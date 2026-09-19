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
exports.VerificationsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const session_guard_1 = require("../auth/session.guard");
const errors_1 = require("../../common/errors");
const verifications_repository_1 = require("./verifications.repository");
/**
 * S03-T03 기반 골격: openapi.yaml `/verifications`의 최소 구현.
 * 대학 미재학(affiliationType='prep'|'none')이어도 이 엔드포인트 사용에 제약이 없다(SRC-01).
 * evidenceKey는 본인 조회 응답에만 포함하고 목록 응답에서는 원본 파일 접근 링크를 만들지 않는다.
 */
let VerificationsController = class VerificationsController {
    constructor(repo) {
        this.repo = repo;
    }
    create(user, body) {
        if (!body?.type || !body?.evidenceKey) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "type과 evidenceKey는 필수입니다.");
        }
        return this.repo.create(user.userId, body.type, body.evidenceKey);
    }
    listMine(user) {
        return this.repo.listByUser(user.userId);
    }
    /**
     * 본인 확인 신청 상세 — 다른 사용자의 신청 ID로 조회하면 403.
     * authorization.md §2 "verifications(비공개 증빙): 본인, 심사 담당 운영자"를 그대로 구현한다.
     */
    getOne(id, user) {
        const record = this.repo.findById(id);
        if (!record)
            throw new common_1.NotFoundException();
        const isOwner = record.userId === user.userId;
        const isReviewer = user.roles.includes("operator") && user.operatorPermissions?.includes("ops.verification_review");
        if (!isOwner && !isReviewer) {
            throw new errors_1.DomainError("FORBIDDEN", "본인 또는 심사 담당 운영자만 조회할 수 있습니다.", 403);
        }
        return record;
    }
};
exports.VerificationsController = VerificationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "listMine", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VerificationsController.prototype, "getOne", null);
exports.VerificationsController = VerificationsController = __decorate([
    (0, common_1.Controller)("verifications"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __metadata("design:paramtypes", [verifications_repository_1.VerificationsRepository])
], VerificationsController);
