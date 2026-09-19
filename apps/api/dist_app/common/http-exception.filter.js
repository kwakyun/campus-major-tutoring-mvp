"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("./errors");
/**
 * 모든 예외를 openapi.yaml Error 스키마({code, message, requestId})로 통일한다(S03-T03).
 * 서버 내부 오류의 스택트레이스나 비밀값을 응답 본문에 포함하지 않는다.
 */
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = request.requestId ?? "unknown";
        if (exception instanceof errors_1.DomainError) {
            response.status(exception.httpStatus).json({
                code: exception.code,
                message: exception.message,
                requestId,
            });
            return;
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            response.status(status).json({
                code: status === common_1.HttpStatus.UNAUTHORIZED ? "UNAUTHENTICATED" : "VALIDATION_ERROR",
                message: exception.message,
                requestId,
            });
            return;
        }
        // 알 수 없는 오류는 상세를 노출하지 않는다.
        // eslint-disable-next-line no-console
        console.error(`[requestId=${requestId}]`, exception);
        response.status(500).json({
            code: "VALIDATION_ERROR",
            message: "예기치 않은 오류가 발생했습니다.",
            requestId,
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
