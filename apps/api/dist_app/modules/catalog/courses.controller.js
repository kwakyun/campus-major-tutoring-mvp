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
exports.CoursesController = void 0;
exports.toTeachingEvidenceCourses = toTeachingEvidenceCourses;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const session_guard_1 = require("../auth/session.guard");
const errors_1 = require("../../common/errors");
const courses_repository_1 = require("./courses.repository");
const reference_data_repository_1 = require("./reference-data.repository");
const idempotency_store_1 = require("./idempotency.store");
const course_types_1 = require("./course.types");
const curriculum_draft_service_1 = require("./curriculum-draft.service");
function requireRole(user, role) {
    if (!user.roles.includes(role)) {
        throw new errors_1.DomainError("FORBIDDEN", `${role} 역할이 필요합니다.`, 403);
    }
}
function validateReferenceIds(refData, subjectId, lifeZoneId) {
    if (!refData.subjectExists(subjectId)) {
        throw new errors_1.DomainError("VALIDATION_ERROR", `존재하지 않는 subjectId입니다: ${subjectId}`);
    }
    if (!refData.lifeZoneExists(lifeZoneId)) {
        throw new errors_1.DomainError("VALIDATION_ERROR", `존재하지 않는 lifeZoneId입니다: ${lifeZoneId}`);
    }
}
/**
 * 수업 탐색·등록·수정 API (openapi.yaml `/courses`, `/courses/{id}`, `/tutor/courses`,
 * `/tutor/courses/{courseId}/versions` — S04-T01. `/tutor/courses/curriculum/draft`는
 * 에드혹 추가 — docs/handoffs/ADHOC-01-ai-curriculum-draft.md 참고).
 *
 * 공개 조회(GET /courses, GET /courses/{id})는 인증이 필요 없고 published 상태만
 * 노출한다. 등록·수정은 세션 인증 + tutor 역할 + 본인 소유 검사를 거친다.
 */
