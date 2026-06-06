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

  const fontStackCheck = await page.evaluate(() => {
    const body = getComputedStyle(document.body).fontFamily;
    const title = getComputedStyle(document.querySelector(".code-label h1")).fontFamily;
    const editor = getComputedStyle(document.querySelector('[data-testid="script-editor"]')).fontFamily;
    return { body, title, editor };
  });
  if (
    !fontStackCheck.body.includes("RAL Body") ||
    !fontStackCheck.title.includes("RAL Display") ||
    !fontStackCheck.editor.includes("RAL Mono")
  ) {
    throw new Error(`Expected updated font aliases to be applied, got ${JSON.stringify(fontStackCheck)}.`);
  }

  if (pageErrors.length > 0) {
    throw new Error(`Browser errors before smoke actions: ${pageErrors.join(" | ")}`);
  }

  await page.getByTestId("story-dialogue").waitFor({ state: "visible" });
  const openingText = await page.getByTestId("story-text").innerText();
  if (!openingText.trim()) {
    throw new Error(`Expected opening story dialogue, got: ${openingText}`);
  }
  const startupLocation = await page.getByTestId("location-name").innerText();
  if (!startupLocation.trim()) {
    throw new Error(`Expected M1 location title at startup, got: ${startupLocation}`);
  }
  const initialGuidance = await page.getByTestId("resource-guidance").innerText();
  if (!initialGuidance.trim()) {
    throw new Error(`Expected M1 resource guidance, got: ${initialGuidance}`);
  }
  const startupFlowSummary = await page.getByTestId("flow-summary").innerText();
  if (!startupFlowSummary.trim()) {
    throw new Error(`Expected M1 stage target summary, got: ${startupFlowSummary}`);
  }
  const storyEntityCount = await page.locator(".grid .deposit, .grid .obstacle, .grid .base-marker, .grid .robot-avatar").count();
  if (storyEntityCount < 4) {
    throw new Error(`Expected real stage entities to be loaded from startup, got ${storyEntityCount}.`);
  }
  const storyGridMode = await page.evaluate(() => {
    const viewport = document.querySelector(".canvas-viewport");
    const world = document.querySelector(".canvas-world");
    return {
      viewportBackgroundSize: getComputedStyle(viewport).backgroundSize,
      worldGridOpacity: getComputedStyle(world, "::before").opacity,
      worldGridBackgroundSize: getComputedStyle(world, "::before").backgroundSize,
    };
  });
  if (
    storyGridMode.viewportBackgroundSize.includes("40px 40px") ||
    storyGridMode.worldGridOpacity !== "1" ||
    !storyGridMode.worldGridBackgroundSize.includes("40px 40px")
  ) {
    throw new Error(`Expected story mode to show the real world grid from startup, got ${JSON.stringify(storyGridMode)}.`);
  }

  await page.getByTestId("settings-toggle").click();
  await page.getByTestId("lang-zh-button").click();
  const zhOpeningText = await page.getByTestId("story-text").innerText();
  if (!zhOpeningText.trim()) {
    throw new Error(`Expected localized Chinese story dialogue, got: ${zhOpeningText}`);
  }
  const zhLocalizationButton = await page.getByTestId("localization-button").innerText();
  if (!zhLocalizationButton.trim() || zhLocalizationButton.toUpperCase().includes("LOCALIZATION [EN]")) {
    throw new Error(`Expected Chinese localization button label, got: ${zhLocalizationButton}`);
  }
  await page.getByTestId("lang-auto-button").click();
  await page.getByTestId("lang-en-button").click();
  await expectText(page, "localization-button", "Localization [EN]");
  await page.getByTestId("stage-actions").waitFor({ state: "visible" });
  const startupRules = await page.evaluate(() => ({
    facilities: document.querySelector('[data-testid="facility-list"]').innerText.toUpperCase(),
    memoryStageEnabled: document.querySelector('[data-testid="upgrade-button"]').dataset.stageEnabled,
    armorStageEnabled: document.querySelector('[data-testid="armor-upgrade-button"]').dataset.stageEnabled,
    weaponStageEnabled: document.querySelector('[data-testid="weapon-upgrade-button"]').dataset.stageEnabled,
    scriptGuidance: document.querySelector('[data-testid="script-guidance"]').innerText,
    sampleActions: document.querySelector('[data-testid="sample-actions"]').innerText.toUpperCase(),
  }));
  if (!startupRules.facilities.includes("CHARGER") || startupRules.facilities.includes("REPAIR_BAY") || startupRules.facilities.includes("FABRICATOR")) {
    throw new Error(`Expected M1 to expose only charger facility, got: ${JSON.stringify(startupRules)}`);
  }
  if (
    startupRules.memoryStageEnabled !== "true" ||
    startupRules.armorStageEnabled !== "false" ||
    startupRules.weaponStageEnabled !== "false"
  ) {
    throw new Error(`Expected M1 upgrade availability to be memory-only, got: ${JSON.stringify(startupRules)}`);
  }
  if (!startupRules.scriptGuidance.toLowerCase().includes("wake script")) {
    throw new Error(`Expected M1 script guidance, got: ${startupRules.scriptGuidance}`);
  }
  if (!startupRules.sampleActions.includes("M1 WAKE") || startupRules.sampleActions.includes("M2 HAUL LOOP")) {
    throw new Error(`Expected M1 sample presets to stay M1-only, got: ${startupRules.sampleActions}`);
  }
  const stageActions = (await page.getByTestId("stage-actions").innerText()).toUpperCase();
  for (const label of ["M1 WAKE", "M2 HAUL LOOP", "M3 BASE CYCLE", "M4 HOT-ZONE RUN", "M5 STOCK BALANCER", "M6 ARENA INTERCEPT"]) {
    if (!stageActions.includes(label)) {
      throw new Error(`Expected stage actions to include ${label}, got: ${stageActions}`);
    }
  }
  await page.locator('[data-testid="stage-actions"] [data-stage="m2"]').click();
  await expectText(page, "tick", "0");
  await expectText(page, "robot-position", "R1 // 2,4 N");
  await expectText(page, "speed-button", "5X");
  await expectText(page, "location-name", "Relay Ladder");
  const m2Story = await page.getByTestId("story-text").innerText();
  if (!m2Story.toLowerCase().includes("range matters now")) {
    throw new Error(`Expected M2 story briefing after stage switch, got: ${m2Story}`);
  }
  const m2Guidance = await page.getByTestId("resource-guidance").innerText();
  if (!m2Guidance.toLowerCase().includes("battery as the limiter")) {
    throw new Error(`Expected M2 resource guidance after stage switch, got: ${m2Guidance}`);
  }
  const m2Checklist = (await page.getByTestId("flow-checklist").innerText()).toUpperCase();
  if (!m2Checklist.includes("RECHARGE AT HOME")) {
    throw new Error(`Expected M2 checklist to include recharge objective, got: ${m2Checklist}`);
  }
  const m2Rules = await page.evaluate(() => ({
    facilities: document.querySelector('[data-testid="facility-list"]').innerText.toUpperCase(),
    armorStageEnabled: document.querySelector('[data-testid="armor-upgrade-button"]').dataset.stageEnabled,
    weaponStageEnabled: document.querySelector('[data-testid="weapon-upgrade-button"]').dataset.stageEnabled,
    flowSummary: document.querySelector('[data-testid="flow-summary"]').innerText,
    scriptGuidance: document.querySelector('[data-testid="script-guidance"]').innerText,
    sampleActions: document.querySelector('[data-testid="sample-actions"]').innerText.toUpperCase(),
  }));
  if (!m2Rules.facilities.includes("REPAIR_BAY") || m2Rules.facilities.includes("FABRICATOR")) {
    throw new Error(`Expected M2 facilities to stop before fabricator, got: ${JSON.stringify(m2Rules)}`);
  }
  if (m2Rules.armorStageEnabled !== "true" || m2Rules.weaponStageEnabled !== "false") {
    throw new Error(`Expected M2 upgrade availability to enable armor but not weapon, got: ${JSON.stringify(m2Rules)}`);
  }
  if (!m2Rules.flowSummary.toUpperCase().includes("COMPILE A VALID SCRIPT")) {
    throw new Error(`Expected M2 flow summary to reset to the first completion task, got: ${m2Rules.flowSummary}`);
  }
  if (!m2Rules.scriptGuidance.toLowerCase().includes("energy check")) {
    throw new Error(`Expected M2 script guidance, got: ${m2Rules.scriptGuidance}`);
  }
  if (
    !m2Rules.sampleActions.includes("M1 WAKE") ||
    !m2Rules.sampleActions.includes("M2 HAUL LOOP") ||
    m2Rules.sampleActions.includes("M3 BASE CYCLE") ||
    m2Rules.sampleActions.includes("M4 HOT-ZONE RUN")
  ) {
    throw new Error(`Expected M2 sample presets to expose M1+M2 only, got: ${m2Rules.sampleActions}`);
  }
  await page.locator('[data-testid="stage-actions"] [data-stage="m1"]').click();
  await expectText(page, "robot-position", "R1 // 1,2 E");
  await expectText(page, "location-name", "Waste-X Sector");
  await expectText(page, "speed-button", "1X");
  await page.getByTestId("settings-toggle").click();

  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  const idleEntityCount = await page.locator(".grid .deposit, .grid .obstacle, .grid .base-marker, .grid .robot-avatar").count();
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
  await expectText(page, "capacity-label", "Capacity 12");
  await expectText(page, "play-button", "Play");
  await expectText(page, "step-button", "Step");
  await expectText(page, "speed-button", "1X");
  const lineNumbers = await page.getByTestId("script-line-numbers").innerText();
  if (!lineNumbers.startsWith("01\n02\n03")) {
    throw new Error(`Expected zero-padded line numbers, got: ${lineNumbers}`);
  }
  const facilitiesText = (await page.getByTestId("facility-list").innerText()).toUpperCase();
  if (!facilitiesText.includes("CHARGER") || facilitiesText.includes("REPAIR_BAY") || facilitiesText.includes("FABRICATOR")) {
    throw new Error(`Expected M1 facility list to stay charger-only, got: ${facilitiesText}`);
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
  const leftToggleBefore = await page.getByTestId("objectives-toggle").innerText();
  await page.getByTestId("objectives-toggle").click();
  await page.waitForTimeout(260);
  const leftToggleAfter = await page.getByTestId("objectives-toggle").innerText();
  if (leftToggleAfter === leftToggleBefore) {
    throw new Error(`Expected objectives toggle icon to change after collapse, got: ${leftToggleAfter}`);
  }
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
  if (!diagnosticUpper.includes("LINE 5") || !diagnosticUpper.includes("UNKNOWN INSTRUCTION: BOGUS")) {
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

  const jumpScript = [
    "@Loop",
    "Check().Has(Scrap)",
    "IfTrue Goto @Loop",
  ].join("\n");
  await page.getByTestId("script-editor").fill(jumpScript);
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

  const deliveryScript = [
    "PickUp()",
    "MoveToward(Home)",
    "MoveToward(Home)",
    "MoveToward(Home)",
    "Unload(Home)",
  ].join("\n");
  await page.getByTestId("script-editor").fill(deliveryScript);

  await page.getByTestId("step-button").click();
  await expectText(page, "compile-status", "");
  await expectText(page, "scrap-count", "0");
  await expectText(page, "cargo-count", "1/3");
  await expectText(page, "battery-value", "5/6");
  const collectTeachingToast = await page.evaluate(() => ({
    kind: document.querySelector('[data-testid="runtime-toast"]')?.dataset.kind,
    title: document.querySelector('[data-testid="runtime-toast-title"]')?.innerText ?? "",
    body: document.querySelector('[data-testid="runtime-toast-body"]')?.innerText ?? "",
    hidden: document.querySelector('[data-testid="runtime-toast"]')?.hidden,
  }));
  if (
    collectTeachingToast.hidden ||
    collectTeachingToast.kind !== "success" ||
    !collectTeachingToast.title.toUpperCase().includes("FIRST RECOVERY CONFIRMED")
  ) {
    throw new Error(`Expected first M1 success teaching toast, got: ${JSON.stringify(collectTeachingToast)}`);
  }
  const cargoManifest = await page.getByTestId("cargo-manifest").innerText();
  if (!cargoManifest.toUpperCase().includes("SCRAP")) {
    throw new Error(`Expected cargo manifest to mention scrap, got: ${cargoManifest}`);
  }
  const pickupGhosts = await page.locator(".pickup-ghost").count();
  if (pickupGhosts === 0) {
    throw new Error("Expected pickup to create a recovery animation ghost.");
  }

  await page.getByTestId("step-button").click();
  await page.getByTestId("step-button").click();
  await page.getByTestId("step-button").click();
  await expectText(page, "robot-position", "R1 // 0,0 N");
  await expectText(page, "battery-value", "6/6");
  await page.waitForTimeout(520);
  const robotAlignment = await page.evaluate(() => {
    const grid = document.querySelector('[data-testid="world-grid"]')?.getBoundingClientRect();
    const robot = document.querySelector(".robot-avatar")?.getBoundingClientRect();
    if (!grid || !robot) {
      return null;
    }
    const cellWidth = grid.width / 7;
    const cellHeight = grid.height / 5;
    return {
      deltaX: Math.abs(robot.left + robot.width / 2 - (grid.left + cellWidth / 2)),
      deltaY: Math.abs(robot.top + robot.height / 2 - (grid.top + cellHeight / 2)),
    };
  });
  if (!robotAlignment || robotAlignment.deltaX > 1 || robotAlignment.deltaY > 1) {
    throw new Error(`Expected robot to stay centered on the stage grid, got ${JSON.stringify(robotAlignment)}.`);
  }

  await page.getByTestId("step-button").click();
  await expectText(page, "scrap-count", "1");
  await expectText(page, "cargo-count", "0/3");
  const completedSummary = await page.getByTestId("flow-summary").innerText();
  if (!completedSummary.toUpperCase().includes("STAGE TARGET COMPLETE")) {
    throw new Error(`Expected completed stage summary after M1 unload loop, got: ${completedSummary}`);
  }

  await page.getByTestId("reset-button").click();
  await ensureVisible(page, "sample-actions", "settings-toggle");
  const sampleActions = (await page.getByTestId("sample-actions").innerText()).toUpperCase();
  if (!sampleActions.includes("M1 WAKE") || sampleActions.includes("M2 HAUL LOOP")) {
    throw new Error(`Expected M1 sample actions to stay scoped to M1, got: ${sampleActions}`);
  }
  await page.locator('[data-testid="stage-actions"] [data-stage="m3"]').click();
  const m3SampleActions = (await page.getByTestId("sample-actions").innerText()).toUpperCase();
  if (!m3SampleActions.includes("M2 HAUL LOOP") || !m3SampleActions.includes("M3 BASE CYCLE") || m3SampleActions.includes("M1 WAKE")) {
    throw new Error(`Expected M3 sample actions to expose M2+M3 only, got: ${m3SampleActions}`);
  }
  const m3Guidance = await page.getByTestId("script-guidance").innerText();
  if (!m3Guidance.toLowerCase().includes("base cycle")) {
    throw new Error(`Expected M3 script guidance, got: ${m3Guidance}`);
  }
  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  await page.locator('[data-testid="sample-actions"] [data-preset="m3"]').click();
  const presetScript = await page.getByTestId("script-editor").inputValue();
  if (!presetScript.includes("Craft(Home)")) {
    throw new Error(`Expected M3 preset to include Craft(Home), got: ${presetScript}`);
  }
  const logicFaultScript = ["@Loop", "Goto @Loop"].join("\n");
  await page.getByTestId("script-editor").fill(logicFaultScript);
  await page.getByTestId("play-button").click();
  await page.getByTestId("runtime-toast").waitFor({ state: "visible" });
  const runtimeToast = await page.evaluate(() => ({
    kind: document.querySelector('[data-testid="runtime-toast"]')?.dataset.kind ?? "",
    title: document.querySelector('[data-testid="runtime-toast-title"]')?.innerText ?? "",
    body: document.querySelector('[data-testid="runtime-toast-body"]')?.innerText ?? "",
    playLabel: document.querySelector('[data-testid="play-button"]')?.innerText ?? "",
  }));
  if (
    runtimeToast.kind !== "guide" ||
    !runtimeToast.title.toUpperCase().includes("BASE LOOP TOO TANGLED")
  ) {
    throw new Error(`Expected first M3 failure teaching toast, got: ${JSON.stringify(runtimeToast)}.`);
  }
  if (!runtimeToast.playLabel.toUpperCase().includes("RESUME")) {
    throw new Error(`Expected runtime fault to pause playback, got: ${JSON.stringify(runtimeToast)}.`);
  }
  await page.getByTestId("reset-button").click();
  await page.locator('[data-testid="stage-actions"] [data-stage="m4"]').click();
  const m4SampleActions = (await page.getByTestId("sample-actions").innerText()).toUpperCase();
  if (!m4SampleActions.includes("M3 BASE CYCLE") || !m4SampleActions.includes("M4 HOT-ZONE RUN") || m4SampleActions.includes("M2 HAUL LOOP")) {
    throw new Error(`Expected M4 sample actions to expose M3+M4 only, got: ${m4SampleActions}`);
  }
  const m4Guidance = await page.getByTestId("script-guidance").innerText();
  if (!m4Guidance.toLowerCase().includes("hot zone")) {
    throw new Error(`Expected M4 script guidance, got: ${m4Guidance}`);
  }
  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  const hazardCount = await page.locator(".grid .hazard-zone").count();
  if (hazardCount === 0) {
    throw new Error("Expected M4 to render visible hazard tiles.");
  }
  await page.getByTestId("script-editor").fill("Check().Is(Hazard)\nIfTrue Move()");
  await page.getByTestId("step-button").click();
  await expectText(page, "robot-position", "R1 // 2,2 E");
  await expectText(page, "hp-value", "7");
  await page.getByTestId("reset-button").click();
  await page.getByTestId("script-editor").fill(["@Loop", "Check(HP).Below(8)", "IfTrue Repair()", "Move()", "Goto @Loop"].join("\n"));
  await page.getByTestId("play-button").click();
  await page.getByTestId("runtime-toast").waitFor({ state: "visible" });
  const hazardToast = await page.evaluate(() => ({
    kind: document.querySelector('[data-testid="runtime-toast"]')?.dataset.kind ?? "",
    title: document.querySelector('[data-testid="runtime-toast-title"]')?.innerText ?? "",
    playLabel: document.querySelector('[data-testid="play-button"]')?.innerText ?? "",
  }));
  if (hazardToast.kind !== "guide" || !hazardToast.title.toUpperCase().includes("SERVICE BEFORE GREED")) {
    throw new Error(`Expected first M4 failure teaching toast, got: ${JSON.stringify(hazardToast)}.`);
  }
  if (!hazardToast.playLabel.toUpperCase().includes("RESUME")) {
    throw new Error(`Expected M4 runtime fault to pause playback, got: ${JSON.stringify(hazardToast)}.`);
  }
  await page.getByTestId("reset-button").click();
  await page.locator('[data-testid="stage-actions"] [data-stage="m3"]').click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  await page.locator('[data-testid="sample-actions"] [data-preset="m2"]').click();
  await page.getByTestId("upgrade-button").click();
  await expectText(page, "capacity-label", "Capacity 14");
  await page.getByTestId("reset-button").click();
  await page.locator('[data-testid="stage-actions"] [data-stage="m5"]').click();
  const m5SampleActions = (await page.getByTestId("sample-actions").innerText()).toUpperCase();
  if (
    !m5SampleActions.includes("M4 HOT-ZONE RUN") ||
    !m5SampleActions.includes("M5 STOCK BALANCER") ||
    m5SampleActions.includes("M3 BASE CYCLE") ||
    m5SampleActions.includes("M6 ARENA INTERCEPT")
  ) {
    throw new Error(`Expected M5 sample actions to expose M4+M5 only, got: ${m5SampleActions}`);
  }
  const m5Guidance = await page.getByTestId("script-guidance").innerText();
  if (!m5Guidance.toLowerCase().includes("current craft cost")) {
    throw new Error(`Expected M5 script guidance, got: ${m5Guidance}`);
  }
  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  await page.locator('[data-testid="sample-actions"] [data-preset="m5"]').click();
  const m5PresetScript = await page.getByTestId("script-editor").inputValue();
  if (!m5PresetScript.includes("Check(Scrap).BelowCost(Craft)") || !m5PresetScript.includes("Check(Memory).Above(2)")) {
    throw new Error(`Expected M5 preset to include stock query and craft call, got: ${m5PresetScript}`);
  }
  await page.getByTestId("script-editor").fill("Check(Scrap).BelowCost(Craft)");
  await page.getByTestId("step-button").click();
  const stockLog = (await page.getByTestId("console-log").innerText()).toUpperCase();
  if (!stockLog.includes("CHECK(SCRAP).BELOWCOST(CRAFT) -> TRUE")) {
    throw new Error(`Expected M5 stock query to evaluate against base resources, got: ${stockLog}`);
  }
  await page.getByTestId("reset-button").click();
  await page.locator('[data-testid="sample-actions"] [data-preset="m5"]').click();
  for (let index = 0; index < 80; index += 1) {
    await page.getByTestId("step-button").click();
  }
  await page.waitForFunction(() => document.querySelector('[data-testid="memory-shard-count"]').innerText.trim() === "3");
  const m5Toast = await page.evaluate(() => ({
    kind: document.querySelector('[data-testid="runtime-toast"]')?.dataset.kind ?? "",
    title: document.querySelector('[data-testid="runtime-toast-title"]')?.innerText ?? "",
  }));
  if (
    !m5Toast.title.toUpperCase().includes("STOCK-AWARE CRAFTING CONFIRMED") ||
    (m5Toast.kind && m5Toast.kind !== "success")
  ) {
    throw new Error(`Expected first M5 success teaching toast, got: ${JSON.stringify(m5Toast)}.`);
  }
  const m5FlowSummary = (await page.getByTestId("flow-summary").innerText()).toUpperCase();
  if (!m5FlowSummary.includes("STAGE TARGET COMPLETE")) {
    throw new Error(`Expected M5 stage summary to complete after the second adaptive craft, got: ${m5FlowSummary}`);
  }
  const m5FacilityText = (await page.getByTestId("facility-list").innerText()).toUpperCase();
  if (!m5FacilityText.includes("4 SCRAP") || !m5FacilityText.includes("1 BATTERY")) {
    throw new Error(`Expected M5 fabricator readout to refresh dynamic recipe, got: ${m5FacilityText}`);
  }
  await page.getByTestId("reset-button").click();

  await page.locator('[data-testid="stage-actions"] [data-stage="m6"]').click();
  const m6SampleActions = (await page.getByTestId("sample-actions").innerText()).toUpperCase();
  if (!m6SampleActions.includes("M5 STOCK BALANCER") || !m6SampleActions.includes("M6 ARENA INTERCEPT") || m6SampleActions.includes("M4 HOT-ZONE RUN")) {
    throw new Error(`Expected M6 sample actions to expose M5+M6 only, got: ${m6SampleActions}`);
  }
  const m6Guidance = await page.getByTestId("script-guidance").innerText();
  if (!m6Guidance.toLowerCase().includes("hostile contact")) {
    throw new Error(`Expected M6 script guidance, got: ${m6Guidance}`);
  }
  for (let index = 0; index < 3; index += 1) {
    await page.getByTestId("story-dialogue").click();
  }
  await page.getByTestId("story-dialogue").waitFor({ state: "hidden" });
  const enemyCount = await page.locator(".grid .enemy-entity").count();
  if (enemyCount !== 1) {
    throw new Error(`Expected M6 to render one hostile contact, got ${enemyCount}.`);
  }
  await page.locator('[data-testid="sample-actions"] [data-preset="m6"]').click();
  const m6PresetScript = await page.getByTestId("script-editor").inputValue();
  if (!m6PresetScript.includes("Check().Has(Enemy)") || !m6PresetScript.includes("Fire()")) {
    throw new Error(`Expected M6 preset to include combat query and fire action, got: ${m6PresetScript}`);
  }
  for (let index = 0; index < 12; index += 1) {
    await page.getByTestId("step-button").click();
  }
  await expectText(page, "chip-count", "1");
  await expectText(page, "hp-value", "10");
  const enemyCountAfter = await page.locator(".grid .enemy-entity").count();
  if (enemyCountAfter !== 0) {
    throw new Error(`Expected M6 hostile contact to be cleared, got ${enemyCountAfter}.`);
  }
  const m6Toast = await page.evaluate(() => ({
    kind: document.querySelector('[data-testid="runtime-toast"]')?.dataset.kind ?? "",
    title: document.querySelector('[data-testid="runtime-toast-title"]')?.innerText ?? "",
  }));
  if (
    !m6Toast.title.toUpperCase().includes("COMBAT BRANCH CONFIRMED") ||
    (m6Toast.kind && m6Toast.kind !== "success")
  ) {
    throw new Error(`Expected first M6 success teaching toast, got: ${JSON.stringify(m6Toast)}.`);
  }
  const m6FlowSummary = (await page.getByTestId("flow-summary").innerText()).toUpperCase();
  if (!m6FlowSummary.includes("STAGE TARGET COMPLETE")) {
    throw new Error(`Expected M6 stage summary to complete after the guarded chip run, got: ${m6FlowSummary}`);
  }
  await page.getByTestId("reset-button").click();

  const checklist = (await page.getByTestId("flow-checklist").innerText()).toUpperCase();
  for (const label of [
    "Compile a valid script",
    "Load cargo from the map",
    "Unload cargo at home",
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
  await expectText(page, "scrap-count", "1");
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
  await page.locator('[data-testid="graphics-entity-list"] [data-entity-key="robot"]').click();
  const graphicsPreviewState = await page.evaluate(() => ({
    entityName: document.querySelector('[data-testid="graphics-entity-name"]')?.innerText ?? "",
    previewBackground: getComputedStyle(document.querySelector('[data-testid="graphics-preview"]')).backgroundImage,
    layerCount: document.querySelectorAll('[data-testid="graphics-layer-list"] [data-layer-id]').length,
    templateCount: document.querySelectorAll('[data-testid="graphics-templates"] [data-template]').length,
    templateNameControl: Boolean(document.querySelector('[data-testid="graphics-template-name"]')),
    saveTemplateControl: Boolean(document.querySelector('[data-testid="graphics-save-template-button"]')),
    firstTemplatePreview:
      getComputedStyle(document.querySelector('[data-testid="graphics-templates"] .visual-template-preview')).backgroundImage,
    firstTemplate: document.querySelector('[data-testid="graphics-templates"] [data-template]')?.getAttribute("data-template") ?? "",
    firstTemplateRecommended: document.querySelector('[data-testid="graphics-templates"] [data-template]')?.getAttribute("data-recommended") ?? "",
  }));
  if (
    !graphicsPreviewState.entityName.toUpperCase().includes("ROBOT") ||
    !graphicsPreviewState.previewBackground.includes("data:image/svg+xml") ||
    graphicsPreviewState.layerCount < 1 ||
    graphicsPreviewState.templateCount < 4 ||
    !graphicsPreviewState.templateNameControl ||
    !graphicsPreviewState.saveTemplateControl ||
    !graphicsPreviewState.firstTemplatePreview.includes("data:image/svg+xml") ||
    graphicsPreviewState.firstTemplate !== "frameBot" ||
    graphicsPreviewState.firstTemplateRecommended !== "true"
  ) {
    throw new Error(`Expected graphics lab preview to initialize, got ${JSON.stringify(graphicsPreviewState)}.`);
  }
  await page.locator('[data-testid="graphics-form"] [data-field="fill"]').evaluate((input) => {
    input.value = "#00ff88";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="graphics-export"]')?.value.includes('"fill": "#00ff88"'),
  );
  const graphicsRenderState = await page.evaluate(() => ({
    exportHasColor: document.querySelector('[data-testid="graphics-export"]')?.value.includes('"fill": "#00ff88"') ?? false,
    robotBackground:
      getComputedStyle(document.querySelector(".robot-avatar")).backgroundImage,
  }));
  if (!graphicsRenderState.exportHasColor || !graphicsRenderState.robotBackground.toLowerCase().includes("00ff88")) {
    throw new Error(`Expected graphics lab edits to update export JSON and world rendering, got ${JSON.stringify(graphicsRenderState)}.`);
  }
  await page.getByTestId("graphics-export-entity-button").click();
  const robotEntityIo = await page.getByTestId("graphics-entity-io").inputValue();
  if (!robotEntityIo.includes('"layers"') || !robotEntityIo.includes('"robot-glyph"')) {
    throw new Error(`Expected single-entity export to populate entity I/O, got: ${robotEntityIo}`);
  }
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="locked"][data-layer-id="robot-body"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-form"] [data-field="fill"]').disabled === true);
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="visible"][data-layer-id="robot-body"]').click();
  await page.getByTestId("graphics-export-entity-button").click();
  const robotEntityIoAfterHide = await page.getByTestId("graphics-entity-io").inputValue();
  if (!robotEntityIoAfterHide.includes('"visible": false')) {
    throw new Error(`Expected layer visibility toggle to serialize into entity export, got: ${robotEntityIoAfterHide}`);
  }
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="visible"][data-layer-id="robot-body"]').click();
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="locked"][data-layer-id="robot-body"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-form"] [data-field="fill"]').disabled === false);
  await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id="robot-glyph"]:not([data-layer-action])').evaluate((node) => node.click());
  await page.getByTestId("graphics-export-entity-button").click();
  const robotImportSource = await page.getByTestId("graphics-entity-io").inputValue();
  await page.getByTestId("graphics-entity-io").fill(robotImportSource.replace('"glyph": "R1"', '"glyph": "RX"'));
  await page.getByTestId("graphics-import-entity-button").click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-testid="graphics-layer-list"] [data-layer-id]')].some((node) => node.innerText.includes("RX")),
  );
  await page.getByTestId("graphics-export-entity-button").click();
  const robotEntityIoAfterImport = await page.getByTestId("graphics-entity-io").inputValue();
  if (!robotEntityIoAfterImport.includes('"glyph": "RX"')) {
    throw new Error(`Expected single-entity import to replace selected entity visual, got: ${robotEntityIoAfterImport}`);
  }
  await page.getByTestId("graphics-copy-button").click();
  if (!(await page.getByTestId("graphics-copy-button").isVisible())) {
    throw new Error("Expected graphics copy control to stay available after export interaction.");
  }
  await page.locator('[data-testid="graphics-entity-list"] [data-entity-key="wall"]').click();
  const wallGraphicsState = await page.evaluate(() => ({
    entityName: document.querySelector('[data-testid="graphics-entity-name"]')?.innerText ?? "",
    exportHasWall: document.querySelector('[data-testid="graphics-export"]')?.value.includes('"wall"') ?? false,
    layerCount: document.querySelectorAll('[data-testid="graphics-layer-list"] [data-layer-id]').length,
    templateGroups: [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template-group]')].map((node) => node.getAttribute("data-template-group") ?? ""),
    firstTemplate: document.querySelector('[data-testid="graphics-templates"] [data-template]')?.getAttribute("data-template") ?? "",
    firstTemplateRecommended: document.querySelector('[data-testid="graphics-templates"] [data-template]')?.getAttribute("data-recommended") ?? "",
  }));
  if (
    !wallGraphicsState.entityName.toUpperCase().includes("WALL") ||
    !wallGraphicsState.exportHasWall ||
    wallGraphicsState.layerCount < 2 ||
    wallGraphicsState.templateGroups[0] !== "recommended" ||
    !wallGraphicsState.templateGroups.includes("pickup") ||
    wallGraphicsState.firstTemplate !== "platedBlock" ||
    wallGraphicsState.firstTemplateRecommended !== "true"
  ) {
    throw new Error(`Expected wall entity visuals to be authorable, got ${JSON.stringify(wallGraphicsState)}.`);
  }
  const templateFilterState = await page.evaluate(() => ({
    modeCount: document.querySelectorAll('[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"]').length,
    categoryCount: document.querySelectorAll('[data-testid="graphics-template-category-filters"] [data-filter-kind="category"]').length,
  }));
  if (templateFilterState.modeCount < 2 || templateFilterState.categoryCount < 3) {
    throw new Error(`Expected graphics template filters, got ${JSON.stringify(templateFilterState)}.`);
  }
  await page.locator('[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-filter-value="fit"]').click();
  await page.waitForFunction(() => {
    const groups = [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template-group]')].map((node) => node.getAttribute("data-template-group"));
    const templates = [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template]')].map((node) => node.getAttribute("data-template"));
    return groups.length === 1 && groups[0] === "structure" && templates.length === 1 && templates[0] === "platedBlock";
  });
  await page.locator('[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-filter-value="all"]').click();
  await page.locator('[data-testid="graphics-template-category-filters"] [data-filter-kind="category"][data-filter-value="pickup"]').click();
  await page.waitForFunction(() => {
    const groups = [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template-group]')].map((node) => node.getAttribute("data-template-group"));
    const templates = [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template]')].map((node) => node.getAttribute("data-template"));
    return groups.length === 1 && groups[0] === "pickup" && templates.length === 1 && templates[0] === "signalToken";
  });
  await page.locator('[data-testid="graphics-template-category-filters"] [data-filter-kind="category"][data-filter-value="all"]').click();
  await page.locator('[data-testid="graphics-templates"] [data-template="signalToken"]').click();
  await page.waitForFunction(() => {
    const exportValue = document.querySelector('[data-testid="graphics-export"]')?.value ?? "";
    return exportValue.includes('"glyph": "W"') && exportValue.includes('"shape": "circle"');
  });
  await page.waitForFunction(() => {
    const recent = document.querySelector('[data-testid="graphics-recent-templates"] [data-template]');
    return recent?.getAttribute("data-template") === "signalToken";
  });
  await page.getByTestId("graphics-export-entity-button").click();
  const wallEntityIoAfterTemplate = await page.getByTestId("graphics-entity-io").inputValue();
  if (!wallEntityIoAfterTemplate.includes('"glyph": "W"') || !wallEntityIoAfterTemplate.includes('"shape": "circle"')) {
    throw new Error(`Expected entity template application to rewrite current visual, got: ${wallEntityIoAfterTemplate}`);
  }
  await page.getByTestId("graphics-template-name").fill("Wall Cache");
  await page.getByTestId("graphics-save-template-button").click();
  await page.waitForFunction(() => {
    const custom = document.querySelector('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]');
    return custom && custom.textContent.includes("Wall Cache");
  });
  const customTemplateState = await page.evaluate(() => ({
    customCount: document.querySelectorAll('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]').length,
    firstCustomLabel:
      document.querySelector('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]')?.innerText ?? "",
    firstRecentTemplate:
      document.querySelector('[data-testid="graphics-recent-templates"] [data-template]')?.getAttribute("data-template") ?? "",
    storedTemplatesRaw: localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "",
    storedRecentRaw: localStorage.getItem("rust-and-logic.template-history.v1") ?? "",
  }));
  if (
    customTemplateState.customCount < 1 ||
    !customTemplateState.firstCustomLabel.toUpperCase().includes("WALL CACHE") ||
    !customTemplateState.storedTemplatesRaw.includes("Wall Cache") ||
    !customTemplateState.firstRecentTemplate.startsWith("custom-wall-wall-cache-") ||
    !customTemplateState.storedRecentRaw.includes("custom-wall-wall-cache-")
  ) {
    throw new Error(`Expected custom graphics template persistence, got ${JSON.stringify(customTemplateState)}.`);
  }
  await page
    .locator('[data-testid="graphics-templates"] .visual-template-card[data-template-source="custom"]')
    .first()
    .locator('[data-template-action="delete"]')
    .click();
  await page.waitForFunction(() => {
    const stored = localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "";
    const recent = localStorage.getItem("rust-and-logic.template-history.v1") ?? "";
    return !stored.includes("Wall Cache") && !recent.includes("custom-wall-wall-cache-");
  });
  const graphicsSelectOptions = await page.evaluate(() => {
    const readOptions = (field) =>
      [...document.querySelectorAll(`[data-testid="graphics-form"] [data-field="${field}"] option`)].map((node) => node.value);
    return {
      entityFields: [...document.querySelectorAll('[data-testid="graphics-form"] [data-scope="entity"]')].map((node) => node.dataset.field),
      baseFields: [...document.querySelectorAll('[data-testid="graphics-form"] [data-scope="layer"]')].slice(0, 2).map((node) => node.dataset.field),
      layerType: readOptions("type"),
      shape: readOptions("shape"),
      textureType: readOptions("textureType"),
    };
  });
  if (
    graphicsSelectOptions.entityFields.join(",") !== "label,canvasSize" ||
    graphicsSelectOptions.baseFields.join(",") !== "id,type" ||
    graphicsSelectOptions.layerType.join(",") !== "shape,glyph" ||
    graphicsSelectOptions.shape.join(",") !== "rectangle,circle,polygon,star" ||
    graphicsSelectOptions.textureType.join(",") !== "none,stripes,dither"
  ) {
    throw new Error(`Expected graphics editor select vocab to come from config, got ${JSON.stringify(graphicsSelectOptions)}.`);
  }
  const wallLayerCountBeforeAdd = await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').count();
  await page.getByTestId("graphics-add-glyph-button").click();
  await page.waitForFunction(
    (count) => document.querySelectorAll('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').length === count + 1,
    wallLayerCountBeforeAdd,
  );
  await page.getByTestId("graphics-export-entity-button").click();
  const wallEntityIoAfterGlyphAdd = await page.getByTestId("graphics-entity-io").inputValue();
  if (!wallEntityIoAfterGlyphAdd.includes('"glyph": "W"')) {
    throw new Error(`Expected added glyph layer to use data-driven entity initial defaults, got: ${wallEntityIoAfterGlyphAdd}`);
  }
  await page.getByTestId("graphics-add-shape-button").click();
  await page.waitForFunction(
    (count) => document.querySelectorAll('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').length === count + 2,
    wallLayerCountBeforeAdd,
  );
  await page.getByTestId("graphics-export-entity-button").click();
  const wallEntityIoAfterShapeAdd = await page.getByTestId("graphics-entity-io").inputValue();
  if (!wallEntityIoAfterShapeAdd.includes('"textureType": "none"') || !wallEntityIoAfterShapeAdd.includes('"fill": "#f28d35"')) {
    throw new Error(`Expected added shape layer to use data-driven default styling, got: ${wallEntityIoAfterShapeAdd}`);
  }
  await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').first().evaluate((node) => node.click());
  const beforeDuplicateLayerCount = await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').count();
  const beforeMoveExport = await page.getByTestId("graphics-export").inputValue();
  await page.getByTestId("graphics-duplicate-layer-button").click();
  await page.waitForFunction(
    (count) => document.querySelectorAll('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').length === count + 1,
    beforeDuplicateLayerCount,
  );
  const afterDuplicateLayerCount = await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id]:not([data-layer-action])').count();
  if (afterDuplicateLayerCount !== beforeDuplicateLayerCount + 1) {
    throw new Error(`Expected graphics layer duplication to add one layer, got ${afterDuplicateLayerCount}.`);
  }
  await page.getByTestId("graphics-move-layer-down-button").click();
  await page.waitForFunction(
    (beforeText) => document.querySelector('[data-testid="graphics-export"]').value !== beforeText,
    beforeMoveExport,
  );
  const afterMoveExport = await page.getByTestId("graphics-export").inputValue();
  if (afterMoveExport === beforeMoveExport) {
    throw new Error("Expected moving a graphics layer to rewrite export order.");
  }
  await page.locator('[data-testid="graphics-presets"] [data-preset="beacon"]').click();
  await page.getByTestId("graphics-export-entity-button").click();
  const wallEntityIoAfterPreset = await page.getByTestId("graphics-entity-io").inputValue();
  if (!wallEntityIoAfterPreset.includes('"shape": "star"')) {
    throw new Error(`Expected shape preset to update selected wall layer, got: ${wallEntityIoAfterPreset}`);
  }
  const ditherVariantOptions = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="graphics-form"] [data-field="textureVariant"] option')].map((node) => node.value),
  );
  if (ditherVariantOptions.join(",") !== "checker,noise,cross") {
    throw new Error(`Expected dither variant vocab to come from config, got ${JSON.stringify(ditherVariantOptions)}.`);
  }
  const fillSwatchCount = await page.locator('[data-testid="graphics-fill-swatches"] .visual-swatch').count();
  const textureSwatchCount = await page.locator('[data-testid="graphics-texture-swatches"] .visual-swatch').count();
  if (fillSwatchCount < 4 || textureSwatchCount < 4) {
    throw new Error(`Expected graphics swatch strips to render from config, got fill=${fillSwatchCount} texture=${textureSwatchCount}.`);
  }
  const conditionalFieldsBefore = await page.evaluate(() => ({
    hasPoints: Boolean(document.querySelector('[data-testid="graphics-form"] [data-field="points"]')),
    hasSides: Boolean(document.querySelector('[data-testid="graphics-form"] [data-field="sides"]')),
  }));
  if (!conditionalFieldsBefore.hasPoints || conditionalFieldsBefore.hasSides) {
    throw new Error(`Expected schema-driven conditional fields for star shape, got ${JSON.stringify(conditionalFieldsBefore)}.`);
  }
  await page.locator('[data-testid="graphics-form"] [data-field="shape"]').selectOption("polygon");
  await page.waitForFunction(() =>
    Boolean(document.querySelector('[data-testid="graphics-form"] [data-field="sides"]')) &&
    !document.querySelector('[data-testid="graphics-form"] [data-field="points"]'),
  );
  await page.locator('[data-testid="graphics-form"] [data-field="textureType"]').selectOption("stripes");
  await page.waitForFunction(() =>
    Boolean(document.querySelector('[data-testid="graphics-form"] [data-field="stripeWidth"]')) &&
    !document.querySelector('[data-testid="graphics-form"] [data-field="textureVariant"]'),
  );
  await page.locator('[data-testid="graphics-fill-swatches"] .visual-swatch').nth(4).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="graphics-export"]').value.includes('"fill": "#00ff88"'),
  );
  await page.locator('[data-testid="graphics-texture-swatches"] .visual-swatch').nth(1).click();
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="graphics-export"]').value.includes('"textureColor": "#a64f21"'),
  );
  const swatchState = await page.evaluate(() => ({
    exportValue: document.querySelector('[data-testid="graphics-export"]')?.value ?? "",
    fillVisible: !document.querySelector('[data-testid="graphics-fill-swatches"]')?.hidden,
    textureVisible: !document.querySelector('[data-testid="graphics-texture-swatches"]')?.hidden,
  }));
  if (
    !swatchState.fillVisible ||
    !swatchState.textureVisible ||
    !swatchState.exportValue.includes('"fill": "#00ff88"') ||
    !swatchState.exportValue.includes('"textureColor": "#a64f21"')
  ) {
    throw new Error(`Expected graphics swatches to update selected layer colors, got ${JSON.stringify(swatchState)}.`);
  }
  await page.getByTestId("graphics-studio-button").click();
  const studioState = await page.evaluate(() => {
    const panel = document.querySelector(".dev-panel");
    const rect = panel?.getBoundingClientRect();
    return {
      bodyFlag: document.body.dataset.graphicsStudio,
      studioFlag: panel?.dataset.studio,
      openFlag: panel?.dataset.open,
      top: rect?.top ?? null,
      left: rect?.left ?? null,
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
    };
  });
  if (
    studioState.bodyFlag !== "true" ||
    studioState.studioFlag !== "true" ||
    studioState.openFlag !== "true" ||
    studioState.top !== 16 ||
    studioState.left !== 16 ||
    studioState.width < 900 ||
    studioState.height < 600
  ) {
    throw new Error(`Expected graphics studio mode to open as a full-screen dev workspace, got ${JSON.stringify(studioState)}.`);
  }
  const studioButtonLabel = await page.getByTestId("graphics-studio-button").innerText();
  if (!studioButtonLabel.toUpperCase().includes("CLOSE_STUDIO")) {
    throw new Error(`Expected graphics studio toggle to switch to close state, got ${studioButtonLabel}.`);
  }
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.body.dataset.graphicsStudio === "false");

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
