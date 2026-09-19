import { Injectable } from "@nestjs/common";
import { DomainError } from "../../common/errors";
import {
  COURSE_STATUS_TRANSITIONS,
  CourseRecord,
  CourseStatus,
  CurriculumSource,
  CurriculumVersionRecord,
  UnitBreakdownItem,
} from "./course.types";

export interface CreateCourseInput {
  subjectId: string;
  lifeZoneId: string;
  targetAudience?: string | null;
  prerequisiteLevel?: string | null;
  learningGoal: string;
  unitBreakdown?: UnitBreakdownItem[];
  totalMinutes?: number | null;
  expectedOutcome?: string | null;
  sampleDescription?: string | null;
  capacity?: number | null;
  askingPrice: number;
  feeBps?: number | null;
  policyVersionId?: string | null;
  /**
   * 2026-09-19 추가(에드혹, docs/handoffs/ADHOC-01-ai-curriculum-draft.md) — 이 커리큘럼이
   * POST /tutor/courses/curriculum/draft 초안을 기반으로 등록되는지 표시. 생략 시 "manual".
   * 튜터가 초안을 그대로 제출하든 수정해서 제출하든 값은 호출자가 명시적으로 넘긴다
   * (서버가 diff를 비교해 추론하지 않는다 — 추론은 오탐 소지가 있다).
   */
  curriculumSource?: CurriculumSource;
}

export type UpdateCourseInput = Partial<Omit<CreateCourseInput, "subjectId" | "lifeZoneId">> & {
  subjectId?: string;
  lifeZoneId?: string;
  status?: CourseStatus;
};

export interface ListPublicCoursesFilter {
  subjectId?: string;
  lifeZoneId?: string;
  cursor?: string;
  limit?: number;
}

/**
 * 수업(courses)·커리큘럼 버전(curriculum_versions) 인메모리 저장소 (S04-T01).
 *
 * S03-T02에서 실제 PostgreSQL 스키마(db/migrations/0002_catalog_and_transactions.sql)는
 * 이미 만들어졌으나, apps/api는 아직 DB 클라이언트 의존성이 없어 실제 접속을 구현할 수
 * 없다(reference-data.repository.ts 상단 주석과 동일한 사유 — docs/handoffs/S04-T01.md
 * "다음 단계로 이관하는 항목" 참고). 이 저장소는 DB 스키마와 동일한 필드 구조를
 * 유지해 이후 실제 Postgres 리포지토리로 교체할 때 컨트롤러 코드를 바꾸지 않아도
 * 되도록 설계했다.
 *
 * 2026-09-19: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 생성자에서 더미 수업
 * 3건(공개)·1건(심사중)을 시드한다 — 이전에는 인메모리 저장소가 완전히 비어 있어 실제
 * 앱을 띄워도(`pnpm run dev`) 수업 목록이 항상 빈 화면이었다(db/seeds/demo.sql은
 * apps/api에 DB 클라이언트가 없어 실행되지 않으므로 실제로는 아무 효과가 없었다).
 * 자세한 근거는 docs/backend/course-discovery.md §10 참고.
 */
const SEED_TUTOR_ECONOMICS = "seed-tutor-0001"; // FakeSessionVerifier "fake-tutor"와 동일 — 로그인해 직접 관리 가능
const SEED_TUTOR_ENGLISH = "seed-tutor-0002"; // 로그인 픽스처 없음 — 다른 교육자로서 목록에만 노출
const SEED_TUTOR_CS = "seed-tutor-0003"; // 로그인 픽스처 없음 — 다른 교육자로서 목록에만 노출

const SEED_SUBJECT_PYTHON = "00000000-0000-0000-0000-000000000204";
const SEED_SUBJECT_ECONOMICS = "00000000-0000-0000-0000-000000000201";
const SEED_SUBJECT_ENGLISH = "00000000-0000-0000-0000-000000000202";
const SEED_SUBJECT_CS = "00000000-0000-0000-0000-000000000203";
const SEED_LIFE_ZONE_MAIN = "00000000-0000-0000-0000-000000000101"; // 부산대학교 정문~부산대역 생활권
const SEED_POLICY_VERSION = "00000000-0000-0000-0000-000000000301"; // db/seeds/demo.sql과 동일