let CoursesController = class CoursesController {
    constructor(courses, refData, idempotency, curriculumDraft) {
        this.courses = courses;
        this.refData = refData;
        this.idempotency = idempotency;
        this.curriculumDraft = curriculumDraft;
    }
    listPublic(subjectId, lifeZoneId, cursor) {
        return this.courses.listPublic({ subjectId, lifeZoneId, cursor });
    }
    getPublicDetail(id) {
        const record = this.courses.findById(id);
        if (!record || !(0, course_types_1.isPubliclyVisible)(record)) {
            // 비공개/삭제된 수업은 존재 자체를 숨긴다(openapi.yaml 404 설명과 일치).
            // DomainError를 써서 오류 코드(NOT_FOUND)가 openapi.yaml Error 스키마와
            // 정확히 일치하도록 한다 — 일반 NestJS HttpException은 AllExceptionsFilter가
            // 401 외 전부 VALIDATION_ERROR로 뭉뚱그린다(common/http-exception.filter.ts,
            // 이번 명령 allowed_paths 밖이라 직접 고치지 않고 remaining_work로 남긴다).
            throw new errors_1.DomainError("NOT_FOUND", "수업을 찾을 수 없습니다.", 404);
        }
        return record;
    }
    /** 교육자 본인의 전체 수업 목록(draft 포함) — 관리 화면용 실용적 추가 엔드포인트. */
    listMine(user) {
        requireRole(user, "tutor");
        return this.courses.listByTutor(user.userId);
    }
    create(user, body, idempotencyKey) {
        requireRole(user, "tutor");
        if (!idempotencyKey) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "Idempotency-Key 헤더가 필요합니다.");
        }
        if (!body?.learningGoal || !body?.subjectId || !body?.lifeZoneId || body?.askingPrice === undefined) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "learningGoal·subjectId·lifeZoneId·askingPrice는 필수입니다.");
        }
        if (body.askingPrice < 0) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "askingPrice는 0 이상이어야 합니다.");
        }
        validateReferenceIds(this.refData, body.subjectId, body.lifeZoneId);
        const cached = this.idempotency.checkExisting(user.userId, "createCourse", idempotencyKey, body);
        if (cached)
            return cached;
        const record = this.courses.create(user.userId, body);
        this.idempotency.save(user.userId, "createCourse", idempotencyKey, body, record);
        return record;
    }
    /**
     * AI 커리큘럼 초안 생성 — 튜터가 "가르치고 싶은 분야"만 입력하면 학습목표·단원별
     * 커리큘럼(unitBreakdown)·예상 결과물 초안을 즉시 반환한다(에드혹 추가, 사용자
     * 요청 — docs/handoffs/ADHOC-01-ai-curriculum-draft.md, docs/ai/contracts-proposal.md §5).
     *
     * 이 엔드포인트는 아무것도 저장하지 않는다 — 반환된 초안은 그대로 또는 자유롭게
     * 수정한 뒤 기존 POST /tutor/courses로 제출해야 실제 커리큘럼이 된다. 즉 "AI로
     * 빠르게 만들기"와 "직접 작성"은 같은 등록 경로를 공유하며, 이 엔드포인트는
     * 그 등록 폼의 초기값을 채워주는 선택적 보조 기능일 뿐이다.
     *
     * 튜터 역할 검사를 두는 이유: 이 초안 생성은 수업 등록 플로우의 일부이고, 응답에
     * 튜터 입력을 그대로 반영하므로 호출 주체를 남겨 두는 편이 안전하다(향후 실제
     * LLM 연동 시 요청량 제한의 단위가 되기도 한다).
     */
    generateCurriculumDraft(user, body) {
        requireRole(user, "tutor");
        if (!body?.topic || !body.topic.trim()) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "topic(가르치고 싶은 분야)을 입력해주세요.");
        }
        if (body.subjectId && !this.refData.subjectExists(body.subjectId)) {
            throw new errors_1.DomainError("VALIDATION_ERROR", `존재하지 않는 subjectId입니다: ${body.subjectId}`);
        }
        return this.curriculumDraft.generateDraft({
            topic: body.topic,
            subjectId: body.subjectId,
            level: body.level,
            sessionCount: body.sessionCount,
        });
    }
    /**
     * 부분 수정 + 상태 전이(draft/pending_review/published/unpublished)를 함께 처리한다.
     * openapi.yaml v0.2.0-s02-baseline에는 아직 이 엔드포인트가 명시되지 않았다
     * (docs/handoffs/S04-T01.md contract_requests에 계약 반영 요청을 남긴다).
     */
    update(id, user, body) {
        requireRole(user, "tutor");
        if (body.subjectId !== undefined || body.lifeZoneId !== undefined) {
            const current = this.courses.requireOwned(id, user.userId);
            validateReferenceIds(this.refData, body.subjectId ?? current.subjectId, body.lifeZoneId ?? current.lifeZoneId);
        }
        if (body.askingPrice !== undefined && body.askingPrice < 0) {
            throw new errors_1.DomainError("VALIDATION_ERROR", "askingPrice는 0 이상이어야 합니다.");
        }
        return this.courses.update(id, user.userId, body);
    }
    /** 소유자만 복제 가능 — 타인 커리큘럼 복제는 403(openapi.yaml 사례와 일치). */
    cloneVersion(courseId, user, body) {
        requireRole(user, "tutor");
        return this.courses.cloneVersion(courseId, user.userId, body?.clonedFromCourseId ?? null);
    }
    listVersions(courseId, user) {
        requireRole(user, "tutor");
        this.courses.requireOwned(courseId, user.userId);
        return this.courses.listVersions(courseId);
    }
    listSubjects() {
        return this.refData.listSubjects();
    }
    listLifeZones() {
        return this.refData.listLifeZones();
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Get)("courses"),
    __param(0, (0, common_1.Query)("subject")),
    __param(1, (0, common_1.Query)("lifeZoneId")),
    __param(2, (0, common_1.Query)("cursor")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "listPublic", null);
__decorate([
    (0, common_1.Get)("courses/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "getPublicDetail", null);
__decorate([
    (0, common_1.Get)("tutor/courses"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)("tutor/courses"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("tutor/courses/curriculum/draft"),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "generateCurriculumDraft", null);
__decorate([
    (0, common_1.Patch)("tutor/courses/:id"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)("tutor/courses/:courseId/versions"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("courseId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "cloneVersion", null);
__decorate([
    (0, common_1.Get)("tutor/courses/:courseId/versions"),
    (0, common_1.UseGuards)(session_guard_1.SessionGuard),
    __param(0, (0, common_1.Param)("courseId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "listVersions", null);
__decorate([
    (0, common_1.Get)("subjects"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "listSubjects", null);
__decorate([
    (0, common_1.Get)("life-zones"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "listLifeZones", null);
exports.CoursesController = CoursesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [courses_repository_1.CoursesRepository,
        reference_data_repository_1.ReferenceDataRepository,
        idempotency_store_1.IdempotencyStore,
        curriculum_draft_service_1.CurriculumDraftService])
], CoursesController);
/** 다른 모듈(identity의 공개 프로필 등)이 재사용할 수 있는 헬퍼. */
function toTeachingEvidenceCourses(courses) {
    return courses
        .filter((c) => c.status === "published")
        .map((c) => ({ sampleDescription: c.sampleDescription, expectedOutcome: c.expectedOutcome }));
}
