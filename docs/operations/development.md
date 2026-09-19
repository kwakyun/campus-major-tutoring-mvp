# 전공한시간 — 개발 환경 설정 가이드 (S03-T01, A7)

작성일: 2026-09-19 · 검증 환경: Node v22.22.2, pnpm 10.28.0, PostgreSQL 16(로컬 클러스터) — docs/qa/S03-foundation.md에서 실제 실행 검증

## 1. 사전 준비물

- Node.js 20 이상 23 미만 (`package.json` `engines` 참고)
- pnpm 9 이상 (`corepack enable` 후 `corepack prepare pnpm@10.28.0 --activate` 권장)
- PostgreSQL 16 (로컬 설치 또는 컨테이너 — 이 문서는 로컬 설치 기준으로 작성됨. `btree_gist`, `pgcrypto` 확장이 필요하며 마이그레이션이 자동으로 활성화한다)

**외부 유료 서비스(Supabase, 결제 제공자 등)는 현재 계약이 확정되지 않았다.** 이 개발 환경 설정은 그 어떤 외부 유료 자격증명도 요구하지 않는다 — 로컬 세션 인증 테스트 대역(`FakeSessionVerifier`)과 `PAYMENT_MODE=fake`로 전체 흐름을 시연한다.

## 2. 최초 설정

```bash
# 1) 의존성 설치
pnpm install

# 2) 환경변수 파일 준비
cp .env.example .env
# .env의 DATABASE_URL을 실제 로컬 PostgreSQL 접속 정보로 수정

# 3) DB 마이그레이션 + 시드(허구 데모 데이터)
pnpm run db:migrate
pnpm run db:seed
```

## 3. 개발 서버 실행

```bash
# 업무 서버(NestJS, :4000)
pnpm run dev:api

# 웹(Next.js, :3000) — 별도 터미널
pnpm run dev:web
```

`http://localhost:3000/login`에서 `fake-learner-prep` / `fake-learner-enrolled` / `fake-tutor` / `fake-operator` 중 하나를 세션 키로 입력하면 해당 역할로 로그인된 것처럼 시연할 수 있다(`apps/api/src/modules/auth/session-verifier.ts`의 고정 픽스처). **이 방식은 로컬 개발 전용이며 `APP_ENV=production`에서는 이중으로 차단된다**(`docs/backend/auth-foundation.md` 참고).

## 4. 검증 명령 (CI와 동일)

```bash
pnpm run typecheck   # 전체 워크스페이스 타입체크
pnpm run build       # apps/api(nest build), apps/web(next build)
pnpm run test        # 전체 워크스페이스 테스트(apps/api 통합테스트 + packages/domain/time 단위테스트)
pnpm run test:unit   # 루트 vitest만(도메인 순수 함수)
```

모든 명령은 `docs/qa/S03-foundation.md`에서 실제로 실행해 통과를 확인했다.

## 5. 자주 겪을 수 있는 문제

API 서버에는 전역 `/api` 접두사가 없으므로 `NEXT_PUBLIC_API_BASE_URL`은 로컬에서
`http://localhost:4000`으로 설정한다. `/api`를 붙이면 수업·생활권·학습 요청 조회가
`Cannot GET /api/...`로 실패한다. Next.js의 별도 환경 설정은 `apps/web/.env.local`에
두며, 환경변수 변경 후 웹 개발 서버를 재시작한다(운영 빌드는 다시 빌드).

| 증상 | 원인/해결 |
|---|---|
| `pnpm install` 후 `Ignored build scripts: @nestjs/core, esbuild` 경고 | pnpm 10의 기본 보안 동작이다. 빌드/실행에 실제 영향이 없음을 `pnpm run build` 통과로 확인했다. 필요 시 `pnpm approve-builds`로 개별 승인 가능(대화형 명령이라 CI에서는 사용하지 않음) |
| `DATABASE_URL이 설정되지 않았습니다` | `.env`를 셸 환경으로 로드하지 않았을 때 발생. `export $(cat .env \| xargs)` 또는 `dotenv-cli` 사용 권장(아직 스크립트에 내장하지 않음 — S04 개선 후보) |
| `EXCLUDE USING gist` 관련 마이그레이션 오류 | `btree_gist` 확장이 없는 PostgreSQL. `0001_extensions_and_identity.sql`이 `CREATE EXTENSION IF NOT EXISTS btree_gist`를 실행하므로, 확장 설치 권한이 없는 관리형 DB(일부 클라우드 무료 티어)에서는 실패할 수 있다 — 이 경우 DB 관리자 권한으로 사전 설치 필요 |
| `apps/web`이 API 호출 시 CORS 오류 | `apps/api`의 `CORS_ALLOWED_ORIGINS`가 `apps/web`의 실제 접속 오리진을 포함하는지 확인(`.env.example` 참고) |

## 6. 비용 관련 사실 확인

이 저장소의 S03 범위 안에서 실제로 비용이 발생하는 외부 서비스는 **없다**. PostgreSQL 로컬 실행, Node/pnpm, 오픈소스 라이브러리만 사용한다. Supabase/결제 제공자 등 유료 서비스 사용은 계약이 체결되지 않았으므로(`docs/decisions/policies.md`) 이 문서에서 비용을 추정하거나 가정하지 않는다 — 확정되는 대로 별도 갱신한다.
