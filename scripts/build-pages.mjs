import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = resolve(root, "dist/pages");
const appDir = resolve(root, "apps/web");
const packagesDir = resolve(root, "packages");
const pagesCustomDomain = "blog.onovich.com";

await rm(outDir, { recursive: true, force: true });
await mkdir(resolve(outDir, "apps/web"), { recursive: true });
await mkdir(resolve(outDir, "apps/web/imgs"), { recursive: true });

await cp(appDir, resolve(outDir, "apps/web"), { recursive: true });
await cp(packagesDir, resolve(outDir, "packages"), { recursive: true });
await cp(resolve(root, "imgs/sample2.avif"), resolve(outDir, "apps/web/imgs/sample2.avif"));

const rootShell = await buildRootShell(resolve(appDir, "index.html"));

await writeFile(resolve(outDir, "index.html"), rootShell);
await writeFile(resolve(outDir, "404.html"), rootShell);
await writeFile(resolve(outDir, "CNAME"), `${pagesCustomDomain}\n`);
await writeFile(resolve(outDir, ".nojekyll"), "");

console.log(`GitHub Pages artifact ready: ${outDir}`);

async function buildRootShell(indexPath) {
  const source = await readFile(indexPath, "utf8");
  if (source.includes("<base ")) {
    return source;
  }
  return source.replace("<head>", "<head>\n    <base href=\"./apps/web/\">");
}
