"use client";

/**
 * 이벤트 전송 모듈 (S04-T03, A3 UX·프론트엔드).
 *
 * prompt 지침:
 * "추천 반환과 실제 화면 노출을 구분해 이벤트를 전송하라."
 *
 * - recommendation_served: 추천 응답이 수신된 시점에 서버/클라이언트 1회 발행
 * - recommendation_impression: 실제 사용자 뷰포트에 카드가 노출된 시점에 발행 (중복 제거)
 * - course_detail_view: 수업 상세 조회 시 발행
 * - inquiry_started: 협의/상담 진입 시 발행
 */

export type ClientEventType =
  | "recommendation_served"
  | "recommendation_impression"
  | "course_detail_view"
  | "inquiry_started";

export interface EventPayload {
  eventType: ClientEventType;
  timestamp: string;
  courseId?: string;
  tutorId?: string;
  candidateCount?: number;
  recommendationSessionId?: string;
  metadata?: Record<string, unknown>;
}

class EventTracker {
  private memoryQueue: EventPayload[] = [];
  private sentImpressions = new Set<string>();

  /** 이벤트 전송 */
  public track(eventType: ClientEventType, payload: Omit<EventPayload, "eventType" | "timestamp">): void {
    const fullEvent: EventPayload = {
      eventType,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    this.memoryQueue.push(fullEvent);
    if (this.memoryQueue.length > 100) {
      this.memoryQueue.shift();
    }

    // 개발 및 진단 로그
    if (typeof window !== "undefined") {
      const style =
        eventType === "recommendation_served"
          ? "background: #1e40af; color: white; padding: 2px 6px; border-radius: 4px;"
          : eventType === "recommendation_impression"
          ? "background: #065f46; color: white; padding: 2px 6px; border-radius: 4px;"
          : "background: #334155; color: white; padding: 2px 6px; border-radius: 4px;";

      console.log(`%c[EventTracker] ${eventType}`, style, fullEvent);

      try {
        window.dispatchEvent(new CustomEvent("cmt:analytics_event", { detail: fullEvent }));
      } catch {
        // window event dispatch safe
      }
    }
  }

  /**
   * 추천 카드 뷰포트 노출 (Impression) — 한 추천 세션 내에서 동일 courseId 중복 전송 방지
   */
  public trackImpression(courseId: string, recommendationSessionId: string): void {
    const impressionKey = `${recommendationSessionId}:${courseId}`;
    if (this.sentImpressions.has(impressionKey)) {
      return;
    }
    this.sentImpressions.add(impressionKey);
    this.track("recommendation_impression", {
      courseId,
      recommendationSessionId,
    });
  }

  /** 최근 발생한 이벤트 큐 조회 (QA 및 검증용) */
  public getRecentEvents(): EventPayload[] {
    return [...this.memoryQueue];
  }

  public clear(): void {
    this.memoryQueue = [];
    this.sentImpressions.clear();
  }
}

export const eventTracker = new EventTracker();
