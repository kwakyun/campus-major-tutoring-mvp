"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTuitionFees = calculateTuitionFees;
function calculateTuitionFees(agreedPrice, depositAmount = 0, educatorFeeBps = 1500) {
    if (agreedPrice < 0) {
        throw new Error("수업료는 0원 이상이어야 합니다.");
    }
    if (depositAmount < 0) {
        throw new Error("보증금은 0원 이상이어야 합니다.");
    }
    // 플랫폼 수수료 (15%) = agreedPrice * (feeBps / 10000)
    const educatorFeeAmount = Math.round((agreedPrice * educatorFeeBps) / 10000);
    const tutorPayoutAmount = agreedPrice - educatorFeeAmount;
    const learnerFeeAmount = 0; // 학습자 수수료 0원 고정
    const totalLearnerAmount = agreedPrice + depositAmount; // 보증금 포함 학습자 결제액
    return {
        tuitionAmount: agreedPrice,
        depositAmount,
        totalLearnerAmount,
        learnerFeeAmount,
        educatorFeeBps,
        educatorFeeAmount,
        tutorPayoutAmount,
    };
}
