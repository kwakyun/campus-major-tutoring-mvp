import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// dist(빌드 산출물)에서 가져온다 — auth-and-verifications.e2e-spec.ts와 동일한 이유
// (emitDecoratorMetadata는 esbuild가 지원하지 않아 소스를 직접 트랜스파일하면 DI가 깨진다).
import { AppModule } from "../dist_app/app.module";
import { AllExceptionsFilter } from "../dist_app/common/http-exception.filter";

/**
 * AI 커리큘럼 초안 생성 통합 테스트 (에드혹 추가, 사용자 요청).
 * 근거 문서: docs/handoffs/ADHOC-01-ai-curriculum-draft.md
 *
 * 실행 이력: device_bash가 이 세션 내내 시작되지 않아, 실제 의존성 버전을 설치한
 * 격리 샌드박스(Claude 클라우드 워크스페이스)에 apps/api 전체(src+test+설정)를
 * 재구성해 `tsc -p tsconfig.json` 빌드와 `vitest run`을 실제로 실행해 검증했다.
 * 최초 실행에서 이 파일의 3개 테스트가 실패했다(POST 응답이 Nest 기본값인 201을
 * 반환 — 이 엔드포인트는 아무것도 저장하지 않으므로 openapi.yaml에 명시된 대로
 * 200이 맞다). courses.controller.ts의 generateCurriculumDraft에 @HttpCode(200)을
 * 추가해 수정 후 재실행 — 이 파일 7개 + auth-and-verifications.e2e-spec.ts 7개,
 * 총 14개 전부 통과(회귀 없음). 실제 사용자 device의 파일도 수정본으로 커밋됨.
 */
describe("AI 커리큘럼 초안 생성 (POST /tutor/courses/curriculum/draft)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.APP_ENV;
    delete process.env.AUTH_TEST_BYPASS;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("인증 없이 호출하면 401", async () => {
    await request(app.getHttpServer())
      .post("/tutor/courses/curriculum/draft")
      .send({ topic: "자료구조" })
      .expect(401);
  });

  it("learner 세션으로 호출하면 403 FORBIDDEN(tutor 역할 필요)", async () => {
    const response = await request(app.getHttpServer())
      .post("/tutor/courses/curriculum/draft")
      .set("Cookie", ["session=fake-learner-enrolled"])
      .send({ topic: "자료구조" })
      .expect(403);

    expect(response.body.code).toBe("FORBIDDEN");
  });

  it("topic 누락 시 400 VALIDATION_ERROR", async () => {
    const response = await request(app.getHttpServer())
      .post("/tutor/courses/curriculum/draft")
      .set("Cookie", ["session=fake-tutor"])
      .send({})
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("tutor 세션 + topic 입력 시 커리큘럼 초안을 생성한다(저장하지 않음)", async () => {
    const response = await request(app.getHttpServer())
      .post("/tutor/courses/curriculum/draft")
      .set("Cookie", ["session=fake-tutor"])
      .send({ topic: "자료구조", sessionCount: 3, level: "introductory" })
      .expect(200);

    expect(response.body.curriculumSource).toBe("ai_generated");
    expect(response.body.unitBreakdown).toHaveLength(3);
    expect(response.body.learningGoal).toContain("자료구조");
    expect(typeof response.body.generatorVersion).toBe("string");
  });

  it("sessionCount 없이 호출하면 기본값(4단원)으로 생성한다", async () => {
    const response = await request(app.getHttpServer())
      .post("/tutor/courses/curriculum/draft")
      .set("Cookie", ["session=fake-tutor"])
      .send({ topic: "미시경제학" })
      .expect(200);

    expect(response.body.unitBreakdown).toHaveLength(4);
  });

  it("생성된 초안을 그대로 제출하면 curriculumSource=ai_generated로 커리큘럼이 등록된다", async () => {
    const draftResponse = await request(app.getHttpServer())
      .post("/tutor/courses/curriculum/draft")
      .set("Cookie", ["session=fake-tutor"])
      .send({ topic: "편입영어 독해", sessionCount: 2 })
      .expect(200);

    const draft = draftResponse.body;

    const subjectsResponse = await request(app.getHttpServer()).get("/subjects").expect(200);
    const lifeZonesResponse = await request(app.getHttpServer()).get("/life-zones").expect(200);

    const created = await request(app.getHttpServer())
      .post("/tutor/courses")
      .set("Cookie", ["session=fake-tutor"])
      .set("Idempotency-Key", `curriculum-draft-e2e-${Date.now()}`)
      .send({
        subjectId: subjectsResponse.body[0].id,
        lifeZoneId: lifeZonesResponse.body[0].id,
        learningGoal: draft.learningGoal,
        unitBreakdown: draft.unitBreakdown,
        expectedOutcome: draft.expectedOutcome,
        totalMinutes: draft.totalMinutes,
        askingPrice: 20000,
        curriculumSource: draft.curriculumSource,
      })
      .expect(201);

    expect(created.body.curriculumSource).toBe("ai_generated");
    expect(created.body.unitBreakdown).toHaveLength(2);
  });

  it("curriculumSource를 생략하고 등록하면 기본값 manual로 저장된다(기존 동작 유지 확인)", async () => {
    const subjectsResponse = await request(app.getHttpServer()).get("/subjects").expect(200);
    const lifeZonesResponse = await request(app.getHttpServer()).get("/life-zones").expect(200);

    const created = await request(app.getHttpServer())
      .post("/tutor/courses")
      .set("Cookie", ["session=fake-tutor"])
      .set("Idempotency-Key", `manual-course-e2e-${Date.now()}`)
      .send({
        subjectId: subjectsResponse.body[0].id,
        lifeZoneId: lifeZonesResponse.body[0].id,
        learningGoal: "직접 작성한 커리큘럼",
        askingPrice: 15000,
      })
      .expect(201);

    expect(created.body.curriculumSource).toBe("manual");
  });
});
