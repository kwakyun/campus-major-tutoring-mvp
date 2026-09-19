import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { DomainError } from "../../common/errors";
import { SessionUser } from "./session-user";

export type OperatorPermission = NonNullable<SessionUser["operatorPermissions"]>[number];

export const RequireOperatorPermission = (permission: OperatorPermission) =>
  SetMetadata("operatorPermission", permission);

/**
 * 운영자 세부 권한 검사(authorization.md §3). SessionGuard 이후에 적용해야 한다.
 * ops.dispute_resolution과 ops.finance를 분리해 분쟁 결정자가 곧바로 정산을 집행하지
 * 못하게 하는 권장안을 강제한다.
 */
@Injectable()
export class OperatorPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<OperatorPermission | undefined>(
      "operatorPermission",
      context.getHandler(),
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: SessionUser }>();
    const user = request.user;

    if (!user || !user.roles.includes("operator") || !user.operatorPermissions?.includes(required)) {
      throw new DomainError("FORBIDDEN", `이 작업에는 ${required} 권한이 필요합니다.`, 403);
    }
    return true;
  }
}
