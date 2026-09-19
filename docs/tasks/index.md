# 전공한시간 — 전체 작업 상태표

관리 담당: A0(총괄·제품·통합). 이 표만 A0가 갱신한다(전공한시간_AI_Agent_역할별_개발_분담.md 13절).

상태값: 대기 / 실행 가능 / 진행 중 / 검증 중 / 통합 완료 / BLOCKED / NOT_APPLICABLE

## S01 — 요구사항·정책·범위

| ID | 담당 | 상태 | 비고 |
|---|---|---|---|
| S01-T01 | A0 | 통합 완료 | P0 요구사항·정책 결정표 작성 완료(PASS). 실제 인터뷰 실행은 별도 BLOCKED 항목으로 이관 |
| S01-T02 | A1 | 통합 완료 | 요구사항-모듈-데이터 매핑, 외부 의존 목록화 완료(PASS) |
| S01-T03 | A6 | 통합 완료 | 인수 기준 매트릭스 작성 완료(PASS) |
| S01-GATE | A0 | 통합 완료 | docs/releases/S01-gate.md — exit_criteria 3개 모두 충족. 다음 실행 가능: S02 |

## S02 — 화면·DB·API 상세 설계

| ID | 담당 | 상태 | 비고 |
|---|---|---|---|
| S02-T01 | A1 | 통합 완료 | 핵심 DB·API 계약 초안(PASS) — openapi.yaml, data-model.md, state-machines.md, authorization.md |
| S02-T02 | A3 | 통합 완료 | 사용자 흐름·화면 상태 설계(PASS), 계약 변경 요청 10건(CR-01~10) 제출 |
| S02-T03 | A4 | 통합 완료 | 금액 처리 계약 제안(PASS), 반영 요청 4건(PR-01~04) 제출 |
| S02-T04 | A5 | 통합 완료 | 추천·이벤트·AI 계약 제안(PASS), 반영 요청 3건(AR-01~03) 제출 |
| S02-T05 | A1 | 통합 완료 | 공통 계약 통합(PASS) — openapi.yaml 0.2.0-s02-baseline, events.yaml 0.1.0-s02-baseline |
| S02-T06 | A6 | 통합 완료 | 설계 일관성 검토(PASS) — F-01 수정완료, F-02·F-04 OPEN 인계, F-03·F-05 경미 |
| S02-GATE | A0 | 통합 완료 | docs/releases/S02-gate.md — exit_criteria 3개 모두 충족. 다음 실행 가능: S03 |

## S03 — 프로젝트 기반·인증·CI

| ID | 담당 | 상태 | 비고 |
|---|---|---|---|
| S03-T01 | A7 | 통합 완료 | pnpm 워크스페이스·NestJS/Next.js 최소 골격·CI 골격 구성(PASS). README.md, .env.example로 외부 미확보 자격증명 명시 |
| S03-T02 | A1 | 통합 완료 | 초기 마이그레이션 2건·허구 시드 작성, 실제 PostgreSQL에 적용 검증(PASS). **F-02(자기거래 DB 제약) RESOLVED** |
| S03-T03 | A2 | 통합 완료 | 세션 인증·운영자 세부권한·공통 오류 처리 구현, 운영환경 테스트우회 이중차단 실제 검증(PASS) |
| S03-T04 | A3 | 통합 완료 | 공유 UI 최소 컴포넌트·로그인/세션 화면 연결(PASS). 브라우저 육안 확인은 미실행으로 별도 보고 |
| S03-T05 | A6 | 통합 완료 | 설치·빌드·DB초기화·인증 흐름 실제 실행 검증, 자동 통합테스트 7건 추가(PASS) |
| S03-GATE | A0 | 통합 완료 | docs/releases/S03-gate.md — exit_criteria 3개 모두 충족. 다음 실행 가능: S04 |

## S04 — 회원·수업·탐색·기본 추천

