import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { DomainError } from "./errors";

/**
 * 모든 예외를 openapi.yaml Error 스키마({code, message, requestId})로 통일한다(S03-T03).
 * 서버 내부 오류의 스택트레이스나 비밀값을 응답 본문에 포함하지 않는다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? "unknown";

    if (exception instanceof DomainError) {
      response.status(exception.httpStatus).json({
        code: exception.code,
        message: exception.message,
        requestId,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({
        code: status === HttpStatus.UNAUTHORIZED ? "UNAUTHENTICATED" : "VALIDATION_ERROR",
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
}
