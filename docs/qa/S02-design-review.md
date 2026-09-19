# 전공한시간 — S02 설계 일관성 검토 (S02-T06)

작성: A6(QA·품질 검증) · 작성일: 2026-09-19
입력: docs/product/requirements.md(P0), docs/ux/screens.md, packages/contracts/openapi.yaml/events.yaml(S02-T05), docs/architecture/data-model.md·state-machines.md·authorization.md(S02-T01), docs/payments/contracts-proposal.md(S02-T03), docs/qa/acceptance-matrix.md(S01)

이 문서는 P0 요구사항·화면·OpenAPI·DB·상태·권한·이벤트 계약을 상호 대조한 결과다. 발견 사항은 재현 가능한 조건과 함께 소유자에게 보고하며, 임의로 통과 처리하지 않는다.

## 1. 검토 범위별 필수 흐름 대조

| 필수 흐름 | 화면 근거 | API 근거 | DB/상태 근거 | 권한 근거 | 결과 |
|---|---|---|---|---|---|
| 탐색→상담 진입 | screens.md §1 | `GET /courses`, `GET /courses/{id}` | Course.status=published | 공개(비로그인 허용) | 일치 |
| 제안→재제안→동의→예약 | screens.md §2 | `POST .../proposals`, `POST /proposals/{id}/accept` | state-machines.md §2 | 참여자 한정 | 일치 |
| 결제 대기→확정 | screens.md §2 | `POST /bookings/{id}/payment-attempts` | state-machines.md §3 + §1 | payer 본인 | 일치 |
| 완료→학습결과→후기→재예약 | screens.md §3 | `/sessions/{id}/completion-confirmations`, `/learning-outcomes`, `/reviews`, `/rebooking-requests` | data-model.md §5 | authorization.md §2 | 일치 |
| 인증 심사 | screens.md §5 | `/verifications`, `/admin/verifications/*` | state-machines.md §4 | ops.verification_review | 일치 |

## 2. 발견 사항(재현 조건 포함)

### [수정 완료] F-01: OpenAPI Course 스키마의 required 필드 오류

- **재현 조건:** `packages/contracts/openapi.yaml`의 `components.schemas.Course.required`에 `curriculum`이 포함되어 있으나 `properties`에는 해당 필드가 없음(스키마 검증 도구가 이 계약으로 코드/클라이언트를 생성하면 항상 실패).
- **검증 방법:** `python3 -c "import yaml; ..."`로 모든 스키마의 required/properties 교차 검증(스캔 결과 첨부: Course만 불일치).
- **소유자:** A1
- **조치:** 이번 검토 중 A1이 `required`를 `[id, tutorId, subjectId, lifeZoneId, learningGoal, askingPrice, status]`로 수정. 재검증 결과 전체 스키마에서 불일치 0건(§5 재검증 로그).
- **상태:** RESOLVED

### F-02: 자기 거래(Self-dealing) 차단이 DB 제약으로 설계되지 않음

- **재현 조건:** authorization.md §4는 "DB 제약 또는 애플리케이션 검사로 차단"이라고만 서술하고, data-model.md에는 `booking_participants`에 대한 실제 제약(예: 동일 `booking_id`에서 `user_id`가 tutor 역할과 learner 역할에 동시 존재할 수 없음을 보장하는 CHECK/EXCLUDE 제약)이 명시되지 않았다.
- **위험:** 애플리케이션 계층 검사만 있으면 동시 요청·버그로 자기 거래가 생성될 수 있다(사업계획서 §4 "자기 거래 허용하지 않음" 원칙 위반 가능).
- **소유자:** A1(제약 설계), A2(구현 시 재검증)
- **권장 조치:** S03/S04 DB migration 작성 시 `booking_participants`에 `(booking_id, user_id)` 조합이 tutor/learner 역할을 동시에 가질 수 없도록 하는 제약 또는 애플리케이션 트랜잭션 내 명시적 검사를 추가하고 통합 테스트(QA-002 계열)로 검증한다.
- **상태:** OPEN — 단계 미완료 항목으로 보고(구현 단계인 S04 이전에는 완결 불가능한 성격이므로 S02-GATE의 통과를 막지 않되 반드시 추적)

### F-03: 포트폴리오 비동의 상태의 응답 내용이 불명확

- **재현 조건:** `openapi.yaml`의 `GET /tutors/{id}/activity-summary` 설명은 "본인/운영자면 상세, 그 외는 동의된 공개 필드만"이라고만 되어 있어, **동의가 전혀 없는 경우** 제3자 응답에 활동 기록 자체가 없어야 하는지, 빈 객체를 반환해야 하는지가 계약에 명시되지 않았다.
- **위험:** 구현자가 "동의된 필드만"을 "일부라도 보여준다"로 오해하면 기본값(비공개)을 위반해 무단으로 활동 기록이 노출될 수 있다(portfolio_consents 기본값 비공개 원칙, data-model.md §6).
- **소유자:** A1
- **권장 조치:** S02-T05 baseline 다음 개정에서 "portfolio_consents에 유효한 동의가 없으면 제3자 응답은 `null` 또는 404"로 명시.
- **상태:** OPEN — 경미, S03 계약 개정 시 반영 권장(설계 원칙 자체는 확정되어 있어 게이트를 막지 않음)

### F-04: completion_rate의 취소/환불 분모 포함 규칙이 보고서마다 다르게 정할 수 있는 구조

