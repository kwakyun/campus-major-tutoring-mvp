# 전공한시간 — 회원·수업·탐색 화면 구현 및 검증 결과 (S04-T03, A3)

- **작성일**: 2026-09-19
- **작성자**: A3 (UX·프론트엔드 담당)
- **관련 파일**: `apps/web/**`, `packages/ui/**`, `docs/handoffs/S04-T03.md`, `agent-prompts/source-alignment.md` (SRC-01, SRC-02, SRC-03)

---

## 1. 구현 화면 및 라우트 목록

| 경로 | 화면명 | 주요 기능 및 연결 API | 상태 및 예외 처리 |
|---|---|---|---|
| `/` | 홈 (랜딩) | 대학생(전공 심화)과 편입준비생(기초 개념)의 2개 진입 카드(SRC-01), 플랫폼 안심 원칙 고지 | 비로그인 누구나 접근 가능 |
| `/login` | 로그인 (세션 설정) | 역할별 세션 키 원클릭 변경(`fake-learner-prep`, `fake-learner-enrolled`, `fake-tutor`, `fake-operator`) | 401/403/네트워크 오류 피드백 |
| `/courses` | 수업 탐색 목록 | 과목·생활권 필터, 수업 카드(시간·결과물·희망가·비식별 라벨·공식 인증 배지 동시 노출), `GET /courses` | **빈 결과 처리**: 대체 시간 확인 및 맞춤 요청/대기 신청 연결 (SRC-03) |
| `/courses/[id]` | 수업 상세 | 단원별 커리큘럼 계획, 교육 품질 근거(`sampleDescription`, `expectedOutcome`), 교육자 가능 시간 슬롯, 1:1 협의 신청 모달 | **이벤트 전송**: `course_detail_view`, `inquiry_started` / 404 비공개 수업 은폐 처리 |
| `/recommendations` | 맞춤 추천 | 조건·태그 기반 추천 질의, 검증 가능한 추천 이유 코드(`REASON_*`) 표시 | **이벤트 분리 전송**: 응답 수신 시 `recommendation_served`, 뷰포트 진입 시 `recommendation_impression` / 빈 결과 대체 행동 제공 |
| `/learning-requests` | 내 학습 요청 목록 | 등록된 학습 요청 상태(`open`, `matched`, `waitlisted`, `withdrawn`) 조회 및 요청 철회, 대기 신청 등록/철회 | 403 학습자 권한 오류 안내 및 전환 버튼 제공 |
| `/learning-requests/new` | 맞춤 학습 요청서 등록 | 학습자 목적 선택(재학생 vs 편입준비생, SRC-01), 목표, 수준(수준 확인 필요 허용), 예산, 기한, 생활권, `POST /learning-requests` | 대학 재학 강제 없음, 유효성 검사 오류 처리 |
| `/tutor/courses` | 교육자 개설 수업 관리 | 본인 수업 목록 조회(`GET /tutor/courses`), 상태 전이(`draft`→`pending_review`→`published`→`unpublished`), **커리큘럼 복제**(`POST /tutor/courses/:id/versions`) 및 버전 이력 조회 | 소유자 검증 강제 (타인 수업 복제 차단) |
| `/tutor/courses/new` | 신규 수업 작성 | 과목, 생활권, 목표, 희망가, 1회 진행시간, 선수 수준, 샘플 설명, 예상 결과물, 단원별 커리큘럼, Idempotency-Key 전송 | 필수값 검증, 과대광고 방지 안내 문구 |
| `/tutor/profile` | 교육자 프로필 관리 | 학교/전공 자기기재 등록(`POST /tutor/profile`), 경력 항목 관리, 공식 인증 상태 배지 연동 | **자기기재 vs 공식 검증 분리 표시** (SRC-02) |
| `/tutor/availability` | 수업 가능 시간 관리 | 주간 반복 가능 시간 슬롯 등록/수정/삭제(`PUT/GET /tutor/availability`) | 시간대 겹침 방지 및 안내 고지 |

---

## 2. 주요 비즈니스 및 UX 요구사항 충족 내역

### 1) 교육 품질 근거와 공식 검증 상태의 분리 표시 (SRC-02)
- 교육자의 자기기재 학력/경력과 운영자 승인 공식 검증(`verificationBadges`)을 시각적으로 완전히 분리했습니다.
- "학교·신원 인증됨" 배지 옆에 **"교육 능력을 보증하지 않습니다"** 및 **"합격·취업 보장 금지"** 경고 문구를 배치하여 근거 없는 과대광고를 원천 차단했습니다.
- 수업 상세 및 탐색 카드에서 `sampleDescription`(샘플 수업 설명)과 `expectedOutcome`(예상 결과물)을 독립된 섹션으로 명시하여, 학습자가 실질적인 수업 품질을 판단할 수 있도록 지원합니다.

