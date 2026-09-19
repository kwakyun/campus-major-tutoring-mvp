"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NegotiationModule = void 0;
const common_1 = require("@nestjs/common");
const negotiation_controller_1 = require("./negotiation.controller");
const negotiation_repository_1 = require("./negotiation.repository");
const catalog_module_1 = require("../catalog/catalog.module");
let NegotiationModule = class NegotiationModule {
};
exports.NegotiationModule = NegotiationModule;
exports.NegotiationModule = NegotiationModule = __decorate([
    (0, common_1.Module)({
        imports: [catalog_module_1.CatalogModule],
        controllers: [negotiation_controller_1.NegotiationController],
        providers: [negotiation_repository_1.NegotiationRepository],
        exports: [negotiation_repository_1.NegotiationRepository],
    })
], NegotiationModule);
