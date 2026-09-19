import { Module } from "@nestjs/common";
import { CoursesController } from "./courses.controller";
import { CoursesRepository } from "./courses.repository";
import { ReferenceDataRepository } from "./reference-data.repository";
import { IdempotencyStore } from "./idempotency.store";
import { TutorAvailabilityController, TutorPublicAvailabilityController } from "./tutor-availability.controller";
import { TutorAvailabilityRepository } from "./tutor-availability.repository";
import { CandidateQueryService } from "./candidate-query.service";
import { CurriculumDraftService } from "./curriculum-draft.service";

@Module({
  controllers: [CoursesController, TutorAvailabilityController, TutorPublicAvailabilityController],
  providers: [
    CoursesRepository,
    ReferenceDataRepository,
    IdempotencyStore,
    TutorAvailabilityRepository,
    CandidateQueryService,
    CurriculumDraftService,
  ],
  exports: [CoursesRepository, ReferenceDataRepository, TutorAvailabilityRepository, CandidateQueryService],
})
export class CatalogModule {}
