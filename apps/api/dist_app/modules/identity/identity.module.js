"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityModule = void 0;
const common_1 = require("@nestjs/common");
const verifications_module_1 = require("../verifications/verifications.module");
const catalog_module_1 = require("../catalog/catalog.module");
const tutor_profile_controller_1 = require("./tutor-profile.controller");
const tutor_profile_repository_1 = require("./tutor-profile.repository");
/**
 * identity 모듈은 verifications 모듈(S03-T03에서 구현됨)과 catalog 모듈을 그대로
 * 가져다 쓴다 — 이 두 모듈의 파일 자체는 수정하지 않는다(S04-T01 allowed_paths 밖).
 */
let IdentityModule = class IdentityModule {
};
exports.IdentityModule = IdentityModule;
exports.IdentityModule = IdentityModule = __decorate([
    (0, common_1.Module)({
        imports: [verifications_module_1.VerificationsModule, catalog_module_1.CatalogModule],
        controllers: [tutor_profile_controller_1.TutorProfileController],
        providers: [tutor_profile_repository_1.TutorProfileRepository],
        exports: [tutor_profile_repository_1.TutorProfileRepository],
    })
], IdentityModule);
