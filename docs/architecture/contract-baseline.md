# 전공한시간 — 계약 Baseline 선언 (S02-T05)

작성: A1 · 작성일: 2026-09-19

## 1. 이번 baseline의 버전

| 계약 파일 | 버전 |
|---|---|
| `packages/contracts/openapi.yaml` | `0.2.0-s02-baseline` |
| `packages/contracts/events.yaml` | `0.1.0-s02-baseline`(신규) |

**모든 구현 담당(A2~A5)은 이 버전을 참조점으로 사용한다.** 이후 변경은 새 버전을 만들고 소비자 영향(§4)을 명시한 뒤 배포한다(기존 원칙 유지).

## 2. 확정 vs 미정의 계약상 구분

| 확정(API 형태로 고정) | 미정(정책값만 비어 있음, 필드는 존재) |
|---|---|
| 제안·동의·예약 상태 머신(state-machines.md §1~2) | `PaymentObligation.expiresAt` 계산 기준 시간(값은 policy_versions에서 이후 결정) |
| 수수료 계산식(`floor(tuition × feeBps / 10000)`) | `feeBps`·가격 하한의 실제 운영값(현재는 15%/1:1 12,500원 "제안" 상태 유지) |
| 학습 결과 접근 권한(본인/상대방/운영자) | 학습 결과 수정·정정 절차(§6 state-machines.md 명시, 세부 미정) |
| 분쟁 접수 시 Settlement HELD 전환 | 보증금 수납·노쇼 보상 처리 제공자(payments/contracts-proposal.md §3, 여전히 미확정) |

이 구분은 acceptance-matrix.md의 "미정 정책을 확정 사실로 서술하지 않음" 원칙을 계약 문서 수준에서도 지킨다.

## 3. 각 역할이 참조할 계약 버전 확인 방법

- API 스키마: `packages/contracts/openapi.yaml`의 `info.version` 필드
- 이벤트: `packages/contracts/events.yaml`의 `schema_version` 필드
- 정책값(수수료·보증금율 등): `docs/decisions/policies.md`(값 자체는 API 스키마가 아니라 DB `policy_versions`에서 런타임에 조회)

## 4. 계약 변경 시 필요한 절차(확정)

1. 변경 요청자는 영향받는 소비자(A2/A3/A4/A5)를 명시한다.
2. A1이 하위 호환 여부를 판단한다. 하위 호환이면 마이너 버전, 아니면 메이저 버전을 올린다.
3. 기존 계약을 사용 중인 구현이 있다면 전환 기간·방법을 함께 기록한다.
4. `docs/api/internal-contracts.md`에 변경 이력을 추가한다.

## 5. 화면·서버 계약 일치 확인(exit_criteria 대응)

| exit_criteria 항목 | 근거 |
|---|---|
| 화면·API·DB·권한·상태 계약이 일치함 | docs/ux/screens.md의 모든 화면이 openapi.yaml의 실제 엔드포인트를 참조(계약 변경 요청 10건 전부 채택/보류 결정 완료 — internal-contracts.md §1) |
| 제안→동의→예약→금액 처리 인터페이스가 정의됨 | openapi.yaml `/conversations/{id}/proposals`, `/proposals/{id}/accept`, `/bookings/{id}/payment-attempts` + payments/contracts-proposal.md §1(Billing 인터페이스) |
| 학습 목표·품질·대기·재이용·생활권·지표의 추가 계약이 통합됨 | internal-contracts.md §10 SRC 대조표 |

## 6. 다음 단계(S03)로 넘길 것

- 이 baseline을 기준으로 DB migration(초기 스키마)을 작성한다(A1, S03).
- OpenAPI에서 TypeScript 클라이언트 생성 파이프라인을 CI에 연결한다(A7, S03).
- QA(S02-T06)가 이 baseline에서 발견한 불일치는 §7에서 추적한다(S02-T06 완료 후 갱신).
