import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { SessionUser } from "../auth/session-user";

@Controller("health")
export class HealthController {
  /** 공개 상태 확인 — 인증 불필요 */
  @Get()
  health() {
    return {
      status: "ok",
      appEnv: process.env.APP_ENV ?? "local",
      paymentMode: process.env.PAYMENT_MODE ?? "fake",
    };
  }

  /**
   * 인증된 세션 확인용 — 가드가 정상 동작하는지 확인하는 최소 엔드포인트(S03-T05 검증 대상).
   * 서버 비밀키·evidenceKey 등은 절대 여기서 반환하지 않는다.
   */
  @Get("whoami")
  @UseGuards(SessionGuard)
  whoami(@CurrentUser() user: SessionUser) {
    return {
      userId: user.userId,
      roles: user.roles,
      identityVerificationStatus: user.identityVerificationStatus,
      schoolAffiliation: user.schoolAffiliation,
    };
  }
}
