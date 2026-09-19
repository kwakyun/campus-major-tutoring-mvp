import { Module } from "@nestjs/common";
import { HealthController } from "./modules/health/health.controller";
import { VerificationsModule } from "./modules/verifications/verifications.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { MatchingModule } from "./modules/matching/matching.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { BillingModule } from "./modules/billing/billing.module";
import { NegotiationModule } from "./modules/negotiation/negotiation.module";
import { BookingModule } from "./modules/booking/booking.module";

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
@Module({
  imports: [
    VerificationsModule,
    IdentityModule,
    CatalogModule,
    MatchingModule,
    RecommendationsModule,
    BillingModule,
    NegotiationModule,
    BookingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
