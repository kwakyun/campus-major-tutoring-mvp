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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateQueryService = void 0;
const common_1 = require("@nestjs/common");
const courses_repository_1 = require("./courses.repository");
const tutor_availability_repository_1 = require("./tutor-availability.repository");
/**
 * 추천 모듈(S04-T02, A5)이 사용할 "최신 공개 상태·시간·차단 관계의 후보 조회 계약"
 * (S04-T01 prompt). 공개 HTTP 엔드포인트가 아니라 같은 프로세스 안에서 주입해 쓰는
 * 서비스로 제공한다 — 모듈형 모놀리스 원칙(internal-contracts.md §8: 모듈 간 트랜잭션은
 * 함수 인자로 전달하고 전역/분산 트랜잭션을 도입하지 않는다)과 같은 방향이다.
 *
 * 학교 소속(schoolAffiliation)은 후보 필터링에 쓰지 않는다 — SRC-08 "학교 소속을
 * 자동적인 동일 학교 제한으로 쓰지 마라"를 그대로 지킨다. lifeZoneId만 명시적 조건으로
 * 쓴다.
 */
let CandidateQueryService = class CandidateQueryService {
    constructor(courses, availability) {
        this.courses = courses;
        this.availability = availability;
    }
    findCandidates(query) {
        const excluded = new Set(query.excludeTutorIds ?? []);
        const { items } = this.courses.listPublic({ subjectId: query.subjectId, lifeZoneId: query.lifeZoneId, limit: 50 });
        return items
            .filter((course) => !excluded.has(course.tutorId))
            .map((course) => {
            if (!query.desiredWindows || query.desiredWindows.length === 0) {
                return { course, timeMatches: null };
            }
            const timeMatches = query.desiredWindows.some((w) => this.availability.hasAvailabilityOverlapping(course.tutorId, w));
            return { course, timeMatches };
        });
    }
};
exports.CandidateQueryService = CandidateQueryService;
exports.CandidateQueryService = CandidateQueryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [courses_repository_1.CoursesRepository,
        tutor_availability_repository_1.TutorAvailabilityRepository])
], CandidateQueryService);
