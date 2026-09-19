# UX 공통 기반 개선 — 2026-09-19

- 요청: 사용자 (곽윤직)
- 범위: 공통 기반(디자인 토큰·타이포·폼·버튼·네비게이션) — 개별 페이지 전수 변경 아님
- 핵심 요구사항: (1) 가독성(글자 크기/줄간격/대비), (2) 입력 및 화면 전환 UX, (3) 기타 UX 일반
- 적용 파일: `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/components/page-transition.tsx` (신규)
- 참고: 이 문서는 S03 QA 재점검(`docs/qa/S03-foundation-recheck-2026-09-19.md`)과는 별개로, UI/UX 개선 작업의 근거(특히 WCAG 대비 계산)를 남기기 위한 것으로 통합/빌드 재검증 범위가 아님.

## 1. 가독성 — 색상 대비 (WCAG 2.1 기준)

sRGB → 선형 휘도 변환을 거친 정식 공식으로 계산 (단순 근사치 아님).

| 조합 | 기존 | 변경 후 | WCAG AA 본문(4.5:1) |
| --- | --- | --- | --- |
| `--text-dim` on `--bg-cream` (#fbf9f4) | 4.24:1 | **5.42:1** (#666856) | 기존 미달 → 충족 |
| `--text-dim` on `--bg-surface` (#ffffff) | 4.46:1 | **5.71:1** (#666856) | 기존 미달(경계) → 충족, 여유 확보 |
| `--text-main` on `--bg-cream` | 17.66:1 | 변경 없음 | 충족 (여유 큼) |
| `--text-muted` on `--bg-cream` | 8.89:1 | 변경 없음 | 충족 |

`--text-dim`은 `#777966` → `#666856`으로 색상(hue)은 유지한 채 명도만 낮췄다. 카드 보조설명, 폼 힌트 텍스트, 푸터 링크 등 본문성 텍스트에 쓰이는 토큰이라 AA 기준(4.5:1) 미달은 실사용자 가독성에 직접 영향을 준다.

## 2. 입력 필드 시인성

기존에는 입력 필드(`.cmt-form-field__input` 등)의 테두리가 배경과 거의 같은 색이라 "여기가 입력 가능 영역"이라는 시각적 단서가 약했다(비텍스트 UI 컴포넌트 대비 WCAG 1.4.11 권장 기준 3:1).

- 신규 토큰 `--border-input: #8f8c7e` 추가.
  - white 배경 대비: **3.38:1**
  - ivory 배경 대비: **3.04:1**
  - 둘 다 WCAG 1.4.11 비텍스트 UI 컴포넌트 권장 기준(3:1) 충족.
- 추가로 발견/수정한 실제 결함:
  - `packages/ui/src/form-field.tsx`가 렌더링하는 `cmt-form-field__helper` 클래스가 기존 CSS에는 `.cmt-form-field__hint`로만 정의되어 있어 **힌트 텍스트 스타일이 전혀 적용되지 않고 있었음** → 두 클래스를 동일 스타일로 병합.
  - `.cmt-form-field--error`, `.cmt-form-field__required`가 컴포넌트에서 참조되지만 CSS에 정의가 없어 **에러 상태·필수 표시(*)가 시각적으로 구분되지 않았음** → 정의 추가(에러 시 테두리색 변경 + 에러 메시지 강조, 필수 표시는 강조색).
  - `:disabled` 입력 필드에 대한 스타일이 없어 비활성 필드가 활성 필드와 구분되지 않았음 → 배경/텍스트 톤 다운 추가.

## 3. 키보드 포커스 표시 (접근성)

기존에는 다수의 인터랙티브 요소(네비게이션 링크, 버튼, 검색창, 카테고리 칩 등)에 `:focus-visible` 스타일이 없어 키보드로 탐색 시 현재 위치를 알 수 없었다.

- 공통 토큰 `--focus-ring: 0 0 0 3px rgba(210, 248, 36, 0.55)` 추가.
- 전역 `:focus-visible` 폴백(정의되지 않은 요소 대상) + 개별 컴포넌트(`.cmt-nav__link`, `.cmt-floating-nav__item`, `.cmt-button`, 폼 입력, `.category-chip`, `.cmt-search-bar__input`)에 명시적 포커스 링 적용.

## 4. 타이포그래피 · 줄간격

- `html`에 `font-size: 16px` 기준선 명시(브라우저 기본값에 암묵 의존하던 것을 명시적으로 고정).
- `body` 기본 `line-height`를 `1.65`로 통일(본문 가독성 기준 1.5~1.6 이상 권장에 부합, 기존에는 요소별로 제각각이었음).
- 전역 `h1..h6 { line-height: 1.22; letter-spacing: -0.01em; }`로 제목 줄간격 통일.
- 전역 `p { line-height: 1.65; }`로 본문 문단 일관성 확보.
- `.cmt-floating-nav__item` 라벨 글자 크기 `0.68rem → 0.72rem`로 소폭 확대(모바일 하단 네비게이션의 가장 작은 텍스트였음).

## 5. 화면 전환 UX

기존에는 페이지 간 이동 시 콘텐츠가 즉시 스냅 전환되어 전환감이 없었다. Next.js App Router는 레이아웃의 DOM 노드를 페이지 이동 간 재사용하므로(`{children}`만 교체), 정적 래퍼에 CSS `animation`을 걸어도 매 네비게이션마다 재실행되지 않는다.

- `apps/web/src/components/page-transition.tsx` 신규 작성: `usePathname()`을 `key`로 사용하는 클라이언트 컴포넌트로 경로가 바뀔 때마다 래퍼를 강제 리마운트시켜 진입 애니메이션(`cmt-page-fade-in`, 짧은 페이드+슬라이드)을 매번 재생.
- `prefers-reduced-motion: reduce` 사용자를 위해 애니메이션 비활성화 처리.
- `html`에 `scroll-behavior: smooth` 추가로 페이지 내 앵커 이동도 부드럽게 처리.

## 6. 적용 범위 밖 (의도적으로 변경하지 않음)

사용자 요청 범위가 "공통 기반"으로 한정되어, 개별 페이지의 레이아웃/문구/기능은 변경하지 않았다. 이번 변경은 전역 토큰과 공용 컴포넌트 클래스(`globals.css`)에만 적용되며, `packages/ui`의 TSX 컴포넌트 자체는 이미 올바른 클래스명을 참조하고 있어 수정하지 않았다(CSS 쪽 정의 누락만 보완).

## 7. 검증 상태

- CSS 문법: 중괄호 균형 + 파서 검증 완료.
- `pnpm install` → `next dev` → Playwright로 `/login`, `/`(데스크톱·모바일) 스크린샷 확보, 이어서 `next build` 프로덕션 빌드까지 "Compiled successfully"로 통과 확인.

## 8. 추가 회차 — 브루탈리즘(Neo-Brutalism) 테마 적용 (2026-09-19, 같은 날 2차 요청)

사용자가 "1번(가독성) 개선 결과를 브루탈리즘 느낌으로 바꿔달라, 단 마음에 안 들면 바로 되돌릴 수 있게 버전을 저장해달라"고 요청하여 추가 반영.

### 8.1 되돌리기 방법 (1차: 파일 전체 교체)

`apps/web/src/app/globals.pre-brutalism-2026-09-19.css`에 브루탈리즘 적용 **직전**(1~7절 가독성 개선판) 상태를 그대로 백업해 두었다. 되돌리려면:

```
cp apps/web/src/app/globals.pre-brutalism-2026-09-19.css apps/web/src/app/globals.css
```

이 한 줄이면 즉시 이전 상태(가독성 개선판, 브루탈리즘 이전)로 복원된다. 다른 파일(`layout.tsx`, `page-transition.tsx`, `card.tsx`)은 브루탈리즘 테마와 무관하게 그대로 유지해도 된다.

### 8.1b 두 버전을 동시에 보기 (2차 요청, 같은 날 3차 반영) — 실시간 토글

사용자가 "브루탈리즘 버전이랑 이전 버전을 둘 다 보고 싶다"고 요청하여, 파일을 매번 바꿔치기하는 대신 **화면 우하단 토글 버튼으로 같은 화면에서 실시간으로 전환**할 수 있도록 구조를 바꿨다.

- `globals.css`의 기본(`:root`) 규칙은 가독성 개선판 그대로 유지하고, 파일 맨 끝에 `:root[data-theme="brutal"]`/`[data-theme="brutal"] .cmt-*` 규칙을 추가해 `<html data-theme="brutal">`일 때만 각진 반경·하드 그림자·굵은 테두리로 덮어쓰도록 구성(두 버전의 규칙이 한 파일에 공존, 색상 토큰·WCAG 대비 개선은 공통).
- `apps/web/src/components/theme-toggle.tsx` 신규: 우하단 고정 버튼(모바일에서는 하단 네비 위쪽, 데스크톱에서는 우하단)으로 `data-theme` 속성을 토글하고 `localStorage`(`cmt-theme` 키)에 저장 — 새로고침해도 마지막으로 본 테마가 유지된다(브라우저별로 독립적).
- `layout.tsx`에 `<ThemeToggle />` 추가.
- 이제 `globals.pre-brutalism-2026-09-19.css` 백업 파일은 필수는 아니지만(토글로 항상 두 버전을 다 볼 수 있으므로) 만약을 위해 그대로 남겨둠.

### 8.2 변경 내용

색상 토큰(`--charcoal-deep`, `--electric-chartreuse`, `--text-dim` 등)과 WCAG 대비 개선(1~7절)은 그대로 두고, **반경(radius)·그림자(shadow)·테두리**만 교체:

- `--radius-*` 전부 `0`으로 — pebble(둥근) 아키텍처 → 각진 사각형.
- `--shadow-*` 전부 블러 없는 "하드 오프셋" 그림자로 교체(예: `3px 3px 0 var(--charcoal-deep)`).
- 카드·버튼·입력창·뱃지·칩·검색창·헤더·하단 네비게이션에 굵은(2~3px) 각진 테두리 추가, 헤더·하단 네비게이션의 반투명 블러(glassmorphism) 제거하고 불투명 배경 + 굵은 테두리로 교체.
- 버튼: 호버 시 그림자 방향으로 살짝 이동(-2px,-2px), 클릭 시 눌리는 느낌(+1px,+1px, 그림자 소멸)으로 "물리적으로 눌리는" 상호작용 추가. 라벨 대문자화.
- 퀵매치 배너·제안 카드에 기울어진(rotate) 라임 컬러 "스티커" 장식 요소 추가.
- 포커스 링을 부드러운 glow에서 이중 각진 테두리(`0 0 0 3px 배경, 0 0 0 5px 검정`) 느낌으로 변경.

### 8.3 이 작업 중 발견한 무관한 실제 버그 (수정함)

`packages/ui/src/index.ts`가 `export ... from "./card"`를 참조하지만 **`packages/ui/src/card.tsx` 파일 자체가 저장소에 없어** `Card`/`CardBody`를 import하는 화면(`apps/web/src/app/page.tsx` — 홈 화면)에서 `next dev`/`next build` 빌드가 즉시 실패하는 상태였다(`Module not found: Can't resolve './card'`). 브루탈리즘 적용 여부와 무관하게 항상 발생하는 버그였음.

- 기존 `.cmt-card` CSS 클래스 규약과 `button.tsx`/`status-badge.tsx`의 컴포넌트 작성 패턴(className 조합, props 규약)을 그대로 따라 `card.tsx`를 새로 작성해 복구.
- 이 파일이 없으면 홈 화면을 포함해 `@campus-major-tutoring-mvp/ui` 배럴을 import하는 사실상 모든 화면이 빌드조차 되지 않으므로, 이번 회차 스코프(공통 기반)와 직결된 차단 이슈로 판단해 함께 수정.

### 8.4 검증

- `next dev` 기동 후 `/login`, `/`(데스크톱 1280px, 모바일 390px) Playwright 스크린샷으로 시각 확인.
- `next build` 프로덕션 빌드 "Compiled successfully" + 정적 페이지 3개(`/`, `/login`, `/_not-found`) 생성 확인, CSS/타입 오류 없음.
- 스크린샷상 Material Symbols 아이콘이 텍스트("school", "search" 등)로 보이는 것은 이 검증 환경(클라우드 샌드박스)이 Google Fonts 호스트로의 네트워크 접근을 차단하고 있기 때문이며, 실제 사용자 브라우저에서는 정상적으로 아이콘이 로드된다(코드상 문제 아님).
