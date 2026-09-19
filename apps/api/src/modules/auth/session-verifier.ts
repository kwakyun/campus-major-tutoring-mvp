import { SessionUser } from "./session-user";

/**
 * 세션 쿠키 → SessionUser 검증 인터페이스 (S03-T03).
 *
 * 실제 구현(Supabase Auth 연동 등)은 계약 미체결로 아직 없다(docs/decisions/policies.md).
 * 이 인터페이스 덕분에 "테스트 대역"과 "실제 인증"을 명확히 분리해 교체할 수 있다.
 */
export interface SessionVerifier {
  verify(sessionCookieValue: string | undefined): Promise<SessionUser | null>;
}

/**
 * 로컬 개발·통합 테스트 전용 테스트 대역.
 *
 * 절대 production에서 사용하지 않는다 — main.ts 부팅 단계와 AuthTestBypassGuard가
 * 이중으로 차단한다(S03-T05 검증 대상: "운영용 테스트 우회 차단").
 */
export class FakeSessionVerifier implements SessionVerifier {
  private readonly fixtures: Record<string, SessionUser> = {
    "fake-learner-prep": {
      userId: "seed-learner-prep-0001",
      roles: ["learner"],
      identityVerificationStatus: "self_reported",
      schoolAffiliation: { campusId: null, affiliationType: "prep" },
    },
    "fake-learner-enrolled": {
      userId: "seed-learner-enrolled-0001",
      roles: ["learner"],
      identityVerificationStatus: "verified",
      schoolAffiliation: { campusId: "campus-demo-1", affiliationType: "enrolled" },
    },
    "fake-tutor": {
      userId: "seed-tutor-0001",
      roles: ["tutor"],
      identityVerificationStatus: "pending",
      schoolAffiliation: { campusId: "campus-demo-1", affiliationType: "enrolled" },
    },
    "fake-operator": {
      userId: "seed-operator-0001",
      roles: ["operator"],
      identityVerificationStatus: "verified",
      schoolAffiliation: { campusId: null, affiliationType: "none" },
      operatorPermissions: ["ops.verification_review", "ops.matching"],
    },
  };

  async verify(sessionCookieValue: string | undefined): Promise<SessionUser | null> {
    if (!sessionCookieValue) return null;
    return this.fixtures[sessionCookieValue] ?? null;
  }
}
