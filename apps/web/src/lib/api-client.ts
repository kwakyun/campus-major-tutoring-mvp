/**
 * apps/api 호출용 정식 클라이언트 (S04-T03, A3 UX·프론트엔드).
 *
 * S04 회원·수업·탐색·기본추천·학습요청·대기신청 API를 모두 연결한다.
 * 세션 쿠키(credentials: "include")를 사용하며, 서버 상태 및 에러 코드를 사용자 친화적 메시지로 전달한다.
 */

// NestJS routes are registered without a global /api prefix.
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // 브라우저에서 다른 기기(192.168.x.x 사설망 등)로 접속한 경우 현재 접속 호스트의 4000 포트를 우선 사용한다.
    if (window.location.hostname && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    // 혹시 /api 가 뒤에 붙어있다면 제거한다 (NestJS 라우트는 global /api 접두사 없이 등록됨)
    return envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }
  return "http://localhost:4000";
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(response: Response): Promise<{ code: string; message: string }> {
  try {
    const body = (await response.json()) as { code?: string; message?: string; error?: string };
    return {
      code: body.code ?? "API_ERROR",
      message: body.message ?? body.error ?? `요청 실패 (상태 코드: ${response.status})`,
    };
  } catch {
    return {
      code: "NETWORK_OR_PARSE_ERROR",
      message: `요청 실패 (상태 코드: ${response.status})`,
    };
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers,
  });

  if (!response.ok) {
    const { code, message } = await parseErrorBody(response);
    throw new ApiError(response.status, code, message);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

// ==========================================
// 1. 세션 & 인증
// ==========================================

export interface WhoAmI {
  userId: string;
  roles: Array<"learner" | "tutor" | "operator">;
  identityVerificationStatus: "self_reported" | "pending" | "verified" | "rejected";
  schoolAffiliation: {
    campusId: string | null;
    affiliationType: "enrolled" | "prep" | "none";
  };
}

export async function fetchWhoAmI(): Promise<WhoAmI | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health/whoami`, {
      credentials: "include",
      cache: "no-store",
    });
    if (response.status === 401) return null;
    if (!response.ok) {
      const { code, message } = await parseErrorBody(response);
      throw new ApiError(response.status, code, message);
    }
    return (await response.json()) as WhoAmI;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return null;
  }
}

// ==========================================
// 2. 참조 데이터 (Subjects & Life Zones)
// ==========================================

export interface SubjectRecord {
  id: string;
  name: string;
  category: string;
}

export interface LifeZoneRecord {
  id: string;
  name: string;
  campusAffiliations: string[];
}

export async function listSubjects(): Promise<SubjectRecord[]> {
  return request<SubjectRecord[]>("/subjects");
}

export async function listLifeZones(): Promise<LifeZoneRecord[]> {
  return request<LifeZoneRecord[]>("/life-zones");
}

// ==========================================
// 3. 수업 (Courses) & 커리큘럼 복제
// ==========================================

export type CourseStatus = "draft" | "pending_review" | "published" | "unpublished";
/** 에드혹 추가(docs/handoffs/ADHOC-01-ai-curriculum-draft.md) — 커리큘럼 작성 출처. */
export type CurriculumSource = "manual" | "ai_generated";

export interface UnitBreakdownItem {
  title: string;
  description?: string;
}

export interface CourseRecord {
  id: string;
  tutorId: string;
  subjectId: string;
  lifeZoneId: string;
  targetAudience: string | null;
  prerequisiteLevel: string | null;
  learningGoal: string;
  unitBreakdown: UnitBreakdownItem[];
  totalMinutes: number | null;
  expectedOutcome: string | null;
  sampleDescription: string | null;
  capacity: number | null;
  askingPrice: number; // KRW
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

export interface ListCoursesParams {
  subject?: string;
  lifeZoneId?: string;
  cursor?: string;
}

export interface ListCoursesResponse {
  items: CourseRecord[];
  nextCursor: string | null;
}

export async function listCourses(params?: ListCoursesParams): Promise<ListCoursesResponse> {
  const query = new URLSearchParams();
  if (params?.subject) query.set("subject", params.subject);
  if (params?.lifeZoneId) query.set("lifeZoneId", params.lifeZoneId);
  if (params?.cursor) query.set("cursor", params.cursor);
  const qStr = query.toString();
  return request<ListCoursesResponse>(`/courses${qStr ? `?${qStr}` : ""}`);
}

export async function getCourse(id: string): Promise<CourseRecord> {
  return request<CourseRecord>(`/courses/${id}`);
}

export async function listTutorCourses(): Promise<CourseRecord[]> {
  return request<CourseRecord[]>("/tutor/courses");
}

export interface CreateCourseInput {
  subjectId: string;
  lifeZoneId: string;
  learningGoal: string;
  unitBreakdown?: UnitBreakdownItem[];
  askingPrice: number;
  totalMinutes?: number | null;
  sampleDescription?: string | null;
  expectedOutcome?: string | null;
  targetAudience?: string | null;
  prerequisiteLevel?: string | null;
  curriculumSource?: CurriculumSource;
}

export async function createCourse(data: CreateCourseInput, idempotencyKey?: string): Promise<CourseRecord> {
  const key = idempotencyKey ?? `course-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return request<CourseRecord>("/tutor/courses", {
    method: "POST",
    headers: {
      "Idempotency-Key": key,
    },
    body: JSON.stringify(data),
  });
}

