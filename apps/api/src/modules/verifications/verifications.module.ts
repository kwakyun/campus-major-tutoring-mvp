import { Module } from "@nestjs/common";
import { VerificationsController } from "./verifications.controller";
import { VerificationsRepository } from "./verifications.repository";

@Module({
  controllers: [VerificationsController],
  providers: [VerificationsRepository],
  exports: [VerificationsRepository],
})
export class VerificationsModule {}
