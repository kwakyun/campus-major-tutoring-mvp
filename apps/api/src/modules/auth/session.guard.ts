import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { DomainError } from "../../common/errors";
import { FakeSessionVerifier, SessionVerifier } from "./session-verifier";

export const SESSION_COOKIE_NAME = "session";

/**
 * 세션 검증 가드 (S03-T03).
 *
 * - 쿠키 인증 자체는 main.ts의 cookie-parser로 파싱된 값을 사용한다.
 * - 변경 요청(POST/PUT/PATCH/DELETE) 보호는 SameSite=Lax 이상 쿠키 설정 + Origin 검사로
 *   처리하며, 이 가드는 인증(누구인가)만 담당하고 인가(무엇을 할 수 있는가)는
 *   RolesGuard/리소스별 검사로 분리한다.
 * - 운영(APP_ENV=production)에서는 FakeSessionVerifier를 사용하지 않는다.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  private readonly verifier: SessionVerifier;

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
    } else {
      this.verifier = new FakeSessionVerifier();
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieValue = request.cookies?.[SESSION_COOKIE_NAME];
    const user = await this.verifier.verify(cookieValue);

    if (!user) {
      throw new DomainError("UNAUTHENTICATED", "로그인이 필요합니다.", 401);
    }

    (request as Request & { user: typeof user }).user = user;
    return true;
  }
}
