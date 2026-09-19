# 전공한시간 — 요구사항·모듈·데이터 연결 (S01-T02)

작성: A1(아키텍처·DB·API 계약) · 작성일: 2026-09-19
입력: docs/product/requirements.md, docs/decisions/policies.md, 전공한시간_웹서비스_아키텍처.md
범위: 이 문서는 설계 매핑이며 코드·migration을 생성하지 않는다(S01-T02 프롬프트 제약).

## 1. 기술 경계 확인

기존 루트 설계(전공한시간_웹서비스_아키텍처.md)는 Next.js(웹) + NestJS 모듈형 모놀리스(업무 서버) + PostgreSQL(+pgvector)를 기본안으로 하고, Python/FastAPI AI 서비스는 **의미 검색·작성 보조 도입 시점(S09)** 에 별도 배포한다. 첫 파일럿(S01~S08)은 NestJS 규칙 기반 추천(R0)까지만 필요하며 Python 서비스 배포는 P0 범위가 아니다.

- 초기 필수 배포: 웹(Next.js), 업무 서버(NestJS), PostgreSQL, Supabase(Auth/Storage)
- S09 이후 추가 배포: Python/FastAPI, pgvector 활성 인덱스, worker
- 이 경계는 requirements.md의 P0/P2 구분과 일치한다(AI 관련 요구사항은 모두 P2).

## 2. P0 요구사항 → 업무 모듈 연결

| 요구사항 ID | 담당 모듈(아키텍처 5절 기준) | 관련 테이블(아키텍처 6절 기준) | 비고 |
|---|---|---|---|
| LRN-01 | Identity | users, user_roles, private_profiles | 재학 필수 아님을 가입 검증 로직에 반영 |
| LRN-02 | Matching | learning_requests | 운영자 수동 매칭의 출발점 |
| LRN-03 | Catalog | courses, availability_windows | 조건 필터(주제·생활권·시간) |
| LRN-04, LRN-05 | Negotiation | conversations, messages, proposals, proposal_acceptances | 제안 버전·동의 규칙 |
| LRN-06 | Negotiation + Billing(조회) | proposals(terms), payment_obligations(조회) | 화면은 A3, 계산은 서버 |
| LRN-07 | Billing | payment_obligations, payment_attempts, payment_allocations | S06 모의, S07 실제 |
| LRN-08 | Booking | lesson_sessions, completion_confirmations | 자동 완료 금지 원칙 |
| LRN-09 | Trust & Operations | reviews | 완료·참여 검증 필요 |
| LRN-10 | Matching(확장) | learning_requests(대기 상태) | P1, SRC-03 |
| LRN-11 | Booking/Trust | bookings(재예약 신규 협의로 시작) | P1, SRC-04 |
| LRN-12 | Recommendations + AI 서비스 | course_search_documents, course_embeddings | P2, S09 |
| TUT-01 | Identity | tutor_profiles, verifications | 본인기재/증빙확인 상태 구분 |
| TUT-02 | Catalog | courses | 심사 상태 필요 |
| TUT-03 | Catalog | availability_windows | 확정 예약과 충돌 검사 |
| TUT-04 | Negotiation | proposals(재제안 시 SUPERSEDED) | |
| TUT-05 | Billing | payment_obligations(교육자 보증금) | |
| TUT-06 | Booking | completion_confirmations | |
| TUT-07 | Billing(조회) | settlements(예정액 계산) | |
| TUT-08 | Trust & Operations | reviews, bookings(이력 집계) | P1 |
| TUT-09 | AI 서비스 | ai_jobs(초안) | P2, S09 |
| OPS-01~06 | Trust & Operations | verifications, disputes, reports, audit_logs, settlements | 운영자 권한 전용 |

**연결 원칙:** Booking은 Billing 테이블을 직접 수정하지 않고 `Billing.createObligations()` 같은 명시적 인터페이스로 요청한다(아키텍처 5절). 이 경계는 A2/A4 역할 분리와 그대로 대응한다.

## 3. 추가 설계가 필요한 상태·권한·동시성·외부 의존 목록

이 목록은 S02 상세 설계에서 반드시 다뤄야 할 항목이며, 현재 루트 설계에 방향은 있으나 구체적 계약이 없는 것들이다.

### 상태 전이

- `PAYMENT_PENDING → EXPIRED` 전환 기준 시간(정책 미정 — policies.md)
- 그룹/복수 차시 도입 전이므로 첫 파일럿은 `bookings` 1건당 `lesson_sessions` 1건 고정. S10에서 재설계 필요
- 재예약(SRC-04)의 상태 모델: 신규 협의로 시작하되 완료 이력 참조를 어떻게 노출할지 미정

