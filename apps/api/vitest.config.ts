import { defineConfig } from "vitest/config";

/**
 * NestJS DI는 emitDecoratorMetadata(TypeScript 컴파일러 전용 기능)에 의존한다.
 * esbuild(vitest 기본 변환기)는 이를 지원하지 않으므로, swc 대신 tsc 산출물을
 * 대상으로 테스트한다 — 즉 이 프로젝트의 통합 테스트는 `pnpm run build` 이후
 * dist/를 통해 실행한다(test 스크립트가 build:test로 선행 빌드를 강제).
 */
export default defineConfig({
  test: {
    include: ["test/**/*.e2e-spec.ts"],
    testTimeout: 15000,
  },
});