### 2) 이름 공개 범위 및 투명한 가격 표시
- 교육자 실명과 연락처를 공개 화면에 일절 노출하지 않고, 시스템 비식별 라벨(`교육자-xxxx`)로 표기합니다.
- 수업 카드의 가격은 **"협의 시작 가격"**임을 명시하고, 학습자에게는 별도의 중개 수수료가 청구되지 않음(플랫폼 수수료 0원)을 카드마다 표기했습니다.

### 3) 추천 반환과 실제 화면 노출 이벤트의 분리 전송 (`event-tracker.ts`)
- 프롬프트 지침: *"추천 반환과 실제 화면 노출을 구분해 이벤트를 전송하라"*
- **`recommendation_served`**: 추천 결과 수신 시점(응답 1회당)에 서버/클라이언트 이벤트로 전송합니다.
- **`recommendation_impression`**: 추천 카드 컴포넌트(`ImpressionCandidateCard`)에 `IntersectionObserver`를 적용하여, 실제 사용자의 뷰포트에 30% 이상 카드가 노출되었을 때에만 중복 제거를 거쳐 노출 이벤트를 개별 발행합니다.

### 4) 학습 목적 구분 및 대학 재학 미강제 (SRC-01)
- 진입 페이지(`/`) 및 학습 요청 등록 폼(`/learning-requests/new`)에서 **대학생/복수전공생**과 **편입준비생/비전공자**의 학습 목적을 명확히 분리 제공합니다.
- 편입준비생에게 대학 재학 증빙을 필수로 요구하지 않으며, 수준 항목에 "수준 확인 필요"를 입력하더라도 부적격으로 배제하지 않습니다.

### 5) 검색 실패 시 대체 시간 확인 및 대기 신청/철회 제공 (SRC-03)
- 탐색(`/courses`) 및 추천(`/recommendations`)에서 조건에 맞는 후보가 없을 때, 조건을 몰래 완화하거나 허위 결과를 만들지 않습니다.
- "조건에 맞는 수업이 없습니다" 빈 결과 화면을 통해:
  1. **대체 가능한 교육자 가능 시간 확인**
  2. **맞춤 학습 요청서 등록 및 대기 신청(Waitlist)**
  3. **대기 신청 철회 액션**
- 대기 신청 시 **"예약이나 좌석 점유, 결제가 발생하지 않으며, 신규 교육자 등록 시 알림을 제공하는 목적"**임을 명확히 고지합니다.

### 6) 소유자 중심 커리큘럼 복제 (Curriculum Version Cloning)
- `/tutor/courses`에서 교육자 본인이 개설한 수업만 `POST /tutor/courses/:id/versions`를 호출하여 새 버전으로 복제할 수 있습니다.
- 복제 시 버전 번호(v1, v2...)가 부여되며, 과거 체결된 예약 사본에 소급 적용되지 않는 안전한 스냅샷 정책을 준수합니다.

---

## 3. 검증 증적 (Evidence)

1. **Next.js 프로덕션 빌드 (Static Page Generation)**:
   - 실행 명령: `pnpm run --filter @campus-major-tutoring-mvp/web build`
   - 결과: **Exit code 0 (전체 13개 라우트 정적 생성 성공)**
   - 라우트: `/`, `/login`, `/courses`, `/courses/[id]`, `/recommendations`, `/learning-requests`, `/learning-requests/new`, `/tutor/courses`, `/tutor/courses/new`, `/tutor/profile`, `/tutor/availability`, `/_not-found`
2. **타입 안전성 (TypeScript Typecheck)**:
   - `pnpm run --filter @campus-major-tutoring-mvp/ui typecheck`: **Pass (Exit code 0)**
   - `pnpm run --filter @campus-major-tutoring-mvp/web typecheck`: **Pass (Exit code 0)**
3. **API 회귀 테스트**:
   - `pnpm run --filter @campus-major-tutoring-mvp/api test`: **7 passed (Exit code 0)**
4. **Node 24 Windows 호환성 보장**:
   - Node 24 Windows 환경에서 `fs.promises.readlink` 및 `readlinkSync`가 일반 파일에 대해 `EISDIR`을 발생시켜 webpack 빌드를 중단시키는 현상을 `node-24-fix.cjs` 프리로드 스크립트로 패치하여 `EINVAL`을 반환하도록 보정, 빌드 무결성을 확보했습니다.
