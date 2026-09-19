import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import {
  RecommendationResponse,
  RecommendationEventInput,
  RecommendationQuery,
} from "./recommendations.types";
import { TimeWindow } from "../catalog/course.types";

@Controller("recommendations")
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  getRecommendations(
    @Query("lifeZoneId") lifeZoneId?: string,
    @Query("subjectId") subjectId?: string,
    @Query("goal") goal?: string,
    @Query("level") level?: string,
    @Query("desiredWindows") desiredWindowsJson?: string,
  ): RecommendationResponse {
    if (!lifeZoneId) {
      throw new BadRequestException("lifeZoneId는 추천 검색의 필수 조건입니다.");
    }

    let desiredWindows: TimeWindow[] | undefined;
    if (desiredWindowsJson) {
      try {
        desiredWindows = JSON.parse(desiredWindowsJson);
      } catch {
        throw new BadRequestException("desiredWindows 형식이 올바른 JSON이 아닙니다.");
      }
    }

    const query: RecommendationQuery = {
      lifeZoneId,
      subjectId: subjectId || undefined,
      goal: goal || undefined,
      level: level || undefined,
      desiredWindows,
    };

    return this.recommendationsService.findRecommendations(query);
  }

  @Post("query")
  @HttpCode(HttpStatus.OK)
  queryRecommendationsPost(@Body() body: RecommendationQuery): RecommendationResponse {
    if (!body || !body.lifeZoneId) {
      throw new BadRequestException("lifeZoneId는 필수 조건입니다.");
    }
    return this.recommendationsService.findRecommendations(body);
  }

  @Post("events")
  @HttpCode(HttpStatus.ACCEPTED)
  recordEvent(@Body() body: RecommendationEventInput) {
    if (!body || !body.eventType || !body.recommendationSessionId) {
      throw new BadRequestException("eventType 및 recommendationSessionId는 필수 이벤트 필드입니다.");
    }
    this.recommendationsService.recordEvent(body);
    return { status: "recorded" };
  }
}
