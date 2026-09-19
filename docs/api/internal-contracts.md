# 전공한시간 — 내부 계약 통합 (S02-T05)

작성: A1(아키텍처·DB·API 계약, 통합) · 작성일: 2026-09-19
입력: docs/ux/contract-requests.md(A3), docs/payments/contracts-proposal.md(A4), docs/ai/contracts-proposal.md·metrics-contract-proposal.md(A5)

이 문서는 각 담당의 계약 제안을 검토해 채택/보류를 확정하고, `packages/contracts/openapi.yaml`(v0.2.0-s02-baseline)·`events.yaml`에 반영한 내역을 기록한다.

## 1. 채택 결과 — UX 요청(CR)

| ID | 결정 | 반영 위치 |
|---|---|---|
| CR-01 | 채택 | `GET /courses/{id}` |
| CR-02 | 채택 | `POST /tutor/profile` |
| CR-03 | 채택 | `POST/GET /verifications` |
| CR-04 | 채택 | `GET /admin/verifications`, `POST /admin/verifications/{id}/decision` |
| CR-05 | 채택(P1) | `GET /admin/learning-requests`, `GET /admin/waitlist-entries` |
| CR-06 | 채택(P1) | `GET /tutors/{id}/activity-summary`, `GET /tutors/{id}/settlements` |
| CR-07 | 채택 | `GET /admin/bookings?status=` |
| CR-08 | 채택(P1) | `GET /admin/settlements`, `GET /admin/payout-attempts` |
| CR-09 | 채택 | `Course.reviewSummary` |
| CR-10 | 보류 | 폴링/푸시 간격은 구현 단계(S03 이후) 성능 측정 후 결정. 계약에는 반영하지 않음 |

## 2. 채택 결과 — Billing 요청(PR)

| ID | 결정 | 반영 위치 |
|---|---|---|
| PR-01 | 채택 | `PaymentObligation.expiresAt` |
| PR-02 | 채택 | `Course.feeBps`, `Course.policyVersionId` |
| PR-03 | 채택 | `Dispute`, `Settlement`(status에 `HELD` 포함) 스키마 및 `/admin/disputes/{id}/resolve` 응답 연결 |
| PR-04 | 채택(문서화) | 본 문서 §5(멱등키 정책)에 명시 |

## 3. 채택 결과 — AI/이벤트 요청(AR)

| ID | 결정 | 반영 위치 |
|---|---|---|
| AR-01 | 채택 | `/recommendations/query` 응답의 `reasonCodes` |
| AR-02 | 채택 | `packages/contracts/events.yaml` 신규 작성 |
| AR-03 | 채택 | `LearningRequest.acquisitionChannel`, `Booking.acquisitionChannel` |

## 4. 필드·상태·오류 코드 충돌 해결

- **PaymentObligation.status vs Settlement.status:** 두 상태 머신을 분리 유지한다(하나로 합치면 "납부 완료"와 "지급 가능"이 혼동됨). `Settlement.status=HELD`는 분쟁 중 지급 보류를, `PaymentObligation.status`는 학습자/교육자 개별 납부 이행을 각각 표현한다.
- **Course.reviewSummary vs 별도 리뷰 API:** 목록 카드용 요약은 `Course.reviewSummary`(캐시 성격, 신선도 보장 안 함)로, 상세 리뷰 목록은 별도 API(S04 이후 추가 예정, 이번 baseline에는 미포함)로 분리한다.
- **acquisitionChannel의 발생 시점:** `LearningRequest`에서 최초 기록되고, 그로부터 이어진 `Booking`은 이를 상속한다(직접 입력 API는 두지 않음).

## 5. 멱등키 정책(PR-04)

우리 API의 `Idempotency-Key`는 "사용자 + 작업 + 키" 단위로 요청 해시와 결과를 저장하며, 같은 키에 다른 본문이 오면 `409 IDEMPOTENCY_KEY_CONFLICT`로 거절한다. 외부 PG의 멱등키는 별도 개념이며, 같은 논리적 결제 작업의 재시도 동안 유지하되 우리 API 키와 자동으로 동기화되지 않는다. PG 제공자의 멱등키 보장 기간이 끝났다고 곧바로 새 키를 발급하지 않고, 먼저 대사(§6 참고 원장 대사 원칙)로 과거 거래를 확인한다(웹서비스 아키텍처 §8 원칙 유지).

## 6. 클라이언트 생성 방식

- TypeScript 클라이언트는 `packages/contracts/openapi.yaml`에서 생성한다(생성 도구는 S03 프로젝트 기반 구축에서 확정).
- Python(AI 서비스, S09 이후)은 내부 API(§7 참고)에 한해 별도 Pydantic 모델을 두되, TypeScript 타입을 직접 가져오지 않는다(웹서비스 아키텍처 §13 원칙 유지).
- 생성된 클라이언트는 항상 `openapi.yaml`/`events.yaml`에서 재생성하며, 구현 담당자가 생성 파일을 직접 편집하지 않는다.

