# 전공한시간 — 권한 매트릭스 (S02-T01)

작성: A1 · 작성일: 2026-09-19 · 입력: 웹서비스 아키텍처 §10, docs/architecture/data-model.md

## 1. 원칙

서버는 모든 사용 사례에서 "세션 사용자 + 리소스 참여 관계 + 현재 상태"를 검사한다(기존 원칙 유지). 아래 표는 신규 엔티티를 포함한 접근 범위를 명시한다.

## 2. 리소스별 접근 범위

| 리소스 | 조회 가능 | 수정 가능 | 비고 |
|---|---|---|---|
| 공개 수업·프로필 | 전체(비로그인 포함) | 소유 교육자만 | 실명·연락처·비공개 증빙 제외 |
| `verifications`(비공개 증빙) | 본인, 심사 담당 운영자 | 심사 담당 운영자(status 전이만) | evidence_key는 짧은 만료 다운로드 링크로만 제공 |
| `learning_requests` | 본인, 운영자 | 본인(취소/수정), 운영자(매칭) | 타 학습자에게 비공개 |
| `waitlist_entries` | 본인, 운영자 | 본인(철회), 운영자(상태 전이) | 다른 학습자·교육자에게 노출 안 함 |
| `conversations`/`messages`/`proposals` | 해당 참여자, 사건 담당 운영자 | 참여자(메시지·제안 작성) | 타 협의방 ID로 접근 시 거절 |
| `bookings`/`payment_obligations` | 해당 참여자, 업무 권한 운영자 | 서버 내부 로직만(직접 PATCH 없음) | 클라이언트가 상태를 직접 변경하지 않음 |
| `learning_outcomes` | **본인 학습자, 해당 세션 교육자, 필요 업무 권한 운영자만** | 본인 학습자(최초 제출) | 제3자 접근 전면 차단 — acceptance-matrix.md 핵심 인수 기준 |
| `tutor_activity_summaries`(비공개 상세) | 본인 교육자, 운영자 | 시스템 생성(직접 수정 불가) | 공개 버전은 `portfolio_consents` 동의 시에만 노출 |
| `portfolio_consents` | 본인 | 본인 | 철회 시 즉시 비공개 반영 |
| `curriculum_versions` | 소유 교육자, 운영자 | 소유 교육자만(복제 포함) | 타인 커리큘럼 복제 불가 |
| `rebooking_requests` | 해당 학습자·교육자, 운영자 | 해당 당사자 | 원본 예약(`origin_booking_id`) 조회 권한은 별도로 확인 |
| `disputes`/`reports` | 신고자·상대방(제한된 범위)·담당 운영자 | 담당 운영자만 결정 | 상대방에게는 답변에 필요한 범위만 노출 |
| `settlements`/`payout_attempts` | 해당 교육자, 재무 권한 운영자 | 재무 권한 운영자 | 분쟁 미해결 시 조회는 가능하되 실행 차단 |
| `policy_versions`/`audit_logs` | 운영자(권한별 상이) | 관리자 권한 + 변경 사유 필수 | 소급 적용 금지(기존 원칙) |

## 3. 운영자 권한 세분화(S01에서 이관된 결정)

기존 설계는 "운영자"를 단일 역할로 취급했으나, 아래와 같이 세분화한다.

| 세부 권한 | 허용 범위 |
|---|---|
| `ops.verification_review` | `verifications` 승인/반려 |
| `ops.matching` | `learning_requests`/`waitlist_entries` 수동 매칭 |
| `ops.dispute_resolution` | `disputes` 결정, 관련 `settlements`/`deposit_dispositions` 보류·해제 |
| `ops.finance` | `settlements`/`payout_attempts` 실행, `refunds` 처리 |
| `ops.audit` | `audit_logs`/`policy_versions` 조회(읽기 전용) |

한 운영자 계정이 여러 세부 권한을 가질 수 있으나, `ops.dispute_resolution`과 `ops.finance`를 분리해 분쟁 결정자가 곧바로 정산을 집행하지 못하게 하는 것을 권장안으로 남긴다(최종 채택은 S02-T05 통합에서 확정).

## 4. 자기 거래(Self-dealing) 차단

교육자 본인이 같은 예약에서 학습자로 참여하는 자기 거래는 신청 단계에서 거절한다(웹서비스 아키텍처 §4 원칙 유지). 검증: `booking_participants`에 동일 `user_id`가 tutor/learner 역할로 동시에 존재하는 경우 DB 제약 또는 애플리케이션 검사로 차단(S02-T06 QA 검토 대상).

## 5. 학교 인증과 교육 능력의 API 표현 분리

`GET /api/tutors/:id` 공개 응답 스키마는 `verification_badges`(학교/전공/자격별 boolean)와 `teaching_evidence`(샘플 설명, 예상 결과물, 후기 요약)를 **별도 최상위 필드**로 분리한다. 두 필드를 하나의 "신뢰도 점수"로 합산해 반환하지 않는다(acceptance-matrix.md 인수 기준과 직접 연결).
