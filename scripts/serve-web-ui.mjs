import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);

export function createStaticServer() {
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    let relativePath = pathname === "/" ? "apps/web/index.html" : pathname.slice(1);
    if (["styles.css"].includes(relativePath) || relativePath.startsWith("src/")) {
      relativePath = `apps/web/${relativePath}`;
    }
    const fullPath = resolve(root, relativePath);

    if (!fullPath.startsWith(root) || !existsSync(fullPath)) {
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

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const server = createStaticServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Rust & Logic Web UI: http://127.0.0.1:${port}/`);
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
    default:
      return "application/octet-stream";
  }
}
