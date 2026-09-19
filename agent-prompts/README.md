# 전공한시간 단계별 AI 에이전트 명령 프롬프트

기존 아키텍처·개발 로드맵·역할 분담을 **10단계, 65개 명령**으로 나눈 YAML 프롬프트 패키지다. 개발 명령 55개와 단계별 총괄 검증 명령 10개로 구성된다. 현재 상태는 계획이며 실제 구현 작업을 실행한 결과가 아니다.

## 1. 사용할 파일

첨부 HWPX·PDF 반영판(`2026-09-19.sources-v2`)이다. [문서 반영 기준과 충돌 처리](./source-alignment.md)를 함께 읽는다. 기존 10단계·65개 명령 ID와 순서는 유지했다.

먼저 [00-workflow.yaml](./00-workflow.yaml)을 읽는다. 이 파일에는 A0~A7 역할, 공통 지침, 실행 순서, 결과 보고 양식이 있다.

| 순서 | 단계 파일 | 내용 | 명령 수 |
|---|---|---|---:|
| 01 | [01-requirements.yaml](./01-requirements.yaml) | 요구사항·정책·MVP 범위 | 4 |
| 02 | [02-detailed-design.yaml](./02-detailed-design.yaml) | 화면·DB·API·금액·이벤트 계약 | 7 |
| 03 | [03-project-foundation.yaml](./03-project-foundation.yaml) | 프로젝트·인증·공통 UI·CI | 6 |
| 04 | [04-users-courses-discovery.yaml](./04-users-courses-discovery.yaml) | 회원·수업·탐색·기본 추천 | 5 |
| 05 | [05-negotiation-booking.yaml](./05-negotiation-booking.yaml) | 채팅·제안·양측 동의·예약 | 6 |
| 06 | [06-mock-transactions-operations.yaml](./06-mock-transactions-operations.yaml) | 모의 거래·완료·취소·분쟁·운영 | 8 |
| 07 | [07-payments-release-readiness.yaml](./07-payments-release-readiness.yaml) | 결제 제공자 연동·복구·출시 준비 | 7 |
| 08 | [08-pilot-feedback.yaml](./08-pilot-feedback.yaml) | 파일럿 준비·실제 기록 분석 | 6 |
| 09 | [09-ai-semantic-search.yaml](./09-ai-semantic-search.yaml) | 의미 검색·AI 초안·평가 | 7 |
| 10 | [10-selected-expansion.yaml](./10-selected-expansion.yaml) | 선택한 개인화·그룹·복수 차시·성능·지역·지인 추천 보상 확장 | 9 |

각 명령에는 `id`, `order`, `agent`, `depends_on`, `condition`, `prompt`, `allowed_paths`, `expected_outputs`, `acceptance_criteria`, `handoff_file`이 있다. **실제로 에이전트에게 전달할 명령문은 `prompt`에 들어 있다.** 나머지 필드는 그 명령의 선행 조건·수정 범위·검증 기준이므로 함께 전달한다.

## 2. 처음 전달할 명령

프로젝트 파일에 접근할 수 있는 AI 에이전트에게 다음과 같이 전달한다.

```text
프로젝트 루트에서 agent-prompts/00-workflow.yaml과
agent-prompts/01-requirements.yaml을 읽어줘.

공통 지침과 역할 정의를 적용하고 S01-T01 명령만 수행해줘.
현재 명령의 allowed_paths와 acceptance_criteria를 따르고,
결과를 지정된 handoff_file에 기록해줘.
다음 명령은 자동으로 시작하지 말아줘.
```

완료 후 같은 방식으로 `S01-T02`, `S01-T03`, `S01-GATE`를 전달한다. 단계 검증이 통과하면 02번 파일로 넘어간다. 새로운 역할에게 넘길 때도 공통 파일·단계 파일·선행 보고서를 함께 읽게 한다.

## 3. 단계 전체를 총괄 에이전트에게 맡기는 명령

```text
너는 전공한시간의 A0 총괄 에이전트야.
agent-prompts/00-workflow.yaml과
agent-prompts/01-requirements.yaml을 읽어줘.

선행 조건을 확인하고 commands.order 순서대로 해당 역할에 작업을 배분해줘.
위임 기능이 없는 환경에서는 같은 역할 경계와 인수인계 규칙으로 순차 수행해줘.
실패나 외부 의존은 완료로 처리하지 말고 필요한 보완 작업을 정리해줘.
현재 단계의 GATE까지 처리하고 결과와 다음 실행 가능 명령을 보고해줘.
다음 단계는 자동으로 시작하지 말아줘.
```

