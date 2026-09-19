/**
 * packages/contracts/openapi.yaml의 Error 스키마와 동일한 오류 코드 집합.
 * 이 파일이 진실 원본이 아니라 openapi.yaml이 원본이며, 코드 생성 파이프라인이
 * 준비되기 전까지는 수동으로 동기화한다(S03-T02 contracts:generate 스크립트 참고).
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "STALE_PROPOSAL"
  | "SCHEDULE_CONFLICT"
  | "PAYMENT_AMOUNT_MISMATCH"
  | "PAYMENT_RECONCILIATION_REQUIRED"
  | "IDEMPOTENCY_KEY_CONFLICT"
  | "SELF_DEALING_NOT_ALLOWED"
  | "CONDITION_NOT_MET";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly httpStatus: number = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
