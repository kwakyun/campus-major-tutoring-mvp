# 전공한시간 — S03 기반 재검증 + 실제 E2E(브라우저) 검증

작성: A6(QA·품질 검증) · 작성일: 2026-09-19 (S03-T05 원 보고서 이후 추가 회차)
입력: S03-T01~T05 산출물 그대로(변경 없음). 이번 회차는 **실제 GUI 브라우저(Playwright/Chromium)가 있는 클라우드 샌드박스**에서 수행했다 — 이전 S03-T05 보고서(§5)가 "이 세션에 GUI 브라우저가 없음"으로 미실행 처리한 항목을 메우기 위함이다.

이 문서는 실제로 실행한 명령·관찰한 결과만 기록한다. FAIL을 PASS로 바꾸지 않는다(00-workflow.yaml 공통 지침).

## 0. 요약 — 이전 PASS 판정에 영향을 주는 신규 발견 3건 + 재확인 1건

| # | 항목 | 판정 | 영향 |
|---|---|---|---|
| 1 | `.github/workflows/ci.yml`이 실제로 존재하지 않음 | **FAIL** (문서-실물 불일치) | S03-GATE의 "CI와 스테이징 준비 상태가 검증됨" 근거 무효화 |
| 2 | `NODE_ENV=development`가 셸에 있으면 `pnpm run build`(apps/web)가 재현 가능하게 실패함 | **FAIL** | `docs/operations/development.md` §5가 권장하는 `.env` 전체 로드 방식과 정면 충돌 |
| 3 | `NEXT_PUBLIC_API_BASE_URL` 기본값(`.env.example`과 `api-client.ts` 둘 다)에 `/api`가 붙어있어 실제 라우트(`/health/whoami` 등, prefix 없음)와 불일치 → 실제 브라우저에서 로그인 화면이 항상 실패 | **FAIL(수정 후 확인)** | S03-T04/T05가 "로그인 성공" 검증에 썼던 방식(curl로 API를 직접 호출)이 이 버그를 가려서 지금까지 발견되지 않았음 |
| 4 | `pnpm-lock.yaml`이 `apps/api/package.json`과 불일치(S03-T05가 추가한 `@nestjs/testing` 등 3개 테스트 의존성이 lockfile에 없음) | **재확인/FAIL** | `pnpm install --frozen-lockfile`(재현 가능한 설치의 표준 방식)이 실패함 |

install/typecheck/test/migrate/seed 자체는 이번에도 전부 실제로 재실행해 PASS를 재확인했다(§1~§3). 아래에 근거를 남긴다.

## 1. 재현: `.github/workflows/ci.yml` 미존재

`docs/handoffs/S03-T01.md`의 `changed_files`와 `docs/releases/S03-gate.md`의 exit_criteria 근거 모두 `.github/workflows/ci.yml`(CI 골격)을 실제 산출물로 인용한다. 그러나 이번 회차에 리포지토리 루트를 실제로 확인한 결과:

```
$ ls -la .github          → 디렉터리 자체가 없음
```

`.env`, `.gitignore` 같은 다른 dot-file/디렉터리는 정상적으로 존재하므로, 이건 목록 조회 도구의 dot-file 누락 문제가 아니라 **파일이 실제로 만들어지지 않았거나, 만들어진 뒤 삭제/커밋되지 않은 것**으로 보인다. CI 골격이 "구성했다"고 보고된 것과 실제 파일 시스템 상태가 다르므로, S03-GATE의 해당 exit_criteria 근거는 재검증이 필요하다.

**권장 조치(A7 소유 — `.github/workflows/**`):** `.github/workflows/ci.yml`을 실제로 생성하거나, 이미 다른 경로에 있다면 그 경로를 정정해서 문서와 일치시켜야 한다.

## 2. 재확인: install / typecheck / test / DB (변경 없음, 전부 PASS)

새 클라우드 샌드박스(Node v22.22.2, pnpm 10.28.0, PostgreSQL 16.13)에서 처음부터 다시 실행했다.

