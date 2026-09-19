-- 전공한시간 초기 스키마 2/2: 수업 · 협의 · 예약 · 납부 · 결과 · 정산 (S03-T02, A1)
-- 입력: docs/architecture/data-model.md §4·§5·§6·§7, state-machines.md §1·§2·§3·§7·§8·§9
--       docs/qa/S02-design-review.md F-02(자기거래 DB 제약) — 이 마이그레이션에서 해소한다.

BEGIN;

-- ---------------------------------------------------------------------------
-- 수업(Course) · 커리큘럼 버전
-- ---------------------------------------------------------------------------
CREATE TYPE course_status AS ENUM ('draft', 'pending_review', 'published', 'unpublished');

CREATE TABLE courses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id              UUID NOT NULL REFERENCES users(id),
  subject_id            UUID NOT NULL REFERENCES subjects(id),
  life_zone_id          UUID NOT NULL REFERENCES life_zones(id),
  target_audience       TEXT,
  prerequisite_level    TEXT,
  learning_goal         TEXT NOT NULL,
  unit_breakdown_json   JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_minutes         INTEGER,
  expected_outcome      TEXT,
  sample_description    TEXT,
  capacity              INTEGER,
  asking_price_amount   BIGINT NOT NULL CHECK (asking_price_amount >= 0),
  asking_price_currency TEXT NOT NULL DEFAULT 'KRW',
  fee_bps               INTEGER CHECK (fee_bps IS NULL OR (fee_bps >= 0 AND fee_bps <= 10000)),
  policy_version_id     UUID REFERENCES policy_versions(id),
  status                course_status NOT NULL DEFAULT 'draft',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_tutor_id ON courses(tutor_id);
CREATE INDEX idx_courses_status_life_zone ON courses(status, life_zone_id);

-- 소유자만 자신의 커리큘럼을 복제할 수 있다 — cloned_from_course_id의 tutor_id가
-- 새 course의 tutor_id와 같아야 하는 검사는 애플리케이션 계층(S04)에서 강제한다
-- (다른 소유자의 course를 참조 자체는 FK로 막을 수 없어 트리거 또는 서비스 계층 필요).
CREATE TABLE curriculum_versions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version               INTEGER NOT NULL,
  content_snapshot_json JSONB NOT NULL,
  cloned_from_course_id UUID REFERENCES courses(id),
  created_by            UUID NOT NULL REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, version)
);

-- ---------------------------------------------------------------------------
-- 학습 요청 · 대기 신청 (SRC-03)
-- ---------------------------------------------------------------------------
CREATE TYPE learning_request_status AS ENUM ('open', 'matched', 'waitlisted', 'expired', 'withdrawn');
CREATE TYPE acquisition_channel AS ENUM ('organic', 'community_post', 'referral_manual', 'paid_ad', 'direct');

CREATE TABLE learning_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id            UUID NOT NULL REFERENCES users(id),
  goal                  TEXT NOT NULL,
  level                 TEXT,                     -- 자기신고, 값 없음을 부적격으로 처리하지 않음
  deadline              TIMESTAMPTZ,
  budget_range_json     JSONB,
  desired_windows_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
  life_zone_id          UUID NOT NULL REFERENCES life_zones(id),
  acquisition_channel   acquisition_channel,
  status                learning_request_status NOT NULL DEFAULT 'open',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_requests_learner_id ON learning_requests(learner_id);

CREATE TYPE waitlist_status AS ENUM ('open', 'notified', 'matched', 'expired', 'withdrawn');

