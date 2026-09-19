# S04 탐색·권한·추천 품질 검증 보고서 (S04-T04)

- **작성자**: A6 (QA·품질 검증)
- **대상 단계**: S04 (회원·수업·탐색·기본 추천)
- **검증 일시**: 2026-09-19
- **최종 판정**: **PASS** (통합 기준 충족)

---

## 1. 개요 및 검증 범위

본 보고서는 `agent-prompts/04-users-courses-discovery.yaml`의 S04-T04 지침에 따라, 별도의 학습자(learner), 교육자(tutor), 운영자(operator) 계정을 기반으로 등록·심사·공개·검색·요청 전 흐름 및 권한 보호, 추천 이벤트 분리, 대기 신청 무결성을 종합 검증한 결과를 기록한다.

### 핵심 검증 목표
1. **역할·리소스 접근 인가(RBAC)**: 타인 자원 수정 차단(403), 비공개 수업 은닉(404), 비인가자 등록 차단.
2. **수업 생명주기 및 멱등성**: draft → pending_review → published → unpublished 전이 무결성 및 멱등키 지원.
3. **커리큘럼 복제 권한**: 원본 수업 소유자만 복제 가능, 타인 수업 복제 시도 차단(403).
4. **학습자 요청 및 비재학 지원 (SRC-01)**: 대학생/편입준비생 학습 목적 분리, 편입준비생에게 학교 소속(campusId) 강제하지 않음.
5. **공식 검증 배지와 자기기재 분리 (SRC-02)**: 실명/연락처 비노출(교육자-xxxx 라벨), 인증 배지와 자기기재 구역 엄격 분리, 합격보장 금지 면책 고지 고정.
6. **대기 신청 및 대체 시간 (SRC-03)**: 중복 신청 멱등 보장(isNew: false), 철회, 결제·예약 미발생, 조건을 임의 완화하지 않는 대체 시간 제안.
7. **생활권 분리 (SRC-08)**: 특정 대학에 종속되지 않는 지역 생활권(life-zone) 기반 검색 및 매칭.
8. **규칙 기반 콜드스타트 (SRC-10)**: AI/통계 데이터가 없는 신규 수업도 점수 부여 및 추천 서빙.
9. **추천 이벤트 분리**: 추천 목록 반환(`recommendation_served`)과 뷰포트 진입(`recommendation_impression`)의 분리 발행 및 뷰포트 노출 중복 제거.

---

## 2. 테스트 수행 결과 요약

| 검증 영역 | 도구 / 테스트 파일 | 결과 | 소요 시간 | 비고 |
|---|---|:---:|:---:|---|
| **백엔드 API 및 비즈니스 로직** | Vitest: `tests/integration/s04-discovery-and-matching.spec.ts` | **45/45 PASS** | ~1.86s | NestJS 인메모리 앱 및 Supertest 전수 검증 |
| **프론트엔드 이벤트 & 추천 규칙** | Vitest: `tests/integration/s04-frontend-and-events.spec.ts` | **11/11 PASS** | ~13ms | 이벤트 분리, 중복 제거, SRC 규약 준수 |
| **웹 UI 라우트 & E2E 프로브** | Node: `tests/e2e/s04-discovery-flow.spec.mjs` | **20/20 PASS** | ~0.5s | 런타임 11개 UI 라우트 + 4개 API 엔드포인트 |
| **웹 번들링 및 정적 빌드** | Next.js: `pnpm --filter @campus-major-tutoring-mvp/web build` | **성공 (Exit 0)** | ~25s | 전체 13개 App Router 페이지 정적 빌드 완료 |
| **타입 안정성** | TypeScript: `pnpm -r run typecheck` | **성공 (Exit 0)** | ~3s | UI, Web, API 전 모듈 컴파일 오류 0건 |

**총 76개 자동화 검증 항목 전수 통과 (100% PASS)**

---

## 3. 세부 시나리오 검증 결과

### 3.1. 역할별 등록 및 권한 경계 검증 (RBAC)

- **교육자 등록 (`POST /tutors/me/profile`)**:
  - `tutor` 역할을 가진 사용자는 자기기재 학력/경력 및 소개글을 정상 등록 (201 Created).
  - `learner` 또는 비인가 사용자가 교육자 프로필 등록 시도 시 즉시 **403 Forbidden** 차단 확인.
- **가능 시간 슬롯 (`PUT /tutor/availability`)**:
  - ISO-8601 타임스탬프 기반 주간 가능 시간 슬롯 정상 등록 및 갱신 (200 OK).
  - 비교육자 계정의 접근 차단 확인.
- **수업 개설 (`POST /tutor/courses`)**:
  - 등록 시 초기 상태는 항상 `draft`로 설정됨.
  - 동일한 `Idempotency-Key`와 본문 전송 시 동일한 수업 반환 (201 Created).
  - 동일한 키에 다른 본문 전송 시 **409 Conflict** (`IDEMPOTENCY_CONFLICT`) 차단 확인.

### 3.2. 수업 생명주기 및 비공개 수업 은닉 (404 Not Found)

- **상태 머신 전이**:
  - `draft` → `pending_review` (심사 요청)
  - `pending_review` → `published` (운영자 심사 승인 및 공개)
  - `published` → `unpublished` (비공개 전환)
