#!/usr/bin/env node
/**
 * 최소 마이그레이션 러너 (S03-T02, A7).
 *
 * db/migrations/*.sql 을 파일명 순서대로 실행하고, schema_migrations 테이블에
 * 적용 이력을 기록해 재실행 시 이미 적용된 파일을 건너뛴다. 정식 마이그레이션
 * 도구(예: node-pg-migrate) 도입 여부는 아직 결정되지 않았다 — 이 스크립트는
 * S03 시연·CI 검증에 필요한 최소 기능만 제공한다.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[db:migrate] DATABASE_URL이 설정되지 않았습니다. .env.example을 참고하세요.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const entries = await readdir(MIGRATIONS_DIR);
    const files = entries.filter((f) => f.endsWith(".sql")).sort();

    const { rows: appliedRows } = await client.query("SELECT filename FROM schema_migrations");
    const applied = new Set(appliedRows.map((r) => r.filename));

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[db:migrate] skip (이미 적용됨): ${file}`);
        continue;
      }
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`[db:migrate] applying: ${file}`);
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      appliedCount += 1;
    }

    console.log(`[db:migrate] 완료 — 신규 적용 ${appliedCount}건, 총 마이그레이션 ${files.length}건`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[db:migrate] 실패:", error.message);
  process.exit(1);
});
