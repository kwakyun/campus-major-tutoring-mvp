# 전공한시간 — 사용자 흐름 설계 (S02-T02)

작성: A3(UX·프론트엔드) · 작성일: 2026-09-19
입력: docs/product/requirements.md(P0 요구사항), packages/contracts/openapi.yaml(S02-T01)

## 1. 학습자: 탐색 → 협의 → 동의 → 예약

```mermaid
flowchart TD
    A[진입: 대학생/편입준비생 구분 문구] --> B[수업 탐색 GET /courses]
    B -->|조건 일치 있음| C[수업 상세]
    B -->|조건 일치 없음| B2[학습 요청 등록 POST /learning-requests]
    B2 --> B3{운영자 매칭 결과}
    B3 -->|후보 있음| C
    B3 -->|후보 없음| B4[대체 시간 확인 + 대기 신청 POST /learning-requests/:id/waitlist]
    C --> D[협의방 시작 POST /conversations]
    D --> E[가격·범위 제안 POST /conversations/:id/proposals]
    E --> F{교육자 응답}
    F -->|재제안| E
    F -->|수락| G[최종 합의서 확인]
    G --> H[동의 POST /proposals/:id/accept]
    H -->|예약 생성| I[결제 대기 화면]
    H -->|STALE_PROPOSAL 409| E2[최신 제안으로 갱신 후 재확인]
    I --> J[본인 결제 POST /bookings/:id/payment-attempts]
    J --> K[예약 확정 대기/확정 표시]
    K --> L[수업 완료 확인 POST /sessions/:id/completion-confirmations]
    L --> M[학습 목표 달성 응답 POST /sessions/:id/learning-outcomes]
    M --> N[후기 작성 POST /bookings/:id/reviews]
    N --> O[재예약 요청 POST /bookings/:id/rebooking-requests]
```

## 2. 교육자: 등록 → 수업 관리

```mermaid
flowchart TD
    A[교육자 프로필 등록 — 자기기재] --> B[학교/전공/경력 확인 신청 verifications]
    B --> C[커리큘럼 등록 POST /tutor/courses — draft]
    C --> D[운영자 심사]
    D -->|승인| E[published — 탐색 노출]
    D -->|반려| C
    E --> F[가능 시간 관리]
    F --> G[협의방에서 수락/재제안]
    G --> H[본인 보증금 처리]
    H --> I[완료 확인]
    I --> J[정산 예정액 확인]
    J --> K[교육 활동 기록 축적]
    K --> L{공개 포트폴리오 동의?}
    L -->|예| M[PUT /users/:id/portfolio-consents — 공개]
    L -->|아니오| N[비공개 유지 — 기본값]
    C --> O[기존 커리큘럼 복제 POST /tutor/courses/:id/versions]
```

## 3. 운영자: 심사 → 매칭 → 분쟁

```mermaid
flowchart TD
    A[인증 신청 대기열] --> B{승인/반려}
    B -->|반려| C[사유 기록 필수]
    D[학습 요청 대기열] --> E{후보 존재?}
    E -->|있음| F[후보 제시]
    E -->|없음| G[대기 신청 안내 — 허위 매칭 금지]
    H[한쪽 미납/완료 미응답 대기열] --> I[상태별 조회·재처리]
    J[신고 접수] --> K[이의제기 기회 제공]
    K --> L[분쟁 결정 — 정산/보증금 보류 연동]
```

## 4. 상태별 공통 화면 처리(모바일 우선)

| 상태 | 표시 방식 |
|---|---|
| 로딩 | 카드 스켈레톤(수업 목록·협의방), 버튼 비활성화(제안·결제 진행 중) |
| 빈 결과 | "조건에 맞는 수업이 없습니다" + 대체 시간 확인 버튼 + 대기 신청 버튼(허위로 결과를 만들지 않음) |
| 권한 오류(403) | "이 대화/예약에 접근할 수 없습니다" — 상세 사유는 노출하지 않고 목록으로 복귀 유도 |
| 오래된 제안(409 STALE_PROPOSAL) | "상대방이 새로운 제안을 보냈습니다" + 최신 제안으로 자동 스크롤, 기존 수락 버튼 비활성화 |
| 결제 확인 중(UNKNOWN) | "결제 확인 중입니다" 배지, 재청구 버튼 숨김, 새로고침/문의 안내만 제공 |

## 5. 매칭 실패 후속 행동 (SRC-03)

빈 결과 화면은 다음 두 경로를 항상 함께 제시한다: ① 가능한 다른 시간 확인(교육자 가능 시간 캘린더로 이동) ② 대기 신청 등록. 대기 신청 후에는 "신규 교육자 등록 시 안내드립니다"로 기대치를 관리하며, 매칭을 보장하는 문구를 사용하지 않는다.

## 6. 학습 전후 흐름(완료 결과·다음 단계·재예약·교육 활동)

완료 확인 이후 화면은 다음 순서로 이어진다: 완료 확인 → 목표 달성 자기응답(선택) → 후기 작성(완료된 경우만) → "다음에 필요한 학습" 안내(다음 단계는 교육자 확정 후에만 확정 제안으로 표시, AI 초안은 '초안' 배지 유지) → 동일 교육자 재예약 진입점. 이 흐름 어디에도 "합격/자격/취업"을 보장하는 문구를 넣지 않는다(acceptance-matrix.md §3).