| 명령 | 결과 |
|---|---|
| `pnpm install --frozen-lockfile` | **FAIL** — `ERR_PNPM_OUTDATED_LOCKFILE`: apps/api의 `@nestjs/testing@10.4.6`, `@types/supertest@6.0.2`, `supertest@7.0.0` 3개가 lockfile에 없음(§5에서 상세) |
| `pnpm install --no-frozen-lockfile` | PASS — 504개 패키지 설치 |
| `pnpm run typecheck` | PASS — 4개 프로젝트(apps/api, apps/web, packages/ui, packages/domain/time) 전부 |
| `pnpm run test` | PASS — `packages/domain/time` 10건 + `apps/api` 통합테스트 7건 = 17건 전부 통과 |
| `pnpm run db:migrate`(빈 DB) | PASS — 2건 신규 적용 |
| `pnpm run db:migrate`(재실행) | PASS — 2건 모두 skip, 멱등성 재확인 |
| `pnpm run db:seed` | PASS |
| production 부팅 차단(`APP_ENV=production AUTH_TEST_BYPASS=true`) | PASS — `SessionGuard` 생성자에서 예외, 부팅 실패 재확인 |
| production(우회 없음) `whoami` | PASS — 401 (fake-operator 세션이어도 거절) |
| production `/health`(공개) | PASS — 200 |

## 3. 신규 발견: `NODE_ENV=development`가 있으면 `pnpm run build`가 깨짐

### 재현 절차

```bash
$ rm -rf apps/web/.next
$ NODE_ENV=development pnpm --filter @campus-major-tutoring-mvp/web run build
# → 모든 페이지(/, /login, /404, /500, /_not-found)에서
#   "TypeError: Cannot read properties of null (reading 'useContext')"
#   "Export encountered errors on following paths" → 종료 코드 1

$ rm -rf apps/web/.next
$ env -u NODE_ENV pnpm --filter @campus-major-tutoring-mvp/web run build
# → 정상 성공(5/5 정적 페이지 생성)
```

동일한 `.next` 캐시 초기화, 동일한 의존성 상태에서 **`NODE_ENV` 존재 여부만 바꿔서 이 결과가 100% 재현됨**을 확인했다(각 2회 반복, 동일 결과).

### 원인

`next build`는 프로덕션 빌드를 강제해야 하는데, 셸에 이미 `NODE_ENV=development`가 설정되어 있으면 React/ReactDOM의 dev 빌드와 Next.js가 내부적으로 준비한 prod 런타임 청크(`next-server/app-page.runtime.prod.js`)가 같은 프로세스에서 섞여 로드된다. 에러 스택에 `runtime.prod.js`와 `runtime.dev.js`가 같은 빌드 시도 안에서 번갈아 나타나는 것이 그 증거다. React 18의 dev/prod 디스패처 모양이 달라서 `useContext`가 `null`이 되는 전형적인 증상이다.

### 왜 지금까지 안 걸렸는가

`docs/operations/development.md` §5는 `DATABASE_URL이 설정되지 않았습니다` 문제의 해결책으로 다음을 권장한다:

> `export $(cat .env | xargs)` 또는 `dotenv-cli` 사용 권장

`.env`에는 `NODE_ENV=development`가 첫 줄에 있다(`.env.example` 기준). 문서가 권장하는 방식대로 `.env` 전체를 셸에 로드한 뒤 같은 터미널에서 `pnpm run build`를 실행하면(실제 개발자가 흔히 하는 순서) 100% 이 버그를 만난다. 이전 S03-T05 검증은 이 순서를 밟지 않아 발견되지 못했다.

### 권장 조치(A3 소유 — `apps/web/package.json`)

`apps/web/package.json`의 `"build"` 스크립트를 `"NODE_ENV=production next build"`처럼 명시적으로 고정하는 것을 권장한다. 부수적으로 `docs/operations/development.md`(A7 소유) §5의 "`.env` 전체를 export하라"는 권고도 `NODE_ENV`를 제외하도록 다시 쓰는 게 안전하다.

