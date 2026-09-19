# Handoff: ADHOC-01 (AI 커리큘럼 초안 생성)

- task_id: ADHOC-01
- agent: 사용자(곽윤직) 직접 요청 — agent-prompts/*.yaml 파이프라인(A0 총괄) 밖에서 진행된 에드혹 작업.
  S04-GATE는 이미 PASS로 마감되어 있고 공식 다음 단계는 S05(협의·제안·동의·예약)이지만,
  사용자가 이 세션에서 별도로 "AI 커리큘럼 자동생성" 기능 추가를 직접 지시했다.
- status: **BACKEND_VERIFIED_FRONTEND_PARTIAL** (기존 문서의 PASS/BLOCKED 표기와 구분하기 위해 이
  작업에서만 사용하는 상태값. device_bash는 이 세션 내내 끝내 시작되지 않았다. 대신 두 번째
  검증 라운드에서, `apps/api` 전체(src 전 모듈 + test 전체 + 실제 package.json/tsconfig/nest-cli.json)를
  실제 의존 파일 그대로 클라우드 작업공간의 격리 sandbox에 재구성하고, 실제 버전의 npm
  패키지를 설치해 **`tsc -p tsconfig.json` 실전 빌드**와 **`vitest run` 실전 실행**을 마쳤다 —
  기존 3개 e2e 스펙(`auth-and-verifications`, `transaction-access`, `web-client`) + 신규
  `curriculum-draft.e2e-spec.ts`, 총 4개 파일 31개 테스트 전부 실행해 통과 확인(아래 "실제로
  검증한 것" 참고). 이 과정에서 **실제 버그 1건을 발견해 수정**했다(POST 200 응답 코드 누락 —
  아래 참고). 백엔드는 이제 진짜 실행 증거로 뒷받침된다. 다만 `apps/web`은 여전히 변경된
  페이지 1개 + api-client만 떼어 타입체크했을 뿐 저장소 전체 기준으로는 미확인이고, DB
  migration 적용과 브라우저 육안 확인도 아직 못했다 — "다음에 반드시 할 일"에 남겨둔다.)

## 요청 배경

사용자가 대화 중 다음 아이디어를 제시했다: "튜터가 AI로 본인이 튜터하고 싶은 분야를 AI 챗봇에
입력하면 관련해서 커리큘럼을 자동으로 짜줘서 학습자가 그 커리큘럼을 볼 수 있으면 좋겠다 (선택:
챗봇 입력으로 빠르게 만들거나 또는 사용자가 직접 커리큘럼을 작성)". 이 메모는 먼저
`claude/feature-idea-ai-curriculum.md`(claude.ai 프로젝트 "개발한시간")에 아이디어로 기록했고,
이후 사용자가 "이대로 개발 진행(기존 프로젝트 수정 및 보완)"을 지시해 이번 구현으로 이어졌다.

## 이 작업이 다른 S0x 단계와 다른 점 (중요)

1. **A0 오케스트레이션을 거치지 않았다.** 보통은 A0가 역할별(A1/A2/A3/...) 명령을 순서대로
   전달하고 각 단계 산출물을 검토한 뒤 GATE로 통합 판정한다. 이번에는 사용자가 직접, 단일
   세션에서 요구사항 파악부터 백엔드·계약·프론트엔드·테스트 작성까지 전부 처리했다.
2. **device_bash(사용자 컴퓨터의 로컬 셸 실행 환경)가 이 세션 내내 시작되지 않았다.** 이
   저장소에서 직접 `pnpm install`, `nest build`, `vitest run`을 실행하지 못했다. 대신 클라우드
   작업공간의 별도 sandbox에서 변경 파일 + 실제 의존 파일 + 실제 npm 패키지로 타입체크만
   실행해 컴파일 정합성을 확인했다(아래 "실제로 검증한 것" 참고) — 그러나 이것은 이 저장소
   자체에서의 build/test는 아니다. S01~S04의 모든 PASS 판정이 이 저장소 안에서의 실행 결과를
   근거로 했던 것과 이 지점이 다르다. 이 차이를 "정직하게 남긴 미완료 항목"으로 명시한다
   (S03-gate.md와 동일한 원칙).
3. 그래서 다음 세션(또는 로컬 환경 접근이 복구된 시점)에서 **가장 먼저** 아래 "다음에 반드시
   할 일"을 실행해야 한다.

## 무엇을 만들었나

튜터가 "가르치고 싶은 분야"(topic)만 입력하면 학습 목표(learningGoal)·단원별 커리큘럼
(unitBreakdown)·예상 결과물(expectedOutcome)·예상 소요시간(totalMinutes) 초안을 즉시 돌려주는
기능. 이 초안은 **저장되지 않으며**, 튜터가 그대로 쓰거나 자유롭게 수정한 뒤 기존
`POST /tutor/courses` 경로로 제출해야 실제 커리큘럼이 된다 — "AI로 빠르게 만들기"와 "직접
작성"이 같은 등록 폼과 같은 저장 경로를 공유하도록 설계해, 사용자가 원했던 두 선택지를 모두
충족한다.

**중요한 정직성 표기:** 실제 LLM/임베딩 제공자와의 계약이 아직 없다(.env.example의
`SUPABASE_*`·`PAYMENTS_PROVIDER_API_KEY`와 동일하게 "미확보" 상태 — 허구의 API 키를 만들지
않는다는 00-workflow.yaml 공통 지침을 그대로 따름). 그래서 `CurriculumDraftService`는 실제
AI 호출이 아니라 **규칙 기반(템플릿) 생성기**로 동작한다. 응답에 `generatorVersion:
"rule-based-template-v1"`을 그대로 노출해 이 사실을 숨기지 않는다. `docs/ai/contracts-proposal.md`
§5가 이미 예약해 둔 내부 계약(`POST /internal/v1/drafts`, S09 착수 시 별도 서비스 예정)과
공개 API 계약을 분리 설계했으므로, 나중에 실제 AI 서비스가 생기면 `CurriculumDraftService`
내부 구현만 교체하면 되고 `POST /tutor/courses/curriculum/draft`의 공개 계약(요청/응답 스키마)은
바뀌지 않는다.

## changed_files

- `apps/api/src/modules/catalog/course.types.ts` (수정 — `CurriculumSource` 타입, `CourseRecord.curriculumSource` 추가)
- `apps/api/src/modules/catalog/courses.repository.ts` (수정 — `CreateCourseInput.curriculumSource`,
  `create()`에서 기본값 `"manual"` 적용, 생성자 시드 데이터에도 `curriculumSource: "manual"` 부여.
  **커밋 중 실제로 충돌을 겪음:** 이 파일을 처음 읽은 뒤 편집하는 사이에 사용자 컴퓨터에서 파일이
  바뀌어 있었다(더미 수업 시드 데이터 4건이 별도로 추가됨 — device_commit_files의 mtime 가드가
  이를 감지해 최초 커밋을 거절했다). 재확인 후 그 최신 내용 위에 `curriculumSource` 변경을 다시
  적용해 병합했다 — 사용자의 시드 데이터 추가분을 덮어쓰지 않았다.)
- `apps/api/src/modules/catalog/curriculum-draft.service.ts` (신규 — 규칙 기반 커리큘럼 초안 생성기)
- `apps/api/src/modules/catalog/courses.controller.ts` (수정 — `POST /tutor/courses/curriculum/draft` 엔드포인트 추가, tutor 역할 검사.
  **2차 검증 라운드에서 버그 발견·수정:** 실제 `vitest run` 결과 이 엔드포인트가 Nest 기본값인
  201을 반환해 openapi.yaml에 이미 명시된 200과 어긋났다(이 엔드포인트는 아무것도 저장하지
  않으므로 200이 맞다). `@HttpCode(200)` 데코레이터를 추가해 수정하고 재실행으로 확인 —
  사용자 device 파일도 수정본으로 커밋됨.)
- `apps/api/src/modules/catalog/catalog.module.ts` (수정 — `CurriculumDraftService` provider 등록)
- `apps/api/test/curriculum-draft.e2e-spec.ts` (신규 — 인증/권한/검증/생성/등록 시나리오 7건.
  **실행 완료 — 7/7 통과**(버그 수정 후). 아래 "실제로 검증한 것" 참고.)
- `db/migrations/0004_courses_curriculum_source.sql` (신규 — `courses.curriculum_source` 컬럼, CHECK 제약. **미적용** — 실제 PostgreSQL에 실행해 확인 필요)
- `packages/contracts/openapi.yaml` (수정 — `info.version` → `0.2.2-adhoc-curriculum-draft`, `Course.curriculumSource` 필드, `/tutor/courses/curriculum/draft` 경로 추가)
- `packages/contracts/events.yaml` (수정 — `schema_version` → `0.1.1-adhoc-curriculum-draft`, `curriculum_draft_generated` 이벤트 계약 추가. **주의: 실제 이벤트 발행 코드는 구현하지 않았다** — apps/api에 이벤트 발행 배관(outbox 등) 자체가 아직 없어 계약만 먼저 고정함)
- `apps/web/src/lib/api-client.ts` (수정 — `CurriculumSource` 타입, `CourseRecord.curriculumSource`, `CreateCourseInput.curriculumSource`, `generateCurriculumDraft()` 함수 추가)
- `apps/web/src/app/tutor/courses/new/page.tsx` (수정 — "AI로 커리큘럼 초안 빠르게 만들기" 섹션 추가: 분야 입력 + 단원 수 선택 + 생성 버튼, 생성 결과로 기존 폼 필드 채움, AI 초안임을 알리는 배너와 "직접 작성으로 표시 전환" 버튼)
- `.env.example` (수정 — `AI_CURRICULUM_PROVIDER_API_KEY` 예약 변수 추가, 현재 미사용 명시)
- `docs/architecture/data-model.md` (수정 — §7 표에 `curriculum_source` 컬럼 추가)
- `docs/api/internal-contracts.md` (수정 — §11 신설, contract-baseline.md §4 절차에 따른 변경 이력 기록)
- `claude/feature-idea-ai-curriculum.md` (claude.ai 프로젝트 "개발한시간" — 아이디어 메모를 구현 완료 상태로 갱신 예정)

## 실제로 검증한 것 (이 세션에서 실행 결과 있음)

이 저장소의 pnpm 워크스페이스 자체는 device_bash 없이 빌드할 수 없었지만, 두 차례에 걸쳐
클라우드 작업공간에 실제 소스+실제 npm 패키지로 격리 sandbox를 구성해 검증했다.

**1차 라운드(타입체크만, 부분):** catalog 모듈 변경분 + 프론트엔드 변경 페이지 1개만 떼어
`tsc` 타입체크 — 오류 0건. (이하 두 문단은 1차 라운드 기록으로 그대로 남긴다.)
- 백엔드: `course.types.ts`·`courses.repository.ts`·`curriculum-draft.service.ts`·
  `courses.controller.ts`·`catalog.module.ts` + 실제 의존 파일(auth/common, 미수정 원본)을
  실제 `tsconfig.json`/`tsconfig.base.json` 설정 그대로, `@nestjs/common@10.4.6` 등 실제
  버전 설치 후 `tsc -p tsconfig.json` → 오류 0건.
- 프론트엔드: `api-client.ts`·`tutor/courses/new/page.tsx` + `packages/ui/src`(미수정 원본)를
  실제 `tsconfig.json`(paths 별칭 포함) 그대로, `next@14.2.15` 등 실제 버전 설치 후
  `tsc -p tsconfig.json` → 오류 0건.

**2차 라운드(전체 실행, 이번 "테스트 및 보완" 요청에 대응) — 백엔드:**
`apps/api` 전체를 재구성했다 — `src/` 전 모듈(auth·billing·booking·catalog·health·identity·
matching·negotiation·recommendations·verifications, 모두 device에서 그대로 staging), `test/`
전체 4개 e2e 스펙, 실제 `package.json`·`tsconfig.json`·`tsconfig.base.json`·`nest-cli.json`·
`vitest.config.ts`. `package.json`에 고정된 정확한 버전(`@nestjs/common@10.4.6`,
`@nestjs/core@10.4.6`, `@nestjs/platform-express@10.4.6`, `cookie-parser@1.4.7`,
`reflect-metadata@0.2.2`, `rxjs@7.8.1`, devDependencies 전부 포함)을 실제 `npm install`.

- `tsc -p tsconfig.json` (실제 `"build"` 스크립트와 동일) → **exit 0, 오류 0건**, `dist_app/`
  실제 생성 확인.
- `vitest run` (실제 `"test"` 스크립트가 실행하는 것과 동일) → **최초 실행에서 curriculum-draft
  3건 실패** (`expected 200, got 201`) — 진짜 버그였다. 원인: `generateCurriculumDraft`가
  아무것도 저장하지 않는데도 `@Post`의 Nest 기본 응답 코드인 201을 그대로 반환해,
  openapi.yaml에 이미 명시돼 있던 200과 어긋났다. `courses.controller.ts`에
  `@HttpCode(200)` 추가로 수정 → 재실행 결과 **4개 파일 31개 테스트 전부 통과**:
  `auth-and-verifications.e2e-spec.ts`(7) / `transaction-access.e2e-spec.ts`(13) /
  `web-client.e2e-spec.ts`(4) / `curriculum-draft.e2e-spec.ts`(7). 기존 3개 스펙이 전부
  그대로 통과했으므로 이번 변경이 기존 기능에 회귀를 일으키지 않았음도 함께 확인했다.
- 수정된 `courses.controller.ts`는 `device_commit_files`로 사용자 device에 커밋 완료.

**이 검증의 한계(과장하지 않기 위해 명시):** 백엔드는 이제 저장소의 apps/api 전체를 대상으로
실제 빌드+실제 테스트 실행 증거가 있다. 그러나 `apps/web`은 여전히 1차 라운드에서 변경 페이지
1개만 떼어 확인했을 뿐, 저장소 전체(`apps/web`의 나머지 화면 — chat/courses/tutors/reviews/
schedule/my-classes/recommendations/login 등)와 함께 빌드했을 때도 문제없는지는 미확인이다.
단, 이번에 변경한 `courses.controller.ts`의 응답 코드 수정은 프론트엔드 `api-client.ts`의
`request()` 헬퍼가 `response.ok`(2xx 전체)만으로 판정하고 특정 상태 코드에 의존하지 않음을
직접 코드로 확인했으므로, 프론트엔드 쪽에 추가 수정은 필요 없다. ESLint·실제 PostgreSQL
적용·브라우저 렌더링도 여전히 미실행 — 아래 "다음에 반드시 할 일"에 남긴다.

## 다음에 반드시 할 일 (device_bash 복구 후 최우선 순서)

1. ~~`pnpm install`~~ / ~~apps/api typecheck~~ / ~~apps/api build~~ / ~~apps/api test(vitest)~~ —
   **이번 세션 2차 라운드에서 클라우드 sandbox 재구성으로 완료**(위 "실제로 검증한 것" 참고,
   31/31 통과). 다만 이것은 pnpm 워크스페이스 링크를 실제로 쓴 것이 아니라 별도 npm sandbox이므로,
   device_bash가 복구되면 **저장소 안에서** `pnpm install` → `pnpm --filter
   @campus-major-tutoring-mvp/api test`로 한 번 더 재확인해 pnpm 워크스페이스 자체의 문제
   (예: workspace:* 링크 깨짐)가 없는지 최종 확인할 것.
2. `db/migrations/0004_courses_curriculum_source.sql`을 실제 로컬 PostgreSQL에 적용해보고
   (S03-T02가 0001~0003을 검증한 것과 동일한 방식) CHECK 제약이 의도대로 동작하는지 확인.
   현재 apps/api는 이 DB에 실제로 연결되어 있지 않으므로(인메모리 저장소), 이 migration은
   지금 당장 courses.repository.ts 동작에 영향을 주지 않는다 — 나중에 실제 Postgres 연동 시
   컬럼이 이미 존재하도록 미리 맞춰 둔 것뿐이다.
3. `pnpm --filter @campus-major-tutoring-mvp/web run typecheck`/`build` — 여전히 변경 페이지
   1개만 떼어 확인했으므로, 저장소 전체(다른 모든 화면 포함) 기준으로 한 번 더 확인 필요.
4. 브라우저에서 실제로 `/tutor/courses/new` 페이지를 열어 "AI 초안 생성" 버튼을 눌러보고
   화면이 의도대로 채워지는지 육안 확인(GUI 없는 샌드박스라 이번에도 못했다 — 유일하게 남은
   "실제 실행 없이는 확인 불가능한" 항목).

## remaining_work (검증 이후에도 남는 것)

- 실제 LLM/임베딩 제공자 계약 체결 시 `CurriculumDraftService.generateDraft()`를 실제 호출로
  교체(현재는 의도적으로 규칙 기반).
- `curriculum_draft_generated` 이벤트의 실제 발행 코드(현재는 계약만 존재).
- `apps/api`가 실제 PostgreSQL에 연결되면 `curriculum_source` 컬럼을 포함해 `CoursesRepository`
  전체를 실제 DB 리포지토리로 교체(S04-T01 handoff에서 이미 남겨둔 동일한 remaining_work와 합류).
- 이 에드혹 변경 전체를 다음 정식 QA/GATE 명령(S05 착수 전 또는 별도 QA 명령)에서 재검토.

## contract_requests

없음 — 이번에는 A1 역할 구분 없이 직접 openapi.yaml/events.yaml을 수정했다. 다음 정식 GATE에서
A1 관점의 재검토가 필요하다(§ "다른 S0x 단계와 다른 점" 참고).

## next_owner

다음 세션(사람 또는 A0) — 위 "다음에 반드시 할 일" 7단계를 실행한 뒤 이 문서의 status를 PASS
또는 구체적인 FAIL 사유로 갱신할 것.
