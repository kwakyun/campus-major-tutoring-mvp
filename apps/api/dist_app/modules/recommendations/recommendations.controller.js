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
exports.RecommendationsController = void 0;
const common_1 = require("@nestjs/common");
const recommendations_service_1 = require("./recommendations.service");
let RecommendationsController = class RecommendationsController {
    constructor(recommendationsService) {
        this.recommendationsService = recommendationsService;
    }
    getRecommendations(lifeZoneId, subjectId, goal, level, desiredWindowsJson) {
        if (!lifeZoneId) {
            throw new common_1.BadRequestException("lifeZoneId는 추천 검색의 필수 조건입니다.");
        }
        let desiredWindows;
        if (desiredWindowsJson) {
            try {
                desiredWindows = JSON.parse(desiredWindowsJson);
            }
            catch {
                throw new common_1.BadRequestException("desiredWindows 형식이 올바른 JSON이 아닙니다.");
            }
        }
        const query = {
            lifeZoneId,
            subjectId: subjectId || undefined,
            goal: goal || undefined,
            level: level || undefined,
            desiredWindows,
        };
        return this.recommendationsService.findRecommendations(query);
    }
    queryRecommendationsPost(body) {
        if (!body || !body.lifeZoneId) {
            throw new common_1.BadRequestException("lifeZoneId는 필수 조건입니다.");
        }
        return this.recommendationsService.findRecommendations(body);
    }
    recordEvent(body) {
        if (!body || !body.eventType || !body.recommendationSessionId) {
            throw new common_1.BadRequestException("eventType 및 recommendationSessionId는 필수 이벤트 필드입니다.");
        }
        this.recommendationsService.recordEvent(body);
        return { status: "recorded" };
    }
};
exports.RecommendationsController = RecommendationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("lifeZoneId")),
    __param(1, (0, common_1.Query)("subjectId")),
    __param(2, (0, common_1.Query)("goal")),
    __param(3, (0, common_1.Query)("level")),
    __param(4, (0, common_1.Query)("desiredWindows")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Object)
], RecommendationsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)("query"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RecommendationsController.prototype, "queryRecommendationsPost", null);
__decorate([
    (0, common_1.Post)("events"),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecommendationsController.prototype, "recordEvent", null);
exports.RecommendationsController = RecommendationsController = __decorate([
    (0, common_1.Controller)("recommendations"),
    __metadata("design:paramtypes", [recommendations_service_1.RecommendationsService])
], RecommendationsController);
