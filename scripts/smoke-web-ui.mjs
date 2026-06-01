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
  await page.getByTestId("world-grid").waitFor({ state: "visible", timeout: 10000 }).catch(async (error) => {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(`App did not initialize: ${error.message} Browser errors: ${pageErrors.join(" | ")} Body: ${bodyText.slice(0, 500)}`);
  });

  if (pageErrors.length > 0) {
    throw new Error(`Browser errors before smoke actions: ${pageErrors.join(" | ")}`);
  }

  await page.getByTestId("story-dialogue").waitFor({ state: "visible" });
  const openingText = await page.getByTestId("story-text").innerText();
  if (!openingText.includes("satellite uplink") && !openingText.includes("卫星链路")) {
    throw new Error(`Expected opening story dialogue, got: ${openingText}`);
  }
  await page.locator(".settings-panel").evaluate((details) => {
    details.open = true;
  });
  await page.getByTestId("lang-zh-button").click();
  const zhOpeningText = await page.getByTestId("story-text").innerText();
  if (!zhOpeningText.includes("卫星链路")) {
    throw new Error(`Expected localized Chinese story dialogue, got: ${zhOpeningText}`);
  }
  await page.getByTestId("lang-en-button").click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });

  await page.locator(".settings-panel").evaluate((details) => {
    details.open = true;
  });
  await page.getByTestId("lang-zh-button").click();
  await expectText(page, "play-button", "▶");
  await expectText(page, "step-button", "⏭");
  await expectText(page, "save-summary", "本轮尚未写入存档。");
  await page.getByTestId("lang-en-button").click();
  await expectText(page, "compile-status", "Waiting");
  await expectText(page, "capacity-label", "Capacity 8");
  await expectText(page, "play-button", "▶");
  await expectText(page, "step-button", "⏭");
  await expectText(page, "speed-button", "x1");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "x5");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "x10");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "x1");

  const devDebugVisible = await page.locator(".dev-panel [data-testid='diff-list']").isVisible();
  if (devDebugVisible) {
    throw new Error("Expected developer diff panel to be closed by default.");
  }
  const arenaButtonCount = await page.getByTestId("arena-button").count();
  if (arenaButtonCount !== 0) {
    throw new Error("Expected arena preview to be removed from the player UI.");
  }

  const layoutBeforeCollapse = await page.evaluate(() => {
    const editor = document.querySelector(".editor-panel").getBoundingClientRect();
    const right = document.querySelector(".right-sidebar").getBoundingClientRect();
    return { editorLeft: editor.left, editorWidth: editor.width, rightWidth: right.width };
  });
  await expectText(page, "objectives-toggle", "[-]");
  await page.getByTestId("objectives-toggle").click();
  await page.waitForTimeout(240);
  await expectText(page, "objectives-toggle", "[+]");
  const layoutAfterLeftCollapse = await page.evaluate(() => {
    const editor = document.querySelector(".editor-panel").getBoundingClientRect();
    const button = document.querySelector('[data-testid="objectives-toggle"]').getBoundingClientRect();
    const sidebar = document.querySelector(".location-sidebar").getBoundingClientRect();
    return {
      editorLeft: editor.left,
      editorWidth: editor.width,
      buttonCenter: button.left + button.width / 2,
      sidebarCenter: sidebar.left + sidebar.width / 2,
    };
  });
  if (
    layoutAfterLeftCollapse.editorLeft >= layoutBeforeCollapse.editorLeft ||
    layoutAfterLeftCollapse.editorWidth <= layoutBeforeCollapse.editorWidth
  ) {
    throw new Error(
      `Expected code area to expand when left panel collapses, got ${JSON.stringify({
        before: layoutBeforeCollapse,
        after: layoutAfterLeftCollapse,
      })}`,
    );
  }
  if (Math.abs(layoutAfterLeftCollapse.buttonCenter - layoutAfterLeftCollapse.sidebarCenter) > 1) {
    throw new Error(`Expected collapsed left toggle to be centered, got ${JSON.stringify(layoutAfterLeftCollapse)}`);
  }
  await page.getByTestId("right-sidebar-toggle").click();
  await page.waitForTimeout(240);
  const layoutAfterRightCollapse = await page.evaluate(() => {
    const right = document.querySelector(".right-sidebar").getBoundingClientRect();
    return { rightWidth: right.width };
  });
  if (layoutAfterRightCollapse.rightWidth >= layoutBeforeCollapse.rightWidth) {
    throw new Error(`Expected right sidebar to collapse, got ${JSON.stringify(layoutAfterRightCollapse)}`);
  }
  await page.getByTestId("objectives-toggle").click();
  await page.getByTestId("right-sidebar-toggle").click();
  await page.waitForTimeout(240);

  await page.waitForFunction(() => document.querySelector('[data-testid="world-canvas"]')?.dataset.camera === "ready");
  const transformBeforeCanvasMove = await page.getByTestId("world-canvas-world").evaluate((node) => node.style.transform);
  const defaultScale = parseScale(transformBeforeCanvasMove);
  if (defaultScale < 0.6 || defaultScale > 2.1) {
    throw new Error(`Expected default camera scale to fit the map with margins, got: ${transformBeforeCanvasMove}`);
  }
  const canvasBox = await page.getByTestId("world-canvas").boundingBox();
  const gridBox = await page.getByTestId("world-grid").boundingBox();
  const centerDelta = {
    x: Math.abs(gridBox.x + gridBox.width / 2 - (canvasBox.x + canvasBox.width / 2)),
    y: Math.abs(gridBox.y + gridBox.height / 2 - (canvasBox.y + canvasBox.height / 2)),
  };
  if (centerDelta.x > 8 || centerDelta.y > 8) {
    throw new Error(`Expected default camera to center the map in the canvas, got: ${JSON.stringify(centerDelta)}`);
  }
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 40, canvasBox.y + canvasBox.height / 2 + 20);
  await page.mouse.up();
  await page.mouse.wheel(0, -240);
  const transformAfterCanvasMove = await page.getByTestId("world-canvas-world").evaluate((node) => node.style.transform);
  if (transformAfterCanvasMove === transformBeforeCanvasMove || !transformAfterCanvasMove.includes("scale(")) {
    throw new Error(`Expected infinite canvas pan/zoom transform, got: ${transformAfterCanvasMove}`);
  }
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 5000, canvasBox.y + canvasBox.height / 2 + 5000);
  await page.mouse.up();
  await page.mouse.wheel(0, -8000);
  const clampedTransform = await page.getByTestId("world-canvas-world").evaluate((node) => node.style.transform);
  if (parseTranslateMagnitude(clampedTransform) > 520 || parseScale(clampedTransform) > 2.1) {
    throw new Error(`Expected canvas pan/zoom to be clamped, got: ${clampedTransform}`);
  }

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
  if (!checkSuggestion.includes("Check().Has(Scrap)")) {
    throw new Error(`Expected Check().Has(Scrap) suggestion for Che, got: ${checkSuggestion}`);
  }
  await page.locator('[data-testid="tape-autocomplete"] [data-index="0"]').click();
  await expectValue(page, "tape-editor", "Check().Has(Scrap)");

  await page.getByTestId("tape-editor").fill("Back");
  await page.locator('[data-testid="tape-autocomplete"]').waitFor({ state: "visible" });
  const backSuggestion = await page.getByTestId("tape-autocomplete").innerText();
  if (!backSuggestion.includes("Move(Back)")) {
    throw new Error(`Expected segmented Back suggestion for Move(Back), got: ${backSuggestion}`);
  }

  await page.getByTestId("tape-editor").fill("@Loop\nGoto ");
  await page.getByTestId("tape-editor").evaluate((editor) => {
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.dispatchEvent(new Event("keyup", { bubbles: true }));
  });
  await page.locator('[data-testid="tape-autocomplete"]').waitFor({ state: "visible" });
  const labelSuggestion = await page.getByTestId("tape-autocomplete").innerText();
  if (!labelSuggestion.includes("@Loop")) {
    throw new Error(`Expected label suggestion after Goto, got: ${labelSuggestion}`);
  }
  await page.locator('[data-testid="tape-autocomplete"] [data-index="0"]').click();
  await expectValue(page, "tape-editor", "@Loop\nGoto @Loop");

  const badTape = `${originalTape}\nBogus`;
  await page.getByTestId("tape-editor").fill(badTape);
  await page.getByTestId("play-button").click();
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
    const offset = editor.value.indexOf("@Loop", editor.value.indexOf("IfTrue"));
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

  await page.getByTestId("step-button").click();
  await expectText(page, "compile-status", "Compile OK");
  await expectText(page, "scrap-count", "1");
  const pickupGhosts = await page.locator(".pickup-ghost").count();
  if (pickupGhosts === 0) {
    throw new Error("Expected pickup to create a recovery animation ghost.");
  }

  await page.getByTestId("step-button").click();
  await expectText(page, "robot-position", "2,2 E");

  await page.getByTestId("upgrade-button").click();
  await expectText(page, "capacity-label", "Capacity 10");

  const checklist = await page.getByTestId("flow-checklist").innerText();
  for (const label of [
    "Compile a valid tape",
    "Collect scrap",
    "Upgrade tape",
    "Upgrade robot hardware",
    "Save and reload",
  ]) {
    if (!checklist.includes(label)) {
      throw new Error(`Expected flow checklist to include ${label}.`);
    }
  }

  await page.locator(".settings-panel").evaluate((details) => {
    details.open = true;
  });
  await page.getByTestId("save-button").click();
  const savedSummary = await page.getByTestId("save-summary").innerText();
  if (!savedSummary.includes("Saved tick")) {
    throw new Error(`Expected save summary, got: ${savedSummary}`);
  }
  await page.getByTestId("reset-button").click();
  await expectText(page, "scrap-count", "0");
  await page.locator(".settings-panel").evaluate((details) => {
    details.open = true;
  });
  await page.getByTestId("load-button").click();
  const loadedSummary = await page.getByTestId("save-summary").innerText();
  if (!loadedSummary.includes("Loaded tick")) {
    throw new Error(`Expected load summary, got: ${loadedSummary}`);
  }

  const pausedTickBeforePlay = Number(await page.getByTestId("tick").innerText());
  await page.getByTestId("play-button").click();
  await page.waitForFunction((tick) => Number(document.querySelector('[data-testid="tick"]').innerText) > tick, pausedTickBeforePlay);
  await page.getByTestId("pause-button").click();
  await expectText(page, "pause-button", "▶");
  const pausedTick = await page.getByTestId("tick").innerText();
  await page.waitForTimeout(850);
  await expectText(page, "tick", pausedTick);
  await page.getByTestId("pause-button").click();
  await expectText(page, "pause-button", "Ⅱ");
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

function parseScale(transform) {
  return Number(transform.match(/scale\(([-\d.]+)\)/)?.[1] ?? 0);
}

function parseTranslateMagnitude(transform) {
  const matches = [...transform.matchAll(/([-]?\d+(?:\.\d+)?)px/g)].map((match) => Math.abs(Number(match[1])));
  return Math.max(0, ...matches);
}