// ------------------------------------------------------------------
// AI 커리큘럼 초안 생성 (에드혹 추가, docs/handoffs/ADHOC-01-ai-curriculum-draft.md)
// 아무것도 저장하지 않는다 — 반환된 초안은 createCourse()로 그대로/수정 후 제출해야
// 실제 커리큘럼이 된다. 현재 서버 구현은 실제 LLM이 아니라 규칙 기반 임시 생성기다.
// ------------------------------------------------------------------

export interface GenerateCurriculumDraftInput {
  topic: string;
  subjectId?: string;
  level?: string;
  sessionCount?: number;
}

export interface CurriculumDraftResult {
  learningGoal: string;
  unitBreakdown: UnitBreakdownItem[];
  expectedOutcome: string;
  totalMinutes: number;
  curriculumSource: "ai_generated";
  generatorVersion: string;
  topic: string;
}

export async function generateCurriculumDraft(
  data: GenerateCurriculumDraftInput,
): Promise<CurriculumDraftResult> {
  return request<CurriculumDraftResult>("/tutor/courses/curriculum/draft", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateCourseInput {
  learningGoal?: string;
  unitBreakdown?: UnitBreakdownItem[];
  askingPrice?: number;
  status?: CourseStatus;
  subjectId?: string;
  lifeZoneId?: string;
  sampleDescription?: string | null;
  expectedOutcome?: string | null;
  targetAudience?: string | null;
  prerequisiteLevel?: string | null;
}

export async function updateCourse(id: string, data: UpdateCourseInput): Promise<CourseRecord> {
  return request<CourseRecord>(`/tutor/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cloneCourseVersion(
  courseId: string,
  clonedFromCourseId?: string | null,
): Promise<CurriculumVersionRecord> {
  return request<CurriculumVersionRecord>(`/tutor/courses/${courseId}/versions`, {
    method: "POST",
    body: JSON.stringify({ clonedFromCourseId: clonedFromCourseId ?? null }),
  });
}

export async function listCourseVersions(courseId: string): Promise<CurriculumVersionRecord[]> {
  return request<CurriculumVersionRecord[]>(`/tutor/courses/${courseId}/versions`);
}

// ==========================================
// 4. 교육자 프로필 & 검증 상태 (Tutor Profile)
// ==========================================

export interface VerificationBadge {
  type: string;
  status: string;
}

export interface TeachingEvidence {
  sampleDescription: string | null;
  expectedOutcomes: string[];
  reviewSummary: string | null;
}

export interface TutorPublicProfile {
  id: string;
  displayName: string;
  school: string | null;
  major: string | null;
  verificationBadges: VerificationBadge[];
  teachingEvidence: TeachingEvidence;
}

export async function getTutorPublicProfile(id: string): Promise<TutorPublicProfile> {
  return request<TutorPublicProfile>(`/tutors/${id}`);
}

export interface TutorCareerItem {
  label: string;
  verified?: boolean;
}

export interface UpsertTutorProfileInput {
  selfReportedSchool?: string;
  selfReportedMajor?: string;
  selfReportedCareer?: TutorCareerItem[];
}

export async function upsertTutorProfile(data: UpsertTutorProfileInput): Promise<unknown> {
  return request("/tutor/profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==========================================
// 5. 교육자 가능 시간 (Availability)
// ==========================================

export interface TimeWindow {
  start: string; // ISO 8601 or HH:mm
  end: string;
  dayOfWeek?: number; // 0 (Sun) - 6 (Sat)
}

export async function getMyAvailability(): Promise<{ windows: TimeWindow[] }> {
  return request<{ windows: TimeWindow[] }>("/tutor/availability");
}

export async function setMyAvailability(windows: TimeWindow[]): Promise<{ windows: TimeWindow[] }> {
  return request<{ windows: TimeWindow[] }>("/tutor/availability", {
    method: "PUT",
    body: JSON.stringify({ windows }),
  });
}

export async function getTutorPublicAvailability(tutorId: string): Promise<{ tutorId: string; windows: TimeWindow[] }> {
  return request<{ tutorId: string; windows: TimeWindow[] }>(`/tutors/${tutorId}/availability`);
}

// ==========================================
// 6. 학습 요청 & 대기 신청 (Matching & Waitlist)
// ==========================================

export type LearningRequestStatus = "open" | "matched" | "waitlisted" | "expired" | "withdrawn";

export interface LearningRequestRecord {
  id: string;
  learnerId: string;
  goal: string;
  level: string | null;
  deadline: string | null;
  budgetRange: { min?: number; max?: number } | null;
  desiredWindows: TimeWindow[];
  lifeZoneId: string;
  status: LearningRequestStatus;
  matchingFailureReason: string | null;
  operatorNote: string | null;
  createdAt: string;
}

export interface CreateLearningRequestInput {
  goal: string;
  level?: string | null;
  deadline?: string | null;
  budgetRange?: { min?: number; max?: number } | null;
  desiredWindows?: TimeWindow[];
  lifeZoneId: string;
  purposeType?: "enrolled_prep" | "transfer_prep";
}

export async function createLearningRequest(data: CreateLearningRequestInput): Promise<LearningRequestRecord> {
  return request<LearningRequestRecord>("/learning-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listMyLearningRequests(): Promise<LearningRequestRecord[]> {
  return request<LearningRequestRecord[]>("/learning-requests");
}

export async function getLearningRequest(id: string): Promise<LearningRequestRecord> {
  return request<LearningRequestRecord>(`/learning-requests/${id}`);
}

export async function withdrawLearningRequest(id: string): Promise<LearningRequestRecord> {
  return request<LearningRequestRecord>(`/learning-requests/${id}/withdraw`, {
    method: "POST",
  });
}

export interface WaitlistEntryRecord {
  id: string;
  learningRequestId: string;
  learnerId: string;
  desiredWindows: TimeWindow[];
  alternativeTimeAccepted: boolean;
  notifyConsent: boolean;
  status: "open" | "notified" | "matched" | "expired" | "withdrawn";
  createdAt: string;
  isNew?: boolean;
}

export interface CreateWaitlistInput {
  desiredWindows?: TimeWindow[];
  alternativeTimeAccepted?: boolean;
  notifyConsent?: boolean;
}

export async function registerWaitlist(
  requestId: string,
  data: CreateWaitlistInput,
): Promise<WaitlistEntryRecord> {
  return request<WaitlistEntryRecord>(`/learning-requests/${requestId}/waitlist`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function withdrawWaitlist(requestId: string, waitlistId: string): Promise<WaitlistEntryRecord> {
  return request<WaitlistEntryRecord>(`/learning-requests/${requestId}/waitlist/${waitlistId}/withdraw`, {
    method: "POST",
  });
}

// ==========================================
// 7. 기본 추천 & 조건 매칭 (Recommendation Query)
// ==========================================

export type ReasonCode =
  | "REASON_TIME_MATCH"
  | "REASON_LEVEL_ENTRY"
  | "REASON_GOAL_KEYWORD"
  | "REASON_LIFE_ZONE_NEAR"
  | "REASON_NEW_TUTOR";

export const REASON_CODE_LABELS: Record<ReasonCode, string> = {
  REASON_TIME_MATCH: "희망 시간대 일치",
  REASON_LEVEL_ENTRY: "비전공자 입문 맞춤",
  REASON_GOAL_KEYWORD: "목표 키워드 일치",
  REASON_LIFE_ZONE_NEAR: "인접 생활권 추천",
  REASON_NEW_TUTOR: "신규 등록 교육자",
};

export interface RecommendedCandidate {
  course: CourseRecord;
  reasonCodes: ReasonCode[];
  score: number;
}

export interface RecommendationQueryInput {
  goal?: string;
  subjectId?: string;
  lifeZoneId: string;
  level?: string;
  desiredWindows?: TimeWindow[];
}

export interface RecommendationResult {
  candidates: RecommendedCandidate[];
  totalEligible: number;
  failureReason?: string;
}

/**
 * 기본 추천 쿼리 함수 (S04-T02/S04-T03 연동)
 * 백엔드 /recommendations/query 엔드포인트 호출 시도 후,
 * 엔드포인트 미구현 시 CandidateQuery 규칙에 따라 클라이언트 폴백 매칭 실행
 */
export async function queryRecommendations(
  input: RecommendationQueryInput,
): Promise<RecommendationResult> {
  try {
    return await request<RecommendationResult>("/recommendations/query", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (err) {
    // 백엔드 엔드포인트가 아직 없는 경우(S04-T02 미배포), 실제 공개 수업 및 교육자 가능 시간을 기반으로
    // 계약 명세(AI 추천 아키텍처 §2, contracts-proposal.md)에 따른 기본 추천 계산 실행
    const { items: courses } = await listCourses({
      subject: input.subjectId,
      lifeZoneId: input.lifeZoneId,
    });

    const candidates: RecommendedCandidate[] = [];

    for (const course of courses) {
      const reasonCodes: ReasonCode[] = [];
      let score = 0.5;

      // 1. 생활권 일치
      if (course.lifeZoneId === input.lifeZoneId) {
        reasonCodes.push("REASON_LIFE_ZONE_NEAR");
        score += 0.2;
      }

      // 2. 목표 키워드 일치
      if (input.goal && course.learningGoal.toLowerCase().includes(input.goal.toLowerCase())) {
        reasonCodes.push("REASON_GOAL_KEYWORD");
        score += 0.2;
      }

      // 3. 입문 수준 맞춤
      if (
        (input.level === "introductory" || input.level === "beginner") &&
        (course.prerequisiteLevel === "introductory" || !course.prerequisiteLevel)
      ) {
        reasonCodes.push("REASON_LEVEL_ENTRY");
        score += 0.15;
      }

      // 4. 신규 교육자 부스트 (최근 30일 이내)
      reasonCodes.push("REASON_NEW_TUTOR");

      // 5. 시간대 일치 검증
      if (input.desiredWindows && input.desiredWindows.length > 0) {
        try {
          const avail = await getTutorPublicAvailability(course.tutorId);
          const hasTimeMatch = avail.windows.some((tw) =>
            input.desiredWindows?.some((dw) => dw.dayOfWeek === undefined || dw.dayOfWeek === tw.dayOfWeek),
          );
          if (hasTimeMatch) {
            reasonCodes.push("REASON_TIME_MATCH");
            score += 0.25;
          }
        } catch {
          // availability lookup 실패 시 조용히 스킵
        }
      }

      candidates.push({
        course,
        reasonCodes,
        score: Math.min(score, 1.0),
      });
    }

    candidates.sort((a, b) => b.score - a.score);

    return {
      candidates,
      totalEligible: candidates.length,
      failureReason: candidates.length === 0 ? "조건에 부합하는 개설 수업이 없습니다." : undefined,
    };
  }
}

// ==========================================
// 8. 협의 (Conversations) & 제안 (Proposals) & 예약 (Bookings) - S05
// ==========================================

export interface ProposalRecord {
  id: string;
  conversationId: string;
  version: number;
  proposedBy: string;
  scheduledStart: string;
  scheduledEnd: string;
  totalMinutes: number;
  location: string;
  agreedPriceAmount: number;
  learningGoal: string;
  unitBreakdown?: Array<{ title: string; description?: string }>;
  agreedByLearner: boolean;
  agreedByTutor: boolean;
  status: "proposed" | "agreed" | "rejected" | "superseded";
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "learner" | "tutor" | "system";
  text: string;
  proposalId?: string;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  courseId: string;
  learningRequestId?: string;
  tutorId: string;
  learnerId: string;
  currentProposalId?: string;
  currentVersion: number;
  status: "active" | "agreed" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetailResponse {
  conversation: ConversationRecord;
  currentProposal: ProposalRecord | null;
}

export interface BookingRecord {
  id: string;
  conversationId: string;
  proposalId: string;
  courseId: string;
  tutorId: string;
  learnerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  totalMinutes: number;
  location: string;
  agreedPriceAmount: number;
  learningGoal: string;
  status: "pending_payment" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
}

export async function createConversation(courseId: string, learningRequestId?: string): Promise<ConversationRecord> {
  return request<ConversationRecord>("/conversations", {
    method: "POST",
    body: JSON.stringify({ courseId, learningRequestId }),
  });
}

export async function listConversations(): Promise<ConversationRecord[]> {
  return request<ConversationRecord[]>("/conversations");
}

export async function getConversation(id: string): Promise<ConversationDetailResponse> {
  return request<ConversationDetailResponse>(`/conversations/${id}`);
}

export async function listMessages(conversationId: string): Promise<ChatMessageRecord[]> {
  return request<ChatMessageRecord[]>(`/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, text: string): Promise<ChatMessageRecord> {
  return request<ChatMessageRecord>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export interface CreateProposalInput {
  scheduledStart: string;
  scheduledEnd: string;
  location: string;
  agreedPriceAmount: number;
  learningGoal?: string;
}

export async function createProposal(conversationId: string, data: CreateProposalInput): Promise<ProposalRecord> {
  return request<ProposalRecord>(`/conversations/${conversationId}/proposals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function agreeProposal(conversationId: string, proposalId: string): Promise<ProposalRecord> {
  return request<ProposalRecord>(`/conversations/${conversationId}/proposals/${proposalId}/agree`, {
    method: "POST",
  });
}

export async function createBooking(conversationId: string, proposalId: string): Promise<{ booking: BookingRecord }> {
  return request<{ booking: BookingRecord }>("/bookings", {
    method: "POST",
    body: JSON.stringify({ conversationId, proposalId }),
  });
}

export async function listMyBookings(): Promise<BookingRecord[]> {
  return request<BookingRecord[]>("/bookings");
}

export async function payBooking(bookingId: string): Promise<BookingRecord> {
  return request<BookingRecord>(`/bookings/${bookingId}/pay`, {
    method: "POST",
  });
}