| ID | 담당 | 상태 | 비고 |
|---|---|---|---|
| S04-T01 | A2 | 통합 완료 | 회원·교육자·수업·가능시간·학습요청·대기·운영자매칭 API 구현 및 typecheck/build/test 검증 완료(PASS) |
| S04-T02 | A5 | 통합 완료 | 조건·태그 기반 기본 추천 엔진(CandidateQueryService 소비, 콜드스타트 우대, 대체시간 안내) 완료(PASS) |
| S04-T03 | A3 | 통합 완료 | 수업 탐색·상세·등록·대기 웹 UI 실연동 및 뷰포트 impression 감지, 빌드 통과(PASS) |
| S04-T04 | A6 | 통합 완료 | S04 통합 QA 및 E2E 검증 (56건 통합 테스트 + 20건 E2E 프로브 전수 PASS) |
| S04-GATE | A0 | 통합 완료 | docs/releases/S04-gate.md — exit_criteria 3개 전수 충족(PASSED). 다음 실행 가능: S05 |

## S05~S10

전체 목록은 agent-prompts/00-workflow.yaml의 `stage_registry`를 따른다.

| 단계 | 파일 | 상태 |
|---|---|---|
| S05 채팅·제안·양측 동의·예약 | agent-prompts/05-negotiation-booking.yaml | 실행 가능 (S04-GATE PASS 완료) |
| S06 모의 결제·수업 완료·운영 통합 | agent-prompts/06-mock-transactions-operations.yaml | 대기 |
| S07 실제 제공자 연동·출시 준비 | agent-prompts/07-payments-release-readiness.yaml | 대기 |
| S08 파일럿 준비·실제 기록 분석·개선 | agent-prompts/08-pilot-feedback.yaml | 대기 |
| S09 AI 의미 검색·작성 보조 | agent-prompts/09-ai-semantic-search.yaml | 대기(S06 완료 후 독립 실행 가능) |
| S10 선택 확장 | agent-prompts/10-selected-expansion.yaml | 대기(S08 완료 후, 트랙 미선택) |

## 현재 실행 가능한 다음 명령

S04 단계가 공식 PASSED 판정되어 통합 완료되었다. **현재 실행 가능한 명령은 S05(채팅·제안·양측 동의·예약) 단계다.**
S05-T01(A1: 스키마 점검), S05-T02(A4: 수수료 15% 및 납부의무), S05-T03(A2: 협의·예약 백엔드), S05-T04(A3: 채팅/제안 웹 UI 실연동) 순서로 진행한다.

## BLOCKED 항목 요약

| 항목 | 사유 | 해제 조건 |
|---|---|---|
| 학습자 6명·교육자 3명 인터뷰 실행 | 실제 인터뷰 대상 미확보 | 팀의 실제 인터뷰 실행 및 결과 기록(docs/product/interview-results.md) |
| 주 고객군(대학생/편입준비생) 최종 선택 | 위 인터뷰 결과 필요 | 인터뷰 결과로 P0-CUST-01 기준 판정 |
| 1~2개 과목 확정 | 교육자 확보 결과 필요 | 교육자 인터뷰·등록 결과 |
| S04 통합 완료(S04-GATE) | S04-T02(A5), S04-T03(A3), S04-T04(A6) 미실행 | A5 추천 모듈, A3 웹 UI, A6 통합 QA 완료 후 S04-GATE 재판정 |

## OPEN 항목 요약

| 항목 | 사유 | 담당 |
|---|---|---|
| F-04: completion_rate 취소/환불 분모 규칙 미표준화 | 지표 정의가 "보고서마다 명시"로 유연하게 남음 | A5(제안) → A1(확정), S06 이전 |

## RESOLVED 항목(S02에서 이관되어 S03에서 해소)

| 항목 | 해소 근거 |
|---|---|
| F-02: 자기 거래 차단 DB 제약 미설계 | `db/migrations/0002_catalog_and_transactions.sql`의 `conversations.no_self_dealing` CHECK 제약으로 구현, 실제 PostgreSQL에서 재현 검증(docs/qa/S03-foundation.md §2-1) |

## S03에서 새로 이관된 항목

| 항목 | 사유 | 담당/시점 |
|---|---|---|
| FakeSessionVerifier ↔ DB users 레코드 미연결 | 세션 인증 대역이 인메모리 픽스처이고 DB 시드와 별개로 존재 | A2, S04 |
| waitlist_entries/learning_outcomes 애플리케이션 접근 제어 미구현 | 인증 방식(RLS 채택 여부) 미확정으로 애플리케이션 계층에서 우선 구현 예정 | A2, S04 |
| curriculum_versions 소유자 전용 복제 검사 미구현 | FK만으로 표현 불가, 서비스 계층 검사 필요 | A2, S04 |
