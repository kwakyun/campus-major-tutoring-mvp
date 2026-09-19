import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionGuard } from "../auth/session.guard";
import { SessionUser } from "../auth/session-user";
import { DomainError } from "../../common/errors";
import { VerificationsRepository } from "./verifications.repository";

/**
 * S03-T03 기반 골격: openapi.yaml `/verifications`의 최소 구현.
 * 대학 미재학(affiliationType='prep'|'none')이어도 이 엔드포인트 사용에 제약이 없다(SRC-01).
 * evidenceKey는 본인 조회 응답에만 포함하고 목록 응답에서는 원본 파일 접근 링크를 만들지 않는다.
 */
@Controller("verifications")
@UseGuards(SessionGuard)
export class VerificationsController {
  constructor(private readonly repo: VerificationsRepository) {}

  @Post()
  create(
    @CurrentUser() user: SessionUser,
    @Body() body: { type: "school_enrollment" | "major" | "career" | "certification"; evidenceKey: string },
  ) {
    if (!body?.type || !body?.evidenceKey) {
      throw new DomainError("VALIDATION_ERROR", "type과 evidenceKey는 필수입니다.");
    }
    return this.repo.create(user.userId, body.type, body.evidenceKey);
  }

  @Get()
  listMine(@CurrentUser() user: SessionUser) {
    return this.repo.listByUser(user.userId);
  }

  /**
   * 본인 확인 신청 상세 — 다른 사용자의 신청 ID로 조회하면 403.
   * authorization.md §2 "verifications(비공개 증빙): 본인, 심사 담당 운영자"를 그대로 구현한다.
   */
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    const record = this.repo.findById(id);
    if (!record) throw new NotFoundException();

    const isOwner = record.userId === user.userId;
    const isReviewer = user.roles.includes("operator") && user.operatorPermissions?.includes("ops.verification_review");

    if (!isOwner && !isReviewer) {
      throw new DomainError("FORBIDDEN", "본인 또는 심사 담당 운영자만 조회할 수 있습니다.", 403);
    }
    return record;
  }
}
