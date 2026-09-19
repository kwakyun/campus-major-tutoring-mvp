import { Module } from "@nestjs/common";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { NegotiationModule } from "../negotiation/negotiation.module";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [NegotiationModule, BillingModule],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
