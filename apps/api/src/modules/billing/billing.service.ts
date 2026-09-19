import { Injectable, Logger } from "@nestjs/common";
import {
  CreatePaymentObligationInput,
  PaymentObligationRecord,
} from "./billing.types";
import { calculateTuitionFees } from "./fee-calculator";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private obligations = new Map<string, PaymentObligationRecord>();

  /**
   * 예약 생성 시 원자적으로 호출되는 납부 의무 생성 인터페이스 (S05-T02)
   */
  createPaymentObligation(input: CreatePaymentObligationInput): PaymentObligationRecord {
    const fees = calculateTuitionFees(
      input.agreedPriceAmount,
      input.depositAmount ?? 0,
      input.educatorFeeBps ?? 1500,
    );

    const record: PaymentObligationRecord = {
      id: `obl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bookingId: input.bookingId,
      learnerId: input.learnerId,
      tutorId: input.tutorId,
      totalAmount: fees.totalLearnerAmount,
      learnerFeeAmount: fees.learnerFeeAmount,
      educatorFeeBps: fees.educatorFeeBps,
      educatorFeeAmount: fees.educatorFeeAmount,
      tutorPayoutAmount: fees.tutorPayoutAmount,
      depositAmount: fees.depositAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.obligations.set(record.bookingId, record);
    this.logger.log(
      `[PaymentObligationCreated] Booking ${input.bookingId} -> Total ₩${record.totalAmount} (Fee ₩${record.educatorFeeAmount}, Payout ₩${record.tutorPayoutAmount})`,
    );

    return record;
  }

  getObligationByBooking(bookingId: string): PaymentObligationRecord | undefined {
    return this.obligations.get(bookingId);
  }

  markAuthorized(bookingId: string): PaymentObligationRecord | undefined {
    const ob = this.obligations.get(bookingId);
    if (!ob) return undefined;
    ob.status = "authorized";
    ob.updatedAt = new Date().toISOString();
    return ob;
  }

  markCaptured(bookingId: string): PaymentObligationRecord | undefined {
    const ob = this.obligations.get(bookingId);
    if (!ob) return undefined;
    ob.status = "captured";
    ob.updatedAt = new Date().toISOString();
    return ob;
  }
}
