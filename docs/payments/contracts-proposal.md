# 전공한시간 — 금액 처리 계약 제안 (S02-T03)

작성: A4(결제·보증금·정산) · 작성일: 2026-09-19
입력: docs/product/requirements.md, docs/decisions/policies.md, packages/contracts/openapi.yaml(S02-T01)
범위: 이 문서는 **제안**이다. `packages/contracts/**`는 A1 소유이므로 직접 수정하지 않고 §7의 반영 요청으로 제출한다.

## 1. 납부 의무·결제 시도·환불·보증금 처분·원장·지급 인터페이스

```text
Billing.createObligations(bookingId, obligations[{payerId, purpose, amount}]) -> PaymentObligation[]
Billing.recordPaymentAttempt(obligationId, providerOrderId, amount, idempotencyKey) -> PaymentAttempt
Billing.confirmPayment(attemptId, providerResult) -> PaymentObligation(status=FULFILLED)
Billing.refund(paymentId, amount, reason, recipientId) -> Refund
Billing.disposeDeposit(bookingId, participantId, disposition: return|compensate, amount, reason) -> DepositDisposition
Billing.settle(bookingId) -> Settlement  # 정산 실행 조건 충족 시에만 호출 가능
Billing.requestPayout(settlementId) -> PayoutAttempt
```

Booking(A2)은 이 인터페이스만 호출하고 `payment_obligations` 등 Billing 테이블을 직접 쓰지 않는다(웹서비스 아키텍처 §5 원칙, 역할분담 문서 14절 "A2 ↔ A4" 계약과 동일).

## 2. Booking ↔ Billing 트랜잭션 경계

| 이벤트 | 트랜잭션 경계 | 비고 |
|---|---|---|
| 최종 수락 → 예약 생성 | Booking이 예약·시간점유·`Billing.createObligations()` 호출을 **한 DB 트랜잭션**으로 묶는다 | 외부 PG 호출은 포함하지 않음(락 밖에서 실행 원칙 유지) |
| 결제 승인 콜백/웹훅 | `Billing.confirmPayment()` → 원장 기입 → (모든 의무 충족 시) Booking에 "예약 확정 가능" 이벤트 발행 → Booking이 별도 트랜잭션에서 상태를 CONFIRMED로 전환 | Billing이 Booking 상태를 직접 쓰지 않고 이벤트/명시적 호출로 요청한다(대칭적 경계) |
| 분쟁 접수 | Booking이 DISPUTED로 전환하는 트랜잭션과 **같은 트랜잭션 또는 즉시 후속 트랜잭션**에서 `Billing.holdSettlement(bookingId)`를 호출해 관련 정산·보증금 반환을 잠금 | 분쟁과 무관하게 확정된 반환분은 운영 결정으로 분리 처리 가능(웹서비스 아키텍처 §8 원칙 유지) |

**분쟁 중 지급 보류(명시):** `disputes.status IN ('open','under_review')`인 예약의 `settlements.status`는 `HELD`로 강제되며, `Billing.settle()` 호출 자체가 거절된다. 분쟁 해결(`resolved_completed`/`resolved_canceled`) 이후에만 정산 재개가 가능하다.

## 3. 보증금 처리 방식의 미확정 사항 (숨기지 않고 명시)

| 항목 | 상태 | 비고 |
|---|---|---|
| 교육자 보증금 수납·보관 방식이 일반 카드결제·취소 API만으로 구현 가능한지 | **미확정** | 웹서비스 아키텍처 §8 명시 제약을 그대로 계승. 제공자(토스페이먼츠 등) 지급대행 확인 전까지 실거래 기능은 비활성화 |
| 노쇼 보상(피해 당사자 지급) 방식 | **미확정** | 원결제 취소는 원 납부자에게만 환원되므로, 제3자(피해자) 지급을 위한 별도 이체/포인트 수단이 필요한지 제공자 확인 필요 |
| 지급대행(Payout) 셀러 등록 절차 | **미확정** | 일반 결제 승인 성공을 교육자 지급 준비 완료로 해석하지 않음(웹서비스 아키텍처 §8) |

이 세 항목이 미확정인 동안 `PAYMENT_MODE`는 `fake` 또는 `test`로 유지하고, `live`로 전환하는 실거래 활성화는 S07의 실제 거래 활성화 기준(웹서비스 아키텍처 §14 B단계 의존 순서)을 충족한 뒤에만 진행한다.

