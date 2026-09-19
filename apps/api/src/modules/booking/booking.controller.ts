import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionUser } from "../auth/session-user";
import { BookingService } from "./booking.service";
import { CreateBookingInput } from "./booking.types";

@Controller("bookings")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(SessionGuard)
  createBooking(
    @CurrentUser() user: SessionUser,
    @Body() body: CreateBookingInput,
  ) {
    return this.bookingService.createBooking(
      body.conversationId,
      body.proposalId,
      user.userId,
    );
  }

  @Get()
  @UseGuards(SessionGuard)
  listMyBookings(@CurrentUser() user: SessionUser) {
    return this.bookingService.listBookingsByUser(user.userId);
  }

  @Get(":id")
  @UseGuards(SessionGuard)
  getBooking(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.bookingService.requireParticipant(id, user.userId);
  }

  @Post(":id/pay")
  @UseGuards(SessionGuard)
  payBooking(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.bookingService.confirmPayment(id, user.userId);
  }
}
