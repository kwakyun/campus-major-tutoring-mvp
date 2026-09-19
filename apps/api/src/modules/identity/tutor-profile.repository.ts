import { Injectable } from "@nestjs/common";

export interface TutorProfileRecord {
  userId: string;
  selfReportedSchool: string | null;
  selfReportedMajor: string | null;
  selfReportedCareer: Array<{ label: string; verified?: boolean }>;
  updatedAt: string;
}

/**
 * 교육자 자기기재 프로필(tutor_profiles) 인메모리 저장소 (S04-T01, openapi.yaml
 * `POST /tutor/profile`). 실제 DB 연동은 catalog/reference-data.repository.ts 상단
 * 주석과 같은 사유로 이번 명령 범위 밖이다(apps/api DB 클라이언트 의존성 부재).
 *
 * 자기기재 값만으로는 공개 프로필에 "확인됨" 배지가 생기지 않는다 — 배지는
 * verifications 모듈(S03-T03에서 이미 구현됨)의 상태만으로 계산한다(authorization.md §5).
 *
 * 2026-09-19: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 catalog/
 * courses.repository.ts가 시드하는 더미 교육자 3명(seed-tutor-0001~0003)의 자기기재
 * 프로필을 함께 시드한다 — 그래야 GET /tutors/{id} 공개 프로필이 빈 값이 아니라
 * 실제 내용을 반환한다.
 */
const SEED_PROFILES: TutorProfileRecord[] = [
  {
    userId: "seed-tutor-0001",
    selfReportedSchool: "부산대학교",
    selfReportedMajor: "경제학과",
    selfReportedCareer: [{ label: "학회 스터디 튜터링 1년", verified: false }],
    updatedAt: new Date().toISOString(),
  },
  {
    userId: "seed-tutor-0002",
    selfReportedSchool: "부산대학교",
    selfReportedMajor: "영어영문학과",
    selfReportedCareer: [{ label: "편입학원 강사 2년", verified: false }],
    updatedAt: new Date().toISOString(),
  },
  {
    userId: "seed-tutor-0003",
    selfReportedSchool: "부산대학교",
    selfReportedMajor: "컴퓨터공학과",
    selfReportedCareer: [{ label: "교내 알고리즘 스터디 운영 6개월", verified: false }],
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class TutorProfileRepository {
  private profiles = new Map<string, TutorProfileRecord>(
    SEED_PROFILES.map((p): [string, TutorProfileRecord] => [p.userId, p]),
  );

  upsert(
    userId: string,
    input: { selfReportedSchool?: string; selfReportedMajor?: string; selfReportedCareer?: Array<{ label: string; verified?: boolean }> },
  ): TutorProfileRecord {
    const existing = this.profiles.get(userId);
    const record: TutorProfileRecord = {
      userId,
      selfReportedSchool: input.selfReportedSchool ?? existing?.selfReportedSchool ?? null,
      selfReportedMajor: input.selfReportedMajor ?? existing?.selfReportedMajor ?? null,
      selfReportedCareer: input.selfReportedCareer ?? existing?.selfReportedCareer ?? [],
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(userId, record);
    return record;
  }

  findByUserId(userId: string): TutorProfileRecord | undefined {
    return this.profiles.get(userId);
  }
}
