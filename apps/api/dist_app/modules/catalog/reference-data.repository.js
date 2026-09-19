"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceDataRepository = void 0;
const common_1 = require("@nestjs/common");
let ReferenceDataRepository = class ReferenceDataRepository {
    constructor() {
        this.subjects = [
            { id: "00000000-0000-0000-0000-000000000204", name: "파이썬 프로그래밍" },
            { id: "00000000-0000-0000-0000-000000000201", name: "미시경제학" },
            { id: "00000000-0000-0000-0000-000000000202", name: "편입영어" },
            { id: "00000000-0000-0000-0000-000000000203", name: "자료구조와 알고리즘" },
        ];
        this.lifeZones = [
            { id: "00000000-0000-0000-0000-000000000101", name: "부산대학교 정문~부산대역 생활권" },
        ];
    }
    listSubjects() {
        return [...this.subjects];
    }
    listLifeZones() {
        return [...this.lifeZones];
    }
    subjectExists(id) {
        return this.subjects.some((s) => s.id === id);
    }
    lifeZoneExists(id) {
        return this.lifeZones.some((z) => z.id === id);
    }
};
exports.ReferenceDataRepository = ReferenceDataRepository;
exports.ReferenceDataRepository = ReferenceDataRepository = __decorate([
    (0, common_1.Injectable)()
], ReferenceDataRepository);
