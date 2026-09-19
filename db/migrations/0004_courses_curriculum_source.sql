-- 전공한시간 마이그레이션 4: 커리큘럼 출처(curriculum_source) 컬럼 추가 (에드혹, 사용자 요청)
-- 입력: docs/handoffs/ADHOC-01-ai-curriculum-draft.md, docs/ai/contracts-proposal.md §5
-- 이미 적용된 migration(0001~0003)은 수정하지 않고 새 migration으로 추가한다
-- (docs/api/internal-contracts.md §9 migration 원칙).

BEGIN;

ALTER TABLE courses
  ADD COLUMN curriculum_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (curriculum_source IN ('manual', 'ai_generated'));

COMMENT ON COLUMN courses.curriculum_source IS
  '이 커리큘럼(learning_goal/unit_breakdown_json/expected_outcome)이 AI 초안 생성기로 '
  '시작됐는지(ai_generated) 튜터가 처음부터 직접 작성했는지(manual) 구분한다. '
  'AI 초안이어도 튜터가 검토·수정 후 제출한 것이며, 자동 게시를 의미하지 않는다 '
  '(courses.status 상태 머신과 독립적인 값). 실제 LLM 연동 전까지는 apps/api의 '
  '규칙 기반 임시 생성기(CurriculumDraftService)가 만든 초안만 ai_generated로 표시된다.';

COMMIT;
