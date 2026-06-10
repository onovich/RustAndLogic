# AGENTS.md

## Project Architecture Notes

Rust & Logic has two top-level domains:

- `TapeScript`: a minimal Rust language/compiler/VM/runtime layer for deterministic robot behavior.
- `Rust & Logic`: the game layer that consumes TapeScript for simulation, progression, UI, Tauri IPC, and arena systems.

Keep TapeScript independent from the game shell. It should not depend on Tauri, React, rendering, saves, economy, or progression code. The game should talk to TapeScript through explicit compiler, VM, and hardware-trait boundaries.

Use `docs/project-brief.md` and `docs/source-docs/` as local project truth before making architecture decisions.

## Mandatory Small-Slice Workflow

Every implementation or documentation slice must follow this loop:

1. Run a bug self-check that directly covers the changed behavior.
2. Run a refactor/architecture self-check against `docs/refactor-architecture-checklist.md` and `docs/engineering-workflow.md`.
3. Update `docs/development-todo.md` when scope or status changes.
4. Commit only the intended files and push to `origin/main`.

Code commits must run `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd` before staging and report architecture self-check evidence. Use `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-architecture.ps1` as the current architecture gate inside that validation flow.

<!-- codex-init-flow: initialized -->

## Codex Project Workflow

Initialization status: initialized
Initialized at: 2026-06-01 00:50:12 +08:00
Project root: D:\LabProjects\RustAndLogic
Initial git remote: git@github.com:onovich/RustAndLogic.git

Use these workflow skills for routine Codex work in this project:

- `init-flow`: initialize or refresh this project document and workflow configuration.
- `project-git-workflow` / `git-flow`: use for git status, validation, commit, push, stash, ignore, and guarded discard operations.
- `project-ops-workflow` / `ops-flow`: use for environment checks, dependencies, build, test, lint, format, typecheck, dev server, smoke, package, and release dry-run operations.

Prefer the configured wrappers instead of guessing project commands:

```
powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "commit message" -Paths path\to\file,other\file
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Stash.cmd -StashMessage "reason"
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\DiscardPaths.cmd -ConfirmDangerous -Paths path\to\file
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StartDevServer.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StopDevServer.cmd
```

Project-specific workflow configs live at:

- `.codex/project-git-workflow.json`
- `.codex/project-ops-workflow.json`

Do not silently fall back to generic git/build/test behavior when those configs exist. Update this section and the workflow configs deliberately when project policy changes.

<!-- /codex-init-flow -->