interface SeedCourseInput extends CreateCourseInput {
  id: string;
  tutorId: string;
  status: CourseStatus;
}

const SEED_COURSES: SeedCourseInput[] = [
  {
    id: "course-seed-0-python",
    tutorId: SEED_TUTOR_CS,
    subjectId: SEED_SUBJECT_PYTHON,
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    targetAudience: "비전공 대학생 및 전공 기초 수강생 (경영·인문·자연계열)",
    prerequisiteLevel: "프로그래밍 경험 전혀 없음 (비전공자 환영)",
    learningGoal: "파이썬으로 데이터 다루기 — 엑셀보다 빠른 데이터 조작 실습",
    unitBreakdown: [
      { title: "1주차: 파이썬 기초 문법 & 환경 설정", description: "Jupyter Notebook 설치 및 기초 자료형·조건문 실습" },
      { title: "2주차: 판다스(Pandas) 데이터 조작", description: "CSV 파일 불러오기, 결측치 처리, 원하는 조건 행/열 필터링" },
      { title: "3주차: 데이터 시각화 및 과제 코드 리뷰", description: "Matplotlib 그래프 생성 및 1:1 과제 코드 리뷰" },
    ],
    totalMinutes: 60,
    expectedOutcome: "엑셀 노가다 대신 파이썬 코드로 10초 만에 데이터 전처리 및 분석 완성",
    sampleDescription: "예제 데이터 파일을 직접 다루며 판다스(Pandas) 기초부터 1:1 코드 리뷰까지 비전공자 눈높이로 60분 만에 마스터합니다.",
    capacity: 1,
    askingPrice: 35000,
    feeBps: 1500,
    policyVersionId: SEED_POLICY_VERSION,
    status: "published",
    curriculumSource: "manual",
  },
  {
    id: "course-seed-econ-1",
    tutorId: SEED_TUTOR_ECONOMICS,
    subjectId: SEED_SUBJECT_ECONOMICS,
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    targetAudience: "부산대학교 경제학과 1~2학년",
    prerequisiteLevel: null,
    learningGoal: "미시경제학 중간고사 대비 — 수요공급·시장균형 개념 정리",
    unitBreakdown: [
      { title: "1주차: 수요와 공급", description: "수요곡선·공급곡선 이동 요인 정리" },
      { title: "2주차: 시장균형과 탄력성", description: "균형가격 계산, 가격탄력성 문제풀이" },
      { title: "3주차: 기출 문제 풀이", description: "최근 3개년 중간고사 기출 유형 풀이" },
    ],
    totalMinutes: 180,
    expectedOutcome: "중간고사 기출 유형 80% 이상 스스로 풀이 가능",
    sampleDescription: "수요·공급 그래프를 손으로 그리며 직접 설명하는 방식으로 진행합니다.",
    capacity: 1,
    askingPrice: 240000,
    feeBps: 1500,
    policyVersionId: SEED_POLICY_VERSION,
    status: "published",
  },
  {
    id: "course-seed-econ-2",
    tutorId: SEED_TUTOR_ECONOMICS,
    subjectId: SEED_SUBJECT_ECONOMICS,
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    targetAudience: "부산대학교 경제학과 2~3학년",
    prerequisiteLevel: "미시경제학 기초 수강 완료",
    learningGoal: "미시경제학 기말고사 대비 — 생산자이론·시장구조 심화",
    unitBreakdown: [
      { title: "1주차: 생산자이론", description: "비용함수, 이윤극대화 조건" },
      { title: "2주차: 시장구조", description: "완전경쟁·독점·과점 비교" },
    ],
    totalMinutes: 120,
    expectedOutcome: "시장구조별 균형 조건을 비교해 설명할 수 있음",
    sampleDescription: null,
    capacity: 1,
    askingPrice: 240000,
    feeBps: 1500,
    policyVersionId: SEED_POLICY_VERSION,
    // 교육자가 등록 후 아직 공개 검토를 마치지 않은 상태를 보여주는 예시(draft/published 외 상태 시연용).
    status: "pending_review",
  },
  {
    id: "course-seed-english-1",
    tutorId: SEED_TUTOR_ENGLISH,
    subjectId: SEED_SUBJECT_ENGLISH,
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    targetAudience: "편입 준비생 및 재학생",
    prerequisiteLevel: null,
    learningGoal: "편입 영어 독해·문법 8주 완성 — 지문 유형별 풀이 전략",
    unitBreakdown: [
      { title: "1~2주차: 문법 핵심 정리", description: "편입 시험 빈출 문법 포인트" },
      { title: "3~5주차: 독해 지문 유형별 풀이", description: "논리·주제·빈칸추론 유형 집중 연습" },
      { title: "6~8주차: 실전 모의고사", description: "기출 변형 문제로 실전 감각 훈련" },
    ],
    totalMinutes: 120,
    expectedOutcome: "편입 영어 모의고사 기준 70점대 → 85점대 목표",
    sampleDescription: "매주 모의 지문 풀이 후 오답 원인을 문장 단위로 짚어드립니다.",
    capacity: 1,
    askingPrice: 200000,
    feeBps: 1500,
    policyVersionId: SEED_POLICY_VERSION,
    status: "published",
  },
  {
    id: "course-seed-cs-1",
    tutorId: SEED_TUTOR_CS,
    subjectId: SEED_SUBJECT_CS,
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    targetAudience: "컴퓨터공학전공 2~3학년",
    prerequisiteLevel: null,
    learningGoal: "자료구조와 알고리즘 전공 필수 대비 — 배열·연결리스트·트리·그래프 핵심 개념",
    unitBreakdown: [
      { title: "1주차: 배열·연결리스트", description: "시간복잡도 비교, 구현 실습" },
      { title: "2주차: 스택·큐·트리", description: "이진트리 순회, BST 구현" },
      { title: "3주차: 그래프 알고리즘", description: "BFS/DFS, 최단경로 기초" },
    ],
    totalMinutes: 150,
    expectedOutcome: "전공 필수 과목 과제·시험에서 자료구조 구현 문제를 스스로 해결 가능",
    sampleDescription: "매 회차 화이트보드에 자료구조를 직접 그리며 구현 코드까지 함께 작성합니다.",
    capacity: 1,
    askingPrice: 260000,
    feeBps: 1500,
    policyVersionId: SEED_POLICY_VERSION,
    status: "published",
  },
];

