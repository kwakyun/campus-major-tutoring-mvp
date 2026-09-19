# 전공한시간 — S03 기반 검증 보고서 (S03-T05)

작성: A6(QA·품질 검증) · 작성일: 2026-09-19
입력: apps/api, apps/web, packages/*, db/migrations, db/seeds (S03-T01~T04 산출물)

이 문서는 **실제로 실행한 명령과 그 결과**만 기록한다. 실행하지 않은 항목은 "미실행"으로 명시하며 통과로 위장하지 않는다(00-workflow.yaml 공통 지침).

## 0. 검증 환경

- Node v22.22.2, pnpm 10.28.0 (클라우드 샌드박스, 사용자 실제 개발 환경과 동일 보장은 아님 — Windows 로컬 환경에서의 재검증은 사용자 측 권장 사항으로 별도 기재)
- PostgreSQL 16.13(로컬 클러스터), 역할 `cmt_dev`, DB `campus_major_tutoring_dev`

## 1. 설치·빌드·타입체크 (fresh install)

| 명령 | 결과 | 비고 |
|---|---|---|
| `pnpm install` | **PASS** | 워크스페이스 5개 프로젝트 해석, 483개 패키지 설치 완료. `@nestjs/core`, `esbuild`의 postinstall 스크립트는 pnpm이 기본 차단(`Ignored build scripts`) — 현재 빌드에는 영향 없음을 `pnpm run build` 통과로 확인 |
| `pnpm run typecheck` | **PASS** | apps/api, apps/web, packages/ui, packages/domain/time 4개 프로젝트 모두 `tsc --noEmit` 통과 |
| `pnpm run build` | **PASS** | `apps/api`(`nest build`), `apps/web`(`next build`, 정적 페이지 5개 생성: `/`, `/login`, `/_not-found` 등) 모두 성공 |
| `pnpm run test:unit` | **PASS** | `packages/domain/time`의 `interval-overlap.test.ts` 10개 테스트 전부 통과 (겹침 판정, 맞닿음 비겹침, 역구간 예외, 병합 로직) |
| `pnpm run test` (전체, apps/api 포함) | **PASS** | `packages/domain/time` 10건 + `apps/api` 통합테스트 7건 = 총 17건 통과. §3-1 참고 |

## 2. DB 마이그레이션·시드 (fresh DB-init)

| 명령 | 결과 | 비고 |
|---|---|---|
| `pnpm run db:migrate` (빈 DB) | **PASS** | `0001_extensions_and_identity.sql`, `0002_catalog_and_transactions.sql` 신규 적용 2건 |
| `pnpm run db:migrate` (재실행) | **PASS** | `schema_migrations` 이력 확인 후 2건 모두 skip — 멱등성 확인 |
| `pnpm run db:seed` | **PASS** | `db/seeds/demo.sql` 허구 데이터 적용 완료 |

### 2-1. [F-02 재검증] 자기 거래(Self-dealing) DB 제약 — docs/qa/S02-design-review.md F-02

S02-T06에서 OPEN으로 보고된 F-02("자기 거래 차단이 DB 제약으로 설계되지 않음")를 이번 마이그레이션(`0002_catalog_and_transactions.sql`의 `conversations.no_self_dealing` CHECK)에서 실제 구현하고, 실제 DB에 대해 검증했다.

```sql
-- 실패해야 하는 케이스: 동일 사용자를 tutor/learner 양쪽에 지정
INSERT INTO conversations (course_id, tutor_id, learner_id)
VALUES ('...course...', '...tutor-A...', '...tutor-A...');
-- 결과: ERROR: new row for relation "conversations" violates check constraint "no_self_dealing"  ← 실제 발생 확인

-- 성공해야 하는 케이스: 서로 다른 사용자
INSERT INTO conversations (course_id, tutor_id, learner_id)
VALUES ('...course...', '...tutor-A...', '...learner-B...');
-- 결과: INSERT 0 1  ← 실제 발생 확인
```

**판정: F-02 RESOLVED.** `proposals`·`bookings`는 모두 `conversation_id`를 통해서만 당사자를 참조하므로, 이 하나의 제약이 하위 모든 거래 단계의 자기 거래를 DB 레벨에서 원천 차단한다. `rebooking_requests`에도 동일한 `CHECK(tutor_id <> learner_id)`를 별도로 추가했다(경로가 `conversations`를 거치지 않는 신규 협의 생성 전이기 때문).

F-04(completion_rate 분모 표준화)는 DB 스키마 범위가 아니므로 이번 단계에서 다루지 않는다 — S02-GATE에 기록된 대로 S06(지표 구현) 담당에게 계속 이관한다.

## 3-1. 자동화된 통합 테스트로 회귀 고정 (`apps/api/test/auth-and-verifications.e2e-spec.ts`)

아래 §3의 수동 curl 검증(시나리오 1, 2, 4, 5, 6, 7)은 `@nestjs/testing` + `supertest` 기반
자동 테스트 7건으로도 고정했다(`tests/integration/README.md`에 위치 설명).

**실제로 겪은 문제와 해결(숨기지 않고 기록):** 처음에는 `apps/api/src/*.ts`를 vitest(esbuild)로
직접 트랜스파일해 테스트했는데, `VerificationsController`의 생성자 주입(`private readonly repo:
VerificationsRepository`, 명시적 `@Inject()` 토큰 없음)이 `undefined`로 주입되어 500 에러가
발생했다. 원인은 esbuild가 NestJS DI가 의존하는 TypeScript의 `emitDecoratorMetadata`를 지원하지
않기 때문이다. `pnpm run build`(tsc, `emitDecoratorMetadata: true`)가 만든 `dist/`를 import하는
방식으로 바꾸자 즉시 정상 동작했다 — `apps/api/package.json`의 `"test"` 스크립트를
`"pnpm run build && vitest run"`으로 고정해 항상 최신 dist를 검증하도록 했다. 이 발견 자체가
"환경이 다르면 조용히 실패할 수 있다"는 S03-T05의 검증 취지에 정확히 부합한다고 판단해 기록한다.

```
✓ 쿠키 없이 보호 엔드포인트 접근 시 401
✓ 존재하지 않는 세션 키는 401
✓ 공개 엔드포인트는 인증 없이 200
✓ 편입준비생(affiliationType=prep)도 로그인·조회 성공 — SRC-01
✓ 본인 증빙은 조회할 수 있다
✓ 제3자의 증빙 조회는 403 FORBIDDEN — 타인 증빙 접근 차단 인수 기준
✓ 심사 담당 운영자는 타인 증빙을 조회할 수 있다
Test Files  1 passed (1) / Tests  7 passed (7)
```

production 부팅 차단(시나리오 8·9)은 별도 프로세스를 강제 종료시키는 특성상 같은 테스트
프로세스 안에서 안전하게 자동화하기 어려워, 아래 §3에 수동 검증 결과로 남긴다(회귀 자동화는
S04 이후 별도 프로세스 스폰 방식으로 검토 권장 — 미실행 항목으로 §5에도 기재).

## 3. 인증 흐름 실제 검증 (실제 HTTP 요청, `apps/api` 실행 중)

`APP_ENV=local`로 `node dist/main.js` 실행 후 `curl`로 직접 검증했다(§3-1의 자동 테스트로
커버되지 않는 production 부팅 차단 시나리오 포함, 전체 기록 보존 목적으로 원본 로그도 남긴다).

| # | 시나리오 | 요청 | 예상 | 실제 결과 | 판정 |
|---|---|---|---|---|---|
| 1 | 인증 없이 보호 엔드포인트 접근 | `GET /health/whoami` (쿠키 없음) | 401 | `401 Unauthorized` | **PASS** |
| 2 | 존재하지 않는 세션 키 | `GET /health/whoami` (`session=not-a-real-fixture`) | 401 | `401 Unauthorized` | **PASS** |
| 3 | 편입준비생 로그인 성공 (SRC-01) | `GET /health/whoami` (`session=fake-learner-prep`) | 200, `affiliationType=prep`, `campusId=null` | `200`, `{"affiliationType":"prep","campusId":null}` — 미재학이어도 로그인·조회 성공 | **PASS** |
| 4 | 공개 엔드포인트는 인증 불필요 | `GET /health` (쿠키 없음) | 200 | `200 OK` | **PASS** |
| 5 | 본인 증빙 조회 | 튜터가 `POST /verifications`로 본인 증빙 생성 후 `GET /verifications/:id` (본인 세션) | 200 | `200 OK` | **PASS** |
| 6 | **제3자의 증빙 조회 거절**(acceptance-matrix.md 인수 기준) | 다른 학습자 세션으로 위 튜터의 증빙 `GET /verifications/:id` | 403 FORBIDDEN | `403`, `{"code":"FORBIDDEN","message":"본인 또는 심사 담당 운영자만 조회할 수 있습니다."}` | **PASS** |
| 7 | 심사 담당 운영자의 타인 증빙 조회 | 운영자 세션으로 동일 요청 | 200 | `200 OK` | **PASS** |
| 8 | **운영 환경 테스트 우회 차단** | `APP_ENV=production AUTH_TEST_BYPASS=true node dist/main.js` | 부팅 실패(listen 되지 않음) | 부팅 중 `SessionGuard` 생성자에서 예외 발생 → 프로세스 종료(exit code 1), `[api] listening` 로그 없음 | **PASS** |
| 9 | 운영 환경(우회 없음)에서 실제 인증 미구현 상태 명시적 거절 | `APP_ENV=production node dist/main.js` 후 `GET /health/whoami` (`session=fake-operator`) | 401 (Supabase 미연동이므로 항상 거절) | `401 Unauthorized` | **PASS** |
| 10 | 운영 환경에서도 공개 엔드포인트는 정상 | `APP_ENV=production` 상태에서 `GET /health` | 200 | `200 OK` | **PASS** |

### 참고: 시나리오 8의 실제 차단 지점

설계상 `main.ts`의 부팅 단계 검사와 `SessionGuard` 생성자의 검사, 두 곳에서 이중 차단하도록 만들었다(`session.guard.ts` 주석: "방어적 이중 차단"). 실제 실행 결과, Nest의 `InstanceLoader`가 `SessionGuard`를 컨트롤러 enhancer로서 `NestFactory.create()` 시점에 즉시 인스턴스화하기 때문에, **`SessionGuard` 생성자의 검사가 먼저 발동**하여 `main.ts` 자체의 명시적 검사에 도달하기 전에 부팅이 실패한다. 두 검사 모두 코드에 남아 있으며 결과적으로 이중 방어가 실제로 작동함을 확인했다(어느 한쪽이 제거되어도 다른 쪽이 차단한다는 것은 코드 검토로 확인, 실제 제거 후 재현 테스트는 이번 단계에서 수행하지 않음 — 필요시 회귀 테스트로 S04에서 추가 권장).

## 4. 세션 만료 시나리오 — 부분 검증

`apps/web`의 로그인 화면(`/login`)은 쿠키를 `document.cookie`로 직접 설정/삭제해 "로그아웃 = 세션 삭제"를 시연하지만, 이는 **수동 삭제**이지 **자연 만료(TTL)** 는 아니다. `FakeSessionVerifier`는 만료 시간 개념이 없는 고정 픽스처이므로, "세션이 일정 시간 후 자동 만료된다"는 시나리오는 이번 단계에서 **검증 대상 자체가 존재하지 않는다**(실제 Supabase Auth 세션 TTL 연동 이후에나 검증 가능). 이 항목은 **NOT_APPLICABLE(S03 범위 아님, S04 이후 대상)** 으로 보고하며, 로그아웃(쿠키 삭제) 자체는 위 시나리오 1과 동일한 코드 경로(쿠키 없음 → 401)로 이미 검증되었다.

## 5. 미실행/보류 항목 (정직하게 보고)

| 항목 | 상태 | 사유 |
|---|---|---|
| `apps/web`에서 `pnpm run dev`로 실제 브라우저 렌더링 확인(스크린샷) | **미실행** | 이 세션에 GUI 브라우저가 없음. `next build`가 5개 페이지를 정적 생성에 성공한 것으로 컴파일 레벨 정합성만 확인했다. 사용자 로컬 환경에서 `pnpm dev:web` 실행 후 육안 확인을 권장한다 |
| production 부팅 차단 시나리오의 자동 회귀 테스트화 | **미실행(수동만 검증)** | §3-1 참고 — 별도 프로세스 스폰이 필요해 이번 단계는 수동 curl로만 검증했다 |
| CI 워크플로(`.github/workflows/ci.yml`) 자체를 GitHub Actions에서 실행 | **미실행** | 이 리포지토리가 아직 GitHub 원격에 푸시되지 않음(로컬/디바이스 파일 시스템에만 존재). 워크플로 파일의 각 단계(install/typecheck/build/test/migrate/seed)는 본 문서 §1·§2에서 로컬로 동일하게 실행해 개별 검증했다 |
| 동시성 경쟁조건(제안 수락 vs 재제안) DB 레벨 테스트 | **미실행** | S02-design-review.md F-05가 이미 S04/S05 구현 단계 검증 항목으로 지정. S03은 스키마·인증 기반 단계이므로 범위 밖 |
| Windows 로컬 개발 환경에서의 동일 명령 재현 | **미실행(사용자 확인 필요)** | 이 검증은 클라우드 리눅스 샌드박스에서 수행됨. `docs/operations/development.md`의 절차를 사용자 실제 Windows 환경에서 한 번 더 실행해 보는 것을 권장 |

## 6. 종합 판정

**S03-T05 QA 게이트 판정: PASS(조건부).** §1~§3의 핵심 항목(설치·빌드·타입체크·테스트, DB 마이그레이션 멱등성, F-02 DB 제약, 인증 성공/실패/권한분리/운영환경 우회차단)은 모두 실제 명령 실행으로 검증되어 PASS다. §4는 범위 밖(NOT_APPLICABLE)으로 명확히 구분했고, §5의 미실행 항목은 숨기지 않고 그대로 다음 단계 또는 사용자 확인 사항으로 이관한다. FAIL 항목은 없다.
