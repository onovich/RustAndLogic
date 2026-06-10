# Refactor Architecture Checklist

Use this checklist before committing any code refactor. Keep the final answer or commit notes explicit enough to prove the check happened.

This is the short standard. When a longer refactor guide feels too broad for the current slice, use this page as the binding self-check.

## Required Self-Check

1. Boundary: TapeScript stays UI, Tauri, rendering, save, economy, and progression independent.
2. Authority: `packages/game-sim/` owns simulation state; UI renders snapshots and sends commands only.
3. Placement: move extracted code into the narrowest existing domain module; do not create empty architecture folders.
4. Direction: shared logic moves inward to helpers; consumers such as `main.js` stay thin and orchestrate state, persistence, toasts, and cross-system refresh only.
5. Side effects: DOM rendering, event parsing, browser IO, storage, and pure state transitions are separate modules when a feature grows.
6. Coverage: run a focused behavior check for the changed path, then the configured architecture gate before commit.
7. Scope: update `docs/development-todo.md` when the slice changes project scope, workflow, or status.

## Codex Hook Contract

The project Stop hook in `.codex/hooks/rustandlogic/refactor_architecture_gate.py` treats code/refactor/commit summaries as incomplete unless they mention architecture self-check evidence, such as:

- `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
- `scripts/check-architecture.ps1`
- `Architecture check passed.`
- this checklist

If the hook blocks a final answer, run the missing check or explicitly cite the already-run architecture self-check before finishing.

## Current Graphics Studio Pattern

- `render.js`: DOM creation and visual application.
- `events.js`: DOM event binding and `dataset` action parsing.
- `commands.js`: state command composition using pure helpers.
- `io.js`: textarea, clipboard, and text-input side effects.
- `main.js`: initialization, selected state, persistence, toasts, world refresh, and cross-system bridge orchestration.

Run the gate:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-architecture.ps1
```
