# E2E(브라우저) 테스트

## 현재 상태 (2026-09-19 갱신)

`login-flow.spec.mjs`가 이 폴더의 첫 실제 E2E 테스트다. S03 시점 초안(아래 "왜 S03에서는 없었는가" 참고)에는 GUI 브라우저가 없어 작성하지 않았으나, 이후 Playwright/Chromium을 쓸 수 있는 환경에서 실제로 작성·실행해 PASS/FAIL을 모두 확인했다(`docs/qa/S03-foundation-recheck-2026-09-19.md` 참고). 이 실행으로 `NEXT_PUBLIC_API_BASE_URL` 기본값 오류(웹이 API를 잘못된 경로로 호출)를 실제로 잡아냈다 — API 레벨 curl 검증만으로는 발견할 수 없었던 결함이다.

## 실행 방법

### 1) S03 로그인 흐름 (Playwright Chromium)
사전 조건: `apps/api`가 4000번 포트에서, `apps/web`이 3000번 포트에서 실행 중이어야 한다.
```bash
node tests/e2e/login-flow.spec.mjs
```

### 2) S04 탐색·권한·추천 E2E 종합 프로브 (S04-T04 검증 완료)
```bash
node tests/e2e/s04-discovery-flow.spec.mjs
```
- `apps/api` 런타임 엔드포인트(헬스체크, 과목/생활권 참조 데이터, 공개 수업 조회) 정상 응답 검증 (HTTP 200).
- `apps/web`의 11개 주요 프론트엔드 라우트(`/`, `/login`, `/courses`, `/courses/demo`, `/recommendations`, `/learning-requests`, `/learning-requests/new`, `/tutor/courses`, `/tutor/courses/new`, `/tutor/profile`, `/tutor/availability`) 전수 정상 접근 검증 (HTTP 200).
- 핵심 소스 규약(SRC-01 편입준비생 지원, SRC-02 검증/자기기재 분리, SRC-03 대기신청 결제/예약 미발생, SRC-08 생활권 분리, 추천 served/impression 이벤트 분리) 자동 검증 통과 (20/20 PASS).
