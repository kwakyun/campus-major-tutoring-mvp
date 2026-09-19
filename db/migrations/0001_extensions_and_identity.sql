-- 전공한시간 초기 스키마 1/2: 확장 · 정책 버전 · 학교/생활권 · 사용자/신원확인 (S03-T02, A1)
-- 입력: docs/architecture/data-model.md §2·§3·§7, docs/architecture/state-machines.md §4
-- 원칙: 금액은 KRW 정수 원(BIGINT), 비율은 bps(INTEGER), 시간은 timestamptz.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- 0002의 tutor_time_allocations EXCLUDE 제약에 필요

-- ---------------------------------------------------------------------------
-- 정책 버전 (courses.policy_version_id, bookings.policy_version_id가 참조)
-- ---------------------------------------------------------------------------
CREATE TABLE policy_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label  TEXT NOT NULL UNIQUE,           -- 예: "2026-09-fee-15pct"
  fee_bps        INTEGER NOT NULL CHECK (fee_bps >= 0 AND fee_bps <= 10000),
  content_json   JSONB NOT NULL,                 -- 취소·환불·수수료 조건 스냅샷
  effective_at   TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 학교(campuses) ≠ 생활권(life_zones) — data-model.md §2 (SRC-08)
-- ---------------------------------------------------------------------------
CREATE TABLE campuses (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name    TEXT NOT NULL,
  region  TEXT
);

CREATE TABLE life_zones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,             -- 예: "OO대 정문~OO역"
  center_point        POINT,                     -- 파일럿 단계는 단일 값이어도 다건 스키마 전제(S10 대비)
  radius_meters       INTEGER,
  bounds_geojson      JSONB                      -- 원형 반경 대신 다각형 경계를 쓸 경우
);

CREATE TABLE campus_life_zones (
  campus_id     UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  life_zone_id  UUID NOT NULL REFERENCES life_zones(id) ON DELETE CASCADE,
  PRIMARY KEY (campus_id, life_zone_id)
);

-- ---------------------------------------------------------------------------
-- 사용자 · 역할 · 운영자 세부 권한
-- 실제 인증(Supabase Auth 등)은 계약 미체결(docs/decisions/policies.md) —
-- id는 향후 auth provider의 user id와 1:1로 맞출 수 있도록 UUID로 둔다.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('learner', 'tutor', 'operator');

CREATE TABLE user_roles (
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role     user_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

CREATE TYPE operator_permission AS ENUM (
  'ops.verification_review',
  'ops.matching',
  'ops.dispute_resolution',
  'ops.finance',
  'ops.audit'
);

-- docs/api/authorization.md: 분쟁 심의자와 정산 집행자를 분리하기 위한 세분화된 권한.
CREATE TABLE operator_permissions (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission  operator_permission NOT NULL,
  PRIMARY KEY (user_id, permission)
);

-- affiliation_type='prep' 또는 'none'이어도 학습자 가입이 차단되지 않는다(SRC-01).
-- campus_id는 'prep'/'none'일 때 NULL일 수 있다.
CREATE TYPE affiliation_type AS ENUM ('enrolled', 'prep', 'none');

CREATE TABLE user_campus_affiliations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id          UUID REFERENCES campuses(id),
  affiliation_type   affiliation_type NOT NULL,
  self_reported_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_status    TEXT NOT NULL DEFAULT 'self_reported'
                        CHECK (verified_status IN ('self_reported', 'pending', 'verified', 'rejected')),
  CONSTRAINT campus_required_when_enrolled
    CHECK (affiliation_type <> 'enrolled' OR campus_id IS NOT NULL)
);

CREATE TABLE tutor_profiles (
  user_id                    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  self_reported_school       TEXT,
  self_reported_major        TEXT,
  self_reported_career_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 자기기재 vs 운영 확인 상태 (SRC-02, data-model.md §3, state-machines.md §4).
-- 항목(type)별로 독립 상태를 가진다 — 한 항목의 verified가 다른 항목이나
-- "교육 능력"의 확인을 의미하지 않는다.
CREATE TYPE verification_type AS ENUM ('school_enrollment', 'major', 'career', 'certification');
CREATE TYPE verification_status AS ENUM ('self_reported', 'pending', 'verified', 'rejected');

CREATE TABLE verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              verification_type NOT NULL,
  status            verification_status NOT NULL DEFAULT 'self_reported',
  evidence_key      TEXT,             -- 비공개 storage 참조. 공개 API 응답에 절대 포함하지 않는다.
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rejection_reason_required_when_rejected
    CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL)
);

CREATE INDEX idx_verifications_user_id ON verifications(user_id);

CREATE TABLE subjects (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

COMMIT;
