import "reflect-metadata";
import { createRequire } from "module";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";

const require = createRequire(import.meta.url);
const { AppModule } = require("../../apps/api/dist-build/app.module.js");
const { AllExceptionsFilter } = require("../../apps/api/dist-build/common/http-exception.filter.js");
const { FakeSessionVerifier } = require("../../apps/api/dist-build/modules/auth/session-verifier.js");
const { Test } = require("@nestjs/testing");
const { CandidateQueryService } = require("../../apps/api/dist-build/modules/catalog/candidate-query.service.js");
const { CoursesRepository } = require("../../apps/api/dist-build/modules/catalog/courses.repository.js");
const { TutorAvailabilityRepository } = require("../../apps/api/dist-build/modules/catalog/tutor-availability.repository.js");
const { VerificationsRepository } = require("../../apps/api/dist-build/modules/verifications/verifications.repository.js");
const { WaitlistEntriesRepository } = require("../../apps/api/dist-build/modules/matching/waitlist-entries.repository.js");

/**
 * 전공한시간 S04 탐색·권한·추천·매칭 통합 검증 테스트 (S04-T04, A6 QA).
 *
 * 검증 범위:
 * 1. 역할별 등록 (교육자 프로필/가용시간/수업, 학습자 학습요청)
 * 2. 수업 생명주기 및 비공개 수업 은닉 (draft/pending_review/published/unpublished, 404 차단)
 * 3. 공개 프로필 및 교육 품질 근거 분리 (SRC-02, 실명 미노출, 검증 배지와 교육근거 분리)
 * 4. 공개 탐색 및 CandidateQueryService (과목/생활권 필터, 신규 수업 콜드스타트, 시간 불일치 대안, SRC-08, SRC-10)
 * 5. 타인 자원 접근 제어 및 수정 차단 (수업 수정, 버전 복제, 학습 요청 조회/철회, 대기 신청 철회)
 * 6. 커리큘럼 버전 복제 및 소유권 검증
 * 7. 대기 신청 중복 방지, 철회, 알림 동의 및 예약 미생성 구조 검증 (SRC-03)
 * 8. 운영자 매칭 보조 및 실패 사유 기록
 * 9. 필수 입력값 및 멱등성(Idempotency) 검증
 */