## 7. AI 내부 계약(참고, 외부 비공개)

`docs/ai/contracts-proposal.md` §5의 4개 내부 API(`/internal/v1/embeddings/query`, `/internal/v1/rank`, `/internal/v1/drafts`, `/internal/v1/jobs/:id`)는 공개 `openapi.yaml`에 포함하지 않는다. 외부에서 호출할 수 없는 내부 전용 계약이므로 S09 착수 시 `services/ai/` 내부 계약 문서로 별도 관리한다(지금은 위치만 예약).

## 8. 모듈 간 트랜잭션 전달 방법

- 같은 DB 내 원자성이 필요한 변경(예: 예약 생성 + 납부 의무 생성)은 호출자가 트랜잭션을 열고 `Billing.createObligations()` 같은 명시적 함수에 트랜잭션 핸들을 전달한다(docs/payments/contracts-proposal.md §2 확정).
- 외부 PG 호출은 트랜잭션 밖에서 실행한다(기존 원칙 유지).
- 모듈 간 트랜잭션 전달은 함수 인자로만 하며, 전역 트랜잭션 매니저나 분산 트랜잭션은 도입하지 않는다(모듈형 모놀리스 원칙, 초기 규모에 맞음).

## 9. Migration 원칙

- migration은 A1이 작성하고 A7이 적용·복구 절차를 관리한다(역할분담 문서 10절 원칙 유지).
- 이미 적용된 migration은 수정하지 않고 새 migration으로 변경한다.
- 데모 seed와 운영 데이터는 처음부터 분리한다(웹서비스 아키텍처 §11).

## 10. 신규 요구사항의 계약 통합 상태(source-traceability 대조)

| SRC | 계약 반영 | 상태/권한/버전 |
|---|---|---|
| SRC-01 | `user_campus_affiliations`(비API, DB만) — 가입 API에는 선택 필드로만 존재 | 권한: 본인만 수정 |
| SRC-02 | `Verification` 스키마 + `/verifications`, `/admin/verifications/*` | 상태 4종(state-machines.md §4), 권한 본인/심사담당(authorization.md §3 ops.verification_review) |
| SRC-03 | `WaitlistEntry` + `/learning-requests/{id}/waitlist`, `/admin/waitlist-entries` | 상태 5종(state-machines.md §5) |
| SRC-04 | `RebookingRequest` + `/bookings/{id}/rebooking-requests`, `curriculum_versions`(DB, API는 `/tutor/courses/{id}/versions`), `tutor_activity_summaries`(`/tutors/{id}/activity-summary`) | 권한: authorization.md §2 |
| SRC-05 | `acquisitionChannel`, `matching_failure_reason`(events.yaml) | 버전: events.yaml schema_version 0.1.0-s02-baseline |
| SRC-06 | `Dispute`/`Settlement`(HELD 포함) | 권한: ops.dispute_resolution / ops.finance 분리(authorization.md §3) |
| SRC-08 | `life_zones`/`campuses` 분리(DB), `Course.lifeZoneId` | 다지역 매칭 로직은 이번 baseline에 없음(선구현 금지 원칙 준수) |

다지역 기능(캠퍼스 간 매칭 자동화)은 이 baseline에서 구현하지 않으며, `life_zones`/`campus_life_zones`가 "식별 가능"한 상태로만 존재한다(요청된 원칙: "확장 전에도 학교와 생활권을 식별할 수 있게 하되 다지역 기능을 선구현하지 마라").

## 11. 변경 이력 — 계약 변경 시 필요한 절차(contract-baseline.md §4) 적용

| 버전 | 변경 요청자 | 영향받는 소비자 | 하위 호환 | 내용 |
|---|---|---|---|---|
| openapi.yaml 0.2.2-adhoc-curriculum-draft, events.yaml 0.1.1-adhoc-curriculum-draft | 사용자(곽윤직) 직접 요청, A0/A1 역할 구분 없이 단일 세션에서 처리 | apps/api(catalog 모듈), apps/web(tutor/courses/new), db(courses 테이블) | 예 — `Course.curriculumSource`는 optional+default(manual)이라 기존 클라이언트를 깨지 않음. 신규 경로(`POST /tutor/courses/curriculum/draft`)도 기존 경로와 충돌 없음(courses.controller.ts 라우트 세그먼트 비교 확인) | AI 커리큘럼 초안 생성 기능 추가. 상세는 `docs/handoffs/ADHOC-01-ai-curriculum-draft.md` 참고. **주의:** 이 변경은 S04-GATE 이후 정식 A0 통합 리뷰 없이 사용자 요청으로 직접 반영됐다 — 다음 정식 게이트(S05 또는 별도 QA 명령)에서 재검토가 필요하다. |
