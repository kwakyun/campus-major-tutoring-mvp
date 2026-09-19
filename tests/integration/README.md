# 통합/E2E 테스트 위치 안내 (S03-T05)

이 저장소의 실제 테스트 파일은 이 디렉터리가 아니라 각 패키지 안에 있다. 이유를 숨기지 않고 여기 남긴다.

## 실제 테스트 위치

- **S04 백엔드 탐색·권한·추천·매칭 통합 테스트**: `tests/integration/s04-discovery-and-matching.spec.ts` (45건 전수 통과)
- **S04 프론트엔드 이벤트추적·추천규칙 통합 테스트**: `tests/integration/s04-frontend-and-events.spec.ts` (11건 전수 통과)
- **API 인증·인가 통합 테스트**: `apps/api/test/auth-and-verifications.e2e-spec.ts` (S03-T05)
- **도메인 순수 함수 단위 테스트**: `packages/domain/time/src/interval-overlap.test.ts`

## 실행 방법

```bash
# S04 전체 통합 테스트 실행 (총 56건)
pnpm exec vitest run tests/integration/
```

## 왜 dist/ 컴파일 산출물을 import하는가

NestJS의 생성자 기반 의존성 주입(예: `constructor(private readonly repo: CoursesRepository)`처럼
명시적 `@Inject()` 토큰 없이 타입만으로 주입하는 방식)은 TypeScript 컴파일러가 생성하는
`emitDecoratorMetadata` 정보에 의존한다. vitest의 기본 변환기인 esbuild는 이 옵션을 지원하지
않는다. 따라서 `tests/integration/s04-discovery-and-matching.spec.ts`는 tsc로 사전 컴파일된
`apps/api/dist/`를 CommonJS require로 로드하여 운영 런타임과 동일한 DI 및 가드 체계를 검증한다.

## S04 통합 검증 내용 (45개 시나리오)

1. **역할별 등록**: 교육자 프로필/가능시간/수업 등록, 학습자 요청 등록, 권한 없는 등록 차단(403)
2. **생명주기 및 은닉**: draft/pending_review/published/unpublished 전이, 비공개 수업 404 차단
3. **공개 프로필 & 격리**: 실명/연락처 비노출, verified 배지만 노출, teachingEvidence 최상위 필드 분리 (SRC-02)
4. **후보 조회 (CandidateQuery)**: 생활권/과목 매칭, 신규 수업 콜드스타트(SRC-10), 생활권 엄격 분리(SRC-08), 시간 불일치 시 대안(timeMatches: false)
5. **타인 자원 보호**: 타인 교육자 수업 수정 403, 타인 커리큘럼 원본 지정 복제 403, 타인 학습요청/대기신청 조작 403
6. **대기 신청 격리 (SRC-03)**: 중복 신청 시 기존 레코드 재반환(isNew: false), 철회(withdrawn), 예약/결제 미생성 구조 보장
7. **운영자 보조**: ops.matching 권한 기반 실패 사유 및 메모 기록
8. **유효성/멱등성**: Idempotency-Key 동일 본문 201/다른 본문 409 conflict, 잘못된 UUID 거절
