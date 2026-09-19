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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorPermissionGuard = exports.RequireOperatorPermission = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const errors_1 = require("../../common/errors");
const RequireOperatorPermission = (permission) => (0, common_1.SetMetadata)("operatorPermission", permission);
exports.RequireOperatorPermission = RequireOperatorPermission;
/**
 * 운영자 세부 권한 검사(authorization.md §3). SessionGuard 이후에 적용해야 한다.
 * ops.dispute_resolution과 ops.finance를 분리해 분쟁 결정자가 곧바로 정산을 집행하지
 * 못하게 하는 권장안을 강제한다.
 */
let OperatorPermissionGuard = class OperatorPermissionGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const required = this.reflector.get("operatorPermission", context.getHandler());
        if (!required)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.roles.includes("operator") || !user.operatorPermissions?.includes(required)) {
            throw new errors_1.DomainError("FORBIDDEN", `이 작업에는 ${required} 권한이 필요합니다.`, 403);
        }
        return true;
    }
};
exports.OperatorPermissionGuard = OperatorPermissionGuard;
exports.OperatorPermissionGuard = OperatorPermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], OperatorPermissionGuard);