다음 단계에서는 위 명령의 단계 파일명만 바꾼다. `00-workflow.yaml`의 `dispatcher_prompt`도 총괄용 프롬프트로 사용할 수 있다.

## 4. 실행 순서와 예외

- 기본 순서는 `01 → 02 → … → 10`이며, 단계 안에서는 `commands.order`를 따른다.
- `depends_on`은 명령 간 선행 관계, `requires_stage_gates`는 단계 간 선행 관계다.
- 각 단계 마지막 `Sxx-GATE`는 A0의 통합 검증이다. 단계마다 사용자 승인을 새로 요청하라는 뜻은 아니다.
- 공통 파일 수정이나 결함 수정이 필요하면 A0가 소유자에게 보완 작업을 배분하고 같은 기준으로 재검증한다.
- S09는 S06 완료 후 독립 실행할 수 있다. 실결제 계약이나 파일럿 데이터 때문에 S07·S08이 대기 중이라면 A0가 선행 조건을 확인해 S09를 선택할 수 있다.
- S10은 `personalization`, `group`, `multi_session`, `performance`, `campus_area_expansion`, `referral_rewards` 중 한 트랙을 선택한다. 해당하지 않는 조건부 명령만 `NOT_APPLICABLE`로 기록한다.
- 실제 데이터·환경이 없어 실행하지 못한 명령은 `BLOCKED`다. 이를 미선택 명령처럼 건너뛰거나 통과로 표시하지 않는다.

## 5. 결과 기록

모든 경로는 프로젝트 루트 기준이다. 현재 저장된 YAML의 `PLANNED`는 계획 상태이며 실제 결과를 나타내지 않는다.

```text
docs/handoffs/S01-T01.md    # 각 명령 담당자의 결과
docs/handoffs/S01-GATE.md   # 총괄의 명령 결과
docs/releases/S01-gate.md   # 단계 통합 판정
docs/tasks/index.md        # A0가 관리하는 전체 작업 상태
```

위 결과 파일들은 실제 명령을 실행할 때 생성한다. 검증한 버전·명령·통과/실패·미실행·남은 작업을 기록한다. 과거 결과 파일이 있다는 사실만으로 현재 통합 버전까지 검증됐다고 해석하지 않는다.

이 YAML은 **에이전트에게 전달할 프롬프트 명세**다. 터미널에서 YAML 파일 자체를 실행하는 명령이나 별도 자동 실행기는 포함하지 않는다. S07은 제공자 테스트와 출시 준비, S08은 준비된 실제 기록 분석을 다루며 파일을 읽는 것만으로 공개 배포·모집 연락·실제 수납·송금을 실행하지 않는다.

## 6. 패키지 검증

[검증 결과](./validation-report.json)에 YAML 문법·중복 키, 단계·역할·명령 ID, 선행 참조·순환 의존, 결과 보고 경로, 원본 문서 존재 여부의 검사 결과를 기록했다. 이 검증은 프롬프트 패키지 자체에 대한 것이며 개발 명령 65개를 실제 실행했다는 의미는 아니다.

## 7. 이번 첨부 자료로 달라진 명령

- S01~S02: 고객군·신뢰·학습 결과·제출 항목을 구분하고 원문 충돌·잠정 수치·지표 단위를 계약으로 정리한다.
- S03~S05: 미재학 학습자, 교육자 품질 근거, 대체 시간·대기 신청, 목표·결과물까지 포함한 합의를 구현한다.
- S06: 결과 기록·커리큘럼 재사용·재예약·교육 활동 보고서와 파일럿 지표를 모의 검증한다.
- S07~S08: 공급 우선 파일럿 준비, 채널별 전환·CAC·정산 만족도·공헌이익·30일 재예약을 실제 기록으로 확인한다.
- S09: 고객군별 의미 검색과 교사 검토 초안을 평가한다. 파일럿 진행의 필수 선행 단계는 아니다.
- S10: 인접 대학 생활권 확장과 완료 기준 지인 추천 보상을 별도 선택 트랙으로 추가한다. 한 번에 한 트랙만 진행한다.

`source_requirements`는 반영 기준 문서의 SRC-ID를 가리킨다. 원문 10시간 시연, 파일럿 일정, 건수 단위, 잠정 확장 목표는 자동 실행 조건이 아니다. 15%·0원은 현재 구현 기준을 유지하며 사업 가설로 별도 검증한다.

[검증 스크립트](./validate-prompts.cjs)는 YAML 문법·의존 관계·트랙·요구사항 연결을 확인한다. Node.js에서 `yaml` 패키지 경로를 첫 인자로 전달할 수 있다. 개발 단계나 외부 작업은 실행하지 않는다.
