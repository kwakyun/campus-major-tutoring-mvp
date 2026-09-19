"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
/**
 * SessionGuard가 request.user에 심어둔 SessionUser를 컨트롤러에서 꺼낸다.
 * SessionGuard 없이 사용하면 undefined가 된다 — 항상 가드와 함께 쓴다.
 */
exports.CurrentUser = (0, common_1.createParamDecorator)((_, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
