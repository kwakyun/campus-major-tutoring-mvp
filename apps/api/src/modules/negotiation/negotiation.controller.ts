import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionUser } from "../auth/session-user";
import { NegotiationRepository } from "./negotiation.repository";
import { CoursesRepository } from "../catalog/courses.repository";
import {
  CreateConversationInput,
  CreateProposalInput,
  SendMessageInput,
} from "./negotiation.types";

@Controller("conversations")
export class NegotiationController {
  constructor(
    private readonly negotiationRepo: NegotiationRepository,
    private readonly coursesRepo: CoursesRepository,
  ) {}

  @Post()
  @UseGuards(SessionGuard)
  createConversation(
    @CurrentUser() user: SessionUser,
    @Body() body: CreateConversationInput,
  ) {
    if (!user.roles.includes("learner")) {
      throw new ForbiddenException("학습자 계정으로 협의를 시작해주세요.");
    }
    const course = this.coursesRepo.findById(body.courseId);
    if (!course || course.status !== "published") {
      throw new NotFoundException("해당 수업을 찾을 수 없습니다.");
    }

    return this.negotiationRepo.createConversation(
      course.id,
      course.tutorId,
      user.userId,
      body.learningRequestId,
    );
  }

  @Get()
  @UseGuards(SessionGuard)
  listMyConversations(@CurrentUser() user: SessionUser) {
    return this.negotiationRepo.listConversationsByUser(user.userId);
  }

  @Get(":id")
  @UseGuards(SessionGuard)
  getConversation(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    const conv = this.negotiationRepo.getConversation(id);
    if (!conv) {
      throw new NotFoundException("협의방을 찾을 수 없습니다.");
    }
    if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
      throw new ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
    }

    const currentProposal = conv.currentProposalId
      ? this.negotiationRepo.getProposal(conv.currentProposalId)
      : null;

    return {
      conversation: conv,
      currentProposal,
    };
  }

  @Get(":id/messages")
  @UseGuards(SessionGuard)
  getMessages(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    const conv = this.negotiationRepo.getConversation(id);
    if (!conv) {
      throw new NotFoundException("협의방을 찾을 수 없습니다.");
    }
    if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
      throw new ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
    }

    return this.negotiationRepo.getMessages(id);
  }

  @Post(":id/messages")
  @UseGuards(SessionGuard)
  sendMessage(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body() body: SendMessageInput,
  ) {
    const conv = this.negotiationRepo.getConversation(id);
    if (!conv) {
      throw new NotFoundException("협의방을 찾을 수 없습니다.");
    }
    if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
      throw new ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
    }

    const role = conv.tutorId === user.userId ? "tutor" : "learner";
    return this.negotiationRepo.addMessage(id, user.userId, role, body.text);
  }

  @Post(":id/proposals")
  @UseGuards(SessionGuard)
  createProposal(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Body() body: CreateProposalInput,
  ) {
    const conv = this.negotiationRepo.getConversation(id);
    if (!conv) {
      throw new NotFoundException("협의방을 찾을 수 없습니다.");
    }
    if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
      throw new ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
    }

    const isTutor = conv.tutorId === user.userId;
    return this.negotiationRepo.createProposal(id, user.userId, isTutor, body);
  }

  @Post(":id/proposals/:proposalId/agree")
  @UseGuards(SessionGuard)
  agreeProposal(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Param("proposalId") proposalId: string,
  ) {
    const conv = this.negotiationRepo.getConversation(id);
    if (!conv) {
      throw new NotFoundException("협의방을 찾을 수 없습니다.");
    }
    if (conv.learnerId !== user.userId && conv.tutorId !== user.userId) {
      throw new ForbiddenException("해당 협의방에 접근할 권한이 없습니다.");
    }

    const isTutor = conv.tutorId === user.userId;
    const proposal = this.negotiationRepo.getProposal(proposalId);
    if (!proposal || proposal.conversationId !== id) {
      throw new NotFoundException("해당 협의방의 제안서를 찾을 수 없습니다.");
    }
    return this.negotiationRepo.agreeProposal(proposalId, user.userId, isTutor);
  }
}
