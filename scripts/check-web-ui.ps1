Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path -LiteralPath $node)) {
  $node = "node"
}

$files = @(
  "packages/tapescript-runtime/index.js",
  "packages/game-sim/index.js",
  "apps/web/src/main.js",
  "scripts/serve-web-ui.mjs",
  "scripts/test-runtime.mjs",
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

Write-Host "Web UI and runtime checks passed."
