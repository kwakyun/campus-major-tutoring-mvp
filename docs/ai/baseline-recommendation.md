# 전공한시간 기본 추천 엔진 (S04-T02, A5)

작성: A5 (AI·추천·데이터)  
버전: 0.1.0-s04  
기준 문서: `agent-prompts/04-users-courses-discovery.yaml`, `전공한시간_AI_추천_아키텍처.md`

---

## 1. 개요 및 설계 원칙

본 모듈은 전공한시간 MVP의 **콜드스타트 대응 규칙 기반 추천 엔진**입니다. 외부 AI 모델이나 Python 서비스에 의존하지 않고, 순수 TypeScript/NestJS로 작성된 모듈형 서비스입니다.

### 핵심 원칙
1. **명시적 생활권 중심 평가 (SRC-08)**: 학습자의 학교 소속(재학 여부)을 배제 필터로 쓰지 않으며, 학습자가 선택한 희망 생활권(`lifeZoneId`)을 기준으로 유효 후보를 선별합니다.
2. **신규 교육자 콜드스타트 우대 (SRC-10)**: 리뷰나 수강 이력이 없는 신규 교육자(수업)를 0점 처리하여 목록에서 배제하지 않고, 기본 베이스 점수(0.5) 및 `REASON_NEW_TUTOR` 배지를 부여하여 공정한 노출 기회를 보장합니다.
3. **조건 미완화 및 대체 경로 안내 (SRC-03)**: 일치하는 수업이 없거나 시간대가 겹치지 않을 때 필수 조건을 몰래 완화하여 엉뚱한 수업을 추천하지 않습니다. 대신 일치 수업 0건을 투명하게 안내하고, 해당 생활권/과목 튜터들의 **대체 가용 시간대 제안(`alternativeTimeSlots`)**과 **대기 신청 링크(`waitlistPath`)**를 제공합니다.
4. **추천 반환과 화면 노출 이벤트의 엄격한 분리**: `recommendation_served`(서버 응답 시점)와 `recommendation_impression`(사용자 뷰포트 30% 이상 실제 진입 시점)을 분리 수집합니다.

---

## 2. 스코어링 공식 및 사유 코드 (Reason Codes)

$$Score = \min(1.0, Base(0.5) + S_{zone}(0.2) + S_{goal}(0.2) + S_{level}(0.15) + S_{time}(0.25))$$

| 항목 | 가산점 | 사유 코드 | 조건 |
|---|---|---|---|
| 베이스라인 | 0.50 | `REASON_NEW_TUTOR` | 모든 공개 후보 기본 적용 (신규 튜터 배제 방지) |
| 희망 생활권 일치 | +0.20 | `REASON_LIFE_ZONE_NEAR` | `course.lifeZoneId === query.lifeZoneId` |
| 학습 목표 키워드 부합 | +0.20 | `REASON_GOAL_KEYWORD` | `course.learningGoal`에 학습자 키워드 포함 |
| 입문/기초 맞춤 난이도 | +0.15 | `REASON_LEVEL_ENTRY` | 학습자가 입문 희망 & 강좌가 입문/기초 난이도 |
| 희망 시간대 일치 | +0.25 | `REASON_TIME_MATCH` | 교육자의 가용 시간 슬롯과 희망 시간이 겹침 |

---

## 3. 엔드포인트 사양

### `GET /recommendations` & `POST /recommendations/query`
- **입력 파라미터**:
  - `lifeZoneId` (필수, UUID)
  - `subjectId` (선택, UUID)
  - `goal` (선택, string)
  - `level` (선택, string)
  - `desiredWindows` (선택, TimeWindow[])
- **응답 DTO (`RecommendationResponse`)**:
  - `candidates`: 점수 내림차순 정렬된 추천 목록 (수업 정보, score, reasonCodes, timeMatches)
  - `totalEligible`: 유효 후보 수
  - `alternativeTimeSlots`: 후보 부재 시 제안되는 교육자 대체 가능 시간대
  - `waitlistPath`: 대기 신청 딥링크
  - `failureReason`: 매칭 실패 시 안내 문구

### `POST /recommendations/events`
- 추천 관련 행동 로그 수집 (HTTP 202 Accepted 반환)
