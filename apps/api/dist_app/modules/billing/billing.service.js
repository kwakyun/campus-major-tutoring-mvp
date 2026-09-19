"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const fee_calculator_1 = require("./fee-calculator");
let BillingService = BillingService_1 = class BillingService {
    constructor() {
        this.logger = new common_1.Logger(BillingService_1.name);
        this.obligations = new Map();
    }
    /**
     * 예약 생성 시 원자적으로 호출되는 납부 의무 생성 인터페이스 (S05-T02)
     */
    createPaymentObligation(input) {
        const fees = (0, fee_calculator_1.calculateTuitionFees)(input.agreedPriceAmount, input.depositAmount ?? 0, input.educatorFeeBps ?? 1500);
        const record = {
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
        this.logger.log(`[PaymentObligationCreated] Booking ${input.bookingId} -> Total ₩${record.totalAmount} (Fee ₩${record.educatorFeeAmount}, Payout ₩${record.tutorPayoutAmount})`);
        return record;
    }
    getObligationByBooking(bookingId) {
        return this.obligations.get(bookingId);
    }
    markAuthorized(bookingId) {
        const ob = this.obligations.get(bookingId);
        if (!ob)
            return undefined;
        ob.status = "authorized";
        ob.updatedAt = new Date().toISOString();
        return ob;
    }
    markCaptured(bookingId) {
        const ob = this.obligations.get(bookingId);
        if (!ob)
            return undefined;
        ob.status = "captured";
        ob.updatedAt = new Date().toISOString();
        return ob;
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)()
], BillingService);
