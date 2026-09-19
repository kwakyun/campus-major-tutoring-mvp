import { CourseRecord, TimeWindow } from "../catalog/course.types";

export type ReasonCode =
  | "REASON_LIFE_ZONE_NEAR"
  | "REASON_GOAL_KEYWORD"
  | "REASON_LEVEL_ENTRY"
  | "REASON_NEW_TUTOR"
  | "REASON_TIME_MATCH";

export interface RecommendationQuery {
  subjectId?: string;
  lifeZoneId: string;
  goal?: string;
  level?: string;
  desiredWindows?: TimeWindow[];
  excludeTutorIds?: string[];
}

export interface RecommendedCandidate {
  course: CourseRecord;
  reasonCodes: ReasonCode[];
  score: number;
  timeMatches: boolean | null;
}

export interface AlternativeTimeSlot {
  dayOfWeek?: number; // 0 (일) ~ 6 (토)
  startMinute?: number;
  endMinute?: number;
  start?: string;
  end?: string;
  formattedText?: string;
}

export interface RecommendationResponse {
  candidates: RecommendedCandidate[];
  totalEligible: number;
  alternativeTimeSlots?: AlternativeTimeSlot[];
  waitlistPath?: string;
  failureReason?: string;
}

export interface RecommendationEventInput {
  eventType: "recommendation_served" | "recommendation_impression" | "recommendation_click";
  courseId?: string;
  recommendationSessionId: string;
  candidateCount?: number;
  metadata?: Record<string, unknown>;
}
