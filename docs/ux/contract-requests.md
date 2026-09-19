# 전공한시간 — UX → 계약 변경 요청 (S02-T02)

작성: A3 · 작성일: 2026-09-19 · 수신: A1(S02-T05 통합)

S02-T01의 openapi.yaml에 화면 구현에 필요하지만 아직 명세되지 않은 항목을 아래와 같이 요청한다. A1이 직접 수정하지 않고 이 목록을 검토해 통합한다(원칙: 공통 파일은 소유자만 수정).

| 요청 ID | 화면 | 필요한 것 | 사유 |
|---|---|---|---|
| CR-01 | 수업 상세 | `GET /courses/{id}` 단건 조회 | 목록 API만 있어 상세 화면 구현 불가 |
| CR-02 | 교육자 프로필 등록 | `POST /tutor/profile`(자기기재 필드: school, major, careerJson) | tutor_profiles 자기기재 저장 API 없음 |
| CR-03 | 신원 확인 신청 | `POST /verifications`, `GET /verifications?userId=` | 학습자/교육자가 확인 신청을 제출·조회할 API 없음 |
| CR-04 | 운영자 심사함 | `GET /admin/verifications?status=pending`, `POST /admin/verifications/{id}/decision` | 심사 목록·결정 API 없음 |
| CR-05 | 운영자 매칭함 | `GET /admin/learning-requests?status=`, `GET /admin/waitlist-entries?status=` | 목록 조회 API 없음(현재는 학습자 단건 생성만 정의됨) |
| CR-06 | 정산·활동 기록(교육자) | `GET /tutors/{id}/activity-summary`(비공개 상세), `GET /tutors/{id}/settlements` | tutor_activity_summaries/settlements 조회 API 없음 |
| CR-07 | 운영자 대기열 | `GET /admin/bookings?status=payment_pending_overdue|completion_no_response` | 상태별 필터 조회 API 없음 |
| CR-08 | 운영자 거래 대사 | `GET /admin/settlements`, `GET /admin/payout-attempts` | 목록 조회 API 없음 |
| CR-09 | 수업 카드 | `Course` 스키마에 `reviewSummary`(평점·후기 수·완료 횟수 요약) 필드 추가 | 신뢰 정보를 탐색 단계에서 함께 노출하기 위함(수업 상세와 별개로 목록 카드에도 최소 요약 필요) |
| CR-10 | 협의방 | 제안 만료 임박 알림을 위한 `expiresAt` 외 서버 푸시/폴링 규약 | 화면이 언제 재조회할지 기준 필요(초기 3~5초 폴링 여부 확정 필요 — 아키텍처 §3 언급 값과 연결) |

## 처리 우선순위 제안

- P0(첫 파일럿 필수): CR-01, CR-02, CR-03, CR-04, CR-07
- P1(운영 효율): CR-05, CR-06, CR-08
- P2(품질 개선): CR-09, CR-10

이 우선순위는 A1의 S02-T05 통합에서 최종 조정될 수 있다.
