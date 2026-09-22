# 전공한시간 (campus-major-tutoring-mvp)

같은 전공·같은 캠퍼스(또는 편입 준비) 튜터와 학습자를 이어주는 1:1 학습 매칭 서비스의 개발 저장소입니다.

비효율적인 학원이나 불투명한 개인 과외 대신, 대학생의 공강 시간표와 연계하여 1시간 단위의 집중 전공 튜터링을 제공합니다.

---

## 1. 저장소 디렉터리 구조

```text
campus-major-tutoring-mvp/
├── apps/
│   ├── api/                    # NestJS 기반 백엔드 모듈형 모놀리스 서버 (기본 포트: 4000)
│   │   └── src/modules/        # 업무 도메인 모듈 (Identity, Catalog, Matching, Negotiation, Booking, Billing 등)
│   └── web/                    # Next.js 14 기반 반응형 웹 프론트엔드 (기본 포트: 3000)
│       └── src/app/            # App Router 페이지 (수업 탐색, 맞춤 추천, 조율 채팅, 시간표 등)
├── packages/
│   ├── contracts/              # OpenAPI(v3.0.3) 및 이벤트 인터페이스 계약 명세
│   ├── domain/time/            # 시간대 겹침 판정 등 순수 도메인 로직 라이브러리
│   └── ui/                     # 디자인 시스템 공통 컴포넌트 라이브러리 (Button, Card, FormField 등)
├── db/
│   ├── migrations/             # PostgreSQL DDL 스키마 마이그레이션 SQL
│   └── seeds/                  # 로컬 시연용 개발 데모 데이터
├── docs/                       # 기획, 소프트웨어 아키텍처, 정책, QA 검증 및 핸드오프 문서
├── tests/
│   └── integration/            # 도메인 및 API e2e 통합 테스트
├── scripts/                    # 마이그레이션 및 시드 실행 유틸리티 스크립트
├── package.json                # pnpm 모노레포 워크스페이스 루트 설정
└── pnpm-workspace.yaml         # 워크스페이스 패키지 정의
```

---

## 2. 빠른 시작 가이드 (Quick Start)

### 1) 사전 준비물
- Node.js: 20 이상 23 미만 (package.json engines 기준; 22 버전 권장)
- 패키지 매니저: `pnpm` 10.28.0 (packageManager 기준)

### 2) 설치 및 환경변수 준비
```powershell
# 의존성 설치
pnpm install

# 환경변수 파일 복사 (기본 목 모드로 외부 유료 서비스 없이 즉시 구동)
Copy-Item .env.example .env
```

### 3) 서비스 실행 (터미널 2개 병렬 실행)
```powershell
# [터미널 1] 백엔드 API 서버 구동 (포트 4000)
pnpm run dev:api

# [터미널 2] 프론트엔드 웹 구동 (포트 3000)
pnpm run dev:web
```

---

## 3. 접속 링크 및 시연 안내

| 접속 대상 | 접속 URL | 설명 |
| :--- | :--- | :--- |
| **로컬 웹 브라우저** | `http://localhost:3000` | 서비스 메인 홈 접속 |
| **API 헬스체크** | `http://localhost:4000/health` | 백엔드 정상 구동 여부 확인 (`status: ok`) |
| **로그인 / 세션 전환** | `http://localhost:3000/login` | 역할별 데모 세션 키 입력 |

### 시연용 데모 세션 키
로그인 페이지(`/login`)에서 입력하여 즉시 역할을 전환할 수 있습니다.
- `fake-learner-prep` : 편입 / 전과 준비생 (학습자)
- `fake-learner-enrolled` : 대학 재학생 (학습자)
- `fake-tutor` : 전공 튜터 (교육자 센터)
- `fake-operator` : 서비스 운영자

---

## 4. 핵심 제공 기능 및 화면 경로

1. **메인 홈 (`/`)**: 서비스 소개, 전공별 카테고리 필터, 실시간 인기 수업 카드
2. **수업 탐색 (`/courses`)**: 생활권 및 과목별 세부 필터, 1:1 전공 수업 상세 및 커리큘럼 조회
3. **AI 맞춤 추천 (`/recommendations`)**: 학습 목표 및 수준에 맞춘 객관적 추천 사유 뱃지 제공
4. **1:1 조율 채팅 (`/chat/sample-1`)**: 수업 일정/장소 실시간 협의 및 공식 수업 제안서 안전 합의
5. **공강 연계 시간표 (`/schedule`)**: 대학생 공강 시간대 자동 연계 및 과외 수업 일정 대시보드
6. **교육자 센터 (`/tutor/courses`)**: 튜터 전용 수업 개설 관리 및 AI 커리큘럼 초안 생성

---

## 5. 검증 명령과 현재 범위

아래 명령으로 타입·빌드·테스트를 확인합니다. 통과 여부는 실행 환경과 해당 커밋의 결과로 판단합니다:

```powershell
pnpm run typecheck    # TypeScript 타입 검사
pnpm run build        # 워크스페이스 빌드
pnpm run test         # 워크스페이스 테스트
```

현재 문서는 로컬 데모 모드를 기준으로 합니다. 데모 세션은 실제 사용자 인증이나 실결제 운영 실적을 뜻하지 않습니다.
PostgreSQL 스키마·향후 연동 설계와 현재 실행되는 저장 방식을 구분해 확인해야 합니다.

## 6. 핵심 구현과 작업 기록

- [시간 도메인](packages/domain/time/): 시간대 겹침 판정
- [백엔드 모듈](apps/api/src/modules/): 매칭·협의·예약·정산 도메인 구분
- [상태 머신 설계](docs/architecture/state-machines.md), [데이터 모델](docs/architecture/data-model.md)
- [QA 기록](docs/qa/): 과거 검증의 범위와 결과
- [AI 작업 프롬프트](agent-prompts/): 저장소에 포함된 개발 보조 자료

[AI 활용 기록](AI_NOTES.md) · [변경 기록](CHANGELOG.md) · [작업 방법](CONTRIBUTING.md)
