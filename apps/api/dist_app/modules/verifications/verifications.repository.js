"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationsRepository = void 0;
const common_1 = require("@nestjs/common");
/**
 * S03 기반 단계의 임시 인메모리 저장소. 실제 PostgreSQL 테이블(`verifications`)은
 * S03-T02(db/migrations)에서 스키마가 생성되고, S04에서 이 리포지토리가 실제
 * DB 접근으로 교체된다. 지금은 "본인/제3자 접근 제어" 규칙을 검증 가능하게
 * 시연하는 것이 목적이다(S03-T05 acceptance: 상대방 증빙 조회 거절).
 */
let VerificationsRepository = class VerificationsRepository {
    constructor() {
        this.records = [];
        this.seq = 1;
    }
    create(userId, type, evidenceKey) {
        const record = {
            id: `verification-${this.seq++}`,
            userId,
            type,
            status: "pending",
            evidenceKey,
            rejectionReason: null,
        };
        this.records.push(record);
        return record;
    }
    listByUser(userId) {
        return this.records.filter((r) => r.userId === userId);
    }
    findById(id) {
        return this.records.find((r) => r.id === id);
    }
};
exports.VerificationsRepository = VerificationsRepository;
exports.VerificationsRepository = VerificationsRepository = __decorate([
    (0, common_1.Injectable)()
], VerificationsRepository);
