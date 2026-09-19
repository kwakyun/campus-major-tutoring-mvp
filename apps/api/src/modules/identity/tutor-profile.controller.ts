import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { SessionUser } from "../auth/session-user";
import { DomainError } from "../../common/errors";
import { VerificationsRepository } from "../verifications/verifications.repository";
import { TutorProfileRepository } from "./tutor-profile.repository";
import { CoursesRepository } from "../catalog/courses.repository";
import { toTeachingEvidenceCourses } from "../catalog/courses.controller";

/**
 * 자기기재 값만으로 "확인됨" 배지를 만들지 않는다(authorization.md §5) — verified 배지는
 * verifications.status==='verified'인 항목만 노출한다. pending/self_reported/rejected는
 * 공개 배지에 노출하지 않는다(반려 사유 등 내부 정보를 공개 화면에 흘리지 않기 위함).
 */
function toVerificationBadges(records: Array<{ type: string; status: string }>) {
  return records
    .filter((r) => r.status === "verified")
    .map((r) => ({ type: r.type, status: r.status }));
}

/** 실제 표시 이름 데이터가 아직 없다(SessionUser/DB에 displayName 연결 미완 — S04 remaining_work).
 * 실명을 노출할 수 없으므로 사용자 ID 기반의 비식별 라벨을 임시로 사용한다. */
function placeholderDisplayName(userId: string): string {
  return `교육자-${userId.slice(-4)}`;
}

@Controller()
export class TutorProfileController {
  constructor(
    private readonly profiles: TutorProfileRepository,
    private readonly verifications: VerificationsRepository,
    private readonly courses: CoursesRepository,
  ) {}

  @Post("tutor/profile")
  @UseGuards(SessionGuard)
  upsert(
    @CurrentUser() user: SessionUser,
    @Body()
    body: {
      selfReportedSchool?: string;
      selfReportedMajor?: string;
      selfReportedCareer?: Array<{ label: string; verified?: boolean }>;
    },
  ) {
    if (!user.roles.includes("tutor")) {
      throw new DomainError("FORBIDDEN", "tutor 역할이 필요합니다.", 403);
    }
    return this.profiles.upsert(user.userId, body ?? {});
  }

  /**
   * 공개 교육자 프로필(TutorPublicProfile, openapi.yaml 스키마는 존재하나 이를 반환하는
   * 엔드포인트가 baseline에 없었다 — docs/ux/screens.md "GET /tutors/{id} 확장 또는 신규
   * API(계약 변경 요청)"에서 이미 필요성이 언급됨. contract_requests에 반영 요청을 남긴다.
   *
   * teachingEvidence는 verificationBadges와 분리된 최상위 필드로 반환한다
   * (authorization.md §5 — 둘을 하나의 "신뢰도 점수"로 합치지 않는다).
   */
  @Get("tutors/:id")
  getPublicProfile(@Param("id") id: string) {
    const profile = this.profiles.findByUserId(id);
    const verifications = this.verifications.listByUser(id);
    const evidenceCourses = toTeachingEvidenceCourses(this.courses.listByTutor(id));

    return {
      id,
      displayName: placeholderDisplayName(id),
      school: profile?.selfReportedSchool ?? null,
      major: profile?.selfReportedMajor ?? null,
      verificationBadges: toVerificationBadges(verifications),
      teachingEvidence: {
        // 여러 published 수업이 있을 수 있어 배열로 반환한다(공식 스키마는 단일 요약
        // 형태이나, 하나로 합치면 특정 수업의 근거인지 불명확해져 원본 그대로 둔다).
        sampleDescription: evidenceCourses[0]?.sampleDescription ?? null,
        expectedOutcomes: evidenceCourses.map((c) => c.expectedOutcome).filter((v): v is string => Boolean(v)),
        reviewSummary: null, // 후기·정산 기록은 S06 이후 범위(reviews 테이블 미사용)
      },
    };
  }
}
