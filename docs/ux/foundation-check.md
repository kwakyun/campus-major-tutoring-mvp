# 전공한시간 — 웹 기반 골격 점검 (S03-T04, A3)

작성일: 2026-09-19 · 관련: docs/ux/screens.md(S02), docs/backend/auth-foundation.md

## 1. 이번 단계에서 만든 것

| 파일 | 역할 |
|---|---|
| `apps/web/src/app/layout.tsx` | 루트 레이아웃(메타데이터: 제목/설명) |
| `apps/web/src/app/page.tsx` | 최소 랜딩 페이지 — 로그인 화면으로 이동하는 버튼만 존재 |
| `apps/web/src/app/login/page.tsx` | 로그인/세션 확인 화면 — `apps/api`의 `FakeSessionVerifier` 픽스처 키로 로그인 시연 |
| `apps/web/src/lib/api-client.ts` | `apps/api` 호출 최소 클라이언트(`fetchWhoAmI`), `credentials: "include"`로 세션 쿠키 전송 |
| `packages/ui` | `Button`, `FormField`, `StatusBadge` — 디자인 확정 전 최소 공유 컴포넌트 |

## 2. 로그인 화면이 실제로 하는 것과 하지 않는 것

**한다:**
- 테스트 픽스처 키(`fake-learner-prep` 등)를 `session` 쿠키에 직접 기록 → `GET /health/whoami` 호출 → 응답을 화면에 표시
- 로그아웃 시 쿠키 삭제 → 재조회 시 401 → "로그인되어 있지 않습니다" 표시
- 본인확인 상태(`identityVerificationStatus`)와 학교 소속(`schoolAffiliation`)을 있는 그대로 노출 — "교육 능력 인증"으로 과장하지 않음(docs/decisions/policies.md, acceptance-matrix.md 원칙 준수)

**하지 않는다(의도적 보류):**
- 실제 비밀번호/이메일 로그인 폼 — 인증 제공자 계약이 아직 없다(docs/decisions/policies.md)
- 세션 만료(TTL) 표시 — `FakeSessionVerifier`에 만료 개념이 없어 표시할 상태 자체가 없음
- 회원가입 흐름 — S02 화면 설계(`docs/ux/screens.md`)의 다른 화면들과 함께 S04 이후 순차 구현

## 3. screens.md와의 관계

`docs/ux/screens.md`(S02-T02)가 정의한 전체 화면 목록 중, 이번 S03은 "로그인·세션 확인"에 필요한 최소 골격만 구현했다. 탐색/상담/예약/완료 화면은 아직 없으며, S03-GATE 통과 기준(`인증/환경분리/CI 준비도 검증`)에는 포함되지 않는다 — S04~S06에서 순차 구현 예정(`docs/tasks/index.md` 참고).

## 4. 실행 검증

`pnpm run build`(apps/web `next build`)로 `/`, `/login`, `/_not-found` 3개 라우트가 정적 페이지로 정상 생성됨을 확인했다(docs/qa/S03-foundation.md §1). 실제 브라우저에서의 육안 확인(개발 서버 `pnpm run dev:web`)은 이 클라우드 샌드박스에 GUI 브라우저가 없어 미실행 — 사용자 로컬 환경에서 확인을 권장한다(같은 문서 §5에 기재).
