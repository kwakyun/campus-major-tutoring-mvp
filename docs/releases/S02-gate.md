# S02-GATE — 2단계(화면·DB·API 상세 설계) 통합 판정

작성: A0(총괄·통합) · 작성일: 2026-09-19 · 입력: S02-T01~T06 handoff 및 산출물

## 1. exit_criteria 대조

| exit_criteria | 충족 여부 | 근거 |
|---|---|---|
| 화면·API·DB·권한·상태 계약이 일치함 | **충족** | docs/architecture/contract-baseline.md §5, docs/qa/S02-design-review.md §1(필수 흐름 5개 전부 화면·API·DB·권한 근거 일치 확인) |
| 제안→동의→예약→금액 처리 인터페이스가 정의됨 | **충족** | packages/contracts/openapi.yaml `/conversations/{id}/proposals`~`/bookings/{id}/payment-attempts`, docs/payments/contracts-proposal.md §1~2(Billing 인터페이스·트랜잭션 경계) |
| 학습 목표·품질·대기·재이용·생활권·지표의 추가 계약이 통합됨 | **충족** | docs/api/internal-contracts.md §10(SRC-01~08 대조표), docs/architecture/data-model.md §2~6(생활권 분리, 대기신청, 학습결과, 재예약, 커리큘럼버전, 포트폴리오동의) |

## 2. 통합 완료 여부

**통합 완료(계획 단계 계약 기준).** S02-T01~T06 전 명령이 PASS로 보고되었다. QA(S02-T06)가 발견한 F-01(OpenAPI 스키마 오류)은 검토 중 즉시 수정되어 RESOLVED로 종결했다. F-02(자기거래 DB 제약), F-04(completion_rate 분모 표준화)는 설계 단계에서 완결할 수 없는 구현/정책 확정 사항이므로 **OPEN 상태로 다음 단계에 명시적으로 인계**하며, 이를 "완료"로 위장하지 않는다.

## 3. 실패·미검증·외부 의존 (숨기지 않고 명시)

| 항목 | 상태 | 담당(다음 실행) |
|---|---|---|
| F-02: 자기 거래(self-dealing) 차단의 DB 수준 제약 미설계 | OPEN | A1(제약 설계) → S04 A2(구현) → A6(동시성 검증) |
| F-04: completion_rate 취소/환불 분모 규칙이 보고서마다 다를 수 있음 | OPEN | A5(제안) → A1(확정) — S02 후속 또는 S06 구현 전까지 |
| F-03: 포트폴리오 비동의 시 응답 내용 불명확 | OPEN(경미) | A1 — 다음 계약 개정 시 |
| F-05: 재제안·수락 동시 요청 락 순서가 S02 문서에 재기술되지 않음 | OPEN(경미, 문서 보완) | A1 |
| 실제 DB migration 적용 | 미실행 | A1(작성) + A7 — S03 |
| 실제 동시성 통합 테스트 | 미실행 | A6 — S04/S05 구현 후 |
| 보증금 수납·노쇼보상·지급대행 제공자 확정 | 미확정(S01부터 이월) | A4 — S07 |

이 항목들은 S02-GATE 통과의 장애 요인이 아니다. S02의 목적은 "구현 계약을 확정"하는 것이며, 위 항목은 계약 확정에 필요한 후속 결정·구현·검증이지 계약 자체의 결함이 아니다(F-02, F-04는 계약에 이미 방향이 기록되어 있고 구체적 값/제약만 남음).

## 4. 계약 baseline 확인

- `packages/contracts/openapi.yaml`: `0.2.0-s02-baseline`, 경로 34개, 스키마 17개, 문법 검증 통과(F-01 수정 반영)
- `packages/contracts/events.yaml`: `0.1.0-s02-baseline`, 이벤트 10건, 문법 검증 통과

## 5. 첨부 문서 반영 검증

docs/api/internal-contracts.md §10에서 SRC-01, 02, 03, 04, 05, 06, 08이 모두 구체적 계약 위치(스키마/엔드포인트/상태)에 연결되었다. SRC-07(인터뷰), SRC-09(지인추천), SRC-10(AI), SRC-11(제출항목), SRC-12(충돌기록)는 S01에서 이미 처리되었거나 후속 단계(S09/S10) 범위로, 이번 S02 계약 통합의 대상이 아니다.

## 6. 남은 사항과 다음 실행 가능 명령

**다음 실행 가능 명령: S02-GATE 통과에 따라 S03(agent-prompts/03-project-foundation.yaml)을 시작할 수 있다.** 이 판정만으로 S03을 자동 실행하지 않는다(00-workflow.yaml 공통 지침).

S03 착수 시 우선 처리할 입력:
1. packages/contracts/openapi.yaml `0.2.0-s02-baseline` 기준 초기 DB migration 작성(A1) — F-02의 자기거래 제약 포함 검토
2. docs/architecture/contract-baseline.md §6의 CI/클라이언트 생성 파이프라인 연결(A7)

## 7. docs/tasks/index.md 갱신

S02 전체 상태를 "통합 완료(OPEN 항목 2건 후속 인계)"로 갱신했다(docs/tasks/index.md 반영 완료).
