Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path -LiteralPath $node)) {
  $node = "node"
}

$files = @(
  "packages/tapescript-runtime/index.js",
  "packages/game-sim/index.js",
  "apps/web/src/graphics-studio/config.js",
  "apps/web/src/graphics-studio/entity-visuals.js",
  "apps/web/src/graphics-studio/form-schema.js",
  "apps/web/src/graphics-studio/layers.js",
  "apps/web/src/graphics-studio/storage.js",
  "apps/web/src/graphics-studio/swatches.js",
  "apps/web/src/graphics-studio/template-library.js",
  "apps/web/src/graphics-studio/templates.js",
  "apps/web/src/stages.js",
  "apps/web/src/utils/assets.js",
  "apps/web/src/utils/csv.js",
  "apps/web/src/utils/json.js",
  "apps/web/src/main.js",
  "scripts/serve-web-ui.mjs",
  "scripts/test-runtime.mjs",
  "scripts/test-web-utils.mjs",
  "scripts/smoke-web-ui.mjs"
)

foreach ($file in $files) {
  & $node --check $file
  if ($LASTEXITCODE -ne 0) {
    throw "JavaScript syntax check failed: $file"
  }
}

& $node scripts/test-runtime.mjs
if ($LASTEXITCODE -ne 0) {
  throw "Runtime tests failed."
}

& $node scripts/test-web-utils.mjs
if ($LASTEXITCODE -ne 0) {
  throw "Web utility tests failed."
}

Write-Host "Web UI and runtime checks passed."