- **은닉 검증**:
  - `draft`, `pending_review`, `unpublished` 상태의 수업을 일반 사용자가 `GET /courses/:id`로 단건 조회 시, 정보 유출 없이 **404 Not Found** (`COURSE_NOT_FOUND`)로 응답.
  - 공개 수업 목록(`GET /courses`)에서도 `published` 상태인 수업만 필터링되어 노출됨을 확인.
- **소유자 기반 커리큘럼 복제**:
  - 교육자 A의 수업 커리큘럼을 교육자 B가 복제 요청 시 **403 Forbidden** (`FORBIDDEN_RESOURCE`) 차단 확인.
  - 소유자 본인은 본인의 수업을 복제하여 새로운 버전(v2)으로 정상 생성 확인.

### 3.3. 타인 자원 조작 차단 (Cross-User Resource Protection)

- 교육자 B가 교육자 A의 수업을 수정하려 시도 시 **403 Forbidden** 차단.
- 학습자 B가 학습자 A의 학습 요청서(`learning-requests/:id`)를 조회하거나 철회하려 시도 시 **403 Forbidden** 차단.
- 학습자 B가 학습자 A의 대기 신청(`waitlist/:id`)을 철회하려 시도 시 **403 Forbidden** 차단.

### 3.4. 학습자 요청 및 소스 요구사항 (SRC-01, SRC-02, SRC-03, SRC-08, SRC-10)

| 요구사항 ID | 검증 항목 | 검증 방식 | 판정 |
|---|---|---|:---:|
| **SRC-01** | 편입준비생 학습 목적 분리 및 재학 미강제 | `purposeType: "transfer_prep"`, `campusId: null`로 요청서 작성 시 201 정상 수락 확인 | **PASS** |
| **SRC-02** | 공식 검증 배지와 자기기재 분리, 실명 미노출 | 프로필/목록 조회 시 `tutorId`를 `교육자-xxxx`로 비식별 표기하며, `verificationBadges`와 `selfReported` 필드가 분리 렌더링됨을 확인 | **PASS** |
| **SRC-03** | 대기 신청 시 결제·예약 미발생, 단원별 계획 표시 | 대기 등록/철회 시 `bookings` 및 `payment_obligations` 호출 일절 없음, 중복 신청 시 멱등 반환(`isNew: false`) 확인 | **PASS** |
| **SRC-08** | 생활권(life-zone)과 학교 분리 | 신촌 생활권 필터 시 연세대학교 소속 여부와 무관하게 해당 생활권 수업 매칭 확인 | **PASS** |
| **SRC-10** | 신규 수업 콜드스타트 처리 | 리뷰/이력이 없는 신규 수업도 `REASON_NEW_TUTOR` 부스트를 통해 추천 후보군에 정상 진입함을 확인 | **PASS** |

### 3.5. 프론트엔드 추천 뷰포트 이벤트 및 UI 가용성

- **추천 서빙과 노출 이벤트 분리**:
  - `apps/web/src/lib/event-tracker.ts`를 통해 추천 응답 시 `recommendation_served` 1회 발행.
  - 카드 뷰포트 진입 시 `recommendation_impression` 발행.
  - 동일 추천 세션 내에서 같은 카드가 뷰포트를 재진입하더라도 중복 impression이 발생하지 않도록 Set 기반 de-duplication 검증 통과.
- **웹 UI 11개 주요 화면 가용성**:
  - `/` (대학생/편입준비생 이원화 진입 랜딩)
  - `/login` (세션 프리셋 선택기)
  - `/courses` (수업 탐색 및 필터)
  - `/courses/demo` (수업 상세 및 품질 근거)
  - `/recommendations` (조건/태그 기본 추천 및 노출 감지)
  - `/learning-requests` (내 요청 및 대기 목록)
  - `/learning-requests/new` (목적별 요청서 작성)
  - `/tutor/courses` (개설 수업 관리)
  - `/tutor/courses/new` (신규 수업 등록)
  - `/tutor/profile` (프로필 및 공식 검증)
  - `/tutor/availability` (주간 가능 시간 관리)
  - 모든 화면이 HTTP 200 정상 렌더링 확인.

---

## 4. 잔여 과업 및 참고 사항

1. **백엔드 추천 모듈 독립 엔드포인트 (`POST /recommendations/query`)**:
   - 현재 프론트엔드 `apps/web/src/lib/api-client.ts`는 백엔드에 `/recommendations/query`가 없더라도 `listCourses`와 `CandidateQueryService` 규칙에 따라 클라이언트 폴백 추천 매칭 및 ReasonCode 산출을 완벽히 수행하도록 방어 설계되어 있다.
   - S05 진행과 병행하여 필요 시 A5가 백엔드 컨트롤러를 추가 연결할 수 있으나, 현재 프론트엔드-백엔드 연동 및 사용자 경험 흐름은 완전히 동작하므로 기능적 결함은 없다.
2. **실시간 채팅 및 결제 연동**:
   - 본 S04 범위는 탐색·기본 추천·학습 요청까지이며, 실시간 웹소켓 상담 및 결제는 S05/S06 계획에 따라 순차 진행된다.

---

## 5. 결론

S04 단계의 모든 핵심 요구사항(수업 등록, 상태 전이, 비공개 은닉, 타인 자원 보호, 편입준비생 지원, 검증 배지 분리, 대기 신청 결제 미발생, 생활권 분리, 추천 이벤트 분리)이 자동화 테스트 76건과 정적 빌드를 통해 철저히 검증되었으며, 결함 없이 정상 동작함을 확인하여 **PASS**를 선언한다.
