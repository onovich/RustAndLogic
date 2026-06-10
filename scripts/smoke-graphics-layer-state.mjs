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

  await page.locator('[data-testid="graphics-entity-list"] [data-entity-key="enemy"]').click();
  await page.waitForFunction(() => {
    const activeEntity = document.querySelector('[data-testid="graphics-entity-list"] [data-active="true"]');
    const activeLayer = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    return activeEntity?.getAttribute("data-entity-key") === "enemy" && activeLayer?.getAttribute("data-layer-id") === "enemy-core";
  });
  const entitySelection = await page.evaluate(() => ({
    activeEntityKey: document
      .querySelector('[data-testid="graphics-entity-list"] [data-active="true"]')
      ?.getAttribute("data-entity-key") ?? "",
    activeLayerId: document
      .querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]')
      ?.getAttribute("data-layer-id") ?? "",
  }));
  await page.locator('[data-testid="graphics-entity-list"] [data-entity-key="robot"]').click();
  await page.waitForFunction(() => {
    const activeEntity = document.querySelector('[data-testid="graphics-entity-list"] [data-active="true"]');
    const activeLayer = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    return activeEntity?.getAttribute("data-entity-key") === "robot" && activeLayer?.getAttribute("data-layer-id") === "robot-body";
  });

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
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="visible"][data-layer-id="robot-body"]').click();
  await page.locator('[data-testid="graphics-layer-list"] [data-layer-action="locked"][data-layer-id="robot-body"]').click();
  await page.waitForFunction(() => {
    const exportValue = document.querySelector('[data-testid="graphics-export"]')?.value ?? "";
    return !exportValue.includes('"visible": false') && !exportValue.includes('"locked": true');
  });
  await page.locator('[data-testid="graphics-layer-list"] button[data-layer-id="robot-body"]:not([data-layer-action])').click();
  await page.waitForFunction(() => {
    const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    return active?.dataset.layerId === "robot-body";
  });
  await page.locator('[data-testid="graphics-form"] [data-field="fill"]').fill("#db5a42");
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-export"]')?.value.includes('"fill": "#db5a42"'));
  const formEdited = await readLayerState(page);
  if (formEdited.activeLayerId !== "robot-body" || !formEdited.exportValue.includes('"fill": "#db5a42"')) {
    throw new Error(`Expected form edit to update selected body fill, got ${JSON.stringify(summarizeLayerState(formEdited))}.`);
  }

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

  await page.locator('[data-testid="graphics-presets"] [data-preset="beacon"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-export"]')?.value.includes('"shape": "star"'));
  const presetApplied = await readLayerState(page);
  if (presetApplied.activeLayerId !== "robot-body" || !presetApplied.exportValue.includes('"shape": "star"')) {
    throw new Error(`Expected shape preset to apply to selected body layer, got ${JSON.stringify(summarizeLayerState(presetApplied))}.`);
  }

  await page.locator('[data-testid="graphics-fill-swatches"] .visual-swatch[data-swatch-value="#00ff88"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-export"]')?.value.includes('"fill": "#00ff88"'));
  const swatchApplied = await readLayerState(page);
  if (swatchApplied.activeLayerId !== "robot-body" || !swatchApplied.exportValue.includes('"fill": "#00ff88"')) {
    throw new Error(`Expected fill swatch to apply to selected body layer, got ${JSON.stringify(summarizeLayerState(swatchApplied))}.`);
  }

  await page.locator('[data-testid="graphics-texture-swatches"] .visual-swatch[data-swatch-value="#4fa3a5"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="graphics-export"]')?.value.includes('"textureColor": "#4fa3a5"'));
  const textureSwatchApplied = await readLayerState(page);
  if (
    textureSwatchApplied.activeLayerId !== "robot-body" ||
    !textureSwatchApplied.exportValue.includes('"textureColor": "#4fa3a5"')
  ) {
    throw new Error(
      `Expected texture swatch to apply to selected body layer, got ${JSON.stringify(summarizeLayerState(textureSwatchApplied))}.`,
    );
  }

  await page.locator('[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-filter-value="fit"]').click();
  await page.waitForFunction(() => {
    const fitButton = document.querySelector(
      '[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-filter-value="fit"]',
    );
    const storedFilter = localStorage.getItem("rust-and-logic.template-filter.v1") ?? "";
    return fitButton?.getAttribute("data-active") === "true" && storedFilter.includes('"mode":"fit"');
  });
  const templateFilterApplied = await page.evaluate(() => ({
    activeMode: document
      .querySelector('[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-active="true"]')
      ?.getAttribute("data-filter-value") ?? "",
    storedFilterHasFit: (localStorage.getItem("rust-and-logic.template-filter.v1") ?? "").includes('"mode":"fit"'),
  }));
  await page.locator('[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-filter-value="all"]').click();
  await page.waitForFunction(() => {
    const allButton = document.querySelector(
      '[data-testid="graphics-template-mode-filters"] [data-filter-kind="mode"][data-filter-value="all"]',
    );
    return allButton?.getAttribute("data-active") === "true";
  });

  await page.locator('[data-testid="graphics-templates"] [data-template-action="export"][data-template-id="frameBot"]').click();
  await page.waitForFunction(() => {
    const entityIo = document.querySelector('[data-testid="graphics-entity-io"]')?.value ?? "";
    return entityIo.includes('"kind": "graphics-template"') && entityIo.includes('"id": "frameBot"');
  });
  const exportedTemplate = await page.evaluate(() => {
    const entityIo = document.querySelector('[data-testid="graphics-entity-io"]')?.value ?? "";
    return {
      hasTemplateKind: entityIo.includes('"kind": "graphics-template"'),
      hasFrameBotId: entityIo.includes('"id": "frameBot"'),
    };
  });

  await page.locator('[data-testid="graphics-templates"] [data-template="frameBot"]').click();
  await page.waitForFunction(() => {
    const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    const exportValue = document.querySelector('[data-testid="graphics-export"]')?.value ?? "";
    return active?.dataset.layerId === "template-body" && exportValue.includes('"id": "template-glyph"');
  });
  const templateApplied = await readLayerState(page);
  expectLayerState(templateApplied, {
    activeLayerId: "template-body",
    layerIds: ["template-body", "template-glyph"],
    exportedRobotLayerIds: ["template-body", "template-glyph"],
  });
  await page.waitForFunction(() => {
    const recent = document.querySelector('[data-testid="graphics-recent-templates"] [data-template]');
    const storedRecent = localStorage.getItem("rust-and-logic.template-history.v1") ?? "";
    return recent?.getAttribute("data-template") === "frameBot" && storedRecent.includes("frameBot");
  });
  const templateRecent = await page.evaluate(() => ({
    recentId: document.querySelector('[data-testid="graphics-recent-templates"] [data-template]')?.getAttribute("data-template") ?? "",
    storedRecentHasFrameBot: (localStorage.getItem("rust-and-logic.template-history.v1") ?? "").includes("frameBot"),
  }));

  await page.locator('[data-testid="graphics-recent-templates"] [data-template-action="export"][data-template-id="frameBot"]').click();
  await page.waitForFunction(() => {
    const entityIo = document.querySelector('[data-testid="graphics-entity-io"]')?.value ?? "";
    return entityIo.includes('"kind": "graphics-template"') && entityIo.includes('"id": "frameBot"');
  });
  const recentExportedTemplate = await page.evaluate(() => {
    const entityIo = document.querySelector('[data-testid="graphics-entity-io"]')?.value ?? "";
    return {
      hasTemplateKind: entityIo.includes('"kind": "graphics-template"'),
      hasFrameBotId: entityIo.includes('"id": "frameBot"'),
    };
  });

  await page.getByTestId("graphics-entity-io").fill(
    JSON.stringify(
      {
        label: "Imported Robot",
        canvasSize: 24,
        layers: [
          {
            id: "import-body",
            type: "shape",
            shape: "circle",
            x: 12,
            y: 12,
            width: 16,
            height: 16,
            fill: "#00ff88",
            stroke: "#120b06",
            strokeWidth: 1,
          },
          {
            id: "import-glyph",
            type: "glyph",
            glyph: "RI",
            x: 12,
            y: 12,
            fontSize: 7,
            glyphColor: "#120b06",
          },
        ],
      },
      null,
      2,
    ),
  );
  await page.getByTestId("graphics-import-entity-button").click();
  await page.waitForFunction(() => {
    const active = document.querySelector('[data-testid="graphics-layer-list"] .visual-layer-select[data-active="true"]');
    const exportValue = document.querySelector('[data-testid="graphics-export"]')?.value ?? "";
    return active?.dataset.layerId === "import-body" && exportValue.includes('"glyph": "RI"');
  });
  const imported = await readLayerState(page);
  expectLayerState(imported, {
    activeLayerId: "import-body",
    layerIds: ["import-body", "import-glyph"],
    exportedRobotLayerIds: ["import-body", "import-glyph"],
  });
  if (!imported.exportValue.includes('"label": "Imported Robot"') || !imported.exportValue.includes('"glyph": "RI"')) {
    throw new Error(`Expected selected entity import to replace robot visual, got ${JSON.stringify(summarizeLayerState(imported))}.`);
  }

  await page.getByTestId("graphics-export-entity-button").click();
  await page.waitForFunction(() => {
    const entityIo = document.querySelector('[data-testid="graphics-entity-io"]')?.value ?? "";
    return entityIo.includes('"label": "Imported Robot"') && entityIo.includes('"id": "import-body"');
  });
  const exportedEntity = await page.evaluate(() => {
    const entityIo = document.querySelector('[data-testid="graphics-entity-io"]')?.value ?? "";
    return {
      hasImportedLabel: entityIo.includes('"label": "Imported Robot"'),
      hasImportBodyLayer: entityIo.includes('"id": "import-body"'),
    };
  });

  await page.getByTestId("graphics-template-name").fill("Imported Cache");
  await page.getByTestId("graphics-save-template-button").click();
  await page.waitForFunction(() => {
    const custom = document.querySelector('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]');
    const recent = document.querySelector('[data-testid="graphics-recent-templates"] [data-template]');
    const customId = custom?.getAttribute("data-template") ?? "";
    const storedTemplates = localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "";
    const storedRecent = localStorage.getItem("rust-and-logic.template-history.v1") ?? "";
    return (
      customId.startsWith("custom-robot-imported-cache-") &&
      custom?.textContent.includes("Imported Cache") &&
      recent?.getAttribute("data-template") === customId &&
      storedTemplates.includes("Imported Cache") &&
      storedRecent.includes(customId)
    );
  });
  const savedTemplate = await page.evaluate(() => {
    const custom = document.querySelector('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]');
    const customId = custom?.getAttribute("data-template") ?? "";
    return {
      customId,
      customLabel: custom?.textContent ?? "",
      recentId: document.querySelector('[data-testid="graphics-recent-templates"] [data-template]')?.getAttribute("data-template") ?? "",
      storedTemplatesHasCustom: (localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "").includes("Imported Cache"),
      storedRecentHasCustom: (localStorage.getItem("rust-and-logic.template-history.v1") ?? "").includes(customId),
    };
  });

  await page.getByTestId("graphics-entity-io").fill(
    JSON.stringify(
      {
        kind: "graphics-template",
        version: 1,
        label: "Imported Mini",
        visual: {
          canvasSize: 24,
          layers: [
            {
              id: "mini-body",
              type: "shape",
              shape: "rectangle",
              x: 12,
              y: 12,
              width: 14,
              height: 14,
              fill: "#ffdd66",
            },
          ],
        },
      },
      null,
      2,
    ),
  );
  await page.getByTestId("graphics-import-template-button").click();
  await page.waitForFunction(() => {
    const customTemplates = [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]')];
    const imported = customTemplates.find(
      (node) => (node.getAttribute("data-template") ?? "").startsWith("custom-robot-imported-mini-") && node.textContent.includes("Imported Mini"),
    );
    const importedId = imported?.getAttribute("data-template") ?? "";
    const recent = document.querySelector('[data-testid="graphics-recent-templates"] [data-template]');
    const storedTemplates = localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "";
    const storedRecent = localStorage.getItem("rust-and-logic.template-history.v1") ?? "";
    return importedId && recent?.getAttribute("data-template") === importedId && storedTemplates.includes("Imported Mini") && storedRecent.includes(importedId);
  });
  const importedTemplate = await page.evaluate(() => {
    const customTemplates = [...document.querySelectorAll('[data-testid="graphics-templates"] [data-template-source="custom"][data-template]')];
    const imported = customTemplates.find((node) => (node.getAttribute("data-template") ?? "").startsWith("custom-robot-imported-mini-"));
    const importedId = imported?.getAttribute("data-template") ?? "";
    return {
      importedId,
      importedLabel: imported?.textContent ?? "",
      recentId: document.querySelector('[data-testid="graphics-recent-templates"] [data-template]')?.getAttribute("data-template") ?? "",
      storedTemplatesHasImported: (localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "").includes("Imported Mini"),
      storedRecentHasImported: (localStorage.getItem("rust-and-logic.template-history.v1") ?? "").includes(importedId),
    };
  });
  if (!importedTemplate.importedId) {
    throw new Error(`Expected imported template id before delete, got ${JSON.stringify(importedTemplate)}.`);
  }

  await page.locator(`[data-testid="graphics-templates"] [data-template-action="delete"][data-template-id="${importedTemplate.importedId}"]`).click();
  await page.waitForFunction(
    (deletedId) => {
      const storedTemplates = localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "";
      const storedRecent = localStorage.getItem("rust-and-logic.template-history.v1") ?? "";
      return (
        !document.querySelector(`[data-testid="graphics-templates"] [data-template="${deletedId}"]`) &&
        !storedTemplates.includes("Imported Mini") &&
        !storedRecent.includes(deletedId)
      );
    },
    importedTemplate.importedId,
  );
  const deletedTemplate = await page.evaluate((deletedId) => {
    const storedTemplates = localStorage.getItem("rust-and-logic.entity-templates.v1") ?? "";
    const storedRecent = localStorage.getItem("rust-and-logic.template-history.v1") ?? "";
    return {
      deletedId,
      templateStillVisible: Boolean(document.querySelector(`[data-testid="graphics-templates"] [data-template="${deletedId}"]`)),
      storedTemplatesHasDeleted: storedTemplates.includes("Imported Mini"),
      storedRecentHasDeleted: storedRecent.includes(deletedId),
    };
  }, importedTemplate.importedId);

  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log(
    JSON.stringify(
      {
        screenshotPath,
        entitySelection,
        initial: summarizeLayerState(initial),
        toggled: summarizeLayerState(toggled),
        selectedGlyph: summarizeLayerState(selectedGlyph),
        formEdited: summarizeLayerState(formEdited),
        addedLayerId,
        duplicateLayerId,
        presetApplied: summarizeLayerState(presetApplied),
        swatchApplied: summarizeLayerState(swatchApplied),
        textureSwatchApplied: summarizeLayerState(textureSwatchApplied),
        templateFilterApplied,
        exportedTemplate,
        templateApplied: summarizeLayerState(templateApplied),
        templateRecent,
        recentExportedTemplate,
        imported: summarizeLayerState(imported),
        exportedEntity,
        savedTemplate,
        importedTemplate,
        deletedTemplate,
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
    bodyFillSignal: state.exportValue.includes('"fill": "#00ff88"'),
  };
}