## 4. 신규 발견 + 실제 수정 확인: `NEXT_PUBLIC_API_BASE_URL`에 잘못된 `/api` 접두사

### 재현 (실제 브라우저, Playwright/Chromium, 수정 전 빌드)

`apps/api`(포트 4000, `FakeSessionVerifier`)와 `apps/web`(포트 3000, 프로덕션 빌드) 둘 다 실제로 띄운 뒤, 실제 Chromium으로 `/login` 화면을 조작했다.

- `apps/api`의 실제 라우트는 `GET /health`, `GET /health/whoami` (전역 prefix 없음 — `apps/api/src/main.ts`에 `setGlobalPrefix` 호출이 없음). 직접 확인: `curl http://localhost:4000/health` → 200, `curl http://localhost:4000/api/health` → **404**.
- 그런데 `.env.example`의 `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`와 `apps/web/src/lib/api-client.ts`의 하드코딩된 기본값(`"http://localhost:4000/api"`) **둘 다** `/api`를 붙인다.
- 이 기본값 그대로 빌드한 화면에서 "로그인" 버튌을 누르면:

```
브라우저 콘솔: Failed to load resource: 404 (Not Found)
화면에 표시된 실제 오류: "VALIDATION_ERROR: Cannot GET /api/health/whoami"
결과: fake-learner-prep으로 로그인해도 "로그인되어 있지 않습니다"로 남음
```

Playwright 자동 테스트 5개 중 2개 FAIL(로그인 성공 확인 2건), 나머지(초기 미로그인 상태·로그아웃·잘못된 세션 키)는 우연히 같은 화면 문구라 통과처럼 보였다. 이 회차의 화면 텍스트 전문을 그대로 남긴다(스크린샷은 수정 후 상태만 보존했다 — 아래 "수정 확인" 참고):

```
로그인 (개발용 테스트 대역)
운영 환경에서는 이 화면이 실제 로그인 폼으로 교체됩니다. 지금은 apps/api의
FakeSessionVerifier 픽스처 키를 입력해 세션 흐름을 확인합니다.
테스트 세션 키 [fake-learner-prep] 로그인 로그아웃
VALIDATION_ERROR: Cannot GET /api/health/whoami
로그인되어 있지 않습니다.
```

### 왜 지금까지 안 걸렸는가

S03-T05의 시나리오 3(편입준비생 로그인 성공)은 **`curl`로 `apps/api`를 직접** 호출했다(`GET /health/whoami`, `/api` 없이) — 맞는 경로였기 때문에 통과했다. `apps/web` 화면을 통해 실제 브라우저로 같은 것을 확인한 적은 이번이 처음이다. 즉 "API는 맞게 만들었지만, 웹이 그 API를 잘못된 주소로 호출하는" 종류의 결함은 API 레벨 curl 검증으로는 절대 잡을 수 없다 — 이번 E2E 검증의 존재 이유 자체가 이 사실을 증명한다.

### 수정 확인 (재현 → 수정 → 재검증)

`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`(접두사 없이)로 다시 빌드하고 동일한 Playwright 스크립트를 재실행:

```
PASS - 초기 상태: 미로그인 문구 또는 오류가 표시됨
PASS - fake-learner-prep 로그인 시 whoami에 userId/affiliation 표시
PASS - fake-operator 로그인 시 운영자 역할 표시
PASS - 로그아웃 후 미로그인 상태로 복귀
PASS - 존재하지 않는 세션 키 입력 시 미로그인 유지(401)
=== 결과: 5/5 PASS ===
```

남은 HTTP 응답은 401 두 건뿐이고(초기 미로그인 확인, 잘못된 키 확인 — 둘 다 "실패해야 정상"인 시나리오), 콘솔 에러는 없다. 스크린샷 `01-initial.png`~`05-invalid-session.png` 5장을 근거로 남긴다(`docs/qa/evidence/S03-recheck-2026-09-19/` 참고 — 대화에 첨부).

