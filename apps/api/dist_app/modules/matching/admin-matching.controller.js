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
exports.AdminMatchingController = void 0;
const common_1 = require("@nestjs/common");
const session_guard_1 = require("../auth/session.guard");
const operator_permission_guard_1 = require("../auth/operator-permission.guard");
const learning_requests_repository_1 = require("./learning-requests.repository");
const waitlist_entries_repository_1 = require("./waitlist-entries.repository");
/**
 * 운영자 매칭 보조 API (openapi.yaml `/admin/learning-requests`,
 * `/admin/waitlist-entries` — ops.matching, S04-T01).
 *
 * 후보가 없을 때 운영자가 허위로 매칭 결과를 만들어내지 않는다(docs/ux/flows.md §3
 * "허위 매칭 금지") — assist()는 상태 전이와 사유·메모만 기록하고, 실제 협의방
 * 생성(conversations)은 S05(협의·예약 모듈) 범위다.
 */
let AdminMatchingController = class AdminMatchingController {
    constructor(learningRequests, waitlist) {
        this.learningRequests = learningRequests;
        this.waitlist = waitlist;
    }
    listLearningRequests(status) {
        return this.learningRequests.listForAdmin(status);
    }
    listWaitlistEntries(status) {
        return this.waitlist.listForAdmin(status);
    }
    assist(id, body) {
        return this.learningRequests.assist(id, body.status, body.reason ?? null, body.note ?? null);
    }
};
exports.AdminMatchingController = AdminMatchingController;
__decorate([
    (0, common_1.Get)("learning-requests"),
    (0, operator_permission_guard_1.RequireOperatorPermission)("ops.matching"),
    __param(0, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminMatchingController.prototype, "listLearningRequests", null);
__decorate([
    (0, common_1.Get)("waitlist-entries"),
    (0, operator_permission_guard_1.RequireOperatorPermission)("ops.matching"),
    __param(0, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminMatchingController.prototype, "listWaitlistEntries", null);
__decorate([
    (0, common_1.Post)("learning-requests/:id/assist"),
    (0, operator_permission_guard_1.RequireOperatorPermission)("ops.matching"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminMatchingController.prototype, "assist", null);
exports.AdminMatchingController = AdminMatchingController = __decorate([
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard, operator_permission_guard_1.OperatorPermissionGuard),
    __metadata("design:paramtypes", [learning_requests_repository_1.LearningRequestsRepository,
        waitlist_entries_repository_1.WaitlistEntriesRepository])
], AdminMatchingController);
