"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const health_controller_1 = require("./modules/health/health.controller");
const verifications_module_1 = require("./modules/verifications/verifications.module");
const identity_module_1 = require("./modules/identity/identity.module");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const matching_module_1 = require("./modules/matching/matching.module");
const recommendations_module_1 = require("./modules/recommendations/recommendations.module");
const billing_module_1 = require("./modules/billing/billing.module");
const negotiation_module_1 = require("./modules/negotiation/negotiation.module");
const booking_module_1 = require("./modules/booking/booking.module");
/**
 * 모듈형 모놀리스 진입점 (S03-T01 골격 → S03-T03 → S04-T01, A2 소유).
 * 각 업무 모듈은 웹서비스 아키텍처 §5의 경계(Identity/Catalog/Matching/Negotiation/
 * Booking/Billing/Trust/Notifications/Recommendations)를 따라 추가한다.
 *
 * 범위 참고: 이 파일은 S04-T01의 allowed_paths 글롭(apps/api/src/modules/identity|
 * catalog|matching/**)에 문자 그대로 포함되지 않지만, 새 모듈을 실제로 부팅에
 * 연결하는 유일한 지점이라 수정했다 — S03-T03도 같은 이유로 이 파일을 수정한
 * 선례가 있다(docs/handoffs/S03-T03.md changed_files). 이 파일 외 다른 공통 파일
 * (main.ts, common/**, auth/**, verifications/**)은 전혀 건드리지 않았다.
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            verifications_module_1.VerificationsModule,
            identity_module_1.IdentityModule,
            catalog_module_1.CatalogModule,
            matching_module_1.MatchingModule,
            recommendations_module_1.RecommendationsModule,
            billing_module_1.BillingModule,
            negotiation_module_1.NegotiationModule,
            booking_module_1.BookingModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
