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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const session_guard_1 = require("../auth/session.guard");
let HealthController = class HealthController {
    /** 공개 상태 확인 — 인증 불필요 */
    health() {
        return {
            status: "ok",
            appEnv: process.env.APP_ENV ?? "local",
            paymentMode: process.env.PAYMENT_MODE ?? "fake",
        };
    }
    /**
     * 인증된 세션 확인용 — 가드가 정상 동작하는지 확인하는 최소 엔드포인트(S03-T05 검증 대상).
     * 서버 비밀키·evidenceKey 등은 절대 여기서 반환하지 않는다.
     */
    whoami(user) {
        return {
            userId: user.userId,
            roles: user.roles,
            identityVerificationStatus: user.identityVerificationStatus,
            schoolAffiliation: user.schoolAffiliation,
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "health", null);
__decorate([
    (0, common_1.Get)("whoami"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "whoami", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)("health")
], HealthController);
