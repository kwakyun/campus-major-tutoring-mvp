import { Module } from "@nestjs/common";
import { VerificationsModule } from "../verifications/verifications.module";
import { CatalogModule } from "../catalog/catalog.module";
import { TutorProfileController } from "./tutor-profile.controller";
import { TutorProfileRepository } from "./tutor-profile.repository";

/**
 * identity 모듈은 verifications 모듈(S03-T03에서 구현됨)과 catalog 모듈을 그대로
 * 가져다 쓴다 — 이 두 모듈의 파일 자체는 수정하지 않는다(S04-T01 allowed_paths 밖).
 */
@Module({
  imports: [VerificationsModule, CatalogModule],
  controllers: [TutorProfileController],
  providers: [TutorProfileRepository],
  exports: [TutorProfileRepository],
})
export class IdentityModule {}
