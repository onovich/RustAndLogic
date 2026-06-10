Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
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

function Format-RepoPath {
  param([string]$Path)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $rootPath = [System.IO.Path]::GetFullPath($repoRoot)
  if ($fullPath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath.Substring($rootPath.Length).TrimStart("\", "/")
  }
  return $Path
}

function Get-TextFiles {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return @()
  }
  return @(
    Get-ChildItem -File -Recurse -LiteralPath $Path |
      Where-Object { $textExtensions -contains $_.Extension }
  )
}

function Add-ForbiddenPatternFailure {
  param(
    [object[]]$Files,
    [string]$Pattern,
    [string]$Message
  )
  if (-not $Files -or $Files.Count -eq 0) {
    return
  }

  $firstMatch = $Files | Select-String -Pattern $Pattern | Select-Object -First 1
  if ($firstMatch) {
    $path = Format-RepoPath $firstMatch.Path
    Add-Failure "$Message Found at ${path}:$($firstMatch.LineNumber)."
  }
}

$requiredFiles = @(
  "AGENTS.md",
  "docs/project-brief.md",
  "docs/development-todo.md",
  "docs/engineering-workflow.md",
  "docs/refactor-architecture-checklist.md",
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

$textExtensions = @(".md", ".json", ".ps1", ".py", ".js", ".mjs", ".ts", ".tsx", ".html", ".css", ".rs", ".toml")
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
  $runtimeFiles = Get-TextFiles "packages/tapescript-runtime"
  Add-ForbiddenPatternFailure `
    $runtimeFiles `
    "apps[\\/]+web|document\.|window\.|localStorage|sessionStorage|navigator\.|addEventListener|querySelector|createElement|closest|tauri|pixi|monaco" `
    "TapeScript runtime must remain independent from UI, browser globals, Tauri, Pixi, and Monaco."
}

if (Test-Path -LiteralPath "packages/game-sim") {
  $gameSimFiles = Get-TextFiles "packages/game-sim"
  Add-ForbiddenPatternFailure `
    $gameSimFiles `
    "apps[\\/]+web|document\.|window\.|localStorage|sessionStorage|navigator\.|addEventListener|querySelector|createElement|closest|tauri|pixi|monaco" `
    "Game simulation must stay headless and avoid UI, browser globals, Tauri, Pixi, and Monaco."
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

$graphicsStudioPath = "apps/web/src/graphics-studio"
if (Test-Path -LiteralPath $graphicsStudioPath) {
  $requiredGraphicsModules = @("commands.js", "events.js", "io.js", "render.js")
  foreach ($moduleName in $requiredGraphicsModules) {
    Test-RequiredFile (Join-Path $graphicsStudioPath $moduleName)
  }

  $graphicsFiles = Get-TextFiles $graphicsStudioPath
  $sideEffectModules = @("events.js", "io.js", "render.js")
  $pureGraphicsFiles = @($graphicsFiles | Where-Object { $sideEffectModules -notcontains $_.Name })

  Add-ForbiddenPatternFailure `
    $pureGraphicsFiles `
    "\b(document|window|navigator|localStorage|sessionStorage|globalThis)\b|addEventListener|querySelector|createElement|closest|dataset" `
    "Graphics Studio pure/config/storage/command helpers must not use DOM, dataset parsing, or browser globals outside events/io/render."

  Add-ForbiddenPatternFailure `
    @(Get-Item -LiteralPath (Join-Path $graphicsStudioPath "commands.js")) `
    "\b(document|window|navigator|localStorage|sessionStorage|globalThis)\b|addEventListener|querySelector|createElement|closest|dataset" `
    "Graphics Studio commands.js must stay state-command orchestration without DOM or browser side effects."

  Add-ForbiddenPatternFailure `
    @(Get-Item -LiteralPath (Join-Path $graphicsStudioPath "render.js")) `
    "addEventListener|localStorage|sessionStorage|navigator\.|execCommand" `
    "Graphics Studio render.js must render/apply DOM only; event binding, storage, and clipboard IO belong elsewhere."

  Add-ForbiddenPatternFailure `
    @(Get-Item -LiteralPath (Join-Path $graphicsStudioPath "events.js")) `
    "document\.|window\.|localStorage|sessionStorage|navigator\.|globalThis|createElement|execCommand" `
    "Graphics Studio events.js must bind and parse events only; rendering, storage, and browser IO belong elsewhere."

  Add-ForbiddenPatternFailure `
    @(Get-Item -LiteralPath (Join-Path $graphicsStudioPath "io.js")) `
    "addEventListener|querySelector|createElement|closest|localStorage|sessionStorage" `
    "Graphics Studio io.js must own text/clipboard side effects only; event binding, rendering, and storage belong elsewhere."

  $mainPath = "apps/web/src/main.js"
  if (Test-Path -LiteralPath $mainPath) {
    $mainText = Get-Content -LiteralPath $mainPath -Raw
    foreach ($moduleName in $requiredGraphicsModules) {
      $importPath = "./graphics-studio/$moduleName"
      if ($mainText -notmatch [regex]::Escape($importPath)) {
        Add-Failure "main.js must keep Graphics Studio orchestration wired through $importPath."
      }
    }
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
