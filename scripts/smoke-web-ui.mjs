import { createStaticServer } from "./serve-web-ui.mjs";
import { chromium } from "file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs";

const server = createStaticServer();
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const appUrl = `http://127.0.0.1:${address.port}/`;

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--disable-gpu", "--no-first-run"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      pageErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      pageErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.getByText("System ready", { exact: false }).waitFor({ state: "visible", timeout: 10000 }).catch(async (error) => {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(`App did not initialize: ${error.message} Browser errors: ${pageErrors.join(" | ")} Body: ${bodyText.slice(0, 500)}`);
  });

  if (pageErrors.length > 0) {
    throw new Error(`Browser errors before smoke actions: ${pageErrors.join(" | ")}`);
  }

  await page.getByTestId("lang-zh-button").click();
  await expectText(page, "compile-status", "等待中");
  await expectText(page, "capacity-label", "容量 8");
  await expectText(page, "deploy-button", "部署");
  await expectText(page, "upgrade-button", "升级纸带");
  await expectText(page, "save-summary", "本轮尚未写入存档。");

  await page.getByTestId("lang-en-button").click();
  await expectText(page, "compile-status", "Waiting");
  await expectText(page, "capacity-label", "Capacity 8");
  await expectText(page, "deploy-button", "Deploy");
  await expectText(page, "upgrade-button", "Upgrade tape");
  await expectText(page, "save-summary", "No save written this session.");

  await page.getByTestId("deploy-button").click();
  await expectText(page, "compile-status", "Compile OK");

  await page.getByTestId("step-button").click();
  await expectText(page, "scrap-count", "1");
  const stepDiff = await page.getByTestId("diff-list").innerText();
  if (!stepDiff.includes("resources.scrap") || !stepDiff.includes("deposits.count")) {
    throw new Error(`Expected step diff to include resource and deposit changes, got: ${stepDiff}`);
  }

  await page.getByTestId("upgrade-button").click();
  await expectText(page, "capacity-label", "Capacity 10");

  await page.getByTestId("run-button").click();
  await page.getByTestId("arena-button").click();
  await page.getByTestId("offline-button").click();

  const arenaText = await page.getByTestId("arena-summary").innerText();
  if (!arenaText.includes("Victory")) {
    throw new Error(`Expected arena preview victory, got: ${arenaText}`);
  }

  const offlineText = await page.getByTestId("offline-summary").innerText();
  if (!offlineText.includes("Fast-forwarded 24 ticks")) {
    throw new Error(`Expected offline projection summary, got: ${offlineText}`);
  }

  await expectText(page, "scrap-count", "7");
  await page.getByTestId("weapon-upgrade-button").click();
  await page.getByTestId("armor-upgrade-button").click();
  await expectText(page, "weapon-level", "2");
  await expectText(page, "armor-level", "2");
  await expectText(page, "hp-value", "12");
  await expectText(page, "scrap-count", "5");
  await expectText(page, "cell-count", "0");
  const finalDiff = await page.getByTestId("diff-list").innerText();
  if (!finalDiff.includes("robot.armor") || !finalDiff.includes("robot.hp")) {
    throw new Error(`Expected hardware diff to include robot stat changes, got: ${finalDiff}`);
  }

  await page.getByTestId("save-button").click();
  await expectText(page, "save-summary", "Saved tick 26.");
  await page.getByTestId("reset-button").click();
  await expectText(page, "armor-level", "1");
  await page.getByTestId("load-button").click();
  await expectText(page, "save-summary", "Loaded tick 26.");
  await expectText(page, "armor-level", "2");
  await expectText(page, "weapon-level", "2");
  await expectText(page, "scrap-count", "5");

  const checklist = await page.getByTestId("flow-checklist").innerText();
  for (const label of [
    "Deploy a valid tape",
    "Collect scrap",
    "Upgrade tape",
    "Preview arena",
    "Resolve offline",
    "Upgrade robot hardware",
    "Save and reload",
  ]) {
    if (!checklist.includes(label)) {
      throw new Error(`Expected flow checklist to include ${label}.`);
    }
  }
  const unfinished = await page.locator('[data-testid="flow-checklist"] [data-done="false"]').count();
  if (unfinished !== 0) {
    throw new Error(`Expected full flow checklist to be complete, ${unfinished} items remain.`);
  }

  const logText = await page.getByTestId("console-log").innerText();
  if (
    !logText.includes("Arena preview") ||
    !logText.includes("Tape upgraded") ||
    !logText.includes("Offline projection") ||
    !logText.includes("Weapon upgraded") ||
    !logText.includes("Armor upgraded") ||
    !logText.includes("Loaded save")
  ) {
    throw new Error("Expected console log to include arena, upgrade, offline, hardware, and save events.");
  }

  console.log("Web UI smoke passed.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

async function expectText(page, testId, expected) {
  const text = await page.getByTestId(testId).innerText();
  if (text.trim() !== expected) {
    throw new Error(`Expected ${testId} to be ${expected}, got ${text}`);
  }
}
