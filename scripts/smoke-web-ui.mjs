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
  await expectText(page, "step-button", "快进一帧");
  await expectText(page, "upgrade-button", "升级纸带");
  await expectText(page, "save-summary", "本轮尚未写入存档。");

  await page.getByTestId("lang-en-button").click();
  await expectText(page, "compile-status", "Waiting");
  await expectText(page, "capacity-label", "Capacity 8");
  await expectText(page, "deploy-button", "Deploy");
  await expectText(page, "step-button", "Frame");
  await expectText(page, "upgrade-button", "Upgrade tape");
  await expectText(page, "save-summary", "No save written this session.");

  await expectText(page, "speed-button", "Speed x1");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "Speed x5");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "Speed x10");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "Speed x1");
  const editorMetrics = await page.evaluate(() => {
    const editor = document.querySelector('[data-testid="tape-editor"]');
    const lines = [...document.querySelectorAll(".code-line")];
    const lineHeight = Number.parseFloat(getComputedStyle(editor).lineHeight);
    return {
      lineHeight,
      firstGap: lines[1].offsetTop - lines[0].offsetTop,
      secondGap: lines[2].offsetTop - lines[1].offsetTop,
      renderedLines: lines.length,
      logicalLines: editor.value.split("\n").length,
    };
  });
  if (
    editorMetrics.renderedLines !== editorMetrics.logicalLines ||
    Math.abs(editorMetrics.firstGap - editorMetrics.lineHeight) > 1 ||
    Math.abs(editorMetrics.secondGap - editorMetrics.lineHeight) > 1
  ) {
    throw new Error(`Expected editor highlight rows to align with textarea rows, got: ${JSON.stringify(editorMetrics)}`);
  }

  const originalTape = await page.getByTestId("tape-editor").inputValue();
  await page.getByTestId("tape-editor").fill("Che");
  await page.locator('[data-testid="tape-autocomplete"]').waitFor({ state: "visible" });
  const checkSuggestion = await page.getByTestId("tape-autocomplete").innerText();
  if (!checkSuggestion.includes("CheckScrap")) {
    throw new Error(`Expected CheckScrap suggestion for Che, got: ${checkSuggestion}`);
  }
  await page.locator('[data-testid="tape-autocomplete"] [data-index="0"]').click();
  await expectValue(page, "tape-editor", "CheckScrap");

  await page.getByTestId("tape-editor").fill("Scr");
  await page.locator('[data-testid="tape-autocomplete"]').waitFor({ state: "visible" });
  const segmentSuggestion = await page.getByTestId("tape-autocomplete").innerText();
  if (!segmentSuggestion.includes("CheckScrap")) {
    throw new Error(`Expected segmented Scrap suggestion for Scr, got: ${segmentSuggestion}`);
  }

  await page.getByTestId("tape-editor").fill("@Loop\nJump ");
  await page.getByTestId("tape-editor").evaluate((editor) => {
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.dispatchEvent(new Event("keyup", { bubbles: true }));
  });
  await page.locator('[data-testid="tape-autocomplete"]').waitFor({ state: "visible" });
  const labelSuggestion = await page.getByTestId("tape-autocomplete").innerText();
  if (!labelSuggestion.includes("@Loop")) {
    throw new Error(`Expected label suggestion after Jump, got: ${labelSuggestion}`);
  }
  await page.locator('[data-testid="tape-autocomplete"] [data-index="0"]').click();
  await expectValue(page, "tape-editor", "@Loop\nJump @Loop");
  await page.getByTestId("tape-editor").fill(originalTape);

  const badTape = `${originalTape}\nBogus`;
  await page.getByTestId("tape-editor").fill(badTape);
  await page.getByTestId("deploy-button").click();
  await expectText(page, "compile-status", "Compile error");
  const diagnosticText = await page.getByTestId("tape-diagnostics").innerText();
  if (!diagnosticText.includes("Line 8") || !diagnosticText.includes("Unknown instruction: Bogus")) {
    throw new Error(`Expected editor diagnostics for Bogus instruction, got: ${diagnosticText}`);
  }
  const unknownTokenCount = await page.locator(".tok-unknown").count();
  if (unknownTokenCount === 0) {
    throw new Error("Expected syntax highlighter to mark an unknown token.");
  }
  await page.locator('[data-testid="tape-diagnostics"] li').first().click();
  const selectedLine = await page.getByTestId("tape-editor").evaluate((editor) =>
    editor.value.slice(editor.selectionStart, editor.selectionEnd),
  );
  if (selectedLine.trim() !== "Bogus") {
    throw new Error(`Expected diagnostic click to select the bad line, got: ${selectedLine}`);
  }
  await page.getByTestId("tape-editor").fill(originalTape);
  await page.getByTestId("tape-editor").evaluate((editor) => {
    const offset = editor.value.indexOf("@Loop", editor.value.indexOf("JumpIfTrue"));
    editor.focus();
    editor.setSelectionRange(offset + 2, offset + 2);
  });
  await page.getByTestId("tape-editor").dispatchEvent("click", { ctrlKey: true });
  const jumpedLine = await page.getByTestId("tape-editor").evaluate((editor) =>
    editor.value.slice(editor.selectionStart, editor.selectionEnd),
  );
  if (jumpedLine.trim() !== "@Loop") {
    throw new Error(`Expected Ctrl-click label reference to select @Loop definition, got: ${jumpedLine}`);
  }

  await page.getByTestId("deploy-button").click();
  await expectText(page, "compile-status", "Compile OK");

  await page.getByTestId("step-button").click();
  await expectText(page, "scrap-count", "1");
  const pickupGhosts = await page.locator(".pickup-ghost").count();
  if (pickupGhosts === 0) {
    throw new Error("Expected pickup to create a recovery animation ghost.");
  }
  const stepDiff = await page.getByTestId("diff-list").innerText();
  if (!stepDiff.includes("resources.scrap") || !stepDiff.includes("deposits.count")) {
    throw new Error(`Expected step diff to include resource and deposit changes, got: ${stepDiff}`);
  }

  await page.getByTestId("step-button").click();
  await expectText(page, "robot-position", "2,2 E");
  const moveDiff = await page.getByTestId("diff-list").innerText();
  if (!moveDiff.includes("robot.x")) {
    throw new Error(`Expected second step to move the robot, got diff: ${moveDiff}`);
  }

  await page.getByTestId("upgrade-button").click();
  await expectText(page, "capacity-label", "Capacity 10");

  for (let index = 0; index < 6; index += 1) {
    await page.getByTestId("step-button").click();
  }
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

  await expectText(page, "scrap-count", "6");
  await page.getByTestId("weapon-upgrade-button").click();
  await page.getByTestId("armor-upgrade-button").click();
  await expectText(page, "weapon-level", "2");
  await expectText(page, "armor-level", "2");
  await expectText(page, "hp-value", "12");
  await expectText(page, "scrap-count", "4");
  await expectText(page, "cell-count", "0");
  const finalDiff = await page.getByTestId("diff-list").innerText();
  if (!finalDiff.includes("robot.armor") || !finalDiff.includes("robot.hp")) {
    throw new Error(`Expected hardware diff to include robot stat changes, got: ${finalDiff}`);
  }

  await page.getByTestId("save-button").click();
  await expectText(page, "save-summary", "Saved tick 32.");
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

  await page.getByTestId("reset-button").click();
  await expectText(page, "armor-level", "1");
  await page.getByTestId("load-button").click();
  await expectText(page, "save-summary", "Loaded tick 32.");
  await expectText(page, "armor-level", "2");
  await expectText(page, "weapon-level", "2");
  await expectText(page, "scrap-count", "4");

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

  await page.getByTestId("play-button").click();
  await page.waitForFunction(() => Number(document.querySelector('[data-testid="tick"]').innerText) > 32);
  await page.getByTestId("pause-button").click();
  await expectText(page, "pause-button", "Resume");
  const pausedTick = await page.getByTestId("tick").innerText();
  await page.waitForTimeout(850);
  await expectText(page, "tick", pausedTick);
  await page.getByTestId("pause-button").click();
  await expectText(page, "pause-button", "Pause");
  await page.getByTestId("reset-button").click();
  await expectText(page, "tick", "0");

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

async function expectValue(page, testId, expected) {
  const value = await page.getByTestId(testId).inputValue();
  if (value !== expected) {
    throw new Error(`Expected ${testId} value to be ${expected}, got ${value}`);
  }
}
