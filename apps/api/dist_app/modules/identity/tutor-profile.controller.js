"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorProfileController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const session_guard_1 = require("../auth/session.guard");
const errors_1 = require("../../common/errors");
const verifications_repository_1 = require("../verifications/verifications.repository");
const tutor_profile_repository_1 = require("./tutor-profile.repository");
const courses_repository_1 = require("../catalog/courses.repository");
const courses_controller_1 = require("../catalog/courses.controller");
/**
 * 자기기재 값만으로 "확인됨" 배지를 만들지 않는다(authorization.md §5) — verified 배지는
 * verifications.status==='verified'인 항목만 노출한다. pending/self_reported/rejected는
 * 공개 배지에 노출하지 않는다(반려 사유 등 내부 정보를 공개 화면에 흘리지 않기 위함).
 */
function toVerificationBadges(records) {
    return records
        .filter((r) => r.status === "verified")
        .map((r) => ({ type: r.type, status: r.status }));
}
/** 실제 표시 이름 데이터가 아직 없다(SessionUser/DB에 displayName 연결 미완 — S04 remaining_work).
 * 실명을 노출할 수 없으므로 사용자 ID 기반의 비식별 라벨을 임시로 사용한다. */
function placeholderDisplayName(userId) {
    return `교육자-${userId.slice(-4)}`;
}
let TutorProfileController = class TutorProfileController {
    constructor(profiles, verifications, courses) {
        this.profiles = profiles;
        this.verifications = verifications;
        this.courses = courses;
    }
    upsert(user, body) {
        if (!user.roles.includes("tutor")) {
            throw new errors_1.DomainError("FORBIDDEN", "tutor 역할이 필요합니다.", 403);
        }
        return this.profiles.upsert(user.userId, body ?? {});
    }
    /**
     * 공개 교육자 프로필(TutorPublicProfile, openapi.yaml 스키마는 존재하나 이를 반환하는
     * 엔드포인트가 baseline에 없었다 — docs/ux/screens.md "GET /tutors/{id} 확장 또는 신규
     * API(계약 변경 요청)"에서 이미 필요성이 언급됨. contract_requests에 반영 요청을 남긴다.
     *
     * teachingEvidence는 verificationBadges와 분리된 최상위 필드로 반환한다
     * (authorization.md §5 — 둘을 하나의 "신뢰도 점수"로 합치지 않는다).
     */
    getPublicProfile(id) {
        const profile = this.profiles.findByUserId(id);
        const verifications = this.verifications.listByUser(id);
        const evidenceCourses = (0, courses_controller_1.toTeachingEvidenceCourses)(this.courses.listByTutor(id));
        return {
            id,
            displayName: placeholderDisplayName(id),
            school: profile?.selfReportedSchool ?? null,
            major: profile?.selfReportedMajor ?? null,
            verificationBadges: toVerificationBadges(verifications),
            teachingEvidence: {
                // 여러 published 수업이 있을 수 있어 배열로 반환한다(공식 스키마는 단일 요약
                // 형태이나, 하나로 합치면 특정 수업의 근거인지 불명확해져 원본 그대로 둔다).
                sampleDescription: evidenceCourses[0]?.sampleDescription ?? null,
                expectedOutcomes: evidenceCourses.map((c) => c.expectedOutcome).filter((v) => Boolean(v)),
                reviewSummary: null, // 후기·정산 기록은 S06 이후 범위(reviews 테이블 미사용)
            },
        };
    }
};
exports.TutorProfileController = TutorProfileController;
__decorate([
    (0, common_1.Post)("tutor/profile"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TutorProfileController.prototype, "upsert", null);
__decorate([
    (0, common_1.Get)("tutors/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TutorProfileController.prototype, "getPublicProfile", null);
exports.TutorProfileController = TutorProfileController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [tutor_profile_repository_1.TutorProfileRepository,
        verifications_repository_1.VerificationsRepository,
        courses_repository_1.CoursesRepository])
], TutorProfileController);
