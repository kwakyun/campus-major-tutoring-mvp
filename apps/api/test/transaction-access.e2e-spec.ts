import "reflect-metadata";
import { createRequire } from "node:module";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NegotiationRepository as NegotiationRepositoryType } from "../src/modules/negotiation/negotiation.repository";
import type { BookingService as BookingServiceType } from "../src/modules/booking/booking.service";
import type { CoursesRepository as CoursesRepositoryType } from "../src/modules/catalog/courses.repository";

// Use one CommonJS loader so provider tokens match AppModule's DI tokens.
const require = createRequire(import.meta.url);
const { AppModule } = require("../dist_app/app.module.js");
const { AllExceptionsFilter } = require("../dist_app/common/http-exception.filter.js");
const { NegotiationRepository } = require("../dist_app/modules/negotiation/negotiation.repository.js");
const { BookingService } = require("../dist_app/modules/booking/booking.service.js");
const { CoursesRepository } = require("../dist_app/modules/catalog/courses.repository.js");

const learner = "seed-learner-prep-0001";
const tutor = "seed-tutor-0001";
const input = {
  scheduledStart: "2027-10-15T10:00:00.000Z",
  scheduledEnd: "2027-10-15T11:00:00.000Z",
  location: "스터디룸",
  agreedPriceAmount: 25000,
};

describe("협의·예약 HTTP 권한 및 입력 검증", () => {
  let app: INestApplication;
  let repo: NegotiationRepositoryType;
  let bookings: BookingServiceType;
  let courses: CoursesRepositoryType;

  beforeEach(async () => {
    vi.stubEnv("APP_ENV", "local");
    vi.stubEnv("PAYMENT_MODE", "fake");
    vi.stubEnv("AUTH_TEST_BYPASS", "false");
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    repo = module.get(NegotiationRepository);
    bookings = module.get(BookingService);
    courses = module.get(CoursesRepository);
  });

  afterEach(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  function makeBooking() {
    const conversation = repo.createConversation("course-1", tutor, learner);
    const proposal = repo.createProposal(conversation.id, tutor, true, input);
    repo.agreeProposal(proposal.id, learner, false);
    return bookings.createBooking(conversation.id, proposal.id, learner).booking;
  }

  it("제3자의 예약 조회와 결제를 거절하고 예약 상태를 유지한다", async () => {
    const booking = makeBooking();
    await request(app.getHttpServer()).get(`/bookings/${booking.id}`)
      .set("Cookie", "session=fake-learner-enrolled").expect(403);
    await request(app.getHttpServer()).post(`/bookings/${booking.id}/pay`)
      .set("Cookie", "session=fake-learner-enrolled").expect(403);
    expect(booking.status).toBe("pending_payment");
  });

  it("당사자 조회, 학습자 모의 결제 및 재시도는 허용하고 튜터 결제는 차단한다", async () => {
    const booking = makeBooking();
    for (const session of ["fake-learner-prep", "fake-tutor"]) {
      await request(app.getHttpServer()).get(`/bookings/${booking.id}`)
        .set("Cookie", `session=${session}`).expect(200);
    }
    await request(app.getHttpServer()).post(`/bookings/${booking.id}/pay`)
      .set("Cookie", "session=fake-tutor").expect(403);
    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer()).post(`/bookings/${booking.id}/pay`)
        .set("Cookie", "session=fake-learner-prep").expect(201);
    }
    expect(booking.status).toBe("confirmed");
  });

  it("실결제 모드에서는 브라우저 요청으로 결제 완료 처리할 수 없다", async () => {
    const booking = makeBooking();
    vi.stubEnv("PAYMENT_MODE", "live");
    await request(app.getHttpServer()).post(`/bookings/${booking.id}/pay`)
      .set("Cookie", "session=fake-learner-prep").expect(403);
    expect(booking.status).toBe("pending_payment");
  });

  it("종료된 예약을 결제 요청으로 되살릴 수 없다", async () => {
    const booking = makeBooking();
    booking.status = "cancelled";
    await request(app.getHttpServer()).post(`/bookings/${booking.id}/pay`)
      .set("Cookie", "session=fake-learner-prep").expect(409);
    expect(booking.status).toBe("cancelled");
  });

  it("내 협의방 경로에 다른 협의방의 제안서 ID를 넣어 동의할 수 없다", async () => {
    const mine = repo.createConversation("course-1", tutor, learner);
    const other = repo.createConversation("course-2", tutor, "seed-learner-enrolled-0001");
    const proposal = repo.createProposal(other.id, tutor, true, input);
    await request(app.getHttpServer()).post(`/conversations/${mine.id}/proposals/${proposal.id}/agree`)
      .set("Cookie", "session=fake-learner-prep").expect(404);
    expect(proposal.agreedByLearner).toBe(false);
    expect(() => repo.agreeProposal(proposal.id, learner, false)).toThrow(/당사자/);
  });

  it.each([
    { scheduledStart: "invalid" },
    { scheduledEnd: input.scheduledStart },
    { agreedPriceAmount: -1 },
    { agreedPriceAmount: 1.5 },
    { totalMinutes: 30 },
    { location: " " },
  ])("잘못된 제안은 기존 제안과 버전을 변경하지 않는다: %j", async (patch) => {
    const conv = repo.createConversation("course-1", tutor, learner);
    const original = repo.createProposal(conv.id, tutor, true, input);
    await request(app.getHttpServer()).post(`/conversations/${conv.id}/proposals`)
      .set("Cookie", "session=fake-learner-prep").send({ ...input, ...patch }).expect(400);
    expect(conv.currentVersion).toBe(1);
    expect(conv.currentProposalId).toBe(original.id);
    expect(original.status).toBe("proposed");
  });

  it("빈 메시지를 저장하지 않는다", async () => {
    const conv = repo.createConversation("course-1", tutor, learner);
    const before = repo.getMessages(conv.id).length;
    await request(app.getHttpServer()).post(`/conversations/${conv.id}/messages`)
      .set("Cookie", "session=fake-learner-prep").send({ text: " " }).expect(400);
    expect(repo.getMessages(conv.id)).toHaveLength(before);
  });

  it("비공개 수업과 비학습자 계정의 협의 생성을 차단한다", async () => {
    const course = courses.create(tutor, {
      subjectId: "subject", lifeZoneId: "zone", learningGoal: "목표", askingPrice: 10000,
    });
    await request(app.getHttpServer()).post("/conversations")
      .set("Cookie", "session=fake-learner-prep").send({ courseId: course.id }).expect(404);
    course.status = "published";
    await request(app.getHttpServer()).post("/conversations")
      .set("Cookie", "session=fake-operator").send({ courseId: course.id }).expect(403);
    await request(app.getHttpServer()).post("/conversations")
      .set("Cookie", "session=fake-learner-prep").send({ courseId: course.id }).expect(201);
  });
});
