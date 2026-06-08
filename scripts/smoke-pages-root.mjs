import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "./build-pages.mjs";
import { chromium } from "file:///C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pagesRoot = resolve(root, "dist/pages");

const server = createStaticServer(pagesRoot);
await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
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
  await page.getByTestId("world-grid").waitFor({ state: "visible", timeout: 10000 });

  if (pageErrors.length > 0) {
    throw new Error(`Browser errors while booting Pages root build: ${pageErrors.join(" | ")}`);
  }

  const rootState = await page.evaluate(() => ({
    path: window.location.pathname,
    baseHref: document.querySelector("base")?.getAttribute("href") ?? "",
    scriptSrc: document.querySelector('script[type="module"]')?.getAttribute("src") ?? "",
    title: document.title,
  }));

  if (rootState.path !== "/") {
    throw new Error(`Expected Pages build to stay on root path, got ${JSON.stringify(rootState)}.`);
  }
  if (rootState.baseHref !== "./apps/web/") {
    throw new Error(`Expected root shell to resolve assets through ./apps/web/, got ${JSON.stringify(rootState)}.`);
  }
  if (rootState.scriptSrc !== "./src/main.js") {
    throw new Error(`Expected root shell to keep the app module entry, got ${JSON.stringify(rootState)}.`);
  }
  if (!rootState.title.includes("Rust & Logic")) {
    throw new Error(`Expected root shell title to stay intact, got ${JSON.stringify(rootState)}.`);
  }

  console.log("Pages root smoke passed.");
} finally {
  await browser.close();
  await new Promise((resolvePromise) => server.close(resolvePromise));
}

function createStaticServer(staticRoot) {
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const fullPath = resolve(staticRoot, relativePath);

    if (!fullPath.startsWith(staticRoot) || !existsSync(fullPath)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const fileStat = await stat(fullPath);
    if (fileStat.isDirectory()) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Directory listing disabled");
      return;
    }

    response.writeHead(200, { "content-type": contentType(fullPath) });
    createReadStream(fullPath).pipe(response);
  });
}

function contentType(path) {
  switch (extname(path)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".avif":
      return "image/avif";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
