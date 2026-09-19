export type ObligationStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "refunded"
  | "cancelled";

export interface PaymentObligationRecord {
  id: string;
  bookingId: string;
  learnerId: string;
  tutorId: string;
  totalAmount: number; // 학습자 최종 결제액 (KRW)
  learnerFeeAmount: number; // 학습자 수수료 (0원)
  educatorFeeBps: number; // 교육자 수수료율 (기본 1500 = 15%)
  educatorFeeAmount: number; // 플랫폼 수수료 (15%)
  tutorPayoutAmount: number; // 교육자 정산 예정액 (85%)
  depositAmount: number; // 보증금 (미정 정책은 0 또는 별도 지정)
  status: ObligationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentObligationInput {
  bookingId: string;
  learnerId: string;
  tutorId: string;
  agreedPriceAmount: number;
  depositAmount?: number;
  educatorFeeBps?: number;
}
