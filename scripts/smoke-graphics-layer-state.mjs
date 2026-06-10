import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve-web-ui.mjs";
import { chromium } from "file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs";

const screenshotPath = fileURLToPath(new URL("../.codex-artifacts/graphics-studio-layer-state-smoke.png", import.meta.url));

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
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.getByTestId("world-grid").waitFor({ state: "visible", timeout: 10000 });
  await page.getByTestId("boot-overlay").waitFor({ state: "hidden", timeout: 10000 });
  await page.getByTestId("devlog-toggle").click();
  await page.getByTestId("graphics-reset-button").click();
  await page.waitForTimeout(150);

  const initial = await readLayerState(page);
  expectLayerState(initial, {
    activeLayerId: "robot-body",
    layerIds: ["robot-body", "robot-glyph"],
    exportedRobotLayerIds: ["robot-body", "robot-glyph"],
  });

  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="visible"][data-layer-id="robot-body"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-export"]')?.value.includes('"visible": false'));
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="locked"][data-layer-id="robot-body"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-form"] [data-field="fill"]')?.disabled === true);

  const toggled = await readLayerState(page);
  expectLayerState(toggled, {
    activeLayerId: "robot-body",
    layerIds: ["robot-body", "robot-glyph"],
    exportedRobotLayerIds: ["robot-body", "robot-glyph"],
  });
  if (!toggled.exportValue.includes('"visible": false') || !toggled.exportValue.includes('"locked": true')) {
    throw new Error(`Expected toggled body layer export state, got ${JSON.stringify(summarizeLayerState(toggled))}.`);
  }
  await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id="robot-glyph"]:not([data-layer-action])').click();
  await page.waitForFunction(() => {
    const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    return active?.dataset.layerId === "robot-glyph";
  });
  const selectedGlyph = await readLayerState(page);
  expectLayerState(selectedGlyph, {
    activeLayerId: "robot-glyph",
    layerIds: ["robot-body", "robot-glyph"],
    exportedRobotLayerIds: ["robot-body", "robot-glyph"],
  });
  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="visible"][data-layer-id="robot-body"]').click();
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="locked"][data-layer-id="robot-body"]').click();
  await page.waitForFunction(() => {
    const exportValue = document.querySelector('[data-testid="graphics-export"]')?.value ?? "";
    return !exportValue.includes('"visible": false') && !exportValue.includes('"locked": true');
  });

  await page.getByTestId("graphics-add-shape-button").click();
  await page.waitForFunction(() => {
    const ids = Array.from(document.querySelectorAll('[data-testid="graphics-layer-list"] .visual-layer-select')).map(
      (button) => button.dataset.layerId ?? "",
    );
    const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    return ids.at(-1)?.startsWith("robot-shape-") && active?.dataset.layerId === ids.at(-1);
  });
  const added = await readLayerState(page);
  const addedLayerId = added.activeLayerId;

  await page.getByTestId("graphics-duplicate-layer-button").click();
  await page.waitForFunction(
    (sourceId) => {
      const ids = Array.from(document.querySelectorAll('[data-testid="graphics-layer-list"] .visual-layer-select')).map(
        (button) => button.dataset.layerId ?? "",
      );
      const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
      return ids.at(-2) === sourceId && ids.at(-1)?.startsWith(`${sourceId}-copy-`) && active?.dataset.layerId === ids.at(-1);
    },
    addedLayerId,
  );
  const duplicated = await readLayerState(page);
  const duplicateLayerId = duplicated.activeLayerId;

  await page.getByTestId("graphics-move-layer-up-button").click();
  await page.waitForFunction(
    (duplicateId) => {
      const ids = Array.from(document.querySelectorAll('[data-testid="graphics-layer-list"] .visual-layer-select')).map(
        (button) => button.dataset.layerId ?? "",
      );
      const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
      return ids.at(-2) === duplicateId && active?.dataset.layerId === duplicateId;
    },
    duplicateLayerId,
  );

  await page.getByTestId("graphics-delete-layer-button").click();
  await page.waitForFunction(
    (deletedId) => {
      const ids = Array.from(document.querySelectorAll('[data-testid="graphics-layer-list"] .visual-layer-select')).map(
        (button) => button.dataset.layerId ?? "",
      );
      const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
      return !ids.includes(deletedId) && active?.dataset.layerId === "robot-body";
    },
    duplicateLayerId,
  );

  console.log(
    JSON.stringify(
      {
        screenshotPath,
        initial: summarizeLayerState(initial),
        toggled: summarizeLayerState(toggled),
        selectedGlyph: summarizeLayerState(selectedGlyph),
        addedLayerId,
        duplicateLayerId,
      },
      null,
      2,
    ),
  );
  console.log("Graphics Studio layer state smoke passed.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

async function readLayerState(page) {
  return page.evaluate(() => {
    const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    const exportValue = document.querySelector('[data-testid="graphics-export"]')?.value ?? "";
    let exportedRobotLayerIds = [];
    try {
      const exported = JSON.parse(exportValue);
      exportedRobotLayerIds = exported?.entities?.robot?.layers?.map((layer) => layer.id) ?? [];
    } catch {}
    return {
      activeLayerId: active?.dataset.layerId ?? "",
      layerIds: Array.from(document.querySelectorAll('[data-testid="graphics-layer-list"] .visual-layer-select')).map(
        (button) => button.dataset.layerId ?? "",
      ),
      exportedRobotLayerIds,
      exportValue,
    };
  });
}

function expectLayerState(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    const actualValue = Array.isArray(value) ? actual[key].join(",") : actual[key];
    const expectedValue = Array.isArray(value) ? value.join(",") : value;
    if (actualValue !== expectedValue) {
      throw new Error(`Expected ${key} to be ${expectedValue}, got ${actualValue}. State: ${JSON.stringify(summarizeLayerState(actual))}`);
    }
  }
}

function summarizeLayerState(state) {
  return {
    activeLayerId: state.activeLayerId,
    layerIds: state.layerIds,
    exportedRobotLayerIds: state.exportedRobotLayerIds,
    bodyHidden: state.exportValue.includes('"visible": false'),
    bodyLocked: state.exportValue.includes('"locked": true'),
  };
}
