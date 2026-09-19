# 전공한시간 — 추천·이벤트·AI 계약 제안 (S02-T04)

작성: A5(AI·추천·데이터) · 작성일: 2026-09-19
입력: 전공한시간_AI_추천_아키텍처.md, packages/contracts/openapi.yaml(S02-T01)
범위: 제안. `packages/contracts/**`는 A1 소유이므로 §5에서 반영 요청으로 제출한다.

## 1. 필수 조건·선호 조건(계약화)

AI 추천 아키텍처 §2의 표를 계약 필드로 고정한다.

```text
EligibilityFilter (필수 — 미충족 시 후보에서 제외)
  isPublishedAndTransactable: boolean
  noBlockRelation: boolean
  withinRequiredLifeZoneAndWindow: boolean
  hasContinuousAvailableSlot: boolean
  noConflictWithConfirmedBookings: boolean
  meetsHardPrerequisite: boolean

PreferenceSignal (선호 — 점수에 반영, 0~1 정규화, 입력 없으면 항목 제외 후 재정규화)
  goalCurriculumSimilarity: number|null
  levelFitConfidence: number|null   # "수준 확인 필요"는 null로 표현, 0으로 강제하지 않음
  timeConvenience: number|null
  budgetProximity: number|null      # 절대 가격 필터와 구분(§1 필수조건과 별개)
  operationalTrackRecord: number|null  # 표본 적은 평점/완료율은 전체 평균과 블렌딩
  newTutorExposureBoost: number|null
```

## 2. 후보 자격 조회 계약(A2 제공, A5 소비)

```text
GET /internal/v1/eligible-courses
  input: { goal, desiredWindows[], lifeZoneId, learnerId }
  output: { candidates: [{ courseId, tutorId, publicFeatures }], asOf: timestamp }
```

이 조회는 A2(핵심 업무 백엔드)가 제공하는 최신 공개 상태·시간·차단 관계 기준의 "진실 원본"이다. 추천 결과 노출 직전 반드시 이 조회로 재검증한다(AI 추천 아키텍처 §3 7단계).

## 3. 추천 이유 코드(검증 가능한 값만 사용)

```text
REASON_TIME_MATCH        "{요일} {시간} 수업 가능"
REASON_LEVEL_ENTRY       "비전공자 입문 과정"
REASON_GOAL_KEYWORD      "{키워드} 목표 포함"
REASON_LIFE_ZONE_NEAR    "가까운 생활권"
REASON_NEW_TUTOR         "신규 등록 교육자"
```

확인되지 않은 교육 능력·합격 가능성을 생성하는 이유 코드는 정의하지 않는다(AI 추천 아키텍처 §3). 매 요청마다 LLM으로 이유를 새로 작성할 필요는 없다는 원문 원칙을 유지한다.

## 4. 이벤트 계약 — 발행자 구분

**거래 이벤트의 발행자는 A2(업무 서버)와 A4(Billing)이며, A5는 임의로 완료 이벤트를 생성하지 않는다.** 클라이언트 노출 이벤트(A3 발행)와 서버 확정 이벤트를 분리한다.

| 이벤트 | 발행자 | 진실 수준 |
|---|---|---|
| `recommendation_served` | A5(추천 응답 시점) | 서버 사실 |
| `recommendation_impression` | A3(클라이언트, 실제 화면 노출) | 클라이언트 보고 — 중복 제거·비정상 전송 제한 적용, 결제·완료의 진실로 사용 금지 |
| `course_detail_view`, `inquiry_started` | A3(클라이언트) | 클라이언트 보고 |
| `proposal_agreed` | A2(협의 모듈, 예약 생성과 같은 트랜잭션) | 서버 사실 |
| `booking_funded` | A4(Billing, 모든 의무 충족 확인 시) | 서버 사실 |
| `lesson_completed` | A2(Booking, 완료 확인 처리 시) | 서버 사실 |
| `booking_canceled` | A2 | 서버 사실 |
| `refund_completed` | A4 | 서버 사실 |
| `goal_feedback_submitted` | A2(learning_outcomes 저장과 같은 트랜잭션) | 서버 사실 + 자기보고 내용(§6에서 분리 표시) |

## 5. AI 내부 API·버전·입력 범위·대체 경로(A1에 반영 요청)

```text
POST /internal/v1/embeddings/query   input: 정제된 목표 문장, 활성 모델 버전 → output: 벡터·차원·버전
POST /internal/v1/rank                input: 후보ID·허용특징·요청조건·특징기준시각 → output: 허용후보ID·점수·모델버전
POST /internal/v1/drafts              input: 작업ID, 목표·수준·시간·교육자 제공 사실 → output: 접수결과/검증된 초안
GET  /internal/v1/jobs/:id            → 상태, 스키마 검증된 결과·오류
```

**입력 데이터 범위 제한(명시):** 신원·재학 증빙, 계좌, 신고 내용, 전체 채팅 원문은 위 API의 입력으로 전달하지 않는다. 임베딩 대상은 교육자가 검토·공개한 수업 텍스트(제목·대상·선수지식·목표·커리큘럼·결과물·태그)로 한정한다(AI 추천 아키텍처 §4).

**대체 경로(장애 격리):**

| 실패 상황 | 대체 동작 |
|---|---|
| 임베딩/순위 모델 타임아웃·오류 | 조건·태그 기반 기본 추천(R0)으로 즉시 전환, 반복 실패 시 일정 기간 AI 호출 차단(회로 차단기) |
| 신규 사용자·신규 교육자(데이터 없음) | 기본 추천(R0)이 항상 동작 — AI 개인화 신호는 선택 가중치이며 필수 입력이 아님 |
| 커리큘럼 초안 생성 실패 | 입력한 초안 유지, 직접 작성 경로로 전환 |
| 예약·결제 흐름 | AI 가용성과 무관하게 항상 동작(§2 후보 자격 조회는 A2가 별도로 제공) |

**거래 원본 변경 권한 없음(명시):** AI 서비스 DB 계정은 검색용 사본 조회와 AI 파생 테이블 수정만 허용되며, 거래 원장·인증 증빙·비공개 프로필에 대한 쓰기 권한을 갖지 않는다(AI 추천 아키텍처 §5).

## 6. 서버 거래 사실과 설문 자기보고의 분리

`goal_feedback_submitted`는 이벤트 자체는 서버가 발행하지만, 페이로드 내용(`goalAchieved`, `feedbackText`)은 학습자의 자기보고다. 지표 집계 시 이 필드를 "목표 달성이 객관적으로 확인됨"으로 표시하지 않고 "학습자 자기응답"으로 라벨링한다(acceptance-matrix.md §3 "개인 경험·소수 인터뷰의 일반화" 위험과 동일 원칙 적용).

## 7. A1에 대한 계약 반영 요청

| 요청 ID | 내용 |
|---|---|
| AR-01 | openapi.yaml에 `/recommendations/query` 응답의 `reasonCodes` 필드(문자열 배열, §3 코드값 enum) 추가 |
| AR-02 | `learning_events`/`recommendation_impressions` 스키마를 packages/contracts/events.yaml에 신규 정의(S02-T05 통합 시) |
| AR-03 | `acquisition_channel` 필드를 `learning_requests`/`bookings`에 추가(metrics-contract-proposal.md §2와 연결) |
