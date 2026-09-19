import { Module } from "@nestjs/common";
import { NegotiationController } from "./negotiation.controller";
import { NegotiationRepository } from "./negotiation.repository";
import { CatalogModule } from "../catalog/catalog.module";

@Module({
  imports: [CatalogModule],
  controllers: [NegotiationController],
  providers: [NegotiationRepository],
  exports: [NegotiationRepository],
})
export class NegotiationModule {}
