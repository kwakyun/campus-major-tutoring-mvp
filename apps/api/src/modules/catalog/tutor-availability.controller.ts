import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { SessionUser } from "../auth/session-user";
import { DomainError } from "../../common/errors";
import { TutorAvailabilityRepository } from "./tutor-availability.repository";
import { TimeWindow } from "./course.types";

/**
 * 교육자 가능 시간 API (docs/ux/screens.md "가능 시간 관리" — S04-T01).
 * "확정 예약 겹침 시 수정 차단"은 예약(bookings) 모듈이 아직 없어(S05 이후) 이번
 * 단계에서는 검증할 대상 자체가 없다 — remaining_work로 남긴다.
 */
@Controller("tutor/availability")
export class TutorAvailabilityController {
  constructor(private readonly repo: TutorAvailabilityRepository) {}

  @Put()
  @UseGuards(SessionGuard)
  setMine(@CurrentUser() user: SessionUser, @Body() body: { windows: TimeWindow[] }) {
    if (!user.roles.includes("tutor")) {
      throw new DomainError("FORBIDDEN", "tutor 역할이 필요합니다.", 403);
    }
    if (!Array.isArray(body?.windows)) {
      throw new DomainError("VALIDATION_ERROR", "windows 배열이 필요합니다.");
    }
    return { windows: this.repo.setWindows(user.userId, body.windows) };
  }

  @Get()
  @UseGuards(SessionGuard)
  getMine(@CurrentUser() user: SessionUser) {
    return { windows: this.repo.getWindows(user.userId) };
  }
}

/** 다른 교육자의 가능 시간은 일정 조율 목적으로만 공개한다(실명·연락처 없음). */
@Controller("tutors")
export class TutorPublicAvailabilityController {
  constructor(private readonly repo: TutorAvailabilityRepository) {}

  @Get(":id/availability")
  getPublic(@Param("id") id: string) {
    return { tutorId: id, windows: this.repo.getWindows(id) };
  }
}
