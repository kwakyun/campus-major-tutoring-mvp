# 전공한시간 — 상태 전이표 (S02-T01)

작성: A1 · 작성일: 2026-09-19 · 기존 루트 설계(웹서비스 아키텍처 §7)의 예약 상태 다이어그램을 계승하고, S02에서 신규 정의한 엔티티의 상태를 추가한다.

## 1. 예약(`bookings.status`) — 기존 유지

```
[*] -> PAYMENT_PENDING (최종 동의 + 시간 점유)
PAYMENT_PENDING -> CONFIRMED (필요한 납부 의무 모두 충족)
PAYMENT_PENDING -> EXPIRED (기한 종료/미완료)
PAYMENT_PENDING -> CANCELED (결제 전 취소)
CONFIRMED -> IN_PROGRESS (수업 진행 확인)
CONFIRMED -> COMPLETION_PENDING (종료 후 완료 확인 요청)
IN_PROGRESS -> COMPLETION_PENDING (예정 종료 시각 도달)
CONFIRMED -> CANCELED (취소 정책 적용)
CONFIRMED -> DISPUTED (노쇼 등 이의 제기)
IN_PROGRESS -> DISPUTED (진행 중 이의 제기)
COMPLETION_PENDING -> COMPLETED (양측 확인 또는 운영자 결정)
COMPLETION_PENDING -> DISPUTED (결과 불일치)
DISPUTED -> COMPLETED (제공 사실 확인)
DISPUTED -> CANCELED (미제공 등 결정)
```

전이 권한: `CONFIRMED→CANCELED`는 당사자(취소 요청) 또는 운영자(정책 위반 처리). `DISPUTED`로의 전이는 당사자 신고 또는 운영자 직권. `DISPUTED`에서 나가는 전이는 운영자 전용.

## 2. 제안(`proposals.status`) — 기존 유지, 값 명시

```
ACTIVE -> SUPERSEDED (동일 협의방에서 새 버전 등록)
ACTIVE -> EXPIRED (validity 만료)
ACTIVE -> ACCEPTED (필요 참여자 전원 동의 완료 → bookings 생성과 같은 트랜잭션)
```

`SUPERSEDED` 또는 `EXPIRED` 제안에 대한 수락 요청은 `409 STALE_PROPOSAL`로 거절(전이 자체가 발생하지 않음).

## 3. 납부 의무(`payment_obligations.status`) — 신규 명시

```
PENDING -> FULFILLED (결제 승인 확인)
PENDING -> EXPIRED (예약 만료에 연동, §1의 PAYMENT_PENDING→EXPIRED와 같은 트랜잭션)
FULFILLED -> REFUND_PENDING (환불/취소 사유 발생)
REFUND_PENDING -> REFUNDED (환불 완료 확인)
```

`EXPIRED` 이후 늦게 도착한 승인은 이 상태를 되살리지 않고 별도 반환 작업(웹서비스 아키텍처 §6 "점유 해제 뒤 늦은 결제 성공" 시나리오)으로 처리한다.

## 4. 신원·자격 확인(`verifications.status`) — 신규

```
self_reported -> pending (심사 신청)
pending -> verified (운영자 승인)
pending -> rejected (운영자 반려, 사유 필수)
verified -> pending (증빙 갱신/재확인 요청 시, 선택)
```

항목(type)별로 독립 상태를 가지며, 한 항목의 `verified`가 다른 항목이나 "교육 능력"의 확인을 의미하지 않는다(data-model.md §3).

## 5. 대기 신청(`waitlist_entries.status`) — 신규

```
open -> notified (조건에 맞는 신규 교육자/수업 등록 시)
open -> expired (유효 기간 종료)
open -> withdrawn (학습자 취소)
notified -> matched (학습자가 실제 협의 시작)
notified -> expired (미응답)
```

## 6. 학습 결과(`learning_outcomes`) — 신규(상태 없음, 이벤트성 기록)

`learning_outcomes`는 상태 머신이 아니라 세션당 1회 제출되는 기록이다(§8 unique 제약). 제출 이후 수정은 새 레코드가 아닌 감사 로그를 남기는 갱신으로 처리하며, 이 규칙은 S02-T05 통합 시 확정한다(현재는 제안).

## 7. 재예약 요청(`rebooking_requests.status`) — 신규

```
requested -> converted (새 협의에서 예약 성립)
requested -> declined (교육자 또는 학습자 거절)
requested -> expired (미응답)
```

`converted`는 새로운 `bookings` 레코드 생성을 의미하며 원본 예약(`origin_booking_id`)의 상태를 변경하지 않는다.

## 8. 분쟁(`disputes.status`) — 기존 방향 확정, 세부 명시

```
open -> under_review (운영자 배정)
under_review -> resolved_completed (제공 사실 확인 → bookings.DISPUTED→COMPLETED)
under_review -> resolved_canceled (미제공 등 결정 → bookings.DISPUTED→CANCELED)
```

`open` 또는 `under_review` 상태인 동안 관련 `settlements`, `deposit_dispositions`의 실행은 보류된다(data-model.md, 웹서비스 아키텍처 §8 원칙 유지).

## 9. 커리큘럼 게시(`courses.status`) — 명시

```
draft -> pending_review (교육자 제출)
pending_review -> published (운영자/자동 심사 통과)
pending_review -> draft (반려, 사유 필수)
published -> unpublished (교육자 비공개 전환 또는 운영자 조치)
```

`unpublished` 전환 시 검색·추천 노출과 파생 데이터(임베딩 등, S09 이후) 삭제 전파가 필요하다(AI 추천 아키텍처 §4, S02-T04에서 계약화).