@Injectable()
export class CoursesRepository {
  private courses = new Map<string, CourseRecord>();
  private curriculumVersions: CurriculumVersionRecord[] = [];
  // course-seed-*는 별도 문자열 접두어를 쓰지만, 향후 실제 생성 ID(course-N)와 절대
  // 겹치지 않도록 seq를 넉넉히 띄워서 시작한다.
  private seq = 1000;

  constructor() {
    const now = new Date().toISOString();
    for (const seed of SEED_COURSES) {
      const record: CourseRecord = {
        id: seed.id,
        tutorId: seed.tutorId,
        subjectId: seed.subjectId,
        lifeZoneId: seed.lifeZoneId,
        targetAudience: seed.targetAudience ?? null,
        prerequisiteLevel: seed.prerequisiteLevel ?? null,
        learningGoal: seed.learningGoal,
        unitBreakdown: seed.unitBreakdown ?? [],
        totalMinutes: seed.totalMinutes ?? null,
        expectedOutcome: seed.expectedOutcome ?? null,
        sampleDescription: seed.sampleDescription ?? null,
        capacity: seed.capacity ?? null,
        askingPrice: seed.askingPrice,
        feeBps: seed.feeBps ?? null,
        policyVersionId: seed.policyVersionId ?? null,
        status: seed.status,
        // 시드 데이터는 전부 사람이 미리 작성해 둔 것이라 "manual"로 표시한다
        // (에드혹 추가, docs/handoffs/ADHOC-01-ai-curriculum-draft.md).
        curriculumSource: seed.curriculumSource ?? "manual",
        createdAt: now,
        updatedAt: now,
      };
      this.courses.set(record.id, record);
      this.curriculumVersions.push({
        id: `curriculum-${record.id}`,
        courseId: record.id,
        version: 1,
        contentSnapshot: {
          learningGoal: record.learningGoal,
          unitBreakdown: record.unitBreakdown,
          expectedOutcome: record.expectedOutcome,
        },
        clonedFromCourseId: null,
        createdBy: record.tutorId,
        createdAt: now,
      });
    }
  }

