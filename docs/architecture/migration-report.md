# 전공한시간 — 초기 DB 마이그레이션 보고서 (S03-T02, A1)

작성일: 2026-09-19 · 입력: docs/architecture/data-model.md, state-machines.md · 실행 환경: PostgreSQL 16.13

## 1. 파일 구성

| 파일 | 내용 |
|---|---|
| `db/migrations/0001_extensions_and_identity.sql` | 확장(pgcrypto, btree_gist), 정책 버전, 학교/생활권, 사용자/역할/운영자 권한, 학교 소속, 튜터 프로필, 신원확인, 과목 |
| `db/migrations/0002_catalog_and_transactions.sql` | 수업/커리큘럼 버전, 학습 요청/대기 신청, 협의/제안/예약/세션/시간점유, 납부의무/정산/분쟁, 학습결과/다음단계/재예약/후기, 교육활동집계/포트폴리오 동의 |
| `db/seeds/demo.sql` | 허구 데모 데이터(학교 1, 생활권 1, 과목 2, 사용자 4, 수업 1, 학습요청 1) |
| `scripts/run-migrations.mjs` | 파일명 순 적용 + `schema_migrations` 이력 관리(멱등) |
| `scripts/run-seed.mjs` | 시드 실행기 |

## 2. data-model.md 대비 반영 현황

| data-model.md 절 | 반영 여부 | 비고 |
|---|---|---|
| §2 학교≠생활권 | 반영 | `campuses`, `life_zones`, `campus_life_zones`, `courses.life_zone_id` |
| §3 자기기재 vs 운영확인 | 반영 | `verifications.status` 4단계, `evidence_key`는 비공개 컬럼(공개 API에서 제외는 애플리케이션 계층 책임 — DB는 저장만 담당) |
| §4 대기 신청 | 반영 | `waitlist_entries`. 접근권한(본인+운영자)은 DB RLS가 아니라 애플리케이션 계층에서 강제(§4 설계 원칙 그대로, docs/decisions/policies.md 인증 미확정과 연동) |
| §5 학습결과·재예약 | 반영 | `learning_outcomes`(UNIQUE session+learner), `next_step_suggestions`(ai_draft 상태 포함), `rebooking_requests`(origin_booking_id 참조 유지, 새 협의로만 전환) |
| §6 커리큘럼 버전·활동집계·포트폴리오 동의 | 반영 | `curriculum_versions`, `tutor_activity_summaries`, `portfolio_consents`(UNIQUE user+scope, 기본 비공개는 애플리케이션 계층에서 "동의 없으면 레코드 없음"으로 구현 예정 — S04) |
| §7 기존 핵심 테이블 상세화 | 반영 | `courses`, `learning_requests`, `proposals`, `bookings`, `payment_obligations`에 명시된 필드 전부 포함 |
| §8 DB 제약 | 반영 | `UNIQUE(conversation_id, version)`, `UNIQUE(accepted_proposal_id)`, `UNIQUE(booking_id, author_id, target_id)` on reviews, `UNIQUE(session_id, learner_id)` on learning_outcomes, `UNIQUE(user_id, scope)` on portfolio_consents, `tutor_time_allocations`의 EXCLUDE 제약(btree_gist) 모두 구현 |

## 3. [핵심] F-02 자기 거래 차단을 실제 DB 제약으로 구현

`docs/qa/S02-design-review.md`의 F-02(OPEN, "S03/S04 DB migration 작성 시" 해소 예정으로 이관됨)를 이번 마이그레이션에서 실제로 해소했다.

- `conversations` 테이블에 `CONSTRAINT no_self_dealing CHECK (tutor_id <> learner_id)` 추가.
- `proposals`, `bookings`는 모두 `conversation_id`로만 당사자를 참조하므로 이 하나의 제약으로 하위 전체 거래 단계의 자기 거래가 원천 차단된다.
- `rebooking_requests`는 `conversations`를 거치지 않고 새 협의 생성 이전 단계에서 `tutor_id`/`learner_id`를 직접 갖기 때문에 동일한 `CHECK` 제약을 별도로 추가했다.
- **실제 PostgreSQL 인스턴스에 대해 두 케이스(동일인 삽입 시도 → 실패, 서로 다른 인원 삽입 → 성공)를 모두 실행해 검증했다**(docs/qa/S03-foundation.md §2-1에 실행 로그 첨부).

## 4. 이번 단계에서 의도적으로 DB가 아닌 애플리케이션 계층에 남긴 것

| 항목 | 이유 |
|---|---|
| `waitlist_entries`/`learning_outcomes`의 "본인+운영자만 조회" | 인증 방식(Supabase RLS 채택 여부)이 계약 미체결이라 RLS 정책을 지금 확정하면 재작업 위험이 큼. S04에서 애플리케이션 가드로 먼저 구현하고, RLS 도입 여부는 별도 결정 |
| `curriculum_versions.cloned_from_course_id`의 "소유자만 복제 가능" | 동일 tutor_id 검사는 FK로 표현 불가(다른 소유자 course를 참조하는 것 자체는 막을 수 없음) — 서비스 계층 검사 필요(S04) |
| `settlements`의 "분쟁 중 정산 보류" | 시점 경합(분쟁이 정산 실행과 동시에 열리는 경우)까지 막으려면 트리거+락 전략이 필요하며 이번 단계 범위 밖(S06) |
| completion_rate 분모 규칙(F-04) | 애초에 DB 스키마 문제가 아니라 지표 계산 규칙 문제 — 스키마는 원본 데이터(세션, 취소, 환불)를 모두 보존하도록만 설계했고, 규칙 자체는 S02-design-review.md대로 S06에서 표준화 예정 |

## 5. 실행 검증 요약

`pnpm run db:migrate`(빈 DB 최초 적용 2건 → 재실행 시 0건, 멱등성 확인), `pnpm run db:seed`(허구 데이터 적용) 모두 실제 PostgreSQL 16 인스턴스에 대해 실행해 통과를 확인했다. 상세 로그는 `docs/qa/S03-foundation.md` §2를 참고.
