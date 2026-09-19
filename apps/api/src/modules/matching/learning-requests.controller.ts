import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { SessionUser } from "../auth/session-user";
import { DomainError } from "../../common/errors";
import { ReferenceDataRepository } from "../catalog/reference-data.repository";
import { CreateLearningRequestInput, LearningRequestsRepository } from "./learning-requests.repository";
import { CreateWaitlistInput, WaitlistEntriesRepository } from "./waitlist-entries.repository";

/**
 * 학습 요청·대기 신청 API (openapi.yaml `/learning-requests`,
 * `/learning-requests/{id}/waitlist` — S04-T01, SRC-03).
 *
 * 대학 재학 여부(schoolAffiliation)는 어디에서도 검사하지 않는다 — learner 역할이면
 * affiliationType이 'prep'/'none'이어도 그대로 등록할 수 있다(SRC-01).
 */
@Controller("learning-requests")
export class LearningRequestsController {
  constructor(
    private readonly learningRequests: LearningRequestsRepository,
    private readonly waitlist: WaitlistEntriesRepository,
    private readonly refData: ReferenceDataRepository,
  ) {}

  @Post()
  @UseGuards(SessionGuard)
  create(@CurrentUser() user: SessionUser, @Body() body: CreateLearningRequestInput) {
    if (!user.roles.includes("learner")) {
      throw new DomainError("FORBIDDEN", "learner 역할이 필요합니다.", 403);
    }
    if (!body?.goal || !body?.lifeZoneId) {
      throw new DomainError("VALIDATION_ERROR", "goal·lifeZoneId는 필수입니다.");
    }
    if (!this.refData.lifeZoneExists(body.lifeZoneId)) {
      throw new DomainError("VALIDATION_ERROR", `존재하지 않는 lifeZoneId입니다: ${body.lifeZoneId}`);
    }
    // level은 자기신고이며 값이 없어도("수준 확인 필요") 부적격으로 처리하지 않는다
    // (data-model.md §7) — 별도 필수 검사를 두지 않는다.
    return this.learningRequests.create(user.userId, body);
  }

  @Get()
  @UseGuards(SessionGuard)
  listMine(@CurrentUser() user: SessionUser) {
    if (!user.roles.includes("learner")) {
      throw new DomainError("FORBIDDEN", "learner 역할이 필요합니다.", 403);
    }
    return this.learningRequests.listByLearner(user.userId);
  }

  @Get(":id")
  @UseGuards(SessionGuard)
  getOne(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.learningRequests.requireOwnedOrOperator(id, user);
  }

  @Post(":id/withdraw")
  @UseGuards(SessionGuard)
  withdrawRequest(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    return this.learningRequests.withdraw(id, user.userId);
  }

  /**
   * 조건에 맞는 교육자가 없을 때 대기 신청 등록(SRC-03). 예약·좌석 점유·결제를
   * 생성하지 않는다 — waitlist_entries만 기록한다. 같은 학습 요청에 이미 활성
   * 대기 신청이 있으면 새로 만들지 않고 기존 레코드를 그대로 반환한다(중복 처리).
   */
  @Post(":id/waitlist")
  @UseGuards(SessionGuard)
  registerWaitlist(@Param("id") id: string, @CurrentUser() user: SessionUser, @Body() body: CreateWaitlistInput) {
    const learningRequest = this.learningRequests.requireOwnedOrOperator(id, user);
    if (learningRequest.learnerId !== user.userId) {
      throw new DomainError("FORBIDDEN", "본인 학습 요청에만 대기 신청을 등록할 수 있습니다.", 403);
    }

    const { record, isNew } = this.waitlist.create(id, user.userId, body ?? {});
    return { ...record, isNew };
  }

  @Post(":id/waitlist/:waitlistId/withdraw")
  @UseGuards(SessionGuard)
  withdrawWaitlist(@Param("waitlistId") waitlistId: string, @CurrentUser() user: SessionUser) {
    return this.waitlist.withdraw(waitlistId, user.userId);
  }
}