  create(tutorId: string, input: CreateCourseInput): CourseRecord {
    const now = new Date().toISOString();
    const record: CourseRecord = {
      id: `course-${this.seq++}`,
      tutorId,
      subjectId: input.subjectId,
      lifeZoneId: input.lifeZoneId,
      targetAudience: input.targetAudience ?? null,
      prerequisiteLevel: input.prerequisiteLevel ?? null,
      learningGoal: input.learningGoal,
      unitBreakdown: input.unitBreakdown ?? [],
      totalMinutes: input.totalMinutes ?? null,
      expectedOutcome: input.expectedOutcome ?? null,
      sampleDescription: input.sampleDescription ?? null,
      capacity: input.capacity ?? null,
      askingPrice: input.askingPrice,
      feeBps: input.feeBps ?? null,
      policyVersionId: input.policyVersionId ?? null,
      status: "draft",
      curriculumSource: input.curriculumSource ?? "manual",
      createdAt: now,
      updatedAt: now,
    };
    this.courses.set(record.id, record);

    // 최초 커리큘럼 버전(version=1)을 함께 만든다 — 이후 복제(clone)는 이 레코드를
    // 원본으로 참조할 수 있다(data-model.md §6).
    this.curriculumVersions.push({
      id: `curriculum-${this.seq++}`,
      courseId: record.id,
      version: 1,
      contentSnapshot: {
        learningGoal: record.learningGoal,
        unitBreakdown: record.unitBreakdown,
        expectedOutcome: record.expectedOutcome,
      },
      clonedFromCourseId: null,
      createdBy: tutorId,
      createdAt: now,
    });

    return record;
  }

  findById(id: string): CourseRecord | undefined {
    return this.courses.get(id);
  }

  /** 소유자 검사는 호출자(컨트롤러)가 아니라 여기서 강제해 검사 누락을 막는다. */
  requireOwned(id: string, tutorId: string): CourseRecord {
    const record = this.courses.get(id);
    if (!record) throw new DomainError("NOT_FOUND", "수업을 찾을 수 없습니다.", 404);
    if (record.tutorId !== tutorId) {
      throw new DomainError("FORBIDDEN", "본인 소유 수업만 수정할 수 있습니다.", 403);
    }
    return record;
  }

  listPublic(filter: ListPublicCoursesFilter): { items: CourseRecord[]; nextCursor: string | null } {
    const limit = filter.limit && filter.limit > 0 ? Math.min(filter.limit, 50) : 20;
    let items = [...this.courses.values()].filter((c) => c.status === "published");

    if (filter.subjectId) items = items.filter((c) => c.subjectId === filter.subjectId);
    if (filter.lifeZoneId) items = items.filter((c) => c.lifeZoneId === filter.lifeZoneId);

    items.sort((a, b) => a.id.localeCompare(b.id));

    const startIndex = filter.cursor ? items.findIndex((c) => c.id === filter.cursor) + 1 : 0;
    const page = items.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < items.length ? page[page.length - 1]?.id ?? null : null;

    return { items: page, nextCursor };
  }

  listByTutor(tutorId: string): CourseRecord[] {
    return [...this.courses.values()].filter((c) => c.tutorId === tutorId);
  }