-- 접근 권한(본인+운영자만)은 DB 레벨(RLS)이 아니라 S04 애플리케이션 계층에서 강제한다.
-- 이 세션 인증 방식(Supabase RLS 여부)이 아직 계약 미체결이기 때문이다(docs/decisions/policies.md).
CREATE TABLE waitlist_entries (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_request_id      UUID NOT NULL REFERENCES learning_requests(id) ON DELETE CASCADE,
  learner_id               UUID NOT NULL REFERENCES users(id),
  desired_windows_json     JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternative_time_accepted BOOLEAN NOT NULL DEFAULT false,
  status                   waitlist_status NOT NULL DEFAULT 'open',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at               TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 협의(Conversation) · 제안(Proposal) · 예약(Booking)
--
-- [F-02 해소] 자기 거래(Self-dealing) 차단을 애플리케이션 검사에만 맡기지 않고
-- conversations 테이블 자체에 CHECK(tutor_id <> learner_id)로 강제한다.
-- proposals·bookings는 모두 conversation_id를 통해서만 당사자를 참조하므로,
-- 이 하나의 제약이 하위 모든 거래 단계의 자기 거래를 원천 차단한다
-- (docs/qa/S02-design-review.md F-02, 상태를 OPEN → 이 마이그레이션으로 RESOLVED).
-- ---------------------------------------------------------------------------
CREATE TABLE conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           UUID REFERENCES courses(id),
  learning_request_id UUID REFERENCES learning_requests(id),
  tutor_id            UUID NOT NULL REFERENCES users(id),
  learner_id          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_dealing CHECK (tutor_id <> learner_id),
  CONSTRAINT origin_required CHECK (course_id IS NOT NULL OR learning_request_id IS NOT NULL)
);

CREATE INDEX idx_conversations_tutor_id ON conversations(tutor_id);
CREATE INDEX idx_conversations_learner_id ON conversations(learner_id);

CREATE TYPE proposal_status AS ENUM ('ACTIVE', 'SUPERSEDED', 'EXPIRED', 'ACCEPTED');

CREATE TABLE proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  proposer_id     UUID NOT NULL REFERENCES users(id),
  status          proposal_status NOT NULL DEFAULT 'ACTIVE',
  terms_hash      TEXT NOT NULL,
  terms_json      JSONB NOT NULL,   -- ProposalTerms: curriculum/sessions/participants/prices/policies/validity
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, version)
);

CREATE TYPE booking_status AS ENUM (
  'PAYMENT_PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELED',
  'IN_PROGRESS', 'COMPLETION_PENDING', 'COMPLETED', 'DISPUTED'
);

CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accepted_proposal_id  UUID NOT NULL UNIQUE REFERENCES proposals(id),
  conversation_id       UUID NOT NULL REFERENCES conversations(id),
  status                booking_status NOT NULL DEFAULT 'PAYMENT_PENDING',
  policy_version_id     UUID REFERENCES policy_versions(id),
  terms_snapshot_json   JSONB NOT NULL,  -- 합의 시점 커리큘럼·취소조건 고정(이후 커리큘럼 수정에 영향받지 않음)
  acquisition_channel   acquisition_channel,
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_conversation_id ON bookings(conversation_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 세션(실제 수업 회차). learning_outcomes/next_step_suggestions가 참조한다.
CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at   TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'scheduled'
                       CHECK (status IN ('scheduled', 'completed', 'canceled')),
  CONSTRAINT session_time_range CHECK (scheduled_end_at > scheduled_start_at)
);

CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);

-- 튜터 시간 점유 — 반열림 구간 [start, end) 중복 배제(data-model.md §8 exclusion constraint).
-- packages/domain/time의 intervalsOverlap과 동일한 반열림 구간 규칙을 DB 레벨에서도 강제한다.
CREATE TABLE tutor_time_allocations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id    UUID NOT NULL REFERENCES users(id),
  session_id  UUID REFERENCES sessions(id),
  time_range  TSTZRANGE NOT NULL,
  EXCLUDE USING gist (tutor_id WITH =, time_range WITH &&)
);

-- ---------------------------------------------------------------------------
-- 납부 의무 · 정산 · 분쟁
-- ---------------------------------------------------------------------------
CREATE TYPE payment_purpose AS ENUM ('tuition', 'learner_deposit', 'tutor_deposit');
CREATE TYPE payment_obligation_status AS ENUM ('PENDING', 'FULFILLED', 'EXPIRED', 'REFUND_PENDING', 'REFUNDED');

