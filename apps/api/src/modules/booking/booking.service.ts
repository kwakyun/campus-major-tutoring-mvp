import { Injectable, Logger } from "@nestjs/common";
import { DomainError } from "../../common/errors";
import { NegotiationRepository } from "../negotiation/negotiation.repository";
import { BillingService } from "../billing/billing.service";
import {
  BookingRecord,
  TimeSlotOccupation,
  CreateBookingResponse,
} from "./booking.types";

function timesOverlap(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && s2 < e1;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private bookings = new Map<string, BookingRecord>();
  private occupations: TimeSlotOccupation[] = [];

  constructor(
    private readonly negotiationRepo: NegotiationRepository,
    private readonly billingService: BillingService,
  ) {}

  createBooking(
    conversationId: string,
    proposalId: string,
    requestedByUserId: string,
  ): CreateBookingResponse {
    const conv = this.negotiationRepo.getConversation(conversationId);
    if (!conv) {
      throw new DomainError("NOT_FOUND", "협의방을 찾을 수 없습니다.");
    }
    if (conv.learnerId !== requestedByUserId && conv.tutorId !== requestedByUserId) {
      throw new DomainError("FORBIDDEN", "해당 거래를 예약할 권한이 없습니다.");
    }

    const proposal = this.negotiationRepo.getProposal(proposalId);
    if (!proposal) {
      throw new DomainError("NOT_FOUND", "제안서를 찾을 수 없습니다.");
    }

    // 1. 최신 제안서 검증
    if (conv.currentProposalId !== proposalId || proposal.status === "superseded") {
      throw new DomainError("STALE_PROPOSAL", "최신 버전의 제안서가 아닙니다.");
    }

    // 2. 양측 동의 완료 상태 검증
    if (proposal.status !== "agreed" || !proposal.agreedByLearner || !proposal.agreedByTutor) {
      throw new DomainError(
        "CONDITION_NOT_MET",
        "양측이 모두 동의(agreed)한 최종 제안서만 예약으로 전환할 수 있습니다.",
      );
    }

    // 3. 시간 충돌 (Schedule Conflict) 검증
    const newStart = new Date(proposal.scheduledStart).getTime();
    const newEnd = new Date(proposal.scheduledEnd).getTime();

    for (const occ of this.occupations) {
      if (occ.tutorId === conv.tutorId) {
        const occStart = new Date(occ.start).getTime();
        const occEnd = new Date(occ.end).getTime();
        if (timesOverlap(newStart, newEnd, occStart, occEnd)) {
          throw new DomainError(
            "SCHEDULE_CONFLICT",
            "교육자의 해당 시간대에 이미 다른 예약이 확정되어 있어 시간을 점유할 수 없습니다.",
          );
        }
      }
    }

    // 4. 원자적 예약 및 시간 점유 생성
    const bookingId = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const booking: BookingRecord = {
      id: bookingId,
      conversationId,
      proposalId,
      courseId: conv.courseId,
      tutorId: conv.tutorId,
      learnerId: conv.learnerId,
      scheduledStart: proposal.scheduledStart,
      scheduledEnd: proposal.scheduledEnd,
      totalMinutes: proposal.totalMinutes,
      location: proposal.location,
      agreedPriceAmount: proposal.agreedPriceAmount,
      learningGoal: proposal.learningGoal,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.set(bookingId, booking);

    // 시간 점유(TimeSlotOccupation) 등록
    const occupation: TimeSlotOccupation = {
      id: `occ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tutorId: conv.tutorId,
      bookingId,
      start: proposal.scheduledStart,
      end: proposal.scheduledEnd,
    };
    this.occupations.push(occupation);

    // 5. Billing 모듈 납부 의무(PaymentObligation) 동시 생성 (트랜잭션 일관성)
    const obligation = this.billingService.createPaymentObligation({
      bookingId,
      learnerId: conv.learnerId,
      tutorId: conv.tutorId,
      agreedPriceAmount: proposal.agreedPriceAmount,
    });

    // 협의방 상태 agreed로 갱신
    conv.status = "agreed";

    this.negotiationRepo.addMessage(
      conversationId,
      "system",
      "system",
      `📅 수업 예약이 완료되었습니다(예약번호: ${bookingId}). 결제를 진행해주세요.`,
    );

    this.logger.log(
      `[BookingConfirmed] Booking ${bookingId} created with PaymentObligation ${obligation.id}`,
    );

    return {
      booking,
      obligation,
    };
  }

  getBooking(bookingId: string): BookingRecord | undefined {
    return this.bookings.get(bookingId);
  }

  requireParticipant(bookingId: string, userId: string): BookingRecord {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new DomainError("NOT_FOUND", "예약을 찾을 수 없습니다.", 404);
    if (booking.learnerId !== userId && booking.tutorId !== userId) {
      throw new DomainError("FORBIDDEN", "본인이 참여한 예약만 조회할 수 있습니다.", 403);
    }
    return booking;
  }

  listBookingsByUser(userId: string): BookingRecord[] {
    return Array.from(this.bookings.values())
      .filter((b) => b.learnerId === userId || b.tutorId === userId)
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }

  confirmPayment(bookingId: string, requestedByUserId: string): BookingRecord {
    const b = this.requireParticipant(bookingId, requestedByUserId);
    if (b.learnerId !== requestedByUserId) {
      throw new DomainError("FORBIDDEN", "예약한 학습자만 결제를 진행할 수 있습니다.", 403);
    }
    // This endpoint simulates payment; real payments must be verified by a provider.
    if ((process.env.APP_ENV ?? "local") !== "local" || (process.env.PAYMENT_MODE ?? "fake") !== "fake") {
      throw new DomainError("CONDITION_NOT_MET", "모의 결제는 로컬 개발 환경에서만 가능합니다.", 403);
    }
    if (b.status === "confirmed") return b;
    if (b.status !== "pending_payment") {
      throw new DomainError("CONDITION_NOT_MET", "결제 대기 중인 예약만 결제할 수 있습니다.", 409);
    }
    if (!this.billingService.getObligationByBooking(bookingId)) {
      throw new DomainError("CONDITION_NOT_MET", "납부 정보를 확인할 수 없습니다.", 409);
    }
    b.status = "confirmed";
    b.updatedAt = new Date().toISOString();
    this.billingService.markAuthorized(bookingId);
    return b;
  }
}
