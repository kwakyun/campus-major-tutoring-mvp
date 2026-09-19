#!/usr/bin/env node
/**
 * 데모 시드 실행기 (S03-T02, A7). db/seeds/demo.sql을 실행한다.
 * db/seeds/demo.sql의 모든 데이터는 허구다 — 실제 창업자·기관·학생 정보를 담지 않는다
 * (00-workflow.yaml 공통 지침, docs/decisions/policies.md).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[db:seed] DATABASE_URL이 설정되지 않았습니다.");
    process.exit(1);
  }

  const sql = await readFile(path.resolve(process.cwd(), "db/seeds/demo.sql"), "utf8");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("[db:seed] 완료 — db/seeds/demo.sql 적용됨 (허구 데이터)");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[db:seed] 실패:", error.message);
  process.exit(1);
});
