import { Injectable } from "@nestjs/common";
import { CoursesRepository } from "./courses.repository";
import { TutorAvailabilityRepository } from "./tutor-availability.repository";
import { CourseRecord, TimeWindow } from "./course.types";

export interface CandidateQuery {
  subjectId?: string;
  lifeZoneId: string;
  desiredWindows?: TimeWindow[];
  /** 차단 관계 — 현재 DB·계약 어디에도 "사용자 차단" 테이블/필드가 없다(계약 공백,
   * docs/handoffs/S04-T01.md contract_requests). 실제 데이터가 생기기 전까지는
   * 항상 빈 배열로 취급하며, 파라미터만 미리 열어 둔다. */
  excludeTutorIds?: string[];
}

export interface Candidate {
  course: CourseRecord;
  /** 학습자가 제시한 희망 시간대와 교육자 가능 시간이 겹치는지. desiredWindows가
   * 없으면 시간 조건은 평가하지 않는다(null). */
  timeMatches: boolean | null;
}

/**
 * 추천 모듈(S04-T02, A5)이 사용할 "최신 공개 상태·시간·차단 관계의 후보 조회 계약"
 * (S04-T01 prompt). 공개 HTTP 엔드포인트가 아니라 같은 프로세스 안에서 주입해 쓰는
 * 서비스로 제공한다 — 모듈형 모놀리스 원칙(internal-contracts.md §8: 모듈 간 트랜잭션은
 * 함수 인자로 전달하고 전역/분산 트랜잭션을 도입하지 않는다)과 같은 방향이다.
 *
 * 학교 소속(schoolAffiliation)은 후보 필터링에 쓰지 않는다 — SRC-08 "학교 소속을
 * 자동적인 동일 학교 제한으로 쓰지 마라"를 그대로 지킨다. lifeZoneId만 명시적 조건으로
 * 쓴다.
 */
@Injectable()
export class CandidateQueryService {
  constructor(
    private readonly courses: CoursesRepository,
    private readonly availability: TutorAvailabilityRepository,
  ) {}

  findCandidates(query: CandidateQuery): Candidate[] {
    const excluded = new Set(query.excludeTutorIds ?? []);
    const { items } = this.courses.listPublic({ subjectId: query.subjectId, lifeZoneId: query.lifeZoneId, limit: 50 });

    return items
      .filter((course) => !excluded.has(course.tutorId))
      .map((course) => {
        if (!query.desiredWindows || query.desiredWindows.length === 0) {
          return { course, timeMatches: null };
        }
        const timeMatches = query.desiredWindows.some((w) =>
          this.availability.hasAvailabilityOverlapping(course.tutorId, w),
        );
        return { course, timeMatches };
      });
  }
}
