import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { SessionUser } from "./session-user";

/**
 * SessionGuard가 request.user에 심어둔 SessionUser를 컨트롤러에서 꺼낸다.
 * SessionGuard 없이 사용하면 undefined가 된다 — 항상 가드와 함께 쓴다.
 */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): SessionUser | undefined => {
  const request = ctx.switchToHttp().getRequest<Request & { user?: SessionUser }>();
  return request.user;
});
