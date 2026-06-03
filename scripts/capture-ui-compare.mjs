import { mkdir } from "node:fs/promises";
import { createStaticServer } from "./serve-web-ui.mjs";
import { chromium } from "file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs";

const artifactsDir = new URL("../.codex-artifacts/", import.meta.url);
const suffix = process.argv[2] ?? "pass";

await mkdir(artifactsDir, { recursive: true });

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
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1285 },
    deviceScaleFactor: 1,
  });

  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
  await page.getByTestId("world-grid").waitFor({ state: "visible", timeout: 10000 });

  await setLanguage(page, "zh");
  await page.screenshot({ path: filePath(`compare-default-${suffix}.png`), fullPage: true });

  await dismissStory(page);
  await page.getByTestId("script-editor").fill("Che");
  await page.locator('[data-testid="script-autocomplete"]').waitFor({ state: "visible", timeout: 5000 });
  await page.screenshot({ path: filePath(`compare-editor-${suffix}.png`), fullPage: true });

  await page.getByTestId("script-editor").fill("Drop()");
  await page.getByTestId("play-button").click();
  await page.getByTestId("runtime-toast").waitFor({ state: "visible", timeout: 6000 });
  await page.screenshot({ path: filePath(`compare-runtime-${suffix}.png`), fullPage: true });

  console.log(`Captured compare-default-${suffix}.png, compare-editor-${suffix}.png, compare-runtime-${suffix}.png`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

async function setLanguage(page, mode) {
  await page.getByTestId("settings-toggle").click();
  await page.getByTestId(`lang-${mode}-button`).click();
  await page.getByTestId("settings-toggle").click();
}

async function dismissStory(page) {
  const dialogue = page.getByTestId("story-dialogue");
  for (let index = 0; index < 4; index += 1) {
    const visible = await dialogue.isVisible().catch(() => false);
    if (!visible) {
      return;
    }
    await dialogue.click();
  }
  await dialogue.waitFor({ state: "hidden", timeout: 5000 });
}

function filePath(name) {
  return new URL(name, artifactsDir).pathname.slice(1);
}
