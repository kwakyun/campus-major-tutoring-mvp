"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CurriculumDraftService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurriculumDraftService = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../common/errors");
/**
 * 튜터가 입력한 "가르치고 싶은 분야"로부터 커리큘럼 초안을 생성한다
 * (에드혹 추가, 사용자 요청 — docs/handoffs/ADHOC-01-ai-curriculum-draft.md 참고).
 *
 * 설계 근거: docs/ai/contracts-proposal.md §5가 이미 `POST /internal/v1/drafts`
 * ("작업ID, 목표·수준·시간·교육자 제공 사실 → 접수결과/검증된 초안")를 커리큘럼
 * 초안 생성 내부 계약으로 예약해 두었다. 다만 그 내부 AI 서비스는 S09 착수 시
 * 별도 계약으로 관리하기로 이미 결정되어 있고(docs/api/internal-contracts.md §7),
 * 아직 존재하지 않는다 — 실제 LLM/임베딩 제공자 계약도 미체결 상태다(.env.example에
 * SUPABASE_*·PAYMENTS_PROVIDER_API_KEY처럼 "미확보"로 표시된 값만 있고, 허구의
 * API 키를 만들어내지 않는다는 00-workflow.yaml 공통 지침을 그대로 따른다).
 *
 * 그래서 이 서비스는 규칙 기반(템플릿) 생성기로 **임시 대체**한다. "AI 커리큘럼
 * 자동생성"이라는 사용자 대상 기능은 제공하되, 내부 구현은 결정론적 로직이라는
 * 점을 코드·계약 문서 양쪽에 명시한다(진행 상황을 완료로 위장하지 않는다는
 * 프로젝트 원칙, 예: S03-gate.md "정직하게 남긴 미완료 항목"과 동일 원칙).
 * 실제 LLM 연동 시 이 클래스의 generateDraft() 내부 구현만 교체하면 되도록
 * 컨트롤러·계약(요청/응답 스키마)은 이미 최종 형태로 설계했다.
 *
 * 대체 경로: contracts-proposal.md §5 "커리큘럼 초안 생성 실패 → 입력한 초안 유지,
 * 직접 작성 경로로 전환" 원칙과 동일하게, 이 엔드포인트는 저장을 하지 않는
 * 순수 조회성 초안 생성이다 — 튜터는 초안을 그대로 쓰거나 자유롭게 수정한 뒤
 * 기존 POST /tutor/courses로 제출해야 실제 커리큘럼이 된다(자동 게시 없음).
 */
let CurriculumDraftService = CurriculumDraftService_1 = class CurriculumDraftService {
    constructor() {
        this.logger = new common_1.Logger(CurriculumDraftService_1.name);
    }
    generateDraft(input) {
        const topic = input.topic?.trim();
        if (!topic) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "topic(가르치고 싶은 분야)을 입력해주세요.");
        }
        const sessionCount = this.normalizeSessionCount(input.sessionCount);
        const levelLabel = this.levelLabel(input.level);
        const unitBreakdown = this.buildUnitBreakdown(topic, sessionCount);
        const learningGoal = `${topic} ${levelLabel} 완성 — 핵심 개념부터 실전 적용까지 ${sessionCount}단계 학습`;
        const expectedOutcome = `${topic}의 핵심 개념을 스스로 설명하고, 관련 문제·과제를 독립적으로 해결할 수 있는 상태`;
        const totalMinutes = sessionCount * 20; // 단원당 대략 20분 기준 초안 — 실제 1회 진행 시간은 튜터가 조정
        this.logger.debug(`[CurriculumDraft] topic="${topic}" level=${levelLabel} sessionCount=${sessionCount} generator=${CurriculumDraftService_1.GENERATOR_VERSION}`);
        return {
            learningGoal,
            unitBreakdown,
            expectedOutcome,
            totalMinutes,
            curriculumSource: "ai_generated",
            generatorVersion: CurriculumDraftService_1.GENERATOR_VERSION,
            topic,
        };
    }
    normalizeSessionCount(count) {
        if (!count || Number.isNaN(count))
            return 4;
        return Math.min(Math.max(Math.trunc(count), 2), CurriculumDraftService_1.SESSION_TEMPLATE.length);
    }
    levelLabel(level) {
        switch (level) {
            case "introductory":
            case "beginner":
            case "입문":
            case "기초":
                return "입문";
            case "intermediate":
            case "중급":
                return "중급";
            case "advanced":
            case "심화":
                return "심화";
            case "exam_prep":
            case "편입":
                return "편입/시험대비";
            default:
                return "기초";
        }
    }
    buildUnitBreakdown(topic, sessionCount) {
        return CurriculumDraftService_1.SESSION_TEMPLATE.slice(0, sessionCount).map((item, idx) => ({
            title: `${idx + 1}단원: ${topic} ${item.title}`,
            description: item.description,
        }));
    }
};
exports.CurriculumDraftService = CurriculumDraftService;
/** 실제 LLM 연동 전 임시 규칙 기반 생성기 버전 태그 — 응답에 그대로 노출해 투명성을 지킨다. */
CurriculumDraftService.GENERATOR_VERSION = "rule-based-template-v1";
CurriculumDraftService.SESSION_TEMPLATE = [
    {
        title: "핵심 개념 정리",
        description: "꼭 알아야 할 기본 개념과 용어를 정리하고 질의응답으로 이해도를 확인한다.",
    },
    {
        title: "기초 실습·문제풀이",
        description: "정리한 개념을 활용한 기본 예제·문제를 함께 풀며 적용 방법을 익힌다.",
    },
    {
        title: "응용 사례 및 오개념 점검",
        description: "자주 틀리는 부분과 헷갈리는 개념을 짚고, 조금 더 응용된 상황에 적용해본다.",
    },
    {
        title: "심화 실전 문제",
        description: "실제 과제·시험 수준과 유사한 문제를 풀어보며 실전 감각을 키운다.",
    },
    {
        title: "종합 점검",
        description: "배운 내용을 스스로 요약·설명해보고, 남은 취약 부분을 확인한다.",
    },
    {
        title: "추가 심화 주제",
        description: "기본 범위를 넘어선 심화 주제나 관련 응용 사례를 다룬다.",
    },
    {
        title: "프로젝트·과제 적용",
        description: "실제 과제나 프로젝트에 배운 개념을 적용해보고 피드백을 받는다.",
    },
    {
        title: "총정리 및 다음 학습 방향",
        description: "전체 내용을 정리하고, 이후 스스로 학습을 이어갈 방향을 제시한다.",
    },
];
exports.CurriculumDraftService = CurriculumDraftService = CurriculumDraftService_1 = __decorate([
    (0, common_1.Injectable)()
], CurriculumDraftService);