## 4. 수수료 계산 계약(확정 규칙 반영)

**수수료는 최초 제안가가 아닌 최종 합의 수업료(수락된 Proposal의 `prices.tuition`)를 기준으로 계산한다.** 계산식(웹서비스 아키텍처 §8과 동일, 계약으로 고정):

```text
F(교육자 수수료) = floor(tuition × feeBps / 10000)   # feeBps=1500(15%), 원 미만 버림은 제안값
payoutEstimate   = tuition - F
learnerPlatformFee = 0
```

`feeBps`와 버림 방식은 `policy_versions`에 저장하고, 과거 예약은 합의 당시 버전을 `bookings.policyVersionId`로 고정 참조한다(A1 소유 스키마, 이 문서는 사용 방식만 제안).

## 5. 보증금 반환 vs 피해자 보상 구분(명시)

| 개념 | 대상 | 재원 |
|---|---|---|
| 보증금 반환(`deposit_dispositions.disposition=return`) | 정상 완료 시 원 납부자(학습자/교육자) 본인에게 | 본인이 납부한 보증금 |
| 피해자 보상(`deposit_dispositions.disposition=compensate`) | 노쇼 등으로 피해를 입은 상대방에게 | 가해자 측 보증금 잔액 한도 내 |

원결제 취소(refund)와 보증금 처분(deposit_disposition)은 별도 레코드로 관리하며, 하나의 손실에 두 처분을 중복 적용하지 않는다(policies.md 원칙과 동일). 동일 보증금이 원 납부자 반환과 피해자 보상에 동시에 지급되지 않도록 같은 예약·보증금 잔액 잠금을 사용한다(§2 트랜잭션 경계와 동일 규칙).

## 6. 거래 원장 vs 예시 수익성 가정 분리

| 구분 | 데이터 위치 | 비고 |
|---|---|---|
| 실제 거래 원장 | `ledger_transactions`/`ledger_entries`(A1 소유 스키마) | 수업료 보관액, 반환 예정 보증금, 교육자 지급채무, 수수료, 피해자 보상 지급채무를 계정과목으로 분리. 수정 대신 역거래만 추가 |
| 예시 수익성 가정(사업계획서 7절) | `docs/payments/`(본 문서 부속, 별도 시나리오 파일로 관리 제안) | 15,000원·PG 3.4%·기타 200원·월 고정비 100만원·과세 가정은 **비교용 모델**이며 원장에 그대로 기입하지 않는다 |
| 준비 예산·월 고정비 vs 거래별 변동비 | 원장과 별도 계정(운영비 계정) | 동일 비용(예: 고정 인건비에 포함된 상담 시간)을 거래별 변동비에 중복 계상하지 않는다. 모집비가 거래량에 연동해 늘어나면 그 증가분만 변동비로 반영(사업계획서 7-5절) |

**보증금·지원금은 거래 매출로 집계하지 않는다.** `paid_enrollment_count`/매출 지표는 수업료(및 확정된 수수료)만 반영하고, 보증금 수납/반환액과 준비 예산·지원금은 별도 계정으로 유지한다(source-alignment.md 지표 계약과 동일).

## 7. A1에 대한 계약 반영 요청 (직접 수정하지 않음)

| 요청 ID | 내용 | 사유 |
|---|---|---|
| PR-01 | `payment_obligations`에 `expiresAt` 필드 추가 | PAYMENT_PENDING 만료 처리를 위해 의무별 기한이 필요 |
| PR-02 | `Course`/`Proposal` 스키마에 `feeBps`, `policyVersionId` 명시(현재 ProposalTerms.prices에 있으나 Course에는 없음) | 등록 시점 참고 수수료 표시용 |
| PR-03 | `disputes` 리소스와 `settlements.status=HELD` 상태를 openapi.yaml에 추가 | 현재 명세에 disputes 스키마 자체가 없음(§2 보류 로직 표현 위해 필요) |
| PR-04 | Idempotency-Key 정책에 "PG 멱등키와 우리 API 멱등키의 관계"(사용자+작업+키) 명시 문구 추가 | 웹서비스 아키텍처 §8 원칙을 계약 문서에도 고정 |
