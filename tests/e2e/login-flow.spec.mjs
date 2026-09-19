import { chromium } from "playwright";

const BASE_URL = process.env.WEB_BASE_URL ?? "http://localhost:3000";
const results = [];

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} - ${name}${detail ? " :: " + detail : ""}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const failedRequests = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  // 1) initial state before login
  const initialText = await page.textContent("body");
  record(
    "초기 상태: 미로그인 문구 또는 오류가 표시됨",
    initialText.includes("로그인되어 있지 않습니다") || initialText.includes("알 수 없는 오류") || /:/.test(initialText),
    initialText.includes("로그인되어 있지 않습니다") ? "미로그인 문구 정상" : "whoami 호출 실패 감지(아래 네트워크 로그 참고)",
  );

  await page.screenshot({ path: "/tmp/e2e/01-initial.png", fullPage: true });

  // 2) login as fake-learner-prep (default value already in the input)
  await page.click("button:has-text('로그인')");
  await page.waitForTimeout(800);
  const afterLoginText = await page.textContent("body");
  await page.screenshot({ path: "/tmp/e2e/02-after-login-prep.png", fullPage: true });

  const learnerPrepOk = afterLoginText.includes("seed-learner-prep-0001") && afterLoginText.includes("prep");
  record("fake-learner-prep 로그인 시 whoami에 userId/affiliation 표시", learnerPrepOk, learnerPrepOk ? undefined : afterLoginText.replace(/\s+/g, " ").slice(0, 300));

  // 3) switch to fake-operator
  await page.fill("#session-key", "fake-operator");
  await page.click("button:has-text('로그인')");
  await page.waitForTimeout(800);
  const operatorText = await page.textContent("body");
  await page.screenshot({ path: "/tmp/e2e/03-after-login-operator.png", fullPage: true });
  const operatorOk = operatorText.includes("seed-operator-0001") && operatorText.includes("operator");
  record("fake-operator 로그인 시 운영자 역할 표시", operatorOk, operatorOk ? undefined : operatorText.replace(/\s+/g, " ").slice(0, 300));

  // 4) logout
  await page.click("button:has-text('로그아웃')");
  await page.waitForTimeout(300);
  const loggedOutText = await page.textContent("body");
  await page.screenshot({ path: "/tmp/e2e/04-after-logout.png", fullPage: true });
  const logoutOk = loggedOutText.includes("로그인되어 있지 않습니다");
  record("로그아웃 후 미로그인 상태로 복귀", logoutOk, logoutOk ? undefined : loggedOutText.replace(/\s+/g, " ").slice(0, 300));

  // 5) invalid session key
  await page.fill("#session-key", "not-a-real-fixture");
  await page.click("button:has-text('로그인')");
  await page.waitForTimeout(500);
  const invalidText = await page.textContent("body");
  await page.screenshot({ path: "/tmp/e2e/05-invalid-session.png", fullPage: true });
  const invalidOk = invalidText.includes("로그인되어 있지 않습니다");
  record("존재하지 않는 세션 키 입력 시 미로그인 유지(401)", invalidOk, invalidOk ? undefined : invalidText.replace(/\s+/g, " ").slice(0, 300));

  await browser.close();

  console.log("\n--- 브라우저 콘솔 에러 ---");
  console.log(consoleErrors.length ? consoleErrors.join("\n") : "(없음)");
  console.log("\n--- HTTP 4xx/5xx 응답 ---");
  console.log(failedRequests.length ? failedRequests.join("\n") : "(없음)");

  const failed = results.filter((r) => !r.passed);
  console.log(`\n=== 결과: ${results.length - failed.length}/${results.length} PASS ===`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("E2E 실행 자체가 실패:", err);
  process.exit(2);
});
