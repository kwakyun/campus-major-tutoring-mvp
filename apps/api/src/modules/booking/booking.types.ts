import { PaymentObligationRecord } from "../billing/billing.types";

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface BookingRecord {
  id: string;
  conversationId: string;
  proposalId: string;
  courseId: string;
  tutorId: string;
  learnerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  totalMinutes: number;
  location: string;
  agreedPriceAmount: number;
  learningGoal: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlotOccupation {
  id: string;
  tutorId: string;
  bookingId: string;
  start: string; // ISO
  end: string; // ISO
}

export interface CreateBookingInput {
  conversationId: string;
  proposalId: string;
}

export interface CreateBookingResponse {
  booking: BookingRecord;
  obligation: PaymentObligationRecord;
}
