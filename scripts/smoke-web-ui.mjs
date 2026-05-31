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

  await page.getByTestId("deploy-button").click();
  await expectText(page, "compile-status", "Compile OK");

  await page.getByTestId("step-button").click();
  await expectText(page, "scrap-count", "1");

  await page.getByTestId("upgrade-button").click();
  await expectText(page, "capacity-label", "Capacity 10");

  await page.getByTestId("run-button").click();
  await page.getByTestId("arena-button").click();

  const arenaText = await page.getByTestId("arena-summary").innerText();
  if (!arenaText.includes("Victory")) {
    throw new Error(`Expected arena preview victory, got: ${arenaText}`);
  }

  const logText = await page.getByTestId("console-log").innerText();
  if (!logText.includes("Arena preview") || !logText.includes("Tape upgraded")) {
    throw new Error("Expected console log to include arena and upgrade events.");
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
