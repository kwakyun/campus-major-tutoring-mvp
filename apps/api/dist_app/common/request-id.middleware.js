"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdMiddleware = void 0;
const node_crypto_1 = require("node:crypto");
/**
 * 모든 요청에 requestId를 부여한다. 오류 응답 스키마(openapi.yaml Error.requestId)와
 * 감사 로그 추적에 사용한다(S03-T03).
 */
class RequestIdMiddleware {
    constructor() {
        this.use = (req, res, next) => {
            const incoming = req.header("x-request-id");
            const requestId = incoming && incoming.length > 0 ? incoming : (0, node_crypto_1.randomUUID)();
            req.requestId = requestId;
            res.setHeader("x-request-id", requestId);
            next();
        };
    }
}
exports.RequestIdMiddleware = RequestIdMiddleware;
