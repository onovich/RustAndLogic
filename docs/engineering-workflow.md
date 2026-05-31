# Engineering Workflow

This project uses a strict small-slice workflow. A slice should be small enough to review, validate, commit, and push independently.

## Required Loop

For every small item:

1. Read current state.
2. Make the smallest aligned implementation or documentation change.
3. Bug self-check:
   - Run the configured validation command when available.
   - Run narrower tests or smoke checks that directly cover the changed behavior.
   - Inspect failures instead of assuming they are unrelated.
4. Architecture self-check:
   - TapeScript code stays independent from game UI, Tauri, rendering, saves, economy, and progression.
   - Game code depends on TapeScript through explicit compiler, VM, and hardware boundaries.
   - UI code may render snapshots and send commands, but must not become the authoritative simulation.
   - Files live in the expected domain directory.
   - Names describe domain concepts, not temporary implementation accidents.
   - Generated/cache/runtime files stay ignored unless deliberately promoted.
5. Update docs/TODO when the slice changes project knowledge.
6. Review `git diff --cached --name-status` before committing.
7. Commit and push only after the checks pass.

## Expected Directory Boundaries

- `docs/`: project knowledge, synced design docs, workflow, roadmap, decisions.
- `scripts/`: repository validation, smoke, and automation helpers.
- `packages/tapescript-runtime/`: current JavaScript TapeScript harness. It must remain UI-independent until replaced or complemented by Rust crates.
- `packages/game-sim/`: current JavaScript game simulation harness. It may depend on TapeScript, but must not depend on DOM/UI code.
- `crates/`: future Rust crates. TapeScript crates should be standalone.
- `apps/web/`: first Web UI test harness and later browser-facing app code.
- `apps/desktop/`: future Tauri shell if introduced.

## Current Validation Gate

Until the implementation stack exists, validation is intentionally documentation-heavy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-architecture.ps1
```

As soon as code appears, add stack-specific checks to `.codex/project-ops-workflow.json` instead of relying only on the architecture script.

The Web UI is served through the local static server because ES modules should run over HTTP:

```powershell
C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/serve-web-ui.mjs 4173
```
