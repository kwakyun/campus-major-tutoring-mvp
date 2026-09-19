"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeSessionVerifier = void 0;
/**
 * 로컬 개발·통합 테스트 전용 테스트 대역.
 *
 * 절대 production에서 사용하지 않는다 — main.ts 부팅 단계와 AuthTestBypassGuard가
 * 이중으로 차단한다(S03-T05 검증 대상: "운영용 테스트 우회 차단").
 */
class FakeSessionVerifier {
    constructor() {
        this.fixtures = {
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
    }
    async verify(sessionCookieValue) {
        if (!sessionCookieValue)
            return null;
        return this.fixtures[sessionCookieValue] ?? null;
    }
}
exports.FakeSessionVerifier = FakeSessionVerifier;
