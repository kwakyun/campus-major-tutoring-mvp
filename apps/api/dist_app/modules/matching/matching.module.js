"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingModule = void 0;
const common_1 = require("@nestjs/common");
const catalog_module_1 = require("../catalog/catalog.module");
const learning_requests_controller_1 = require("./learning-requests.controller");
const learning_requests_repository_1 = require("./learning-requests.repository");
const waitlist_entries_repository_1 = require("./waitlist-entries.repository");
const admin_matching_controller_1 = require("./admin-matching.controller");
let MatchingModule = class MatchingModule {
};
exports.MatchingModule = MatchingModule;
exports.MatchingModule = MatchingModule = __decorate([
    (0, common_1.Module)({
        imports: [catalog_module_1.CatalogModule],
        controllers: [learning_requests_controller_1.LearningRequestsController, admin_matching_controller_1.AdminMatchingController],
        providers: [learning_requests_repository_1.LearningRequestsRepository, waitlist_entries_repository_1.WaitlistEntriesRepository],
        exports: [learning_requests_repository_1.LearningRequestsRepository, waitlist_entries_repository_1.WaitlistEntriesRepository],
    })
], MatchingModule);
