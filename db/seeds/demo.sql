-- 전공한시간 데모 시드 (S03-T02, A7 / 2026-09-19 생활권 타겟 갱신, A2)
-- 아래 데이터는 전부 허구다. 실제 창업자·학교·학생 개인정보를 담지 않는다
-- (00-workflow.yaml 공통 지침). UUID는 재실행 시 충돌하지 않도록 고정값을 사용한다.
--
-- 주의: apps/api/src/modules/auth/session-verifier.ts의 FakeSessionVerifier 픽스처
-- (userId: "seed-learner-prep-0001" 등)는 문자열 키를 쓰는 완전히 별개의 인메모리
-- 테스트 대역이며, 아래 DB 시드의 UUID와 아직 연결되어 있지 않다. 세션 인증과 DB
-- 사용자 레코드를 실제로 연결하는 작업은 S04(A2, 인증-DB 연동)에서 수행한다.
--
-- 2026-09-19 갱신: 사용자 요청으로 초기 출시 생활권을 "가상대학교/서울" 플레이스홀더
-- 대신 목표 상권인 "부산대학교/부산"으로 타겟팅한다. 모든 UUID는 그대로 유지했다
-- (courses/learning_requests/verifications 등 기존 행이 이 ID들을 참조하므로 ID를
-- 바꾸면 깨진다) — campuses.name, life_zones.name, region, tutor_profiles의
-- self_reported_school 등 텍스트 라벨만 바꿨다. 이는 실제 부산대학교와의 공식
-- 제휴를 의미하지 않는 가상의 초기 출시 시나리오다(docs/decisions/policies.md
-- 공통 지침 — 허구 데이터에 실제 기관명을 오인시키지 않을 것). 이 파일은 A7
-- 소유(allowed_paths)이나, 이번 변경은 스키마가 아닌 데이터 값만 바꾸는 것이고
-- apps/api/src/modules/catalog/reference-data.repository.ts(A2 소유, 인메모리
-- 참조 데이터)와 UUID·라벨을 동일하게 유지해야 하는 명시적 요구사항이 있어
-- A2가 함께 갱신했다 — S03-T03/S04-T01의 app.module.ts 교차 수정과 동일한 선례.
--
-- 2026-09-19 추가 갱신: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 교육자
-- 2명(영어/컴퓨터공학)·과목 1개(자료구조와 알고리즘)·수업 2건·학습 요청 1건·대기
-- 신청 1건을 추가한다. apps/api는 아직 이 DB에 실제로 접속하지 않으므로(§ 위 주석)
-- 여기 추가한 내용은 "실제로 실행되는 앱"에는 영향이 없다 — 실행 중인 앱에 보이는
-- 더미 데이터는 apps/api/src/modules/{catalog,identity,matching}/*.repository.ts의
-- 인메모리 시드다. 이 파일은 실제 Postgres 연동 시점을 위해 두 시드를 동기화해
-- 두는 것뿐이다(docs/backend/course-discovery.md §10 참고). 아래 신규 tutor
-- 사용자(405, 406)는 FakeSessionVerifier의 로그인 픽스처와 연결되어 있지 않다 —
-- 이는 원래 있던 데모 튜터(403)도 이미 그랬던, S03-T02부터의 기존 미해결 갭이다
-- (세션 인증-DB 사용자 연결은 아직 어느 단계에서도 완료되지 않았다).

BEGIN;

-- 학교 · 생활권
INSERT INTO campuses (id, name, region) VALUES
  ('00000000-0000-0000-0000-000000000001', '부산대학교', '부산')
ON CONFLICT (id) DO NOTHING;

INSERT INTO life_zones (id, name, radius_meters) VALUES
  ('00000000-0000-0000-0000-000000000101', '부산대학교 정문~부산대역 생활권', 1500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO campus_life_zones (campus_id, life_zone_id) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101')
ON CONFLICT DO NOTHING;

-- 과목
INSERT INTO subjects (id, name) VALUES
  ('00000000-0000-0000-0000-000000000201', '미시경제학'),
  ('00000000-0000-0000-0000-000000000202', '편입영어'),
  ('00000000-0000-0000-0000-000000000203', '자료구조와 알고리즘'),
  ('00000000-0000-0000-0000-000000000204', '파이썬 프로그래밍')
ON CONFLICT (id) DO NOTHING;

-- 정책 버전(수수료 15% = 1500bps, docs/decisions/policies.md)
INSERT INTO policy_versions (id, version_label, fee_bps, content_json, effective_at) VALUES
  ('00000000-0000-0000-0000-000000000301', '2026-09-fee-15pct', 1500,
   '{"tutorFeeBps": 1500, "learnerPlatformFeeBps": 0, "note": "확정 정책 — docs/decisions/policies.md"}'::jsonb,
   '2026-09-01T00:00:00+09:00')
ON CONFLICT (id) DO NOTHING;

-- 사용자(학습자 2명 — 재학/편입준비, 튜터 3명 — 경제/영어/컴퓨터공학, 운영자 1명)
INSERT INTO users (id, email, display_name) VALUES
  ('00000000-0000-0000-0000-000000000401', 'demo-learner-enrolled@example.invalid', '데모 재학생 학습자'),
  ('00000000-0000-0000-0000-000000000402', 'demo-learner-prep@example.invalid', '데모 편입준비생 학습자'),
  ('00000000-0000-0000-0000-000000000403', 'demo-tutor@example.invalid', '데모 튜터(경제)'),
  ('00000000-0000-0000-0000-000000000404', 'demo-operator@example.invalid', '데모 운영자'),
  ('00000000-0000-0000-0000-000000000405', 'demo-tutor-english@example.invalid', '데모 튜터(영어)'),
  ('00000000-0000-0000-0000-000000000406', 'demo-tutor-cs@example.invalid', '데모 튜터(컴퓨터공학)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000401', 'learner'),
  ('00000000-0000-0000-0000-000000000402', 'learner'),
  ('00000000-0000-0000-0000-000000000403', 'tutor'),
  ('00000000-0000-0000-0000-000000000404', 'operator'),
  ('00000000-0000-0000-0000-000000000405', 'tutor'),
  ('00000000-0000-0000-0000-000000000406', 'tutor')
ON CONFLICT DO NOTHING;

INSERT INTO operator_permissions (user_id, permission) VALUES
  ('00000000-0000-0000-0000-000000000404', 'ops.verification_review'),
  ('00000000-0000-0000-0000-000000000404', 'ops.matching')
ON CONFLICT DO NOTHING;

-- 학교 소속: 편입준비생은 affiliation_type='prep', campus_id 없음(SRC-01)
INSERT INTO user_campus_affiliations (user_id, campus_id, affiliation_type, verified_status) VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001', 'enrolled', 'verified'),
  ('00000000-0000-0000-0000-000000000402', NULL, 'prep', 'self_reported'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001', 'enrolled', 'verified'),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000001', 'enrolled', 'verified'),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000001', 'enrolled', 'verified')
ON CONFLICT DO NOTHING;

INSERT INTO tutor_profiles (user_id, self_reported_school, self_reported_major, self_reported_career_json) VALUES
  ('00000000-0000-0000-0000-000000000403', '부산대학교', '경제학과',
   '[{"label": "학회 스터디 튜터링 1년", "verified": false}]'::jsonb),
  ('00000000-0000-0000-0000-000000000405', '부산대학교', '영어영문학과',
   '[{"label": "편입학원 강사 2년", "verified": false}]'::jsonb),
  ('00000000-0000-0000-0000-000000000406', '부산대학교', '컴퓨터공학과',
   '[{"label": "교내 알고리즘 스터디 운영 6개월", "verified": false}]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- 신원확인: 학교 재학은 verified, 자격증은 아직 pending(항목별 독립 상태, data-model.md §3)
INSERT INTO verifications (user_id, type, status, reviewed_by, reviewed_at) VALUES
  ('00000000-0000-0000-0000-000000000403', 'school_enrollment', 'verified',
   '00000000-0000-0000-0000-000000000404', now()),
  ('00000000-0000-0000-0000-000000000405', 'school_enrollment', 'verified',
   '00000000-0000-0000-0000-000000000404', now()),
  ('00000000-0000-0000-0000-000000000406', 'school_enrollment', 'verified',
   '00000000-0000-0000-0000-000000000404', now())
ON CONFLICT DO NOTHING;

INSERT INTO verifications (user_id, type, status) VALUES
  ('00000000-0000-0000-0000-000000000403', 'certification', 'pending'),
  ('00000000-0000-0000-0000-000000000406', 'certification', 'pending')
ON CONFLICT DO NOTHING;

-- 수업(게시됨 3건 + 심사중 1건 — apps/api/src/modules/catalog/courses.repository.ts의
-- 인메모리 시드와 내용 동일)
INSERT INTO courses (
  id, tutor_id, subject_id, life_zone_id, target_audience, prerequisite_level,
  learning_goal, expected_outcome, sample_description,
  capacity, asking_price_amount, fee_bps, policy_version_id, status
) VALUES
  ('00000000-0000-0000-0000-000000000501',
   '00000000-0000-0000-0000-000000000403',
   '00000000-0000-0000-0000-000000000201',
   '00000000-0000-0000-0000-000000000101',
   '부산대학교 경제학과 1~2학년', NULL,
   '미시경제학 중간고사 대비 — 수요공급·시장균형 개념 정리',
   '중간고사 기출 유형 80% 이상 스스로 풀이 가능',
   '수요·공급 그래프를 손으로 그리며 직접 설명하는 방식으로 진행합니다.',
   1, 240000, 1500, '00000000-0000-0000-0000-000000000301', 'published'),
  ('00000000-0000-0000-0000-000000000502',
   '00000000-0000-0000-0000-000000000403',
   '00000000-0000-0000-0000-000000000201',
   '00000000-0000-0000-0000-000000000101',
   '부산대학교 경제학과 2~3학년', '미시경제학 기초 수강 완료',
   '미시경제학 기말고사 대비 — 생산자이론·시장구조 심화',
   '시장구조별 균형 조건을 비교해 설명할 수 있음',
   NULL,
   1, 240000, 1500, '00000000-0000-0000-0000-000000000301', 'pending_review'),
  ('00000000-0000-0000-0000-000000000503',
   '00000000-0000-0000-0000-000000000405',
   '00000000-0000-0000-0000-000000000202',
   '00000000-0000-0000-0000-000000000101',
   '편입 준비생 및 재학생', NULL,
   '편입 영어 독해·문법 8주 완성 — 지문 유형별 풀이 전략',
   '편입 영어 모의고사 기준 70점대 → 85점대 목표',
   '매주 모의 지문 풀이 후 오답 원인을 문장 단위로 짚어드립니다.',
   1, 200000, 1500, '00000000-0000-0000-0000-000000000301', 'published'),
  ('00000000-0000-0000-0000-000000000504',
   '00000000-0000-0000-0000-000000000406',
   '00000000-0000-0000-0000-000000000203',
   '00000000-0000-0000-0000-000000000101',
   '컴퓨터공학전공 2~3학년', NULL,
   '자료구조와 알고리즘 전공 필수 대비 — 배열·연결리스트·트리·그래프 핵심 개념',
   '전공 필수 과목 과제·시험에서 자료구조 구현 문제를 스스로 해결 가능',
   '매 회차 화이트보드에 자료구조를 직접 그리며 구현 코드까지 함께 작성합니다.',
   1, 260000, 1500, '00000000-0000-0000-0000-000000000301', 'published'),
  ('00000000-0000-0000-0000-000000000505',
   '00000000-0000-0000-0000-000000000406',
   '00000000-0000-0000-0000-000000000204',
   '00000000-0000-0000-0000-000000000101',
   '비전공 대학생 및 전공 기초 수강생 (경영·인문·자연계열)', NULL,
   '파이썬으로 데이터 다루기 — 엑셀보다 빠른 데이터 조작 실습',
   '엑셀 노가다 대신 파이썬 코드로 10초 만에 데이터 전처리 및 분석 완성',
   '예제 데이터 파일을 직접 다루며 판다스(Pandas) 기초부터 1:1 코드 리뷰까지 비전공자 눈높이로 60분 만에 마스터합니다.',
   1, 35000, 1500, '00000000-0000-0000-0000-000000000301', 'published')
ON CONFLICT (id) DO NOTHING;

-- 학습 요청(편입준비생 — affiliation_type='none'이어도 요청 가능함을 시연). 첫 번째는
-- 같은 생활권에 아직 맞는 시간대의 편입영어 교육자를 찾지 못해 운영자가 waitlisted로
-- 처리한 시나리오(SRC-03, 아래 waitlist_entries와 짝을 이룸).
INSERT INTO learning_requests (
  id, learner_id, goal, level, life_zone_id, acquisition_channel, status
) VALUES
  ('00000000-0000-0000-0000-000000000601',
   '00000000-0000-0000-0000-000000000402',
   '편입 영어 독해 기초부터 시작하고 싶습니다',
   '수준 확인 필요',
   '00000000-0000-0000-0000-000000000101',
   'community_post',
   'waitlisted'),
  ('00000000-0000-0000-0000-000000000602',
   '00000000-0000-0000-0000-000000000401',
   '자료구조 전공 수업을 따라가기 어려워서 그래프 알고리즘부터 다시 배우고 싶습니다',
   '중급',
   '00000000-0000-0000-0000-000000000101',
   'organic',
   'open')
ON CONFLICT (id) DO NOTHING;

-- 대기 신청(SRC-03 — 예약·결제 미발생, 알림 동의·대체 시간 동의만 기록)
INSERT INTO waitlist_entries (
  id, learning_request_id, learner_id, alternative_time_accepted, notify_consent, status
) VALUES (
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000601',
  '00000000-0000-0000-0000-000000000402',
  true, true, 'open'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
