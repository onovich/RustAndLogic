<!-- codex-project-ops-workflow: initialized -->
<!-- initialized-at: 2026-06-01 00:50:13 +08:00 -->

# Codex Ops Workflow

Initialization status: initialized
Project: RustAndLogic
Repository root: D:/LabProjects/RustAndLogic
Machine config: `.codex\project-ops-workflow.json`
Skill: project-ops-workflow

Treat this document and .codex/project-ops-workflow.json as the source of truth for mechanical project operations.

## Global Wrappers

```
powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\EnvCheck.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\RestoreDeps.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\InstallDeps.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Build.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Test.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Lint.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Format.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Typecheck.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StructureCheck.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Codegen.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\DocsCheck.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StartDevServer.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StopDevServer.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Package.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

## Validate Sequence

lint, typecheck, build, test, structureCheck, docsCheck

## Dev Server

Start command: `C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/serve-web-ui.mjs 4173`
Health URL: intentionally blank in `.codex/project-ops-workflow.json`.
Ready text: intentionally blank.
Timeout seconds: 30

`Smoke.cmd` relies on `scripts/smoke-web-ui.mjs`, which starts its own temporary HTTP server on an available port and closes it after the browser flow finishes. Keep smoke independent from the fixed manual-testing port `4173`, because that port may already be occupied by another local project.

For token-light refactor slices, run focused module tests first:

```powershell
C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/test-web-utils.mjs
```

This directly covers extracted Web utility and Graphics Studio pure modules before the broader `Validate.cmd` and `Smoke.cmd` gates.

## Safety Policy

Do not run destructive clean/reset/deploy commands unless the user explicitly asks.
