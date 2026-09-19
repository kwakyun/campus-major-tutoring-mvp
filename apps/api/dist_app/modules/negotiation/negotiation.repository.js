"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NegotiationRepository = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../common/errors");
let NegotiationRepository = class NegotiationRepository {
    constructor() {
        this.conversations = new Map();
        this.proposals = new Map();
        this.messagesByConversation = new Map();
    }
    createConversation(courseId, tutorId, learnerId, learningRequestId) {
        // [F-02] 자기 거래(Self-dealing) 원천 차단
        if (tutorId === learnerId) {
            throw new errors_1.DomainError("SELF_DEALING_NOT_ALLOWED", "자기 자신의 개설 수업과는 협의하거나 거래할 수 없습니다.");
        }
        // 기존 대화방 확인 (동일 courseId + learnerId 조합)
        for (const conv of this.conversations.values()) {
            if (conv.courseId === courseId && conv.learnerId === learnerId && conv.status !== "closed") {
                return conv;
            }
        }
        const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const conv = {
            id,
            courseId,
            learningRequestId,
            tutorId,
            learnerId,
            currentVersion: 0,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.conversations.set(id, conv);
        this.messagesByConversation.set(id, []);
        // 시스템 환영 메시지 생성
        this.addMessage(id, "system", "system", "협의방이 생성되었습니다. 수업 일정, 장소, 학습 범위 등을 협의하고 최종 제안서에 합의해주세요.");
        return conv;
    }
    getConversation(id) {
        return this.conversations.get(id);
    }
    listConversationsByUser(userId) {
        return Array.from(this.conversations.values()).filter((c) => c.learnerId === userId || c.tutorId === userId);
    }
    addMessage(conversationId, senderId, senderRole, text, proposalId) {
        if (typeof text !== "string" || !text.trim() || text.length > 5000) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "메시지는 1~5000자로 입력해주세요.");
        }
        const list = this.messagesByConversation.get(conversationId) ?? [];
        const msg = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            conversationId,
            senderId,
            senderRole,
            text,
            proposalId,
            createdAt: new Date().toISOString(),
        };
        list.push(msg);
        this.messagesByConversation.set(conversationId, list);
        const conv = this.conversations.get(conversationId);
        if (conv) {
            conv.updatedAt = new Date().toISOString();
        }
        return msg;
    }
    getMessages(conversationId) {
        return this.messagesByConversation.get(conversationId) ?? [];
    }
    createProposal(conversationId, proposedBy, isTutor, input) {
        const conv = this.conversations.get(conversationId);
        if (!conv) {
            throw new errors_1.DomainError("NOT_FOUND", "해당 협의방을 찾을 수 없습니다.");
        }
        if ((isTutor ? conv.tutorId : conv.learnerId) !== proposedBy) {
            throw new errors_1.DomainError("FORBIDDEN", "협의 당사자만 제안할 수 있습니다.", 403);
        }
        if (conv.status !== "active") {
            throw new errors_1.DomainError("CONDITION_NOT_MET", "종료되거나 이미 예약된 협의방에서는 제안서를 발행할 수 없습니다.");
        }
        const start = typeof input.scheduledStart === "string" ? Date.parse(input.scheduledStart) : NaN;
        const end = typeof input.scheduledEnd === "string" ? Date.parse(input.scheduledEnd) : NaN;
        const minutes = (end - start) / 60000;
        if (!Number.isFinite(start) || !Number.isFinite(end) || minutes <= 0 || !Number.isInteger(minutes)) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "수업 시작·종료 시간을 올바른 분 단위로 입력해주세요.");
        }
        if (input.totalMinutes !== undefined && input.totalMinutes !== minutes) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "수업 시간이 시작·종료 시간과 일치하지 않습니다.");
        }
        if (!Number.isSafeInteger(input.agreedPriceAmount) || input.agreedPriceAmount < 0) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "금액은 0 이상의 정수여야 합니다.");
        }
        if (typeof input.location !== "string" || !input.location.trim()) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "수업 장소를 입력해주세요.");
        }
        // Validate before changing the current version or previous proposal.
        // 이전 제안서들은 superseded 처리
        for (const p of this.proposals.values()) {
            if (p.conversationId === conversationId && p.status === "proposed") {
                p.status = "superseded";
            }
        }
        const version = conv.currentVersion + 1;
        conv.currentVersion = version;
        const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const proposal = {
            id: proposalId,
            conversationId,
            version,
            proposedBy,
            scheduledStart: input.scheduledStart,
            scheduledEnd: input.scheduledEnd,
            totalMinutes: minutes,
            location: input.location,
            agreedPriceAmount: input.agreedPriceAmount,
            learningGoal: input.learningGoal ?? "협의된 학습 목표",
            unitBreakdown: input.unitBreakdown ?? [],
            agreedByLearner: !isTutor, // 제안자가 학습자면 학습자 동의는 true
            agreedByTutor: isTutor, // 제안자가 튜터면 튜터 동의는 true
            status: "proposed",
            createdAt: new Date().toISOString(),
        };
        this.proposals.set(proposalId, proposal);
        conv.currentProposalId = proposalId;
        // 제안 생성 시스템 메시지 추가
        this.addMessage(conversationId, proposedBy, isTutor ? "tutor" : "learner", `제안서(버전 ${version})가 발행되었습니다: ₩${input.agreedPriceAmount.toLocaleString()}원 / ${input.location}`, proposalId);
        return proposal;
    }
    getProposal(proposalId) {
        return this.proposals.get(proposalId);
    }
    agreeProposal(proposalId, userId, isTutor) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new errors_1.DomainError("NOT_FOUND", "해당 제안서를 찾을 수 없습니다.");
        }
        const conv = this.conversations.get(proposal.conversationId);
        if (!conv) {
            throw new errors_1.DomainError("NOT_FOUND", "협의방을 찾을 수 없습니다.");
        }
        if ((isTutor ? conv.tutorId : conv.learnerId) !== userId) {
            throw new errors_1.DomainError("FORBIDDEN", "협의 당사자만 동의할 수 있습니다.", 403);
        }
        // 최신 제안서인지 검증 (구버전 수락 차단: STALE_PROPOSAL)
        if (conv.currentProposalId !== proposalId || proposal.status === "superseded") {
            throw new errors_1.DomainError("STALE_PROPOSAL", "이전 버전의 제안서에는 동의할 수 없습니다. 최신 제안서를 확인하세요.");
        }
        if (isTutor) {
            proposal.agreedByTutor = true;
        }
        else {
            proposal.agreedByLearner = true;
        }
        // 양측 모두 동의 시 합의 완료(agreed) 상태로 전이
        if (proposal.agreedByLearner && proposal.agreedByTutor) {
            proposal.status = "agreed";
            this.addMessage(conv.id, "system", "system", `🎉 양측이 제안서(버전 ${proposal.version})에 모두 동의하여 최종 합의되었습니다! 이제 예약을 확정할 수 있습니다.`, proposal.id);
        }
        else {
            this.addMessage(conv.id, userId, isTutor ? "tutor" : "learner", `제안서(버전 ${proposal.version})에 동의했습니다. 상대방의 동의를 기다립니다.`, proposal.id);
        }
        return proposal;
    }
};
exports.NegotiationRepository = NegotiationRepository;
exports.NegotiationRepository = NegotiationRepository = __decorate([
    (0, common_1.Injectable)()
], NegotiationRepository);
