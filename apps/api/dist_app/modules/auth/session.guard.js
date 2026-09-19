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
exports.SessionGuard = exports.SESSION_COOKIE_NAME = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../common/errors");
const session_verifier_1 = require("./session-verifier");
exports.SESSION_COOKIE_NAME = "session";
/**
 * 세션 검증 가드 (S03-T03).
 *
 * - 쿠키 인증 자체는 main.ts의 cookie-parser로 파싱된 값을 사용한다.
 * - 변경 요청(POST/PUT/PATCH/DELETE) 보호는 SameSite=Lax 이상 쿠키 설정 + Origin 검사로
 *   처리하며, 이 가드는 인증(누구인가)만 담당하고 인가(무엇을 할 수 있는가)는
 *   RolesGuard/리소스별 검사로 분리한다.
 * - 운영(APP_ENV=production)에서는 FakeSessionVerifier를 사용하지 않는다.
 */
let SessionGuard = class SessionGuard {
    constructor() {
        const appEnv = process.env.APP_ENV ?? "local";
        const bypassEnabled = process.env.AUTH_TEST_BYPASS === "true";
        if (appEnv === "production") {
            if (bypassEnabled) {
                // 방어적 이중 차단(main.ts에서도 부팅 자체를 막는다).
                throw new Error("AUTH_TEST_BYPASS=true는 production에서 허용되지 않습니다.");
            }
            // 실제 Supabase Auth 연동은 계약 미체결로 아직 구현되지 않았다.
            // 여기서는 명시적으로 미구현 상태를 드러내기 위해 항상 거절하는 검증기를 사용한다.
            this.verifier = {
                async verify() {
                    return null;
                },
            };
        }
        else {
            this.verifier = new session_verifier_1.FakeSessionVerifier();
        }
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const cookieValue = request.cookies?.[exports.SESSION_COOKIE_NAME];
        const user = await this.verifier.verify(cookieValue);
        if (!user) {
            throw new errors_1.DomainError("UNAUTHENTICATED", "로그인이 필요합니다.", 401);
        }
        request.user = user;
        return true;
    }
};
exports.SessionGuard = SessionGuard;
exports.SessionGuard = SessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SessionGuard);
