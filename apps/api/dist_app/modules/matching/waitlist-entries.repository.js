"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistEntriesRepository = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../../common/errors");
const ACTIVE_STATUSES = ["open", "notified"];
/**
 * 대기 신청(waitlist_entries) 인메모리 저장소 (S04-T01, SRC-03).
 * 대기 신청은 예약·좌석 점유·결제를 생성하지 않는다 — 이 저장소는 bookings/
 * payment_obligations를 전혀 참조하지 않으며, 관련 로직 자체가 없다(설계로 보장).
 *
 * 2026-09-19: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 matching/
 * learning-requests.repository.ts가 시드하는 learning-request-seed-1(waitlisted)에
 * 대응하는 대기 신청 1건을 시드한다 — SRC-03(대기 신청이 예약·결제를 만들지 않음,
 * 대체 시간 안내)이 실제 실행 중인 앱에서도 보이도록 하기 위함이다.
 */
const SEED_WAITLIST_ENTRIES = [
    {
        id: "waitlist-seed-1",
        learningRequestId: "learning-request-seed-1",
        learnerId: "seed-learner-prep-0001",
        desiredWindows: [],
        alternativeTimeAccepted: true,
        notifyConsent: true,
        status: "open",
        createdAt: new Date().toISOString(),
        expiresAt: null,
    },
];
let WaitlistEntriesRepository = class WaitlistEntriesRepository {
    constructor() {
        this.records = new Map(SEED_WAITLIST_ENTRIES.map((r) => [r.id, r]));
        this.seq = 1000;
    }
    /** 같은 학습자가 같은 학습 요청에 이미 활성(open/notified) 대기 신청이 있으면
     * 그 레코드를 그대로 반환한다(중복 신청 처리). */
    create(learningRequestId, learnerId, input) {
        const existing = [...this.records.values()].find((r) => r.learningRequestId === learningRequestId && r.learnerId === learnerId && ACTIVE_STATUSES.includes(r.status));
        if (existing) {
            return { record: existing, isNew: false };
        }
        const record = {
            id: `waitlist-${this.seq++}`,
            learningRequestId,
            learnerId,
            desiredWindows: input.desiredWindows ?? [],
            alternativeTimeAccepted: input.alternativeTimeAccepted ?? false,
            notifyConsent: input.notifyConsent ?? false,
            status: "open",
            createdAt: new Date().toISOString(),
            expiresAt: null,
        };
        this.records.set(record.id, record);
        return { record, isNew: true };
    }
    findById(id) {
        return this.records.get(id);
    }
    withdraw(id, learnerId) {
        const record = this.records.get(id);
        if (!record)
            throw new errors_1.DomainError("NOT_FOUND", "대기 신청을 찾을 수 없습니다.", 404);
        if (record.learnerId !== learnerId) {
            throw new errors_1.DomainError("FORBIDDEN", "본인 대기 신청만 철회할 수 있습니다.", 403);
        }
        record.status = "withdrawn";
        return record;
    }
    listByLearner(learnerId) {
        return [...this.records.values()].filter((r) => r.learnerId === learnerId);
    }
    listForAdmin(status) {
        const all = [...this.records.values()];
        return status ? all.filter((r) => r.status === status) : all;
    }
};
exports.WaitlistEntriesRepository = WaitlistEntriesRepository;
exports.WaitlistEntriesRepository = WaitlistEntriesRepository = __decorate([
    (0, common_1.Injectable)()
], WaitlistEntriesRepository);
