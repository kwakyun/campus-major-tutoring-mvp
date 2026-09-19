# 전공한시간 — 상세 데이터 모델 (S02-T01)

작성: A1(아키텍처·DB·API 계약) · 작성일: 2026-09-19
입력: 전공한시간_웹서비스_아키텍처.md §6(기존 ERD), docs/architecture/requirements-map.md §4·§6(S01에서 이관된 6개 결정)
범위: 이 문서는 유료 파일럿(B 단계) 목표 모델이다. A 단계(대회 데모)는 이 중 협의·동의·예약·모의 금액 처리 핵심만 구현할 수 있다.

## 1. 원칙

- 기존 루트 설계(웹서비스 아키텍처 6절)의 테이블은 유지하고, 이 문서는 **① 신규 테이블(대기 신청·학습 결과·재예약·커리큘럼 버전·교육 활동 집계·포트폴리오 동의) ② 학교/생활권 분리 ③ 자기기재/운영확인 구분**을 상세화한다.
- 금액은 KRW 정수 원, 비율은 bps(15%=1500bps), 시간은 `timestamptz` 저장 후 `Asia/Seoul` 표시 원칙을 그대로 따른다.
- 합의한 커리큘럼·취소 조건 사본은 JSON 스냅샷으로 보존하고, 조회·제약에 필요한 값은 정규 컬럼에 둔다(루트 원칙 유지).

## 2. 학교/캠퍼스 ≠ 생활권 (SRC-08)

기존 `courses.campus_id`는 "어느 학교 소속 교육자/학습자인가"만 표현하며, "실제로 만날 수 있는 이동 반경"과 다르다. 편입준비생은 특정 대학 소속이 아니므로 `campus_id` 하나로는 생활권을 표현할 수 없다.

| 테이블 | 주요 필드 | 의미 |
|---|---|---|
| `campuses` | id, name, region | 학교 식별자(소속 확인용, 거래 조건 아님) |
| `life_zones` | id, name, center_point, radius_or_bounds | 실제 대면 수업이 성사될 수 있는 생활권(예: "OO대 정문~OO역") |
| `campus_life_zones` | campus_id, life_zone_id | 한 학교가 여러 생활권과 연결될 수 있음(다지역 매칭 로직은 아직 구현하지 않음 — 확장 전이라도 식별만 가능하게 함) |
| `user_campus_affiliations` | user_id, campus_id, affiliation_type(enrolled/prep/none), self_reported_at, verified_status | 편입준비생은 `affiliation_type=prep` 또는 `none`으로 가입 가능. 이 값이 없어도 학습자 가입은 차단되지 않음(SRC-01) |

`courses.life_zone_id`(신규, `campus_id` 대신 또는 병행)로 수업이 실제 열리는 생활권을 지정한다. 첫 파일럿은 `life_zones`가 1건뿐이어도 스키마는 다건을 전제로 설계해 S10의 `campus_area_expansion` 트랙에서 재설계가 필요 없게 한다(다지역 매칭 로직 자체는 지금 구현하지 않는다).

## 3. 자기기재 vs 운영 확인 상태 (SRC-02)

| 테이블 | 주요 필드 | 의미 |
|---|---|---|
| `tutor_profiles` | user_id, self_reported_school, self_reported_major, self_reported_career_json | 본인이 입력한 값(그대로는 공개 프로필에 "확인됨"으로 표기하지 않음) |
| `verifications` | id, user_id, type(enum: school_enrollment, major, career, certification), status(enum: self_reported, pending, verified, rejected), evidence_key(비공개 storage 참조), reviewed_by, reviewed_at | 항목별로 독립된 확인 상태. `evidence_key`는 비공개 storage에만 존재하고 공개 API 응답에 포함하지 않는다 |
| `tutor_profiles.public_verification_badges` | (verifications에서 파생, 캐시 아님 — 조회 시점 계산 권장) | 공개 프로필에는 "학교 인증됨" 배지만 노출, 이를 "교육 능력 인증"으로 표시하지 않는다(acceptance-matrix.md 인수 기준과 직접 연결) |
| `courses.sample_description`, `courses.expected_outcome` | text | 샘플 설명·예상 결과물(교육 능력을 보여주는 실질적 근거, 인증 상태와 별개 필드) |

**설계 규칙:** `verifications.status='verified'`는 해당 항목(학교 재학, 특정 자격 등)만 확인됐다는 뜻이며, 다른 항목이나 "가르치는 능력"에 대해서는 아무 것도 증명하지 않는다. API 응답 스키마에서 이 둘을 같은 필드로 합치지 않는다.

## 4. 대체 시간 제안·대기 신청 (SRC-03)

| 테이블 | 주요 필드 | 의미 |
|---|---|---|
| `learning_requests` | (기존) + `status`(enum: open, matched, waitlisted, expired, withdrawn) | 매칭 실패 시 `waitlisted`로 전이 |
| `waitlist_entries`(신규) | id, learning_request_id, learner_id, desired_windows_json, alternative_time_accepted(bool), status(enum: open, notified, matched, expired, withdrawn), created_at, expires_at | 조건에 맞는 교육자가 없을 때 생성. 신규 교육자·수업 등록 시 매칭 후보 알림 대상 |
| **접근 권한** | | `waitlist_entries`는 본인(learner_id)과 운영자만 조회 가능. 다른 학습자·교육자에게 노출하지 않는다 |

## 5. 학습 결과·목표 달성·다음 학습 단계·재예약 (SRC-03, SRC-04)

