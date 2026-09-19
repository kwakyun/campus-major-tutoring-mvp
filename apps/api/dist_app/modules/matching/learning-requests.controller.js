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
exports.LearningRequestsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const session_guard_1 = require("../auth/session.guard");
const errors_1 = require("../../common/errors");
const reference_data_repository_1 = require("../catalog/reference-data.repository");
const learning_requests_repository_1 = require("./learning-requests.repository");
const waitlist_entries_repository_1 = require("./waitlist-entries.repository");
/**
 * 학습 요청·대기 신청 API (openapi.yaml `/learning-requests`,
 * `/learning-requests/{id}/waitlist` — S04-T01, SRC-03).
 *
 * 대학 재학 여부(schoolAffiliation)는 어디에서도 검사하지 않는다 — learner 역할이면
 * affiliationType이 'prep'/'none'이어도 그대로 등록할 수 있다(SRC-01).
 */
let LearningRequestsController = class LearningRequestsController {
    constructor(learningRequests, waitlist, refData) {
        this.learningRequests = learningRequests;
        this.waitlist = waitlist;
        this.refData = refData;
    }
    create(user, body) {
        if (!user.roles.includes("learner")) {
            throw new errors_1.DomainError("FORBIDDEN", "learner 역할이 필요합니다.", 403);
        }
        if (!body?.goal || !body?.lifeZoneId) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "goal·lifeZoneId는 필수입니다.");
        }
        if (!this.refData.lifeZoneExists(body.lifeZoneId)) {
            throw new errors_1.DomainError("VALIDATION_ERROR", `존재하지 않는 lifeZoneId입니다: ${body.lifeZoneId}`);
        }
        // level은 자기신고이며 값이 없어도("수준 확인 필요") 부적격으로 처리하지 않는다
        // (data-model.md §7) — 별도 필수 검사를 두지 않는다.
        return this.learningRequests.create(user.userId, body);
    }
    listMine(user) {
        if (!user.roles.includes("learner")) {
            throw new errors_1.DomainError("FORBIDDEN", "learner 역할이 필요합니다.", 403);
        }
        return this.learningRequests.listByLearner(user.userId);
    }
    getOne(id, user) {
        return this.learningRequests.requireOwnedOrOperator(id, user);
    }
    withdrawRequest(id, user) {
        return this.learningRequests.withdraw(id, user.userId);
    }
    /**
     * 조건에 맞는 교육자가 없을 때 대기 신청 등록(SRC-03). 예약·좌석 점유·결제를
     * 생성하지 않는다 — waitlist_entries만 기록한다. 같은 학습 요청에 이미 활성
     * 대기 신청이 있으면 새로 만들지 않고 기존 레코드를 그대로 반환한다(중복 처리).
     */
    registerWaitlist(id, user, body) {
        const learningRequest = this.learningRequests.requireOwnedOrOperator(id, user);
        if (learningRequest.learnerId !== user.userId) {
            throw new errors_1.DomainError("FORBIDDEN", "본인 학습 요청에만 대기 신청을 등록할 수 있습니다.", 403);
        }
        const { record, isNew } = this.waitlist.create(id, user.userId, body ?? {});
        return { ...record, isNew };
    }
    withdrawWaitlist(waitlistId, user) {
        return this.waitlist.withdraw(waitlistId, user.userId);
    }
};
exports.LearningRequestsController = LearningRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LearningRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LearningRequestsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LearningRequestsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(":id/withdraw"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LearningRequestsController.prototype, "withdrawRequest", null);
__decorate([
    (0, common_1.Post)(":id/waitlist"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LearningRequestsController.prototype, "registerWaitlist", null);
__decorate([
    (0, common_1.Post)(":id/waitlist/:waitlistId/withdraw"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("waitlistId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LearningRequestsController.prototype, "withdrawWaitlist", null);
exports.LearningRequestsController = LearningRequestsController = __decorate([
    (0, common_1.Controller)("learning-requests"),
    __metadata("design:paramtypes", [learning_requests_repository_1.LearningRequestsRepository,
        waitlist_entries_repository_1.WaitlistEntriesRepository,
        reference_data_repository_1.ReferenceDataRepository])
], LearningRequestsController);
