/**
 * 수업(Course) 관련 타입 — packages/contracts/openapi.yaml `Course` 스키마와 동일한
 * 필드를 camelCase로 유지한다(S04-T01).
 *
 * 계약 차이(문서화, packages/contracts/openapi.yaml은 A1 소유라 이번 명령에서 직접
 * 수정하지 않음 — docs/handoffs/S04-T01.md contract_requests 참고):
 * - `sampleDescription`이 DB(courses.sample_description)와 data-model.md §3에는
 *   있으나 현재 openapi.yaml Course 스키마에는 누락되어 있다. 이 필드는 교육
 *   능력의 실질적 근거(authorization.md §5 teachingEvidence)라 응답에 포함한다.
 *
 * 2026-09-19 추가(에드혹, docs/handoffs/ADHOC-01-ai-curriculum-draft.md):
 * - `curriculumSource` — 이 커리큘럼(unitBreakdown 등)이 AI 초안 생성기로 시작됐는지
 *   수동 작성인지 구분한다. openapi.yaml Course 스키마·db/migrations/0004에도 동일하게
 *   반영했다. AI 초안이어도 튜터가 검토·수정 후 제출한 것이며, 자동 게시가 아니다.
 */
export type CourseStatus = "draft" | "pending_review" | "published" | "unpublished";
export type CurriculumSource = "manual" | "ai_generated";

export interface UnitBreakdownItem {
  title: string;
  description?: string;
}

export interface TimeWindow {
  start: string; // ISO-8601
  end: string; // ISO-8601
}

export interface CourseRecord {
  id: string;
  tutorId: string;
  subjectId: string;
  lifeZoneId: string;
  targetAudience: string | null;
  prerequisiteLevel: string | null; // 값 없음 = "수준 확인 필요", 부적격 처리 아님
  learningGoal: string;
  unitBreakdown: UnitBreakdownItem[];
  totalMinutes: number | null;
  expectedOutcome: string | null;
  sampleDescription: string | null;
  capacity: number | null;
  askingPrice: number; // KRW 정수
  feeBps: number | null;
  policyVersionId: string | null;
  status: CourseStatus;
  curriculumSource: CurriculumSource;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumVersionRecord {
  id: string;
  courseId: string;
  version: number;
  contentSnapshot: Record<string, unknown>;
  clonedFromCourseId: string | null;
  createdBy: string;
  createdAt: string;
}

/** state-machines.md §9 — 이 표에 없는 전이는 허용하지 않는다. */
export const COURSE_STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  draft: ["pending_review"],
  pending_review: ["published", "draft"],
  published: ["unpublished"],
  unpublished: [],
};

/**
 * 공개 응답에서 제외할 필드는 없다 — Course 자체에는 실명·연락처·비공개 증빙이
 * 없기 때문이다(tutorId는 식별자일 뿐 실명이 아니며, 실명 공개는 identity 모듈의
 * TutorPublicProfile에서 별도로 마스킹한다). 다만 비공개(draft/pending_review/
 * unpublished) 상태의 수업은 소유자·운영자 외에는 아예 조회 자체를 거절한다.
 */
export function isPubliclyVisible(course: CourseRecord): boolean {
  return course.status === "published";
}
