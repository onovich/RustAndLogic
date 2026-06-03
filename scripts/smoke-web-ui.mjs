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
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
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
  const storyEntityCount = await page.locator(".grid > .deposit, .grid > .obstacle, .grid > .base-marker, .grid > .robot-avatar").count();
  if (storyEntityCount !== 0) {
    throw new Error(`Expected stage entities to stay unloaded during story mode, got ${storyEntityCount}.`);
  }
  const storyGridMode = await page.evaluate(() => {
    const viewport = document.querySelector(".canvas-viewport");
    const world = document.querySelector(".canvas-world");
    return {
      viewportBackgroundSize: getComputedStyle(viewport).backgroundSize,
      worldGridOpacity: getComputedStyle(world, "::before").opacity,
    };
  });
  if (!storyGridMode.viewportBackgroundSize.includes("40px 40px") || storyGridMode.worldGridOpacity !== "0") {
    throw new Error(`Expected story mode to use the fake viewport grid, got ${JSON.stringify(storyGridMode)}.`);
  }

  await page.getByTestId("settings-toggle").click();
  await page.getByTestId("lang-zh-button").click();
  const zhOpeningText = await page.getByTestId("story-text").innerText();
  if (!zhOpeningText.includes("卫星链路")) {
    throw new Error(`Expected localized Chinese story dialogue, got: ${zhOpeningText}`);
  }
  await expectText(page, "localization-button", "本地化 [中文]");
  await page.getByTestId("lang-auto-button").click();
  await page.getByTestId("lang-en-button").click();
  await expectText(page, "localization-button", "Localization [EN]");
  await page.getByTestId("settings-toggle").click();

  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  const idleEntityCount = await page.locator(".grid > .deposit, .grid > .obstacle, .grid > .base-marker, .grid > .robot-avatar").count();
  if (idleEntityCount < 4) {
    throw new Error(`Expected stage entities to load after story mode, got ${idleEntityCount}.`);
  }
  const idleGridMode = await page.evaluate(() => {
    const viewport = document.querySelector(".canvas-viewport");
    const world = document.querySelector(".canvas-world");
    return {
      viewportBackgroundSize: getComputedStyle(viewport).backgroundSize,
      worldGridOpacity: getComputedStyle(world, "::before").opacity,
      worldGridBackgroundSize: getComputedStyle(world, "::before").backgroundSize,
    };
  });
  if (
    idleGridMode.viewportBackgroundSize.includes("40px 40px") ||
    idleGridMode.worldGridOpacity !== "1" ||
    !idleGridMode.worldGridBackgroundSize.includes("40px 40px")
  ) {
    throw new Error(`Expected idle mode to use the transformed world grid, got ${JSON.stringify(idleGridMode)}.`);
  }

  await expectText(page, "compile-status", "");
  await expectText(page, "capacity-label", "Capacity 8");
  await expectText(page, "play-button", "Play");
  await expectText(page, "step-button", "Step");
  await expectText(page, "speed-button", "1X");
  const lineNumbers = await page.getByTestId("script-line-numbers").innerText();
  if (!lineNumbers.startsWith("01\n02\n03")) {
    throw new Error(`Expected zero-padded line numbers, got: ${lineNumbers}`);
  }

  const stageHeaderLayout = await page.evaluate(() => {
    const panel = document.querySelector(".stage-panel").getBoundingClientRect();
    const heading = document.querySelector(".stage-heading").getBoundingClientRect();
    const canvas = document.querySelector(".canvas-viewport").getBoundingClientRect();
    return {
      panelTop: panel.top,
      headingBottom: heading.bottom,
      canvasTop: canvas.top,
      canvasOffset: canvas.top - panel.top,
      gapBelowHeading: canvas.top - heading.bottom,
    };
  });
  if (stageHeaderLayout.gapBelowHeading > 2 || stageHeaderLayout.canvasOffset > 42) {
    throw new Error(`Expected map canvas to start directly below the stage header, got ${JSON.stringify(stageHeaderLayout)}`);
  }

  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "5X");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "10X");
  await page.getByTestId("speed-button").click();
  await expectText(page, "speed-button", "1X");

  const devDebugState = await page.evaluate(() => {
    const panel = document.querySelector(".dev-panel");
    return {
      open: panel?.dataset.open,
      height: panel?.getBoundingClientRect().height ?? 0,
    };
  });
  if (devDebugState.open !== "false" || devDebugState.height > 4) {
    throw new Error(`Expected developer log drawer to be collapsed by default, got ${JSON.stringify(devDebugState)}.`);
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
  await expectText(page, "objectives-toggle", "◀");
  await page.getByTestId("objectives-toggle").click();
  await page.waitForTimeout(260);
  await expectText(page, "objectives-toggle", "▶");
  const layoutAfterLeftCollapse = await page.evaluate(() => {
    const editor = document.querySelector(".editor-panel").getBoundingClientRect();
    const sidebar = document.querySelector(".location-sidebar").getBoundingClientRect();
    return { editorLeft: editor.left, editorWidth: editor.width, sidebarWidth: sidebar.width };
  });
  if (
    layoutAfterLeftCollapse.editorLeft >= layoutBeforeCollapse.editorLeft ||
    layoutAfterLeftCollapse.editorWidth <= layoutBeforeCollapse.editorWidth
  ) {
    throw new Error(`Expected code area to expand when left panel collapses, got ${JSON.stringify({
      before: layoutBeforeCollapse,
      after: layoutAfterLeftCollapse,
    })}`);
  }
  if (layoutAfterLeftCollapse.sidebarWidth > 50) {
    throw new Error(`Expected collapsed left sidebar to become a narrow rail, got ${JSON.stringify(layoutAfterLeftCollapse)}`);
  }
  await page.getByTestId("right-sidebar-toggle").click();
  await page.waitForTimeout(260);
  const layoutAfterRightCollapse = await page.evaluate(() => {
    const right = document.querySelector(".right-sidebar").getBoundingClientRect();
    return { rightWidth: right.width };
  });
  if (layoutAfterRightCollapse.rightWidth >= layoutBeforeCollapse.rightWidth) {
    throw new Error(`Expected right sidebar to collapse, got ${JSON.stringify(layoutAfterRightCollapse)}`);
  }
  await page.getByTestId("objectives-toggle").click();
  await page.getByTestId("right-sidebar-toggle").click();
  await page.waitForTimeout(260);

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
  if (centerDelta.x > 12 || centerDelta.y > 12) {
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
    const editor = document.querySelector('[data-testid="script-editor"]');
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

  const originalScript = await page.getByTestId("script-editor").inputValue();
  await page.getByTestId("script-editor").fill("Che");
  await page.locator('[data-testid="script-autocomplete"]').waitFor({ state: "visible" });
  const checkSuggestion = (await page.getByTestId("script-autocomplete").innerText()).toUpperCase();
  if (!checkSuggestion.includes("CHECK().HAS(SCRAP)")) {
    throw new Error(`Expected Check().Has(Scrap) suggestion for Che, got: ${checkSuggestion}`);
  }
  await page.locator('[data-testid="script-autocomplete"] [data-index="0"]').click();
  await expectValue(page, "script-editor", "Check().Has(Scrap)");

  await page.getByTestId("script-editor").fill("Back");
  await page.locator('[data-testid="script-autocomplete"]').waitFor({ state: "visible" });
  const backSuggestion = (await page.getByTestId("script-autocomplete").innerText()).toUpperCase();
  if (!backSuggestion.includes("MOVE(BACK)")) {
    throw new Error(`Expected segmented Back suggestion for Move(Back), got: ${backSuggestion}`);
  }

  await page.getByTestId("script-editor").fill("@Loop\nGoto ");
  await page.getByTestId("script-editor").evaluate((editor) => {
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.dispatchEvent(new Event("keyup", { bubbles: true }));
  });
  await page.locator('[data-testid="script-autocomplete"]').waitFor({ state: "visible" });
  const labelSuggestion = (await page.getByTestId("script-autocomplete").innerText()).toUpperCase();
  if (!labelSuggestion.includes("@LOOP")) {
    throw new Error(`Expected label suggestion after Goto, got: ${labelSuggestion}`);
  }
  await page.locator('[data-testid="script-autocomplete"] [data-index="0"]').click();
  await expectValue(page, "script-editor", "@Loop\nGoto @Loop");

  const badScript = `${originalScript}\nBogus`;
  await page.getByTestId("script-editor").fill(badScript);
  await page.getByTestId("play-button").click();
  await expectText(page, "compile-status", "");
  const diagnosticText = await page.getByTestId("script-diagnostics").innerText();
  const diagnosticUpper = diagnosticText.toUpperCase();
  if (!diagnosticUpper.includes("LINE 8") || !diagnosticUpper.includes("UNKNOWN INSTRUCTION: BOGUS")) {
    throw new Error(`Expected editor diagnostics for Bogus instruction, got: ${diagnosticText}`);
  }
  const unknownTokenCount = await page.locator(".tok-unknown").count();
  if (unknownTokenCount === 0) {
    throw new Error("Expected syntax highlighter to mark an unknown token.");
  }
  await page.locator('[data-testid="script-diagnostics"] li').first().click();
  const selectedLine = await page.getByTestId("script-editor").evaluate((editor) =>
    editor.value.slice(editor.selectionStart, editor.selectionEnd),
  );
  if (selectedLine.trim() !== "Bogus") {
    throw new Error(`Expected diagnostic click to select the bad line, got: ${selectedLine}`);
  }

  await page.getByTestId("script-editor").fill(originalScript);
  await page.getByTestId("script-editor").evaluate((editor) => {
    const offset = editor.value.indexOf("@Loop", editor.value.indexOf("IfTrue"));
    editor.focus();
    editor.setSelectionRange(offset + 2, offset + 2);
  });
  await page.getByTestId("script-editor").dispatchEvent("click", { ctrlKey: true });
  const jumpedLine = await page.getByTestId("script-editor").evaluate((editor) =>
    editor.value.slice(editor.selectionStart, editor.selectionEnd),
  );
  if (jumpedLine.trim() !== "@Loop") {
    throw new Error(`Expected Ctrl-click label reference to select @Loop definition, got: ${jumpedLine}`);
  }

  await page.getByTestId("step-button").click();
  await expectText(page, "compile-status", "");
  await expectText(page, "scrap-count", "1");
  const pickupGhosts = await page.locator(".pickup-ghost").count();
  if (pickupGhosts === 0) {
    throw new Error("Expected pickup to create a recovery animation ghost.");
  }

  await page.getByTestId("step-button").click();
  await expectText(page, "robot-position", "R1 // 2,2 E");
  const robotAlignment = await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="world-grid"]')?.getBoundingClientRect();
    const robot = document.querySelector(".robot-avatar")?.getBoundingClientRect();
    if (!grid || !robot) {
      return null;
    }
    const cellWidth = grid.width / 7;
    const cellHeight = grid.height / 5;
    return {
      deltaX: Math.abs(robot.left + robot.width / 2 - (grid.left + 2 * cellWidth + cellWidth / 2)),
      deltaY: Math.abs(robot.top + robot.height / 2 - (grid.top + 2 * cellHeight + cellHeight / 2)),
    };
  });
  if (!robotAlignment || robotAlignment.deltaX > 1 || robotAlignment.deltaY > 1) {
    throw new Error(`Expected robot to stay centered on the stage grid, got ${JSON.stringify(robotAlignment)}.`);
  }

  await page.getByTestId("settings-toggle").click();
  await page.getByTestId("upgrade-button").click();
  await expectText(page, "capacity-label", "Capacity 10");

  const checklist = (await page.getByTestId("flow-checklist").innerText()).toUpperCase();
  for (const label of [
    "Compile a valid script",
    "Collect scrap from the map",
    "Expand logic memory",
    "Upgrade robot hardware",
    "Save and reload progress",
  ]) {
    if (!checklist.includes(label.toUpperCase())) {
      throw new Error(`Expected flow checklist to include ${label}.`);
    }
  }

  await page.getByTestId("save-button").click();
  const savedSummary = await page.getByTestId("save-summary").innerText();
  if (!savedSummary.toUpperCase().includes("SAVED TICK")) {
    throw new Error(`Expected save summary, got: ${savedSummary}`);
  }
  await page.getByTestId("reset-button").click();
  await expectText(page, "scrap-count", "0");
  await ensureVisible(page, "load-button", "settings-toggle");
  await page.getByTestId("load-button").click();
  const loadedSummary = await page.getByTestId("save-summary").innerText();
  if (!loadedSummary.toUpperCase().includes("LOADED TICK")) {
    throw new Error(`Expected load summary, got: ${loadedSummary}`);
  }

  const pausedTickBeforePlay = Number(await page.getByTestId("tick").innerText());
  await page.getByTestId("play-button").click();
  await page.waitForFunction((tick) => Number(document.querySelector('[data-testid="tick"]').innerText) > tick, pausedTickBeforePlay);
  await expectText(page, "play-button", "Pause");
  await page.getByTestId("play-button").click();
  await expectText(page, "play-button", "Resume");
  const pausedTick = await page.getByTestId("tick").innerText();
  await page.waitForTimeout(850);
  await expectText(page, "tick", pausedTick);
  await page.getByTestId("play-button").click();
  await expectText(page, "play-button", "Pause");
  await page.getByTestId("reset-button").click();
  await expectText(page, "tick", "0");

  await page.getByTestId("devlog-toggle").click();
  const devLogState = await page.evaluate(() => {
    const panel = document.querySelector(".dev-panel");
    return {
      open: panel?.dataset.open,
      height: panel?.getBoundingClientRect().height ?? 0,
    };
  });
  if (devLogState.open !== "true" || devLogState.height < 20) {
    throw new Error(`Expected developer log drawer to open, got ${JSON.stringify(devLogState)}.`);
  }
  await expectText(page, "devlog-toggle", "Dev_Log [-]");

  console.log("Web UI smoke passed.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

async function expectText(page, testId, expected) {
  const text = await page.getByTestId(testId).innerText();
  if (text.trim() !== expected && text.trim().toUpperCase() !== expected.toUpperCase()) {
    throw new Error(`Expected ${testId} to be ${expected}, got ${text}`);
  }
}

async function expectValue(page, testId, expected) {
  const value = await page.getByTestId(testId).inputValue();
  if (value !== expected) {
    throw new Error(`Expected ${testId} value to be ${expected}, got ${value}`);
  }
}

async function ensureVisible(page, targetTestId, toggleTestId) {
  if (await page.getByTestId(targetTestId).isVisible()) {
    return;
  }
  await page.getByTestId(toggleTestId).click();
  await page.getByTestId(targetTestId).waitFor({ state: "visible" });
}

function parseScale(transform) {
  return Number(transform.match(/scale\(([-\d.]+)\)/)?.[1] ?? 0);
}

function parseTranslateMagnitude(transform) {
  const matches = [...transform.matchAll(/([-]?\d+(?:\.\d+)?)px/g)].map((match) => Math.abs(Number(match[1])));
  return Math.max(0, ...matches);
}