CREATE TABLE payment_obligations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payer_id          UUID NOT NULL REFERENCES users(id),
  purpose           payment_purpose NOT NULL,
  amount            BIGINT NOT NULL CHECK (amount >= 0),
  currency          TEXT NOT NULL DEFAULT 'KRW',
  expires_at        TIMESTAMPTZ,
  status            payment_obligation_status NOT NULL DEFAULT 'PENDING',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_obligations_booking_id ON payment_obligations(booking_id);

CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_completed', 'resolved_canceled');

CREATE TABLE disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id),
  status            dispute_status NOT NULL DEFAULT 'open',
  reason            TEXT NOT NULL,
  evidence_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolved_by       UUID REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE settlement_status AS ENUM ('PENDING', 'HELD', 'RELEASED', 'PAID', 'FAILED');

-- open/under_review 상태인 분쟁이 있는 동안 정산 실행을 보류하는 규칙(state-machines.md §8)은
-- 애플리케이션 계층(S06)에서 강제한다 — DB 트리거로는 시점 경합을 완전히 막기 어렵다.
CREATE TABLE settlements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  tutor_id        UUID NOT NULL REFERENCES users(id),
  tuition_amount  BIGINT NOT NULL CHECK (tuition_amount >= 0),
  fee_amount      BIGINT NOT NULL CHECK (fee_amount >= 0),
  payable_amount  BIGINT NOT NULL CHECK (payable_amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'KRW',
  status          settlement_status NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payable_equals_tuition_minus_fee CHECK (payable_amount = tuition_amount - fee_amount)
);

CREATE TABLE payout_attempts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id  UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  status         TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  provider_ref   TEXT,
  attempted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 학습 결과 · 다음 단계 제안 · 재예약 · 후기 (SRC-03, SRC-04)
-- ---------------------------------------------------------------------------
CREATE TABLE learning_outcomes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  learner_id     UUID NOT NULL REFERENCES users(id),
  goal_achieved  TEXT NOT NULL CHECK (goal_achieved IN ('yes', 'partial', 'no', 'no_response')),
  feedback_text  TEXT,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, learner_id)
);

CREATE TABLE next_step_suggestions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  suggested_by  TEXT NOT NULL CHECK (suggested_by IN ('tutor', 'ai_draft')),
  content_json  JSONB NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'tutor_confirmed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE rebooking_status AS ENUM ('requested', 'converted', 'declined', 'expired');

CREATE TABLE rebooking_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_booking_id   UUID NOT NULL REFERENCES bookings(id),
  learner_id          UUID NOT NULL REFERENCES users(id),
  tutor_id            UUID NOT NULL REFERENCES users(id),
  new_conversation_id UUID REFERENCES conversations(id),
  status              rebooking_status NOT NULL DEFAULT 'requested',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rebooking_no_self_dealing CHECK (tutor_id <> learner_id)
);

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id),
  author_id   UUID NOT NULL REFERENCES users(id),
  target_id   UUID NOT NULL REFERENCES users(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, author_id, target_id)
);

-- ---------------------------------------------------------------------------
-- 교육 활동 집계 · 포트폴리오 동의 (기본값 비공개)
-- ---------------------------------------------------------------------------
CREATE TABLE tutor_activity_summaries (
  tutor_id                    UUID NOT NULL REFERENCES users(id),
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  completed_sessions_count    INTEGER NOT NULL DEFAULT 0,
  completed_learner_hour_units NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subjects_taught_json        JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_summary_json         JSONB,
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tutor_id, period_start, period_end)
);

CREATE TABLE portfolio_consents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope       TEXT NOT NULL CHECK (scope IN ('public_activity_record', 'public_review_display')),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ,
  UNIQUE (user_id, scope)
);

COMMIT;
