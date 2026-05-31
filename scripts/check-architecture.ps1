Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location -LiteralPath $repoRoot

$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $failures.Add($Message) | Out-Null
}

function Test-NoBom {
  param([string]$Path)
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
    Add-Failure "UTF-8 BOM is not allowed: $Path"
  }
}

function Test-RequiredFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    Add-Failure "Missing required file: $Path"
  }
}

$requiredFiles = @(
  "AGENTS.md",
  "docs/project-brief.md",
  "docs/development-todo.md",
  "docs/engineering-workflow.md",
  "docs/source-docs/tapescript-language-design.md",
  "docs/source-docs/tapescript-technical-spec.md",
  "docs/source-docs/tapescript-architecture-design.md",
  "docs/source-docs/rust-and-logic-game-design.md",
  "docs/source-docs/rust-and-logic-technical-architecture.md",
  "docs/source-docs/rust-and-logic-roadmap.md"
)

foreach ($file in $requiredFiles) {
  Test-RequiredFile $file
}

$textExtensions = @(".md", ".json", ".ps1", ".js", ".mjs", ".ts", ".tsx", ".html", ".css", ".rs", ".toml")
Get-ChildItem -File -Recurse |
  Where-Object {
    $_.FullName -notmatch "\\.git\\" -and
    $_.FullName -notmatch "\\.tmp\\" -and
    $_.FullName -notmatch "\\docs\\sources\\" -and
    $_.FullName -notmatch "\\docs\\source-docs\\_raw\\" -and
    $textExtensions -contains $_.Extension
  } |
  ForEach-Object { Test-NoBom $_.FullName }

if ((Test-Path -LiteralPath "apps") -and -not (Test-Path -LiteralPath "apps/web")) {
  Add-Failure "If apps/ exists, apps/web/ must exist as the first UI test harness."
}

if ((Test-Path -LiteralPath "packages") -and -not (Test-Path -LiteralPath "packages/tapescript-runtime")) {
  Add-Failure "If packages/ exists, packages/tapescript-runtime/ must define the TapeScript boundary."
}

if ((Test-Path -LiteralPath "packages/game-sim") -and -not (Test-Path -LiteralPath "packages/tapescript-runtime")) {
  Add-Failure "The game simulation package requires an explicit TapeScript runtime package."
}

if (Test-Path -LiteralPath "packages/tapescript-runtime") {
  $runtimeImports = Get-ChildItem -File -Recurse "packages/tapescript-runtime" |
    Where-Object { $textExtensions -contains $_.Extension } |
    Select-String -Pattern "apps/web|document\.|window\.|localStorage|tauri|pixi|monaco" -SimpleMatch
  if ($runtimeImports) {
    Add-Failure "TapeScript runtime must remain independent from UI, browser globals, Tauri, Pixi, and Monaco."
  }
}

if ((Test-Path -LiteralPath "crates") -and -not (Test-Path -LiteralPath "crates/tapescript")) {
  Add-Failure "If crates/ exists, the TapeScript runtime must have an explicit crates/tapescript boundary."
}

$gitignore = if (Test-Path -LiteralPath ".gitignore") { Get-Content -LiteralPath ".gitignore" -Raw } else { "" }
foreach ($pattern in @(".tmp/", "docs/source-docs/_raw/", "docs/sources/gemini-raw/")) {
  if ($gitignore -notmatch [regex]::Escape($pattern)) {
    Add-Failure ".gitignore must keep runtime/source caches ignored: $pattern"
  }
}

if ($failures.Count -gt 0) {
  Write-Host "Architecture check failed:" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Architecture check passed."