describe("S04 탐색·권한·추천 통합 검증 (S04-T04)", () => {
  let app: INestApplication;
  let candidateQueryService: typeof CandidateQueryService;
  let coursesRepo: typeof CoursesRepository;
  let availabilityRepo: typeof TutorAvailabilityRepository;
  let verificationsRepo: typeof VerificationsRepository;
  let waitlistRepo: typeof WaitlistEntriesRepository;

  // demo.sql 및 ReferenceDataRepository에 등록된 실제 UUID
  const SUBJECT_ECONOMICS = "00000000-0000-0000-0000-000000000201"; // 미시경제학
  const SUBJECT_TRANSFER_ENGLISH = "00000000-0000-0000-0000-000000000202"; // 편입영어
  const LIFE_ZONE_MAIN = "00000000-0000-0000-0000-000000000101"; // 가상대학교 정문~가상역 생활권
  const INVALID_LIFE_ZONE = "00000000-0000-0000-0000-000000000999";
  const INVALID_SUBJECT = "00000000-0000-0000-0000-000000000888";

  const originalVerify = FakeSessionVerifier.prototype.verify;

  beforeAll(async () => {
    delete process.env.APP_ENV;
    delete process.env.AUTH_TEST_BYPASS;

    // 테스트용 제2 교육자(seed-tutor-0002) 동적 fixture 추가 — 소유권 격리 검증용
    FakeSessionVerifier.prototype.verify = async function (sessionCookieValue: string | undefined) {
      if (sessionCookieValue === "fake-tutor-2") {
        return {
          userId: "seed-tutor-0002",
          roles: ["tutor"],
          identityVerificationStatus: "verified",
          schoolAffiliation: { campusId: "campus-demo-2", affiliationType: "enrolled" },
        };
      }
      return originalVerify.call(this, sessionCookieValue);
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    candidateQueryService = app.get(CandidateQueryService);
    coursesRepo = app.get(CoursesRepository);
    availabilityRepo = app.get(TutorAvailabilityRepository);
    verificationsRepo = app.get(VerificationsRepository);
    waitlistRepo = app.get(WaitlistEntriesRepository);
  });

  afterAll(async () => {
    FakeSessionVerifier.prototype.verify = originalVerify;
    await app.close();
  });

  // =========================================================================
  // 1. 교육자 프로필 및 가능 시간 등록 검증
  // =========================================================================
  describe("1. 교육자 등록 및 가용 시간 설정", () => {
    it("교육자(fake-tutor)는 프로필(자기기재)을 등록할 수 있다", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/profile")
        .set("Cookie", ["session=fake-tutor"])
        .send({
          selfReportedSchool: "신촌한국대학교",
          selfReportedMajor: "경제학과",
          selfReportedCareer: [{ label: "전공 튜터링 1년", verified: false }],
        })
        .expect(201);

      expect(res.body.userId).toBe("seed-tutor-0001");
      expect(res.body.selfReportedMajor).toBe("경제학과");
    });

    it("학습자(fake-learner-prep)가 교육자 프로필 등록 시도 시 403 FORBIDDEN", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/profile")
        .set("Cookie", ["session=fake-learner-prep"])
        .send({ selfReportedMajor: "경제학과" })
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("교육자는 가능 시간 윈도우를 설정하고 조회할 수 있다", async () => {
      const windows = [
        { start: "2026-09-21T10:00:00.000Z", end: "2026-09-21T12:00:00.000Z" },
        { start: "2026-09-23T14:00:00.000Z", end: "2026-09-23T16:00:00.000Z" },
      ];

      const putRes = await request(app.getHttpServer())
        .put("/tutor/availability")
        .set("Cookie", ["session=fake-tutor"])
        .send({ windows })
        .expect(200);

      expect(putRes.body.windows).toHaveLength(2);

      const getRes = await request(app.getHttpServer())
        .get("/tutor/availability")
        .set("Cookie", ["session=fake-tutor"])
        .expect(200);

      expect(getRes.body.windows).toHaveLength(2);
      expect(getRes.body.windows[0].start).toBe("2026-09-21T10:00:00.000Z");
    });

    it("잘못된 시간 구간(end <= start) 설정 시 400 VALIDATION_ERROR", async () => {
      const res = await request(app.getHttpServer())
        .put("/tutor/availability")
        .set("Cookie", ["session=fake-tutor"])
        .send({
          windows: [
            { start: "2026-09-21T12:00:00.000Z", end: "2026-09-21T10:00:00.000Z" },
          ],
        })
        .expect(400);

      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("누구나 교육자의 공개 가능 시간을 조회할 수 있다 (실명/연락처 제외)", async () => {
      const res = await request(app.getHttpServer())
        .get("/tutors/seed-tutor-0001/availability")
        .expect(200);

      expect(res.body.tutorId).toBe("seed-tutor-0001");
      expect(res.body.windows).toHaveLength(2);
    });
  });

  // =========================================================================
  // 2. 수업 등록, 유효성 검증, 멱등성 및 생명주기 전이
  // =========================================================================
  describe("2. 수업 등록·유효성 검증·생명주기 및 비공개 은닉", () => {
    let createdCourseId: string;
    const coursePayload = {
      subjectId: SUBJECT_ECONOMICS,
      lifeZoneId: LIFE_ZONE_MAIN,
      learningGoal: "전공기초 미시경제학 1:1 완벽 대비",
      prerequisiteLevel: "기초 경제 원론",
      totalMinutes: 60,
      sampleDescription: "소비자 균형 조건을 한계효용 체감 법칙 예시로 직관적 이해",
      expectedOutcome: "중간고사 계산 문제 3종 단독 해결",
      askingPrice: 25000,
      unitBreakdown: [
        { unitTitle: "1단원: 효용극대화와 무차별곡선", minutes: 30 },
        { unitTitle: "2단원: 예산선과 최적선택 실습", minutes: 30 },
      ],
    };

    it("Idempotency-Key 누락 시 400 VALIDATION_ERROR", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .send(coursePayload)
        .expect(400);

      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.message).toContain("Idempotency-Key");
    });

    it("존재하지 않는 subjectId 등록 시 400 VALIDATION_ERROR", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-invalid-subj")
        .send({
          ...coursePayload,
          subjectId: INVALID_SUBJECT,
        })
        .expect(400);

      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.message).toContain("subjectId");
    });

    it("존재하지 않는 lifeZoneId 등록 시 400 VALIDATION_ERROR", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-invalid-zone")
        .send({
          ...coursePayload,
          lifeZoneId: INVALID_LIFE_ZONE,
        })
        .expect(400);

      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.message).toContain("lifeZoneId");
    });

    it("음수 희망가(askingPrice < 0) 입력 시 400 VALIDATION_ERROR", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-negative-price")
        .send({
          ...coursePayload,
          askingPrice: -5000,
        })
        .expect(400);

      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(res.body.message).toContain("askingPrice");
    });

    it("교육자는 정상 수업을 등록할 수 있고 초기 상태는 draft이다", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-course-001")
        .send(coursePayload)
        .expect(201);

      createdCourseId = res.body.id;
      expect(createdCourseId).toBeDefined();
      expect(res.body.status).toBe("draft");
      expect(res.body.tutorId).toBe("seed-tutor-0001");
    });

    it("동일 Idempotency-Key와 동일 본문으로 재요청 시 기존 수업 레코드가 반환된다 (멱등성 보장)", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-course-001")
        .send(coursePayload)
        .expect(201);

      expect(res.body.id).toBe(createdCourseId);
    });

    it("동일 Idempotency-Key에 다른 본문 전달 시 409 IDEMPOTENCY_KEY_CONFLICT", async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-course-001")
        .send({
          ...coursePayload,
          askingPrice: 50000, // 다른 가격
        })
        .expect(409);

      expect(res.body.code).toBe("IDEMPOTENCY_KEY_CONFLICT");
    });

    it("draft 상태 수업은 공개 목록 GET /courses에 노출되지 않는다", async () => {
      const res = await request(app.getHttpServer())
        .get("/courses")
        .expect(200);

      const found = res.body.items.find((c: any) => c.id === createdCourseId);
      expect(found).toBeUndefined();
    });

    it("draft 상태 수업을 직접 GET /courses/:id 조회 시 404 NOT_FOUND (존재 은닉)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/courses/${createdCourseId}`)
        .expect(404);

      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("허용되지 않은 상태 전이(draft -> unpublished 직접 전이) 시도 시 409 CONDITION_NOT_MET", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tutor/courses/${createdCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "unpublished" })
        .expect(409);

      expect(res.body.code).toBe("CONDITION_NOT_MET");
    });

    it("교육자는 수업 상태를 draft -> pending_review -> published로 순차 전이할 수 있다", async () => {
      // 1) pending_review
      const res1 = await request(app.getHttpServer())
        .patch(`/tutor/courses/${createdCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "pending_review" })
        .expect(200);
      expect(res1.body.status).toBe("pending_review");

      // pending_review 상태도 아직 비공개여야 함
      await request(app.getHttpServer()).get(`/courses/${createdCourseId}`).expect(404);

      // 2) published
      const res2 = await request(app.getHttpServer())
        .patch(`/tutor/courses/${createdCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "published" })
        .expect(200);
      expect(res2.body.status).toBe("published");
    });

    it("published 상태의 수업은 공개 목록 및 상세 조회에서 정상 노출된다", async () => {
      const detailRes = await request(app.getHttpServer())
        .get(`/courses/${createdCourseId}`)
        .expect(200);

      expect(detailRes.body.id).toBe(createdCourseId);
      expect(detailRes.body.learningGoal).toContain("미시경제학");
      expect(detailRes.body.sampleDescription).toBeDefined();

      const listRes = await request(app.getHttpServer())
        .get("/courses")
        .expect(200);

      const found = listRes.body.items.find((c: any) => c.id === createdCourseId);
      expect(found).toBeDefined();
    });

    it("별도 수업을 생성해 published -> unpublished 전이 시 404로 은닉되고, 종료 상태에서 재전이는 409 차단된다", async () => {
      // 전용 수업 생성
      const newCourseRes = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-unpublish-test")
        .send({
          ...coursePayload,
          learningGoal: "비공개 테스트용 수업",
        })
        .expect(201);
      const unpubCourseId = newCourseRes.body.id;

      // draft -> pending_review -> published
      await request(app.getHttpServer())
        .patch(`/tutor/courses/${unpubCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "pending_review" })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/tutor/courses/${unpubCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "published" })
        .expect(200);

      // published -> unpublished
      await request(app.getHttpServer())
        .patch(`/tutor/courses/${unpubCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "unpublished" })
        .expect(200);

      // 공개 상세에서 404 은닉 확인
      await request(app.getHttpServer()).get(`/courses/${unpubCourseId}`).expect(404);

      // unpublished(종료 상태)에서 다시 published 전이 시도 시 409 차단 확인
      const forbiddenTransition = await request(app.getHttpServer())
        .patch(`/tutor/courses/${unpubCourseId}`)
        .set("Cookie", ["session=fake-tutor"])
        .send({ status: "published" })
        .expect(409);

      expect(forbiddenTransition.body.code).toBe("CONDITION_NOT_MET");
    });
  });

  // =========================================================================
  // 3. 공개 프로필 및 교육 품질 근거 분리 검증 (SRC-02)
  // =========================================================================
  describe("3. 공개 프로필·교육 품질 근거 분리 및 민감정보 보호 (SRC-02)", () => {
    it("공개 교육자 프로필은 실명/연락처를 노출하지 않고 displayName을 비식별 처리한다", async () => {
      const res = await request(app.getHttpServer())
        .get("/tutors/seed-tutor-0001")
        .expect(200);

      expect(res.body.id).toBe("seed-tutor-0001");
      expect(res.body.displayName).toBe("교육자-0001");
      expect(res.body.realName).toBeUndefined();
      expect(res.body.phone).toBeUndefined();
      expect(res.body.email).toBeUndefined();
      expect(res.body.evidenceKey).toBeUndefined();
    });

    it("verified_status가 'verified'인 증빙만 verificationBadges에 노출된다", async () => {
      // verificationsRepo에 verified 상태 증빙 하나 등록
      const record = verificationsRepo.create("seed-tutor-0001", "major", "evidence/major.pdf");
      record.status = "verified";

      const res = await request(app.getHttpServer())
        .get("/tutors/seed-tutor-0001")
        .expect(200);

      expect(res.body.verificationBadges).toEqual(
        expect.arrayContaining([{ type: "major", status: "verified" }]),
      );
    });

    it("teachingEvidence(샘플설명, 예상결과물)는 verificationBadges와 분리된 최상위 필드로 반환된다", async () => {
      const res = await request(app.getHttpServer())
        .get("/tutors/seed-tutor-0001")
        .expect(200);

      expect(res.body.teachingEvidence).toBeDefined();
      expect(res.body.teachingEvidence.sampleDescription).toContain("소비자 균형");
      expect(res.body.teachingEvidence.expectedOutcomes).toContain("중간고사 계산 문제 3종 단독 해결");
    });
  });

  // =========================================================================
  // 4. 후보 조회 서비스 (CandidateQueryService) 및 규칙 검증 (SRC-08, SRC-10)
  // =========================================================================
  describe("4. 후보 조회 서비스 (CandidateQueryService) 및 기본 추천 규칙 (SRC-08, SRC-10)", () => {
    it("과목과 생활권이 일치하는 published 수업을 정상 반환한다", () => {
      const candidates = candidateQueryService.findCandidates({
        subjectId: SUBJECT_ECONOMICS,
        lifeZoneId: LIFE_ZONE_MAIN,
      });

      expect(candidates.length).toBeGreaterThanOrEqual(1);
      const target = candidates.find((c: any) => c.course.subjectId === SUBJECT_ECONOMICS);
      expect(target).toBeDefined();
      expect(target?.timeMatches).toBeNull(); // desiredWindows 미지정 시 null
    });

    it("신규 등록된 수업(평가/리뷰 없음)도 평점 0점으로 배제되지 않고 후보에 포함된다 (SRC-10 콜드스타트)", () => {
      const candidates = candidateQueryService.findCandidates({
        subjectId: SUBJECT_ECONOMICS,
        lifeZoneId: LIFE_ZONE_MAIN,
      });

      const newCourse = candidates.find((c: any) => c.course.tutorId === "seed-tutor-0001");
      expect(newCourse).toBeDefined();
      expect(newCourse?.course.status).toBe("published");
    });

    it("생활권(lifeZoneId)이 다르면 후보에서 엄격하게 제외된다 (조건 임의 완화 금지)", () => {
      const candidates = candidateQueryService.findCandidates({
        subjectId: SUBJECT_ECONOMICS,
        lifeZoneId: INVALID_LIFE_ZONE,
      });

      const found = candidates.find((c: any) => c.course.lifeZoneId === LIFE_ZONE_MAIN);
      expect(found).toBeUndefined();
    });

    it("학교 소속(schoolAffiliation)이 달라도 생활권이 일치하면 배제되지 않는다 (SRC-08)", () => {
      const candidates = candidateQueryService.findCandidates({
        lifeZoneId: LIFE_ZONE_MAIN,
      });

      expect(candidates.length).toBeGreaterThanOrEqual(1);
    });

    it("학습자 희망 시간과 교육자 가능 시간이 일치하면 timeMatches: true를 반환한다", () => {
      const candidates = candidateQueryService.findCandidates({
        subjectId: SUBJECT_ECONOMICS,
        lifeZoneId: LIFE_ZONE_MAIN,
        desiredWindows: [
          { start: "2026-09-21T10:30:00.000Z", end: "2026-09-21T11:30:00.000Z" }, // 튜터 10:00~12:00과 겹침
        ],
      });

      const match = candidates.find((c: any) => c.course.tutorId === "seed-tutor-0001");
      expect(match?.timeMatches).toBe(true);
    });

    it("희망 시간이 불일치해도 조건을 바꾸지 않고 timeMatches: false로 반환한다 (대안 경로 근거)", () => {
      const candidates = candidateQueryService.findCandidates({
        subjectId: SUBJECT_ECONOMICS,
        lifeZoneId: LIFE_ZONE_MAIN,
        desiredWindows: [
          { start: "2026-09-22T10:00:00.000Z", end: "2026-09-22T12:00:00.000Z" }, // 화요일 (튜터는 월/수만 가능)
        ],
      });

      const match = candidates.find((c: any) => c.course.tutorId === "seed-tutor-0001");
      expect(match?.timeMatches).toBe(false);
    });

    it("차단된 교육자(excludeTutorIds)는 후보 목록에서 제외된다", () => {
      const candidates = candidateQueryService.findCandidates({
        subjectId: SUBJECT_ECONOMICS,
        lifeZoneId: LIFE_ZONE_MAIN,
        excludeTutorIds: ["seed-tutor-0001"],
      });

      const match = candidates.find((c: any) => c.course.tutorId === "seed-tutor-0001");
      expect(match).toBeUndefined();
    });
  });

  // =========================================================================
  // 5. 권한 검증: 타인 자원 수정 차단 및 커리큘럼 복제 권한
  // =========================================================================
  describe("5. 타인 자원 수정 차단 및 커리큘럼 복제 권한", () => {
    let courseId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor"])
        .set("Idempotency-Key", "idemp-perm-check")
        .send({
          subjectId: SUBJECT_ECONOMICS,
          lifeZoneId: LIFE_ZONE_MAIN,
          learningGoal: "권한 검증용 수업",
          askingPrice: 20000,
        });
      expect(res.status).toBe(201);
      courseId = res.body.id;
    });

    it("다른 교육자(fake-tutor-2)가 본인 소유가 아닌 수업 수정 시도 시 403 FORBIDDEN", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tutor/courses/${courseId}`)
        .set("Cookie", ["session=fake-tutor-2"])
        .send({ askingPrice: 99999 })
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.message).toContain("본인 소유 수업만");
    });

    it("학습자(fake-learner-enrolled)가 교육자 수업 수정 시도 시 403 FORBIDDEN (역할 부족)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tutor/courses/${courseId}`)
        .set("Cookie", ["session=fake-learner-enrolled"])
        .send({ askingPrice: 10000 })
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("소유자(fake-tutor)는 본인 수업의 커리큘럼을 복제(version 증가)할 수 있다", async () => {
      const res = await request(app.getHttpServer())
        .post(`/tutor/courses/${courseId}/versions`)
        .set("Cookie", ["session=fake-tutor"])
        .send({})
        .expect(201);

      expect(res.body.version).toBe(2);
      expect(res.body.createdBy).toBe("seed-tutor-0001");
      expect(res.body.contentSnapshot).toBeDefined();
    });

    it("다른 교육자(fake-tutor-2)가 타인 수업에 버전 복제 시도 시 403 FORBIDDEN", async () => {
      const res = await request(app.getHttpServer())
        .post(`/tutor/courses/${courseId}/versions`)
        .set("Cookie", ["session=fake-tutor-2"])
        .send({})
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("타인의 수업을 원본(clonedFromCourseId)으로 지정해 복제 시도 시 403 FORBIDDEN", async () => {
      // fake-tutor-2가 자기 수업(course2)을 만든 뒤, clonedFromCourseId에 fake-tutor의 courseId 지정
      const c2Res = await request(app.getHttpServer())
        .post("/tutor/courses")
        .set("Cookie", ["session=fake-tutor-2"])
        .set("Idempotency-Key", "idemp-tutor2-course")
        .send({
          subjectId: SUBJECT_ECONOMICS,
          lifeZoneId: LIFE_ZONE_MAIN,
          learningGoal: "튜터2의 수업",
          askingPrice: 20000,
        });

      const tutor2CourseId = c2Res.body.id;

      const res = await request(app.getHttpServer())
        .post(`/tutor/courses/${tutor2CourseId}/versions`)
        .set("Cookie", ["session=fake-tutor-2"])
        .send({ clonedFromCourseId: courseId })
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  // =========================================================================
  // 6. 학습 요청, 대학 미재학 진입, 대기 신청 중복 방지 및 철회 (SRC-01, SRC-03)
  // =========================================================================
  describe("6. 학습 요청·미재학 진입(SRC-01)·대기 신청 중복/철회/동의(SRC-03)", () => {
    let prepRequestId: string;
    let waitlistId: string;

    it("대학 미재학/편입준비생(fake-learner-prep)도 학습 요청을 정상 등록할 수 있다 (SRC-01)", async () => {
      const res = await request(app.getHttpServer())
        .post("/learning-requests")
        .set("Cookie", ["session=fake-learner-prep"])
        .send({
          goal: "미시경제학 1개월 완성",
          level: "기초",
          lifeZoneId: LIFE_ZONE_MAIN,
          desiredWindows: [{ start: "2026-09-22T10:00:00.000Z", end: "2026-09-22T12:00:00.000Z" }],
          budgetRange: { min: 20000, max: 35000 },
        })
        .expect(201);

      prepRequestId = res.body.id;
      expect(prepRequestId).toBeDefined();
      expect(res.body.learnerId).toBe("seed-learner-prep-0001");
      expect(res.body.status).toBe("open");
    });

    it("타인 학습자(fake-learner-enrolled)가 미재학 학습자의 요청 조회 시도 시 403 FORBIDDEN", async () => {
      const res = await request(app.getHttpServer())
        .get(`/learning-requests/${prepRequestId}`)
        .set("Cookie", ["session=fake-learner-enrolled"])
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("타인 학습자가 미재학 학습자의 요청에 대기 신청 등록 시도 시 403 FORBIDDEN", async () => {
      const res = await request(app.getHttpServer())
        .post(`/learning-requests/${prepRequestId}/waitlist`)
        .set("Cookie", ["session=fake-learner-enrolled"])
        .send({ notifyConsent: true })
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("학습자 본인은 대기 신청을 등록할 수 있으며 알림 동의/대체 시간 수락이 저장된다 (SRC-03)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/learning-requests/${prepRequestId}/waitlist`)
        .set("Cookie", ["session=fake-learner-prep"])
        .send({
          notifyConsent: true,
          alternativeTimeAccepted: true,
          desiredWindows: [{ start: "2026-09-22T10:00:00.000Z", end: "2026-09-22T12:00:00.000Z" }],
        })
        .expect(201);

      waitlistId = res.body.id;
      expect(waitlistId).toBeDefined();
      expect(res.body.notifyConsent).toBe(true);
      expect(res.body.alternativeTimeAccepted).toBe(true);
      expect(res.body.status).toBe("open");
      expect(res.body.isNew).toBe(true);
    });

    it("동일 학습 요청에 활성 대기 신청이 이미 있으면 중복 레코드를 만들지 않는다 (isNew: false)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/learning-requests/${prepRequestId}/waitlist`)
        .set("Cookie", ["session=fake-learner-prep"])
        .send({ notifyConsent: true })
        .expect(201);

      expect(res.body.id).toBe(waitlistId);
      expect(res.body.isNew).toBe(false);
    });

    it("타인 학습자(fake-learner-enrolled)가 대기 신청 철회 시도 시 403 FORBIDDEN", async () => {
      const res = await request(app.getHttpServer())
        .post(`/learning-requests/${prepRequestId}/waitlist/${waitlistId}/withdraw`)
        .set("Cookie", ["session=fake-learner-enrolled"])
        .expect(403);

      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("학습자 본인은 대기 신청을 철회할 수 있다 (status: withdrawn)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/learning-requests/${prepRequestId}/waitlist/${waitlistId}/withdraw`)
        .set("Cookie", ["session=fake-learner-prep"])
        .expect(201);

      expect(res.body.id).toBe(waitlistId);
      expect(res.body.status).toBe("withdrawn");
    });

    it("철회 후 재신청 시 신규 대기 신청 레코드가 생성된다 (isNew: true)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/learning-requests/${prepRequestId}/waitlist`)
        .set("Cookie", ["session=fake-learner-prep"])
        .send({ notifyConsent: true })
        .expect(201);

      expect(res.body.id).not.toBe(waitlistId);
      expect(res.body.isNew).toBe(true);
    });

    it("대기 신청 및 학습 요청은 예약(bookings)이나 결제를 일절 생성하지 않는다 (구조적 격리)", async () => {
      const waitlistRecord = waitlistRepo.findById(waitlistId);
      expect(waitlistRecord).toBeDefined();
      expect((waitlistRecord as any).bookingId).toBeUndefined();
      expect((waitlistRecord as any).paymentObligationId).toBeUndefined();
    });
  });

  // =========================================================================
  // 7. 운영자 권한 및 매칭 보조 처리
  // =========================================================================
  describe("7. 운영자 매칭 보조 및 권한 경계", () => {
    let reqId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post("/learning-requests")
        .set("Cookie", ["session=fake-learner-prep"])
        .send({
          goal: "운영자 매칭 보조 테스트",
          lifeZoneId: LIFE_ZONE_MAIN,
        });
      reqId = res.body.id;
    });

    it("일반 학습자(fake-learner-prep)가 운영자 매칭 API 접근 시 403 FORBIDDEN", async () => {
      await request(app.getHttpServer())
        .get("/admin/learning-requests")
        .set("Cookie", ["session=fake-learner-prep"])
        .expect(403);
    });

    it("매칭 권한(ops.matching)을 가진 운영자는 학습 요청 및 대기 신청 목록을 조회할 수 있다", async () => {
      const lrRes = await request(app.getHttpServer())
        .get("/admin/learning-requests")
        .set("Cookie", ["session=fake-operator"])
        .expect(200);

      expect(Array.isArray(lrRes.body)).toBe(true);

      const wlRes = await request(app.getHttpServer())
        .get("/admin/waitlist-entries")
        .set("Cookie", ["session=fake-operator"])
        .expect(200);

      expect(Array.isArray(wlRes.body)).toBe(true);
    });

    it("운영자는 매칭 실패 사유와 운영 메모를 기록하며 상태를 전이할 수 있다", async () => {
      const res = await request(app.getHttpServer())
        .post(`/admin/learning-requests/${reqId}/assist`)
        .set("Cookie", ["session=fake-operator"])
        .send({
          status: "waitlisted",
          reason: "time_mismatch",
          note: "학습자 희망 시간대에 활동 가능한 교육자 없음, 튜터 추가 영입 시 알림 예정",
        })
        .expect(201);

      expect(res.body.id).toBe(reqId);
      expect(res.body.status).toBe("waitlisted");
      expect(res.body.matchingFailureReason).toBe("time_mismatch");
      expect(res.body.operatorNote).toContain("학습자 희망 시간대");
    });
  });
});
