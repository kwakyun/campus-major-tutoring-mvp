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
exports.TutorPublicAvailabilityController = exports.TutorAvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const session_guard_1 = require("../auth/session.guard");
const errors_1 = require("../../common/errors");
const tutor_availability_repository_1 = require("./tutor-availability.repository");
/**
 * 교육자 가능 시간 API (docs/ux/screens.md "가능 시간 관리" — S04-T01).
 * "확정 예약 겹침 시 수정 차단"은 예약(bookings) 모듈이 아직 없어(S05 이후) 이번
 * 단계에서는 검증할 대상 자체가 없다 — remaining_work로 남긴다.
 */
let TutorAvailabilityController = class TutorAvailabilityController {
    constructor(repo) {
        this.repo = repo;
    }
    setMine(user, body) {
        if (!user.roles.includes("tutor")) {
            throw new errors_1.DomainError("FORBIDDEN", "tutor 역할이 필요합니다.", 403);
        }
        if (!Array.isArray(body?.windows)) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "windows 배열이 필요합니다.");
        }
        return { windows: this.repo.setWindows(user.userId, body.windows) };
    }
    getMine(user) {
        return { windows: this.repo.getWindows(user.userId) };
    }
};
exports.TutorAvailabilityController = TutorAvailabilityController;
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TutorAvailabilityController.prototype, "setMine", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TutorAvailabilityController.prototype, "getMine", null);
exports.TutorAvailabilityController = TutorAvailabilityController = __decorate([
    (0, common_1.Controller)("tutor/availability"),
    __metadata("design:paramtypes", [tutor_availability_repository_1.TutorAvailabilityRepository])
], TutorAvailabilityController);
/** 다른 교육자의 가능 시간은 일정 조율 목적으로만 공개한다(실명·연락처 없음). */
let TutorPublicAvailabilityController = class TutorPublicAvailabilityController {
    constructor(repo) {
        this.repo = repo;
    }
    getPublic(id) {
        return { tutorId: id, windows: this.repo.getWindows(id) };
    }
};
exports.TutorPublicAvailabilityController = TutorPublicAvailabilityController;
__decorate([
    (0, common_1.Get)(":id/availability"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TutorPublicAvailabilityController.prototype, "getPublic", null);
exports.TutorPublicAvailabilityController = TutorPublicAvailabilityController = __decorate([
    (0, common_1.Controller)("tutors"),
    __metadata("design:paramtypes", [tutor_availability_repository_1.TutorAvailabilityRepository])
], TutorPublicAvailabilityController);
