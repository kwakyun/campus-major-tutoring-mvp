"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorAvailabilityRepository = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../common/errors");
/**
 * 교육자 가능 시간(Availability) — docs/ux/screens.md "가능 시간 관리 |
 * PUT /tutor/availability(기존 아키텍처 §9)"에서 이미 예고된 계약이지만
 * packages/contracts/openapi.yaml v0.2.0-s02-baseline에는 아직 반영되지 않았다
 * (docs/handoffs/S04-T01.md contract_requests).
 *
 * DB에는 이 개념을 위한 전용 테이블이 없다 — `tutor_time_allocations`는 실제
 * 확정된 예약 점유 구간(EXCLUDE 제약)만 표현하고, "가르칠 수 있다고 선언한 시간"과는
 * 다르다. 새 테이블 추가는 db/migrations/**(A1 소유, 이번 명령 allowed_paths 밖)라
 * 여기서는 인메모리로 우선 구현하고 실제 스키마 반영을 remaining_work로 남긴다.
 *
 * packages/domain/time의 겹침 판정 유틸을 쓰고 싶지만, apps/api/package.json이
 * @campus-major-tutoring-mvp/domain-time을 의존성으로 선언하지 않고 있어(같은 이유로
 * 이번 명령 범위 밖) 겹침 판정을 이 파일 안에 최소 형태로 다시 구현한다.
 */
function overlaps(a, b) {
    return new Date(a.start).getTime() < new Date(b.end).getTime() &&
        new Date(b.start).getTime() < new Date(a.end).getTime();
}
/**
 * 2026-09-19: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 catalog/
 * courses.repository.ts가 시드하는 더미 교육자 3명의 가능 시간을 함께 시드한다.
 * 절대 시각(ISO-8601)이라 매번 "다음 주" 같은 상대 계산 대신, 이 파일을 만든 시점
 * (2026-09-19, 토) 기준 다음 한 주의 구체적 날짜를 고정값으로 넣었다 — 실제 DB 연동
 * 전까지는 서버가 재시작될 때마다 이 값으로 초기화된다는 점에 유의.
 */
const SEED_WINDOWS = {
    "seed-tutor-0001": [
        { start: "2026-09-21T18:00:00+09:00", end: "2026-09-21T21:00:00+09:00" }, // 월요일 저녁
        { start: "2026-09-23T18:00:00+09:00", end: "2026-09-23T21:00:00+09:00" }, // 수요일 저녁
    ],
    "seed-tutor-0002": [
        { start: "2026-09-22T19:00:00+09:00", end: "2026-09-22T22:00:00+09:00" }, // 화요일 저녁
        { start: "2026-09-24T19:00:00+09:00", end: "2026-09-24T22:00:00+09:00" }, // 목요일 저녁
    ],
    "seed-tutor-0003": [
        { start: "2026-09-25T18:00:00+09:00", end: "2026-09-25T21:00:00+09:00" }, // 금요일 저녁
        { start: "2026-09-26T14:00:00+09:00", end: "2026-09-26T18:00:00+09:00" }, // 토요일 오후
    ],
};
let TutorAvailabilityRepository = class TutorAvailabilityRepository {
    constructor() {
        this.windowsByTutor = new Map(Object.entries(SEED_WINDOWS).map(([tutorId, windows]) => [
            tutorId,
            windows.map((w) => ({ ...w })),
        ]));
    }
    /** 겹치거나 맞닿은 구간을 정규화(병합)해서 저장한다. */
    setWindows(tutorId, windows) {
        for (const w of windows) {
            if (new Date(w.end).getTime() <= new Date(w.start).getTime()) {
                throw new errors_1.DomainError("VALIDATION_ERROR", `잘못된 시간 구간입니다: ${w.start} ~ ${w.end}`);
            }
        }
        const sorted = [...windows].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        const merged = [];
        for (const current of sorted) {
            const last = merged[merged.length - 1];
            if (last && new Date(current.start).getTime() <= new Date(last.end).getTime()) {
                if (new Date(current.end).getTime() > new Date(last.end).getTime()) {
                    last.end = current.end;
                }
            }
            else {
                merged.push({ ...current });
            }
        }
        this.windowsByTutor.set(tutorId, merged);
        return merged;
    }
    getWindows(tutorId) {
        return this.windowsByTutor.get(tutorId) ?? [];
    }
    /** 추천/매칭 모듈이 사용할 후보 조회 계약의 일부 — 특정 시간대와 겹치는 가능 시간이 있는지. */
    hasAvailabilityOverlapping(tutorId, window) {
        const windows = this.getWindows(tutorId);
        if (windows.length === 0)
            return false;
        return windows.some((w) => overlaps(w, window));
    }
};
exports.TutorAvailabilityRepository = TutorAvailabilityRepository;
exports.TutorAvailabilityRepository = TutorAvailabilityRepository = __decorate([
    (0, common_1.Injectable)()
], TutorAvailabilityRepository);
