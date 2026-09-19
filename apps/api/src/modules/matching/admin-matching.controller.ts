import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { OperatorPermissionGuard, RequireOperatorPermission } from "../auth/operator-permission.guard";
import {
  LearningRequestsRepository,
  LearningRequestStatus,
  MatchingFailureReason,
} from "./learning-requests.repository";
import { WaitlistEntriesRepository } from "./waitlist-entries.repository";

/**
 * 운영자 매칭 보조 API (openapi.yaml `/admin/learning-requests`,
 * `/admin/waitlist-entries` — ops.matching, S04-T01).
 *
 * 후보가 없을 때 운영자가 허위로 매칭 결과를 만들어내지 않는다(docs/ux/flows.md §3
 * "허위 매칭 금지") — assist()는 상태 전이와 사유·메모만 기록하고, 실제 협의방
 * 생성(conversations)은 S05(협의·예약 모듈) 범위다.
 */
@Controller("admin")
@UseGuards(SessionGuard, OperatorPermissionGuard)
export class AdminMatchingController {
  constructor(
    private readonly learningRequests: LearningRequestsRepository,
    private readonly waitlist: WaitlistEntriesRepository,
  ) {}

  @Get("learning-requests")
  @RequireOperatorPermission("ops.matching")
  listLearningRequests(@Query("status") status?: string) {
    return this.learningRequests.listForAdmin(status);
  }

  @Get("waitlist-entries")
  @RequireOperatorPermission("ops.matching")
  listWaitlistEntries(@Query("status") status?: string) {
    return this.waitlist.listForAdmin(status);
  }

  @Post("learning-requests/:id/assist")
  @RequireOperatorPermission("ops.matching")
  assist(
    @Param("id") id: string,
    @Body() body: { status: LearningRequestStatus; reason?: MatchingFailureReason | null; note?: string | null },
  ) {
    return this.learningRequests.assist(id, body.status, body.reason ?? null, body.note ?? null);
  }
}
