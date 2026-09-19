# 전공한시간 — 인증 기반 구현 개요 (S03-T03, A2)

작성일: 2026-09-19 · 관련: docs/decisions/policies.md, docs/api/authorization.md, docs/qa/S03-foundation.md

## 1. 범위와 비범위

**이번 단계에서 구현한 것:**
- 세션 쿠키 → `SessionUser` 검증 인터페이스(`SessionVerifier`)와 로컬 전용 테스트 대역(`FakeSessionVerifier`)
- `SessionGuard`(인증: 누구인가) / `OperatorPermissionGuard`(인가: 무엇을 할 수 있는가) 분리
- 운영 환경 테스트 우회 이중 차단
- 자원 소유자 기반 접근 제어의 최소 실사례(`VerificationsController`)

**구현하지 않은 것(계약 미체결로 인한 명시적 보류, docs/decisions/policies.md):**
- 실제 Supabase Auth 연동(비밀번호/OAuth 로그인, 세션 TTL, 리프레시 토큰)
- Row-Level Security(RLS) — 지금은 애플리케이션 계층 가드로만 접근 제어
- 사용자 DB 레코드와 세션의 실제 연결(현재 `FakeSessionVerifier`는 인메모리 픽스처이며 `db/seeds/demo.sql`의 UUID 사용자와 연결되어 있지 않음 — S04 과제로 명시)

## 2. 인증(Authentication) — `SessionGuard`

`apps/api/src/modules/auth/session.guard.ts`

- 로컬/개발(`APP_ENV != production`): `FakeSessionVerifier`가 쿠키 값(`fake-learner-prep` 등 4개 고정 키)을 `SessionUser`로 변환한다.
- 운영(`APP_ENV=production`): 항상 `null`을 반환하는 검증기를 사용한다 — 즉 **아직 아무도 로그인할 수 없다**. 이는 버그가 아니라 "실제 인증 미구현 상태를 숨기지 않는다"는 명시적 설계다. 미구현 기능을 가짜로 통과시키는 대신 정직하게 401을 반환한다.
- `APP_ENV=production`이면서 `AUTH_TEST_BYPASS=true`인 조합은 **이중으로 차단**된다: (1) `main.ts` 부팅 단계에서 명시적 검사, (2) `SessionGuard` 생성자 자체에서도 검사. 실제 실행 결과 Nest의 컨트롤러 enhancer 인스턴스화 순서상 (2)가 먼저 발동하지만, (1)도 코드상 남아 있어 어느 한쪽이 우연히 제거되어도 다른 쪽이 막는다(docs/qa/S03-foundation.md §3 참고 결과 기록).

## 3. 인가(Authorization) — 두 겹의 권한 검사

1. **역할(role) 기반**: `SessionUser.roles`(`learner`/`tutor`/`operator`) — 컨트롤러 단위의 굵은 단위 접근 제어.
2. **운영자 세부 권한**: `OperatorPermissionGuard` + `@RequireOperatorPermission(...)` 데코레이터 — `ops.verification_review`, `ops.matching`, `ops.dispute_resolution`, `ops.finance`, `ops.audit` 5종. `docs/api/authorization.md`의 "분쟁 심의자와 정산 집행자를 분리한다" 요구를 그대로 구현한다(한 사람이 모든 운영 권한을 갖지 않아도 되는 구조).
3. **자원 소유자 기반**: 역할이나 운영자 권한만으로는 부족한 경우(예: 본인 증빙 조회) 컨트롤러에서 `record.userId === user.userId` 같은 명시적 소유권 검사를 추가한다. `VerificationsController.getOne`이 이 패턴의 최초 구현 사례이며, 이후 `learning_outcomes`, `waitlist_entries` 등 동일 접근 규칙을 가진 엔드포인트(S04 이후)도 이 패턴을 재사용한다.

## 4. SRC-01 준수 확인

`SessionUser.schoolAffiliation.affiliationType`이 `'prep'` 또는 `'none'`이어도 `SessionGuard`는 인증을 거절하지 않는다 — 로그인 가능 여부는 오직 "유효한 세션인가"만으로 판정하며, "대학 재학 여부"는 별도 정보로 취급한다. `docs/qa/S03-foundation.md` 시나리오 3(자동 테스트로도 고정, `auth-and-verifications.e2e-spec.ts`)에서 실제로 검증했다.

## 5. 다음 단계(S04)로 이관하는 항목

- `FakeSessionVerifier`의 픽스처 사용자를 `db/seeds/demo.sql`의 실제 `users` 레코드와 연결(현재 두 세계가 분리되어 있음을 `db/seeds/demo.sql` 주석에도 명시)
- Supabase Auth 계약 확정 시 `SessionVerifier` 구현체 교체(인터페이스는 이미 이를 위해 분리해 둠)
- RLS 또는 동등한 DB 레벨 접근 제어 도입 여부 결정
