import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * 모든 요청에 requestId를 부여한다. 오류 응답 스키마(openapi.yaml Error.requestId)와
 * 감사 로그 추적에 사용한다(S03-T03).
 */
export class RequestIdMiddleware {
  use = (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header("x-request-id");
    const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  };
}
