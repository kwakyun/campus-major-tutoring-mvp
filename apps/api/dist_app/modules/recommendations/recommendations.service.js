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
var RecommendationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const candidate_query_service_1 = require("../catalog/candidate-query.service");
const tutor_availability_repository_1 = require("../catalog/tutor-availability.repository");
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
function formatMinutes(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
let RecommendationsService = RecommendationsService_1 = class RecommendationsService {
    constructor(candidateQuery, availabilityRepo) {
        this.candidateQuery = candidateQuery;
        this.availabilityRepo = availabilityRepo;
        this.logger = new common_1.Logger(RecommendationsService_1.name);
        this.eventQueue = [];
    }
    findRecommendations(query) {
        // 1. CandidateQueryService로 1차 유효 후보 조회 (생활권 및 과목 기준 필터, 비공개/차단 제외)
        const rawCandidates = this.candidateQuery.findCandidates({
            subjectId: query.subjectId,
            lifeZoneId: query.lifeZoneId,
            desiredWindows: query.desiredWindows,
            excludeTutorIds: query.excludeTutorIds,
        });
        // 2. 각 후보 스코어링 및 사유 코드 부여
        const evaluated = [];
        for (const { course, timeMatches } of rawCandidates) {
            // 시간 조건이 주어졌으나 불일치하는 경우, 필수 조건을 몰래 완화하지 않기 위해 기본 추천 목록에서는 제외하거나 후순위 처리
            // 단, query.desiredWindows가 명시되었는데 timeMatches === false이면 조건 미충족 후보로 분리
            if (query.desiredWindows && query.desiredWindows.length > 0 && timeMatches === false) {
                continue;
            }
            const reasonCodes = [];
            let score = 0.5; // 기본 베이스라인 점수
            // 생활권 일치 사유
            if (course.lifeZoneId === query.lifeZoneId) {
                reasonCodes.push("REASON_LIFE_ZONE_NEAR");
                score += 0.2;
            }
            // 목표 키워드 일치 사유
            if (query.goal && course.learningGoal.toLowerCase().includes(query.goal.toLowerCase())) {
                reasonCodes.push("REASON_GOAL_KEYWORD");
                score += 0.2;
            }
            // 입문/초급 수준 매칭 사유
            const isUserIntro = query.level?.toLowerCase() === "introductory" ||
                query.level?.toLowerCase() === "beginner" ||
                query.level === "입문" ||
                query.level === "기초";
            const isCourseIntro = !course.prerequisiteLevel ||
                course.prerequisiteLevel.toLowerCase() === "introductory" ||
                course.prerequisiteLevel.toLowerCase() === "beginner" ||
                course.prerequisiteLevel === "입문" ||
                course.prerequisiteLevel === "기초";
            if (isUserIntro && isCourseIntro) {
                reasonCodes.push("REASON_LEVEL_ENTRY");
                score += 0.15;
            }
            // 시간 일치 가산
            if (timeMatches === true) {
                reasonCodes.push("REASON_TIME_MATCH");
                score += 0.25;
            }
            // 신규 교육자 콜드스타트 보정 (평가 0건이라도 0점 처리하지 않고 신규 튜터 배지 및 가산)
            reasonCodes.push("REASON_NEW_TUTOR");
            evaluated.push({
                course,
                reasonCodes,
                score: Math.min(score, 1.0),
                timeMatches,
            });
        }
        // 3. 점수 내림차순 정렬
        evaluated.sort((a, b) => b.score - a.score);
        // 4. 일치 후보가 없을 경우 대체 시간 제안 및 대기 신청 안내 (SRC-03, SRC-10)
        let alternativeTimeSlots;
        let waitlistPath;
        let failureReason;
        if (evaluated.length === 0) {
            failureReason = "현재 선택하신 조건(과목/시간/생활권)에 완전히 부합하는 개설 수업이 없습니다.";
            // 해당 과목 또는 생활권에 개설된 수업의 교육자 가용시간을 검색하여 대체 시간으로 제안
            const altWindows = this.findAlternativeSlots(query.lifeZoneId, query.subjectId);
            if (altWindows.length > 0) {
                alternativeTimeSlots = altWindows;
            }
            const qParams = new URLSearchParams();
            if (query.subjectId)
                qParams.set("subjectId", query.subjectId);
            if (query.lifeZoneId)
                qParams.set("lifeZoneId", query.lifeZoneId);
            qParams.set("waitlist", "true");
            waitlistPath = `/learning-requests/new?${qParams.toString()}`;
        }
        return {
            candidates: evaluated,
            totalEligible: evaluated.length,
            alternativeTimeSlots,
            waitlistPath,
            failureReason,
        };
    }
    findAlternativeSlots(lifeZoneId, subjectId) {
        const { items: allCourses } = this.candidateQuery["courses"].listPublic({
            lifeZoneId,
            subjectId,
            limit: 10,
        });
        const slots = [];
        const seen = new Set();
        for (const c of allCourses) {
            const tutorWindows = this.availabilityRepo.getWindows(c.tutorId);
            for (const w of tutorWindows) {
                const key = `${w.start}-${w.end}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    const startDate = new Date(w.start);
                    const endDate = new Date(w.end);
                    const day = startDate.getDay();
                    const startMin = startDate.getHours() * 60 + startDate.getMinutes();
                    const endMin = endDate.getHours() * 60 + endDate.getMinutes();
                    slots.push({
                        start: w.start,
                        end: w.end,
                        dayOfWeek: day,
                        startMinute: startMin,
                        endMinute: endMin,
                        formattedText: `${DAY_LABELS[day]}요일 ${formatMinutes(startMin)} - ${formatMinutes(endMin)}`,
                    });
                }
                if (slots.length >= 4)
                    break;
            }
            if (slots.length >= 4)
                break;
        }
        return slots;
    }
    recordEvent(event) {
        this.eventQueue.push({
            ...event,
            receivedAt: new Date().toISOString(),
        });
        if (this.eventQueue.length > 500) {
            this.eventQueue.shift();
        }
        this.logger.debug(`[EventTracked] ${event.eventType} for session ${event.recommendationSessionId} (queue: ${this.eventQueue.length})`);
    }
    getRecentEvents() {
        return [...this.eventQueue];
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = RecommendationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [candidate_query_service_1.CandidateQueryService,
        tutor_availability_repository_1.TutorAvailabilityRepository])
], RecommendationsService);
