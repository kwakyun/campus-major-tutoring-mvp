"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogModule = void 0;
const common_1 = require("@nestjs/common");
const courses_controller_1 = require("./courses.controller");
const courses_repository_1 = require("./courses.repository");
const reference_data_repository_1 = require("./reference-data.repository");
const idempotency_store_1 = require("./idempotency.store");
const tutor_availability_controller_1 = require("./tutor-availability.controller");
const tutor_availability_repository_1 = require("./tutor-availability.repository");
const candidate_query_service_1 = require("./candidate-query.service");
const curriculum_draft_service_1 = require("./curriculum-draft.service");
let CatalogModule = class CatalogModule {
};
exports.CatalogModule = CatalogModule;
exports.CatalogModule = CatalogModule = __decorate([
    (0, common_1.Module)({
        controllers: [courses_controller_1.CoursesController, tutor_availability_controller_1.TutorAvailabilityController, tutor_availability_controller_1.TutorPublicAvailabilityController],
        providers: [
            courses_repository_1.CoursesRepository,
            reference_data_repository_1.ReferenceDataRepository,
            idempotency_store_1.IdempotencyStore,
            tutor_availability_repository_1.TutorAvailabilityRepository,
            candidate_query_service_1.CandidateQueryService,
            curriculum_draft_service_1.CurriculumDraftService,
        ],
        exports: [courses_repository_1.CoursesRepository, reference_data_repository_1.ReferenceDataRepository, tutor_availability_repository_1.TutorAvailabilityRepository, candidate_query_service_1.CandidateQueryService],
    })
], CatalogModule);
