import { describe, it, expect, beforeEach } from "vitest";
import { calculateTuitionFees } from "../../apps/api/src/modules/billing/fee-calculator";
import { BillingService } from "../../apps/api/src/modules/billing/billing.service";
import { NegotiationRepository } from "../../apps/api/src/modules/negotiation/negotiation.repository";
import { BookingService } from "../../apps/api/src/modules/booking/booking.service";

describe("S05 협의·제안·동의·예약 및 수수료 통합 검증 (S05-T05, A6 QA)", () => {
  let billingService: BillingService;
  let negotiationRepo: NegotiationRepository;
  let bookingService: BookingService;

  beforeEach(() => {
    billingService = new BillingService();
    negotiationRepo = new NegotiationRepository();
    bookingService = new BookingService(negotiationRepo, billingService);
  });

  describe("1. 수수료 15% 및 정산액 계산 검증 (S05-T02)", () => {
    it("15,000원 수업에 대해 플랫폼 수수료 2,250원, 교육자 정산액 12,750원, 학습자 수수료 0원이 산출된다", () => {
      const fees = calculateTuitionFees(15000);
      expect(fees.tuitionAmount).toBe(15000);
      expect(fees.educatorFeeBps).toBe(1500); // 15%
      expect(fees.educatorFeeAmount).toBe(2250);
      expect(fees.tutorPayoutAmount).toBe(12750);
      expect(fees.learnerFeeAmount).toBe(0);
      expect(fees.totalLearnerAmount).toBe(15000);
    });

    it("보증금이 주어져도 수수료 기준 금액에는 포함되지 않고 학습자 총 결제액에만 가산된다", () => {
      const fees = calculateTuitionFees(15000, 5000); // 보증금 5,000원
      expect(fees.tuitionAmount).toBe(15000);
      expect(fees.depositAmount).toBe(5000);
      expect(fees.educatorFeeAmount).toBe(2250); // 15,000원 기준 수수료 유지
      expect(fees.tutorPayoutAmount).toBe(12750);
      expect(fees.totalLearnerAmount).toBe(20000); // 15000 + 5000
    });
  });

  describe("2. 협의방 및 자기거래(Self-dealing) 차단 검증 (F-02, S05-T03)", () => {
    it("자기 자신의 개설 수업과 협의를 시도하면 SELF_DEALING_NOT_ALLOWED 오류로 차단된다", () => {
      expect(() => {
        negotiationRepo.createConversation(
          "course-101",
          "user-same-id", // tutorId
          "user-same-id", // learnerId
        );
      }).toThrowError(/자기 자신의 개설 수업과는 협의하거나 거래할 수 없습니다/);
    });

    it("서로 다른 사용자의 경우 협의방이 정상 생성되고 초기 시스템 메시지가 등록된다", () => {
      const conv = negotiationRepo.createConversation(
        "course-101",
        "tutor-001",
        "learner-002",
      );
      expect(conv.id).toBeDefined();
      expect(conv.tutorId).toBe("tutor-001");
      expect(conv.learnerId).toBe("learner-002");
      expect(conv.status).toBe("active");

      const msgs = negotiationRepo.getMessages(conv.id);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].senderRole).toBe("system");
    });
  });

  describe("3. 제안서 버전 관리 및 STALE_PROPOSAL 검증 (S05-T03)", () => {
    it("새로운 제안서가 발행되면 이전 제안서는 superseded 처리되고 버전이 1 증가한다", () => {
      const conv = negotiationRepo.createConversation("course-101", "tutor-001", "learner-002");

      const prop1 = negotiationRepo.createProposal(conv.id, "tutor-001", true, {
        scheduledStart: "2026-10-15T10:00:00.000Z",
        scheduledEnd: "2026-10-15T11:00:00.000Z",
        location: "신촌 스터디룸",
        agreedPriceAmount: 20000,
      });
      expect(prop1.version).toBe(1);
      expect(prop1.status).toBe("proposed");

      const prop2 = negotiationRepo.createProposal(conv.id, "learner-002", false, {
        scheduledStart: "2026-10-15T11:00:00.000Z",
        scheduledEnd: "2026-10-15T12:00:00.000Z",
        location: "홍대 스터디카페",
        agreedPriceAmount: 18000,
      });
      expect(prop2.version).toBe(2);
      expect(prop2.status).toBe("proposed");

      // 이전 제안서 상태 확인
      const oldProp = negotiationRepo.getProposal(prop1.id);
      expect(oldProp?.status).toBe("superseded");
    });

    it("구버전 제안서(prop1)에 동의를 시도하면 STALE_PROPOSAL 오류로 차단된다", () => {
      const conv = negotiationRepo.createConversation("course-101", "tutor-001", "learner-002");
      const prop1 = negotiationRepo.createProposal(conv.id, "tutor-001", true, {
        scheduledStart: "2026-10-15T10:00:00.000Z",
        scheduledEnd: "2026-10-15T11:00:00.000Z",
        location: "신촌",
        agreedPriceAmount: 20000,
      });
      negotiationRepo.createProposal(conv.id, "learner-002", false, {
        scheduledStart: "2026-10-15T11:00:00.000Z",
        scheduledEnd: "2026-10-15T12:00:00.000Z",
        location: "홍대",
        agreedPriceAmount: 18000,
      });

      expect(() => {
        negotiationRepo.agreeProposal(prop1.id, "learner-002", false);
      }).toThrowError(/이전 버전의 제안서에는 동의할 수 없습니다/);
    });
  });

  describe("4. 양측 동의 및 원자적 예약·시간점유·납부의무 생성 검증 (S05-T03)", () => {
    it("양측이 모두 동의하기 전에는 예약으로 전환할 수 없다 (CONDITION_NOT_MET)", () => {
      const conv = negotiationRepo.createConversation("course-101", "tutor-001", "learner-002");
      const prop = negotiationRepo.createProposal(conv.id, "tutor-001", true, {
        scheduledStart: "2026-10-15T10:00:00.000Z",
        scheduledEnd: "2026-10-15T11:00:00.000Z",
        location: "신촌",
        agreedPriceAmount: 25000,
      });

      // 튜터만 제안하고 학습자는 아직 동의 안 함
      expect(() => {
        bookingService.createBooking(conv.id, prop.id, "learner-002");
      }).toThrowError(/양측이 모두 동의/);
    });

    it("상대방(학습자)이 동의하면 agreed 완료 상태가 되고 예약이 원자적으로 생성된다", () => {
      const conv = negotiationRepo.createConversation("course-101", "tutor-001", "learner-002");
      const prop = negotiationRepo.createProposal(conv.id, "tutor-001", true, {
        scheduledStart: "2026-10-15T10:00:00.000Z",
        scheduledEnd: "2026-10-15T11:00:00.000Z",
        location: "신촌 스터디룸",
        agreedPriceAmount: 30000,
      });

      // 학습자 동의 수행
      const agreedProp = negotiationRepo.agreeProposal(prop.id, "learner-002", false);
      expect(agreedProp.status).toBe("agreed");
      expect(agreedProp.agreedByLearner).toBe(true);
      expect(agreedProp.agreedByTutor).toBe(true);

      // 예약 생성
      const result = bookingService.createBooking(conv.id, prop.id, "learner-002");
      expect(result.booking.id).toBeDefined();
      expect(result.booking.status).toBe("pending_payment");
      expect(result.booking.agreedPriceAmount).toBe(30000);

      // 납부 의무 레코드 검증
      expect(result.obligation.bookingId).toBe(result.booking.id);
      expect(result.obligation.totalAmount).toBe(30000);
      expect(result.obligation.educatorFeeAmount).toBe(4500); // 15%
      expect(result.obligation.tutorPayoutAmount).toBe(25500); // 85%
    });
  });

  describe("5. 시간 충돌(Schedule Conflict) 방지 검증 (S05-T05)", () => {
    it("동일 교육자의 기 예약된 시간대와 겹치는 제안을 예약하려고 하면 SCHEDULE_CONFLICT로 차단된다", () => {
      // 1) 첫 번째 예약 생성 (10:00 ~ 11:00)
      const conv1 = negotiationRepo.createConversation("course-101", "tutor-001", "learner-002");
      const prop1 = negotiationRepo.createProposal(conv1.id, "tutor-001", true, {
        scheduledStart: "2026-10-15T10:00:00.000Z",
        scheduledEnd: "2026-10-15T11:00:00.000Z",
        location: "신촌",
        agreedPriceAmount: 20000,
      });
      negotiationRepo.agreeProposal(prop1.id, "learner-002", false);
      bookingService.createBooking(conv1.id, prop1.id, "learner-002");

      // 2) 다른 학습자와 동일 시간대(10:30 ~ 11:30) 예약 시도
      const conv2 = negotiationRepo.createConversation("course-101", "tutor-001", "learner-003");
      const prop2 = negotiationRepo.createProposal(conv2.id, "tutor-001", true, {
        scheduledStart: "2026-10-15T10:30:00.000Z",
        scheduledEnd: "2026-10-15T11:30:00.000Z",
        location: "신촌",
        agreedPriceAmount: 20000,
      });
      negotiationRepo.agreeProposal(prop2.id, "learner-003", false);

      expect(() => {
        bookingService.createBooking(conv2.id, prop2.id, "learner-003");
      }).toThrowError(/교육자의 해당 시간대에 이미 다른 예약이 확정되어 있어/);
    });
  });
});