### 권장 조치

- `apps/web/src/lib/api-client.ts`(A3 소유)의 기본값 `"http://localhost:4000/api"` → `"http://localhost:4000"`로 수정
- `.env.example`(A7 소유)의 `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api` → `http://localhost:4000`로 수정
- 또는 반대로 `apps/api`에 `app.setGlobalPrefix('api')`를 추가해 `/api` 쪽을 실제로 맞추는 선택도 가능(A2 소유, `apps/api/src/main.ts`) — 어느 쪽으로 통일할지는 계약 소유자(A1/A2)와 조율 필요. 이번 문서는 재현과 임시 수정 확인까지만 하고 정책 결정은 넘긴다.

## 5. 재확인: lockfile-package.json 불일치

```
$ pnpm install --frozen-lockfile
ERR_PNPM_OUTDATED_LOCKFILE
specifiers in the lockfile don't match specifiers in package.json:
* 3 dependencies were removed: @nestjs/testing@10.4.6, @types/supertest@6.0.2, supertest@7.0.0
```

S03-T05가 `apps/api/test/auth-and-verifications.e2e-spec.ts`를 추가하면서 `@nestjs/testing`, `supertest`, `@types/supertest`를 `apps/api/package.json`에 추가했는데(핸드오프에 명시), `pnpm-lock.yaml`은 그 시점에 다시 생성되지 않았다. `--no-frozen-lockfile`로는 문제없이 설치되지만, CI에서 흔히 쓰는 `--frozen-lockfile`(정확히 커밋된 대로만 설치)은 실패한다. `.github/workflows/ci.yml`이 실제로 만들어질 때 이 lockfile도 함께 갱신해야 한다.

**권장 조치(A7 소유 — 루트 lockfile):** `pnpm install`을 실행해 `pnpm-lock.yaml`을 최신 `package.json` 세트와 다시 맞추고 커밋.

## 6. 이번 회차에도 미실행/범위 밖으로 남긴 것

| 항목 | 상태 | 사유 |
|---|---|---|
| GitHub Actions 실제 실행 | 미실행 | §1에서 확인한 대로 워크플로 파일 자체가 없음 — 파일이 만들어진 뒤에야 실행 가능 |
| 동시성 경쟁조건 테스트 | 미실행 | S02-design-review.md F-05, S04/S05 범위로 유지 |
| Windows 로컬 환경 재현 | 미실행 | 이번 회차도 클라우드 리눅스 샌드박스에서 수행 |

## 7. 종합 판정

이번 회차의 신규 발견(§1, §3, §5)은 **원래 S03-T05/S03-GATE의 PASS 판정이 실제로는 조건부로 취소선을 그어야 하는 항목을 포함하고 있었음**을 보여준다. install/typecheck/test/migrate/seed·인증 흐름·production 차단(§2)은 다시 실행해도 여전히 PASS다. 하지만:

- CI 골격 실재 여부(§1)와 lockfile 동기화(§5)는 A7에게,
- `NODE_ENV` 빌드 취약성(§3)과 `NEXT_PUBLIC_API_BASE_URL` 오류(§4)는 A3(+ 선택적으로 A2/A1 계약 조율)에게

각각 변경 요청으로 넘긴다. A6는 이 결함들을 고칠 권한(쓰기 범위)이 없으므로 여기서 재현·근거·권장 수정안까지만 제공하고, 실제 코드 수정과 재검증은 해당 소유자 완료 후 A0가 배정하면 이어서 확인한다.

**이 문서를 근거로, S03-GATE의 "인증·환경 분리·CI와 스테이징 준비 상태가 검증됨" 항목은 A0의 재검토가 필요하다고 판단한다.** FAIL을 PASS로 위장하지 않기 위해 이 판단을 숨기지 않고 명시한다.