  update(id: string, tutorId: string, patch: UpdateCourseInput): CourseRecord {
    const record = this.requireOwned(id, tutorId);

    if (patch.status && patch.status !== record.status) {
      const allowed = COURSE_STATUS_TRANSITIONS[record.status];
      if (!allowed.includes(patch.status)) {
        throw new DomainError(
          "CONDITION_NOT_MET",
          `${record.status} 상태에서 ${patch.status}(으)로 전이할 수 없습니다.`,
          409,
        );
      }
      record.status = patch.status;
    }

    if (patch.subjectId !== undefined) record.subjectId = patch.subjectId;
    if (patch.lifeZoneId !== undefined) record.lifeZoneId = patch.lifeZoneId;
    if (patch.targetAudience !== undefined) record.targetAudience = patch.targetAudience;
    if (patch.prerequisiteLevel !== undefined) record.prerequisiteLevel = patch.prerequisiteLevel;
    if (patch.learningGoal !== undefined) record.learningGoal = patch.learningGoal;
    if (patch.unitBreakdown !== undefined) record.unitBreakdown = patch.unitBreakdown;
    if (patch.totalMinutes !== undefined) record.totalMinutes = patch.totalMinutes;
    if (patch.expectedOutcome !== undefined) record.expectedOutcome = patch.expectedOutcome;
    if (patch.sampleDescription !== undefined) record.sampleDescription = patch.sampleDescription;
    if (patch.capacity !== undefined) record.capacity = patch.capacity;
    if (patch.askingPrice !== undefined) record.askingPrice = patch.askingPrice;
    if (patch.feeBps !== undefined) record.feeBps = patch.feeBps;
    if (patch.policyVersionId !== undefined) record.policyVersionId = patch.policyVersionId;
    // curriculumSource는 생성 시점 출처 기록이라 update()로 바꾸지 않는다(의도적 누락,
    // 에드혹 추가 — docs/handoffs/ADHOC-01-ai-curriculum-draft.md).

    record.updatedAt = new Date().toISOString();
    return record;
  }

  /**
   * 커리큘럼 복제(clone) — 소유자만 자신의 course를 원본으로 복제할 수 있다
   * (data-model.md §6, openapi.yaml `/tutor/courses/{courseId}/versions` 403 사례).
   * 새 버전은 대상 course(courseId)에 추가되며, clonedFromCourseId로 계보를 남긴다.
   */
  cloneVersion(
    targetCourseId: string,
    tutorId: string,
    clonedFromCourseId: string | null,
  ): CurriculumVersionRecord {
    const target = this.requireOwned(targetCourseId, tutorId);

    let snapshot: Record<string, unknown> = {
      learningGoal: target.learningGoal,
      unitBreakdown: target.unitBreakdown,
      expectedOutcome: target.expectedOutcome,
    };

    if (clonedFromCourseId) {
      // 타인의 course를 원본으로 지정하는 시도는 여기서 차단한다 — FK만으로는
      // 막을 수 없어 서비스 계층 검사가 필요하다는 db/migrations/0002 주석과 일치.
      const source = this.requireOwned(clonedFromCourseId, tutorId);
      snapshot = {
        learningGoal: source.learningGoal,
        unitBreakdown: source.unitBreakdown,
        expectedOutcome: source.expectedOutcome,
      };
    }

    const existingVersions = this.curriculumVersions.filter((v) => v.courseId === targetCourseId);
    const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.version)) + 1 : 1;

    const record: CurriculumVersionRecord = {
      id: `curriculum-${this.seq++}`,
      courseId: targetCourseId,
      version: nextVersion,
      contentSnapshot: snapshot,
      clonedFromCourseId,
      createdBy: tutorId,
      createdAt: new Date().toISOString(),
    };
    this.curriculumVersions.push(record);
    return record;
  }

  listVersions(courseId: string): CurriculumVersionRecord[] {
    return this.curriculumVersions.filter((v) => v.courseId === courseId);
  }
}