### 권한

- 학습자가 편입준비생일 때 "재학 미확인" 상태에서 접근 가능한 화면·API 범위(가입은 허용하되 특정 기능 제한 여부 미정)
- 운영자 권한 세분화(인증 심사 vs 분쟁 결정 vs 정산 승인)를 하나의 "운영 권한"으로 뭉칠지, 아키텍처 9절의 `/api/admin/*` 별 권한으로 분리할지 결정 필요

### 동시성

- 시간 중복 배제 제약(exclusion constraint)의 정확한 적용 범위: 교육자·학습자 각각의 `time_allocations` 외에 이동 여유 시간을 포함할지(아키텍처 6절, 미확정)
- 결제 대기 시간 만료와 결제 승인 웹훅이 경쟁할 때의 처리 순서(아키텍처 7절 원칙은 있으나 락 순서 명세 없음)

### 외부 제공자 의존

- 본인·재학 확인 제공자(미정, policies.md)
- 결제대행/지급대행 제공자(토스페이먼츠 후보, 계약 미체결)
- 교육자 보증금 수납·보관·반환 방식(일반 카드결제·취소 API만으로 구현 가능하다고 가정하지 않음 — 아키텍처 8절 명시)

## 4. 첨부 자료 추가 요구사항의 기존 설계 반영 상태

기존 루트 아키텍처 문서는 첨부 HWPX/PDF 반영 이전에 작성되었으므로, 아래 항목은 "이미 구현됨"이 아니라 **S02에서 계약에 통합해야 할 추가 범위**로 명시한다.

| 추가 요구사항(SRC) | 기존 설계 상태 | 소유자 | 반영 단계 |
|---|---|---|---|
| 학교/캠퍼스와 생활권의 개념 분리(SRC-08) | `campus_id` 필드만 존재, 생활권(이동 가능 반경) 개념 없음 | A1 | S02 ERD 보완 |
| 대체 시간·대기 신청(SRC-03) | `learning_requests`에 상태 필드 있으나 "대기" 세부 상태 미정의 | A1 + A2 | S02 계약, S04 구현 |
| 학습 결과(목표 달성 피드백) 기록(SRC-03, SRC-04) | `goal_feedback_submitted` 이벤트만 AI 문서에 정의, 정식 테이블 없음 | A1 | S02에서 테이블 추가 |
| 교육 활동 보고서(SRC-04) | reviews/bookings 집계로 가능하나 전용 발급 스키마 없음 | A1 + A2 | S02 설계, S06 구현 |
| 채널별 지표(channel_cac 등, SRC-05) | 지표 정의만 존재(source-alignment.md), 유입 채널 저장 필드 없음 | A1 | S02에서 `acquisition_channel` 등 필드 추가 |
| 지인 추천 보상 원장(SRC-09) | 없음, 완전히 신규 | A1(스키마) + A4(원장) | S10 트랙 선택 시 |

이 표의 항목은 기존 루트 설계에 "이미 반영됐다"고 가정하지 않는다(S01-T02 프롬프트 명시 제약). S02에서 계약과 `docs/architecture/`에 정식 통합한다.

## 5. 거래 정확성·AI 장애 격리 요구(수용 기준 반영)

- **거래 정확성:** 동일 수락·결제·웹훅의 반복 처리에도 유효 예약·금액 기록 중복이 0건이어야 한다(아키텍처 14절 검증 시나리오와 동일 기준 채택). 이는 S02의 멱등키·고유 제약 설계로 직접 연결된다.
- **AI 장애 격리:** AI(추천 R1 이상, 초안 생성)가 응답하지 않거나 타임아웃되어도 조건 기반 기본 추천(R0)과 예약·결제 흐름은 영향을 받지 않아야 한다(AI 추천 아키텍처 6절). 이는 P0 요구사항에는 직접 없으나, P2 요구사항(LRN-12, TUT-09) 구현 시 반드시 지켜야 할 비기능 제약으로 S02·S09 계약에 명시한다.

## 6. 결론 — S02로 이관할 결정 목록

1. `campus_id`(학교) vs 생활권(이동 가능 반경) 스키마 분리안
2. 대기 신청 상태 모델
3. 학습 결과·교육 활동 보고서 테이블 초안
4. 채널 유입 필드 추가안
5. PAYMENT_PENDING 만료 시간, 시간 중복 배제 범위(이동 여유시간 포함 여부)
6. 운영자 권한 세분화 방식