- **재현 조건:** `docs/ai/metrics-contract-proposal.md` §4는 "취소·환불·분쟁 건의 분모 포함 여부는 각 보고서에서 명시"라고 되어 있어, 규칙 자체가 문서마다 달라질 수 있다.
- **위험:** acceptance-matrix.md §3 "분모 없는 달성 주장" 위험과 직결 — 서로 다른 보고서가 서로 다른 분모 규칙으로 completion_rate를 계산하면 비교 불가능하고, 유리한 규칙을 선택하는 방식으로 성과를 부풀릴 수 있다.
- **소유자:** A5(제안), A1(계약 확정 권한)
- **권장 조치:** S02 후속 또는 S06 구현 착수 전, 단일 표준 규칙(예: "환불 완료 건은 분모에서 제외, 분쟁 중인 건은 분모에 포함하되 별도 각주")을 확정해 metrics-contract-proposal.md를 개정한다. 그때까지 모든 completion_rate 보고는 사용한 분모 규칙을 반드시 병기한다.
- **상태:** OPEN — 단계 미완료 항목으로 보고

### F-05: 재제안·수락 동시 요청의 락 순서가 S02 문서에 재기술되지 않음

- **재현 조건:** 기존 루트 아키텍처(§7 "최종 수락 트랜잭션")는 "협의방 행을 잠그고..." 절차를 규정하지만, S02-T01의 state-machines.md/data-model.md는 이를 재인용하지 않고 상태값만 정의했다. 구현자가 루트 문서를 참조하지 않으면 락 순서를 놓칠 수 있다.
- **위험 시나리오:** 학습자가 v1을 수락하는 순간 교육자가 v2로 재제안하면, 트랜잭션 순서에 따라 이미 SUPERSEDED된 제안이 수락돼 예약이 생성될 수 있다(경쟁 조건).
- **소유자:** A1
- **권장 조치:** S02-T01 산출물(data-model.md 또는 state-machines.md)에 루트 아키텍처 §7의 락 절차를 명시적으로 재인용하는 보완이 필요. S04/S05 구현 시 QA(A6)가 PostgreSQL 동시성 테스트로 직접 검증(acceptance-matrix.md §1 이미 인수 기준으로 존재).
- **상태:** OPEN — 문서 보완 권고, 구현 단계 검증 항목으로 이미 추적 중(중복 위험 아님, 문서 링크 누락만 지적)

## 3. 인수 기준 대조(위험 항목별)

| 위험 | 검토 결과 |
|---|---|
| 타인의 학습 결과·신원 증빙 접근 | `LearningOutcome`/`Verification` 접근 범위가 authorization.md에 명시되어 있고 openapi.yaml 설명에도 반복 기재됨 — 설계상 일치. 구현 후 QA-002 계열 테스트로 재검증 필요 |
| 무단 포트폴리오 공개 | F-03 참고 — 경미한 계약 모호성 존재, 원칙(기본 비공개)은 확정 |
| 과거 커리큘럼 수정 | `bookings.termsSnapshot`이 합의 시점 내용을 고정하므로 이후 커리큘럼 수정이 기존 예약 표시를 바꾸지 않음 — 설계상 안전. 단, 완료된 학습자에게 노출되는 "완료 당시 커리큘럼" 조회 API가 별도로 없다는 점은 P1 개선 사항으로 남김(신규 발견 아님, contract-requests.md 범위 밖) |
| 재예약 자동 청구 | `rebooking_requests`는 새 협의로만 전환되며 자동 결제 트리거가 계약에 없음 — 문제 없음 |
| 시간 환산·완료율·30일 분모·환불 지표의 모순 | F-04 참고 — completion_rate 분모 규칙의 표준화 필요 |

## 4. 새 데이터(S02 신규 엔티티)의 공개 범위 검토

| 신규 데이터 | 공개 범위 설계 | 판정 |
|---|---|---|
| `learning_outcomes` | 본인/상대방/운영자만(§2, authorization.md) | 적절 |
| `verifications.evidenceKey` | 공개 API 응답 제외 명시(openapi.yaml Verification 설명) | 적절 |
| `waitlist_entries` | 본인/운영자만 | 적절 |
| `tutor_activity_summaries`(공개판) | 동의 시에만 노출 | F-03으로 세부 규칙 보완 필요 |
| `acquisitionChannel`/`matching_failure_reason` | 내부 지표용, 공개 API 응답 스키마에 노출 안 함(openapi.yaml에는 필드 존재하나 공개 GET 응답에는 포함되지 않음 — 확인 완료) | 적절 |

## 5. 재검증 로그

```text
$ python3 -c "yaml.safe_load(openapi.yaml) 후 required/properties 교차 검증"
결과: 불일치 0건 (F-01 수정 반영 확인)
$ python3 -c "yaml.safe_load(events.yaml)"
결과: 파싱 성공, 이벤트 10건 정의 확인
```

## 6. 종합 판정

**단계 미완료 항목 없이 넘어가지 않는다.** F-02, F-04는 OPEN 상태로 S02-GATE에 그대로 보고하며, 이들은 설계 단계에서 완전히 해결할 수 없는 구현/정책 확정 사항이므로 각각 S04(자기거래 DB 제약)와 S02 후속/S06(지표 분모 표준화) 담당에게 인계한다. F-01은 이번 검토 중 즉시 수정되어 RESOLVED로 종결한다. F-03, F-05는 경미한 문서 보완 권고로 게이트를 막지 않는다.
