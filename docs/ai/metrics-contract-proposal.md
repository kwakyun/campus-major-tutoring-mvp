# 전공한시간 — 지표 계약 제안 (S02-T04)

작성: A5 · 작성일: 2026-09-19 · 입력: agent-prompts/source-alignment.md 지표 정의, docs/product/requirements.md §6(S01 결정)

이 문서는 source-alignment.md의 지표 정의를 실제 계약(필드·집계 규칙)으로 구체화한다. **같은 입력으로 같은 지표값을 재현할 수 있어야 한다.**

## 1. 기본 단위 필드(서로 다른 개념, 혼용 금지)

| 필드 | 정의 | 비고 |
|---|---|---|
| `booking_count` | 중복 제거한 예약 수 | 그룹 좌석 수와 별개(S10 이전에는 그룹 없음) |
| `paid_enrollment_count` | 학습자별 유효 수업료 납부 수강 수 | 재시도·웹훅 중복, 보증금, 테스트 거래(PAYMENT_MODE≠live) 제외 |
| `completed_enrollment_count` | 완료 처리된 학습자별 수강 수 | `completion_confirmations` 근거 필요 |
| `completed_learner_hour_units` | 완료된 학습자별 실제 인정 수강 분의 합 / 60 | 소수 단위 허용. 그룹 미도입 상태에서는 항상 1명×실제 분/60 |

원문 "1건"의 의미(HWPX 학습자 1명×1시간)가 실제 파일럿·확장 건수와 대응하는지는 S01에서 미확정으로 남겼다(policies.md). 위 4개 필드를 항상 함께 보고하고, "10건"·"30건" 목표 달성 여부는 이 중 어느 필드 기준인지 명시하지 않고는 판정하지 않는다.

## 2. 유입 채널·매칭 실패 사유 구분(신규 필드, AR-03 연결)

```text
acquisition_channel: enum(organic, community_post, referral_manual, paid_ad, direct)
  # 수동 모집(창업팀 지인 네트워크 등)은 organic과 구분해 `referral_manual`로 별도 표시,
  # 인건비 포함 여부를 채널별로 밝힌다(source-alignment.md channel_cac 정의)

matching_failure_reason: enum(time_mismatch, price_gap, subject_or_level_mismatch, quality_concern, no_candidate)
  # 학습 요청이 waitlisted 또는 expired로 종료될 때 기록.
  # "빈 추천"과 "가격 협의 실패"를 하나의 실패로 뭉치지 않는다.
```

## 3. 전환 퍼널 지표(서버 사실 기준)

```text
funnel:
  recommendation_served / recommendation_impression / course_detail_view
  -> inquiry_started (협의 시작, A2 이벤트)
  -> proposal_agreed (양측 동의, A2 이벤트)
  -> booking_funded (결제 충족, A4 이벤트)
  -> lesson_completed (완료, A2 이벤트)
  -> rebooking(§5)
```

각 단계 전환율은 분자·분모를 함께 표시하며, 표본이 작을 때(파일럿 초기) 비율만 단독 보고하지 않는다(acceptance-matrix.md "분모 없는 달성 주장" 인수 기준과 연결).

## 4. completion_rate 정의(재확인)

```text
completion_rate = completed_enrollment_count / 결과_판정_시점_도래_유료_수강_코호트
```

- 분모에는 "결과 판정 시점이 이미 지난" 유료 수강만 포함하고, 진행 예정 수강을 섞지 않는다.
- 취소·환불·분쟁 건의 분모 포함 여부는 각 보고서에서 명시하고, 환불자를 임의로 제외해 비율을 인위적으로 높이지 않는다.

## 5. rebooking_30d_rate 정의(재확인 + 취소 처리 정책 명시)

```text
분모: 첫 유료 수업 완료 후 30일을 온전히 관찰할 수 있는(즉 완료일+30일이 이미 지난) 고유 학습자 수
분자: 그 30일 이내에 후속 유료 예약을 "성립"시킨 학습자 수

성립 기준(확정 제안):
  - 예약 확정(CONFIRMED) 시점을 기준 시각으로 한다(제안 수락만으로는 불성립).
  - 30일 관찰 기간 내 성립했다가 이후 환불/취소된 예약은 성립 시점 기준으로는 분자에 포함하되,
    "성립 후 취소된 재예약" 수를 별도 각주로 병기한다(취소를 소급 제외하지 않음 — 재현성 유지 목적).
분모 0(관찰 완료된 고유 학습자가 없음)이면 N/A로 표기하고 0%로 표시하지 않는다.
```

이 정의는 제안이며 S02-T05 통합에서 A1이 최종 채택 여부를 확정한다(원문 30% 기준의 관찰기간·확정시점이 HWPX에 명시되지 않았기 때문 — source-alignment.md 충돌표).

## 6. 서버 사실 vs 자기보고 분리 표시

| 구분 | 예시 필드 | 표시 규칙 |
|---|---|---|
| 서버 거래 사실 | booking_count, paid_enrollment_count, completed_enrollment_count | "실측"으로 표기 |
| 자기보고 | goal_feedback_submitted.goalAchieved, 정산 만족도 설문 | "학습자/교육자 자기응답(n=응답수/발송수)"로 반드시 응답률 병기 |

자기보고를 객관적 학습 효과·인과 관계로 승격해 서술하지 않는다(acceptance-matrix.md §3과 동일 원칙).

## 7. 원문 목표 수치와의 연결

| 원문 지표 | 이 계약의 대응 필드 | 판정 가능 여부 |
|---|---|---|
| 파일럿 유료 수강 5~10건/10건 | `paid_enrollment_count` | 집계 가능(코호트·기간 명시 시) |
| 누적 30건, 완료율 80% | `paid_enrollment_count` 누계, `completion_rate` | §4 분모 규칙 확정 후 판정 |
| 30일 재예약률 30% | `rebooking_30d_rate` | §5 정의 채택 확정 후 판정 |

이 표의 목표 수치 자체는 여전히 "잠정 기준"이며(policies.md), 이 문서는 판정에 쓰일 산식만 고정한다.
