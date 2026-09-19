-- ===========================================================================
-- 전공한시간 마이그레이션 0003: 교육자 가용 시간 및 대기 신청 알림 동의
--
-- 작성일: 2026-09-19 (S04-T01 계약 동기화)
-- 목적:
--   1. waitlist_entries 테이블에 알림 동의(notify_consent) 컬럼 추가
--   2. tutor_availability_windows 테이블 생성 (요일·분 단위 가용 시간대 관리)
-- ===========================================================================

-- 1. 대기 신청 알림 동의 컬럼 추가
ALTER TABLE waitlist_entries
  ADD COLUMN IF NOT EXISTS notify_consent BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN waitlist_entries.notify_consent IS
  '조건 일치 교육자 등록 또는 공석 발생 시 알림 수신 동의 여부 (S04-T01)';

-- 2. 교육자 주간 정기 가용 시간대 테이블
CREATE TABLE IF NOT EXISTS tutor_availability_windows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minute INT NOT NULL CHECK (start_minute BETWEEN 0 AND 1440),
  end_minute   INT NOT NULL CHECK (end_minute BETWEEN 0 AND 1440 AND end_minute > start_minute),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tutor_availability_windows IS
  '교육자가 설정한 주간 정기 가능 시간 (day_of_week: 0=일..6=토, 0~1440분)';

CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor
  ON tutor_availability_windows (tutor_id);

CREATE INDEX IF NOT EXISTS idx_tutor_availability_lookup
  ON tutor_availability_windows (day_of_week, start_minute, end_minute);
