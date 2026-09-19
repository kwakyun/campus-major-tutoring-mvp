import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// dist(빌드 산출물)에서 가져온다 — esbuild(vitest 기본 변환기)는 emitDecoratorMetadata를
// 지원하지 않아, 타입 기반 생성자 주입(예: VerificationsController의 VerificationsRepository)이
// 소스(src/*.ts)를 직접 트랜스파일하면 undefined로 주입되는 문제가 실제로 발생했다
// (esbuild 트랜스파일 결과로 재현 확인 후 이 방식으로 전환). tsc가 emitDecoratorMetadata를
// 포함해 생성한 dist를 사용하면 실제 운영 코드와 동일한 DI 동작을 검증할 수 있다.
// package.json의 "test": "pnpm run build && vitest run"이 항상 최신 dist를 보장한다.
import { AppModule } from "../dist_app/app.module";
import { AllExceptionsFilter } from "../dist_app/common/http-exception.filter";

/**
 * 인증·인가 흐름 통합 테스트 (S03-T05, A6).
 *
 * docs/qa/S03-foundation.md §3에서 수동 curl로 먼저 검증한 시나리오를 자동화된
 * 회귀 테스트로 고정한다. APP_ENV=local(기본값)이므로 FakeSessionVerifier가
 * 사용된다 — production 분기(부팅 차단)는 별도 프로세스 스폰이 필요해
 * docs/qa/S03-foundation.md §3 시나리오 8/9에서 수동으로 검증했다(이 파일의
 * 범위 밖. 이유: 부팅 실패를 같은 프로세스 안에서 안전하게 재현할 수 없음).
 */
describe("인증·인가 흐름 (FakeSessionVerifier, APP_ENV=local)", () => {
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

  it("쿠키 없이 보호 엔드포인트 접근 시 401", async () => {
    await request(app.getHttpServer()).get("/health/whoami").expect(401);
  });

  it("존재하지 않는 세션 키는 401", async () => {
    await request(app.getHttpServer())
      .get("/health/whoami")
      .set("Cookie", ["session=not-a-real-fixture"])
      .expect(401);
  });

  it("공개 엔드포인트는 인증 없이 200", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(200);
    expect(response.body.status).toBe("ok");
  });

  it("편입준비생(affiliationType=prep)도 로그인·조회 성공 — SRC-01", async () => {
    const response = await request(app.getHttpServer())
      .get("/health/whoami")
      .set("Cookie", ["session=fake-learner-prep"])
      .expect(200);

    expect(response.body.schoolAffiliation.affiliationType).toBe("prep");
    expect(response.body.schoolAffiliation.campusId).toBeNull();
  });

  it("본인 증빙은 조회할 수 있다", async () => {
    const created = await request(app.getHttpServer())
      .post("/verifications")
      .set("Cookie", ["session=fake-tutor"])
      .send({ type: "certification", evidenceKey: "evidence/e2e-test.pdf" })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/verifications/${created.body.id}`)
      .set("Cookie", ["session=fake-tutor"])
      .expect(200);
  });

  it("제3자의 증빙 조회는 403 FORBIDDEN — 타인 증빙 접근 차단 인수 기준", async () => {
    const created = await request(app.getHttpServer())
      .post("/verifications")
      .set("Cookie", ["session=fake-tutor"])
      .send({ type: "certification", evidenceKey: "evidence/e2e-test-2.pdf" })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/verifications/${created.body.id}`)
      .set("Cookie", ["session=fake-learner-enrolled"])
      .expect(403);

    expect(response.body.code).toBe("FORBIDDEN");
  });

  it("심사 담당 운영자는 타인 증빙을 조회할 수 있다", async () => {
    const created = await request(app.getHttpServer())
      .post("/verifications")
      .set("Cookie", ["session=fake-tutor"])
      .send({ type: "certification", evidenceKey: "evidence/e2e-test-3.pdf" })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/verifications/${created.body.id}`)
      .set("Cookie", ["session=fake-operator"])
      .expect(200);
  });
});
