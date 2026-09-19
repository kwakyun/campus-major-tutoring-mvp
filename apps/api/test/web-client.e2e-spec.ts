import "reflect-metadata";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AppModule } from "../dist_app/app.module";
import { AllExceptionsFilter } from "../dist_app/common/http-exception.filter";

describe("웹 클라이언트와 실제 API 라우트 연결", () => {
  let app: INestApplication;
  let client: typeof import("../../web/src/lib/api-client");
  let session = "";
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", undefined);
    vi.stubEnv("APP_ENV", "local");
    vi.stubEnv("AUTH_TEST_BYPASS", "false");
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, "127.0.0.1");
    const testOrigin = new URL(await app.getUrl());

    // Only redirect the host to an ephemeral test port; preserve the client's
    // actual path so a mistaken /api prefix causes a real server 404.
    vi.stubGlobal("fetch", (input: string, init?: RequestInit) => {
      const url = new URL(input);
      expect(url.origin).toBe("http://localhost:4000");
      url.host = testOrigin.host;
      const headers = new Headers(init?.headers);
      if (session) headers.set("Cookie", `session=${session}`);
      return originalFetch(url, { ...init, headers });
    });
    client = await import("../../web/src/lib/api-client");
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    await app?.close();
  });

  it("수업 목록을 404 없이 조회한다", async () => {
    expect((await client.listCourses()).items).toBeInstanceOf(Array);
  });

  it("추천 화면의 과목과 생활권 선택 항목을 반환한다", async () => {
    expect((await client.listSubjects()).length).toBeGreaterThan(0);
    const zones = await client.listLifeZones();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].name).toBeTruthy();
  });

  it("비로그인 학습 요청 조회는 404가 아닌 401이다", async () => {
    await expect(client.listMyLearningRequests()).rejects.toMatchObject({ status: 401 });
  });

  it("학습자 세션으로 내 학습 요청을 조회한다", async () => {
    session = "fake-learner-prep";
    expect(await client.listMyLearningRequests()).toBeInstanceOf(Array);
  });
});
