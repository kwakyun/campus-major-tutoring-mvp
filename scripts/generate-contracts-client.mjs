#!/usr/bin/env node
/**
 * OpenAPI 클라이언트 코드 생성 스텁 (S03).
 *
 * packages/contracts/openapi.yaml(S02-T05 baseline v0.2.0)로부터 apps/web/apps/api가
 * 공유할 타입/클라이언트를 생성하는 실제 파이프라인은 아직 구축되지 않았다.
 * 지금 apps/web/src/lib/api-client.ts는 필요한 엔드포인트만 수동으로 감싼 임시
 * 클라이언트를 쓰고 있다(S03-T04 handoff 참고). 이 스크립트를 실행하면 그 사실을
 * 명시적으로 알리고 0이 아닌 코드로 종료해, "생성됨"으로 착각하지 않게 한다.
 */
console.error(
  "[contracts:generate] 아직 구현되지 않았습니다. " +
    "openapi.yaml → 클라이언트 코드 생성 파이프라인은 S04 이후 도입 예정입니다. " +
    "현재는 apps/web/src/lib/api-client.ts의 수동 클라이언트를 사용하세요.",
);
process.exit(1);