| 테이블 | 주요 필드 | 의미 |
|---|---|---|
| `learning_outcomes`(신규) | id, session_id, learner_id, goal_achieved(enum: yes, partial, no, no_response), feedback_text, submitted_at | 사전 질문·완료 확인 과제 결과. 자기보고이며 객관적 학습효과 증명으로 취급하지 않는다(acceptance-matrix.md §3) |
| `next_step_suggestions`(신규) | id, session_id, suggested_by(enum: tutor, ai_draft), content_json, status(enum: draft, tutor_confirmed) | AI가 생성해도 `ai_draft` 상태로 저장, 교육자 확정 전 학습자에게 확정 제안으로 노출하지 않음(AI 추천 아키텍처 10절 원칙과 연결) |
| `rebooking_requests`(신규) | id, origin_booking_id(FK bookings, 원본 예약 참조), learner_id, tutor_id, new_conversation_id, status(enum: requested, converted, declined, expired) | 새 협의(conversation)로 시작하되 원본 예약을 참조로 유지. 기존 예약을 직접 재사용하지 않는다(웹서비스 아키텍처 7절 "재예약 상담은 별도 협의로 시작" 원칙 유지) |
| **접근 권한** | | `learning_outcomes`는 본인 학습자, 해당 세션의 교육자, 필요 업무 권한 운영자만 조회(acceptance-matrix.md "학습 결과 접근 권한" 인수 기준과 직접 연결). 제3자 접근은 거절되어야 한다 |

## 6. 소유자 커리큘럼 복제·버전·교육 활동 집계·포트폴리오 동의 (SRC-04)

| 테이블 | 주요 필드 | 의미 |
|---|---|---|
| `curriculum_versions`(신규) | id, course_id, version, content_snapshot_json, cloned_from_course_id(nullable), created_by, created_at | 교육자가 자신의 기존 커리큘럼을 복제해 새 수업을 만들 때 `cloned_from_course_id`로 계보 유지. 타인의 커리큘럼 복제는 허용하지 않음(소유자만 복제 가능) |
| `tutor_activity_summaries`(신규, 파생/집계) | tutor_id, period_start, period_end, completed_sessions_count, completed_learner_hour_units, subjects_taught_json, review_summary_json, generated_at | 완료된 실제 데이터에서만 집계. 대학 공식 학점·공인 자격으로 표시하지 않는다는 원문 제약을 API 문구 수준에서도 지킨다 |
| `portfolio_consents`(신규) | id, user_id, scope(enum: public_activity_record, public_review_display), granted_at, revoked_at | 교육 활동 기록의 "공개 포트폴리오" 노출은 별도 동의가 있어야 하며, 동의 철회 시 즉시 비공개 전환. 기본값은 비공개 |

## 7. 기존 핵심 테이블(회원·수업·협의·예약·납부) 상세화

기존 루트 ERD(웹서비스 아키텍처 6절)의 다음 테이블에 아래 제약을 추가로 명시한다.

| 테이블 | 추가/명시할 제약 |
|---|---|
| `courses` | `target_audience`, `prerequisite_level`, `learning_goal`, `unit_breakdown_json`(차시별 내용), `total_minutes`, `expected_outcome`, `capacity`, `asking_price`, `life_zone_id`(§2), `status`(draft/pending_review/published/unpublished), `curriculum_source`(manual/ai_generated — 에드혹 추가, db/migrations/0004, docs/handoffs/ADHOC-01-ai-curriculum-draft.md) |
| `learning_requests` | `goal`, `level`(자기신고, "수준 확인 필요" 표현 지원 — 값 없음을 부적격으로 처리하지 않음), `deadline`(기한), `budget_range`, `desired_windows_json`, `life_zone_id` |
| `proposals` | `terms_hash`(정규화 해시), `expires_at`, `status`(ACTIVE/SUPERSEDED/EXPIRED/ACCEPTED) — `UNIQUE(conversation_id, version)` |
| `bookings` | `policy_version_id`(FK `policy_versions`), `terms_snapshot_json`(합의 시점 커리큘럼·취소조건 고정), `version` |
| `payment_obligations` | `purpose`(enum: tuition, learner_deposit, tutor_deposit), `payer_id`, `amount`, `status`(PENDING/FULFILLED/EXPIRED/REFUND_PENDING/REFUNDED) |

## 8. 이 문서에서 확정한 DB 제약(요약)

- `UNIQUE(conversation_id, version)`, `UNIQUE(proposal_id, user_id)`, `UNIQUE(accepted_proposal_id)` — 기존 루트 설계 유지
- `UNIQUE(booking_id, author_id, target_id)` on `reviews` — 기존 유지
- `UNIQUE(learning_outcomes.session_id, learning_outcomes.learner_id)` — 세션당 학습자 1개 결과만
- `UNIQUE(portfolio_consents.user_id, portfolio_consents.scope)` — 동일 범위 중복 동의 방지, 최신 상태로 갱신
- `time_allocations`의 exclusion constraint는 기존 루트 설계를 그대로 적용하며, `life_zones` 도입이 이 제약의 범위를 바꾸지 않는다(생활권은 검색·매칭 조건이지 시간 점유 단위가 아님)

## 9. S01에서 이관된 결정 처리 현황

| S01 이관 항목(requirements-map.md §6) | 이 문서에서의 처리 |
|---|---|
| campus_id vs 생활권 분리 | §2에서 확정(campuses, life_zones, campus_life_zones 분리) |
| 대기 신청 상태 모델 | §4에서 확정(waitlist_entries) |
| 학습 결과·교육 활동 보고서 테이블 | §5, §6에서 확정 |
| 채널 유입 필드 | S02-T04(A5)로 이관(추천·이벤트 계약에서 처리) |
| PAYMENT_PENDING 만료 시간, 시간 중복 배제 범위 | S02-T03(A4)/T05(A1 통합)에서 처리 |
| 운영자 권한 세분화 | docs/api/authorization.md(본 명령 동시 산출)에서 처리 |
