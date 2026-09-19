"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NegotiationController = void 0;
const common_1 = require("@nestjs/common");
const session_guard_1 = require("../auth/session.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const negotiation_repository_1 = require("./negotiation.repository");
const courses_repository_1 = require("../catalog/courses.repository");
let NegotiationController = class NegotiationController {
    constructor(negotiationRepo, coursesRepo) {
        this.negotiationRepo = negotiationRepo;
        this.coursesRepo = coursesRepo;
    }
    createConversation(user, body) {
        if (!user.roles.includes("learner")) {
            throw new common_1.ForbiddenException("학습자 계정으로 협의를 시작해주세요.");
        }
        const course = this.coursesRepo.findById(body.courseId);
        if (!course || course.status !== "published") {
            throw new common_1.NotFoundException("해당 수업을 찾을 수 없습니다.");
        }
        return this.negotiationRepo.createConversation(course.id, course.tutorId, user.userId, body.learningRequestId);
    }
    listMyConversations(user) {
        return this.negotiationRepo.listConversationsByUser(user.userId);
    }
    getConversation(user, id) {
        const conv = this.negotiationRepo.getConversation(id);
        if (!conv) {
            throw new common_1.NotFoundException("협의방을 찾을 수 없습니다.");
        }
        if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
            throw new common_1.ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
        }
        const currentProposal = conv.currentProposalId
            ? this.negotiationRepo.getProposal(conv.currentProposalId)
            : null;
        return {
            conversation: conv,
            currentProposal,
        };
    }
    getMessages(user, id) {
        const conv = this.negotiationRepo.getConversation(id);
        if (!conv) {
            throw new common_1.NotFoundException("협의방을 찾을 수 없습니다.");
        }
        if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
            throw new common_1.ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
        }
        return this.negotiationRepo.getMessages(id);
    }
    sendMessage(user, id, body) {
        const conv = this.negotiationRepo.getConversation(id);
        if (!conv) {
            throw new common_1.NotFoundException("협의방을 찾을 수 없습니다.");
        }
        if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
            throw new common_1.ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
        }
        const role = conv.tutorId === user.userId ? "tutor" : "learner";
        return this.negotiationRepo.addMessage(id, user.userId, role, body.text);
    }
    createProposal(user, id, body) {
        const conv = this.negotiationRepo.getConversation(id);
        if (!conv) {
            throw new common_1.NotFoundException("협의방을 찾을 수 없습니다.");
        }
        if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
            throw new common_1.ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
        }
        const isTutor = conv.tutorId === user.userId;
        return this.negotiationRepo.createProposal(id, user.userId, isTutor, body);
    }
    agreeProposal(user, id, proposalId) {
        const conv = this.negotiationRepo.getConversation(id);
        if (!conv) {
            throw new common_1.NotFoundException("협의방을 찾을 수 없습니다.");
        }
        if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
            throw new common_1.ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
        }
        const isTutor = conv.tutorId === user.userId;
        const proposal = this.negotiationRepo.getProposal(proposalId);
        if (!proposal || proposal.conversationId !== id) {
            throw new common_1.NotFoundException("해당 협의방의 제안서를 찾을 수 없습니다.");
        }
        return this.negotiationRepo.agreeProposal(proposalId, user.userId, isTutor);
    }
};
exports.NegotiationController = NegotiationController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "listMyConversations", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Get)(":id/messages"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(":id/messages"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)(":id/proposals"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "createProposal", null);
__decorate([
    (0, common_1.Post)(":id/proposals/:proposalId/agree"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("proposalId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], NegotiationController.prototype, "agreeProposal", null);
exports.NegotiationController = NegotiationController = __decorate([
    (0, common_1.Controller)("conversations"),
    __metadata("design:paramtypes", [negotiation_repository_1.NegotiationRepository,
        courses_repository_1.CoursesRepository])
], NegotiationController);
