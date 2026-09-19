import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/http-exception.filter";
import { RequestIdMiddleware } from "./common/request-id.middleware";

/**
 * 전공한시간 업무 서버 부트스트랩 (S03-T01/T03, A7/A2).
 *
 * - 서버 비밀키(SESSION_COOKIE_SECRET, SUPABASE_SERVICE_ROLE_KEY 등)는
 *   여기서만 읽고 브라우저 응답에 절대 포함하지 않는다(웹서비스 아키텍처 §10).
 * - PAYMENT_MODE, APP_ENV는 서버 설정이며 클라이언트가 바꿀 수 없다.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 로컬 개발 및 사설망 IP(192.168.x.x 등)에서 apps/web(3000)과 apps/api(4000) 연동을 위해 credentials 포함 CORS를 지원한다.
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        ) ||
        (process.env.APP_ENV ?? "local") !== "production"
      ) {
        return callback(null, true);
      }
      const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000").split(",");
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  });

  app.use(cookieParser());
  app.use(new RequestIdMiddleware().use);
  app.useGlobalFilters(new AllExceptionsFilter());

  const appEnv = process.env.APP_ENV ?? "local";
  if (appEnv === "production" && process.env.AUTH_TEST_BYPASS === "true") {
    // 운영 환경에서 테스트 인증 우회가 켜지는 것을 부팅 단계에서 차단한다(S03-T05 검증 대상).
    throw new Error(
      "AUTH_TEST_BYPASS=true는 production에서 허용되지 않습니다. 서버를 시작하지 않습니다.",
    );
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`[api] listening on :${port} (APP_ENV=${appEnv}, PAYMENT_MODE=${process.env.PAYMENT_MODE ?? "fake"})`);
}

bootstrap();
