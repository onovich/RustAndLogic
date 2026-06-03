import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = resolve(root, "dist/pages");
const appDir = resolve(root, "apps/web");
const packagesDir = resolve(root, "packages");

await rm(outDir, { recursive: true, force: true });
await mkdir(resolve(outDir, "apps/web"), { recursive: true });
await mkdir(resolve(outDir, "apps/web/imgs"), { recursive: true });

await cp(appDir, resolve(outDir, "apps/web"), { recursive: true });
await cp(packagesDir, resolve(outDir, "packages"), { recursive: true });
await cp(resolve(root, "imgs/sample2.avif"), resolve(outDir, "apps/web/imgs/sample2.avif"));

await writeFile(resolve(outDir, "index.html"), redirectHtml("./apps/web/"));
await writeFile(resolve(outDir, "404.html"), redirectHtml("./apps/web/"));
await writeFile(resolve(outDir, ".nojekyll"), "");

console.log(`GitHub Pages artifact ready: ${outDir}`);

function redirectHtml(target) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${target}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Rust & Logic</title>
    <script>
      window.location.replace(${JSON.stringify(target)});
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="${target}">${target}</a>...</p>
  </body>
</html>
`;
}
