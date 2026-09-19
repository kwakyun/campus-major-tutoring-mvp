/**
 * 전공한시간 수업료 및 수수료 계산기 (S05-T02, A4)
 *
 * 규약:
 * - 학습자 플랫폼 수수료: 0원 (수업료만 납부)
 * - 교육자 플랫폼 수수료: 15% (1500 bps, 하향/상향 조정 시 feeBps 파라미터 주입)
 * - 정산 예정액: 수업료 - 플랫폼 수수료
 * - 보증금은 수수료 산정 모수에 포함되지 않음
 */
export interface FeeCalculationResult {
  tuitionAmount: number;
  depositAmount: number;
  totalLearnerAmount: number;
  learnerFeeAmount: number;
  educatorFeeBps: number;
  educatorFeeAmount: number;
  tutorPayoutAmount: number;
}

export function calculateTuitionFees(
  agreedPrice: number,
  depositAmount = 0,
  educatorFeeBps = 1500, // 기본 15%
): FeeCalculationResult {
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
