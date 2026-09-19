import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { LearningRequestsController } from "./learning-requests.controller";
import { LearningRequestsRepository } from "./learning-requests.repository";
import { WaitlistEntriesRepository } from "./waitlist-entries.repository";
import { AdminMatchingController } from "./admin-matching.controller";

@Module({
  imports: [CatalogModule],
  controllers: [LearningRequestsController, AdminMatchingController],
  providers: [LearningRequestsRepository, WaitlistEntriesRepository],
  exports: [LearningRequestsRepository, WaitlistEntriesRepository],
})
export class MatchingModule {}
