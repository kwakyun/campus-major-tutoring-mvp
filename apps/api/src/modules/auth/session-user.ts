/**
 * 세션 사용자 모델 (S03-T03).
 *
 * identityVerificationStatus는 "본인 확인" 상태만 나타낸다. schoolAffiliation은
 * 별도이며, affiliationType='none'(편입준비생 등 미재학)이어도 학습자로 로그인·이용할 수 있다.
 * 즉 이 타입 자체가 "대학 재학"을 필수 조건으로 강제하지 않는다(SRC-01, docs/decisions/policies.md).
 */
export interface SessionUser {
  userId: string;
  roles: Array<"learner" | "tutor" | "operator">;
  identityVerificationStatus: "self_reported" | "pending" | "verified" | "rejected";
  schoolAffiliation: {
    campusId: string | null;
    affiliationType: "enrolled" | "prep" | "none";
  };
  operatorPermissions?: Array<
    "ops.verification_review" | "ops.matching" | "ops.dispute_resolution" | "ops.finance" | "ops.audit"
  >;
}
