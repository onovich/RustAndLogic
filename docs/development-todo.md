# Rust & Logic Development TODO

This TODO is the working backlog for reaching the first goal: a Web UI where the whole game UI flow can be tested end to end.

## Milestone 0: Project Control Plane

- [x] Sync source design documents into `docs/source-docs/`.
- [x] Establish the top-level architecture split between TapeScript and the game layer.
- [x] Initialize git, remote, and Codex workflow configuration.
- [x] Keep `docs/development-todo.md` current after each implementation slice.
- [x] Keep validation commands in `.codex/project-ops-workflow.json` aligned with the current stack.

## Milestone 1: TapeScript Core Slice

- [x] Define the TapeScript instruction model independent of UI and game progression.
- [x] Implement a two-pass compiler for labels, actions, queries, jumps, and comments.
- [x] Implement a deterministic VM state model with `pc`, `cf`, lifecycle state, and watchdog.
- [x] Define a hardware boundary for game/world actions.
- [x] Add tests for compile errors, label resolution, action suspension, and watchdog faults.

## Milestone 2: Headless Game Simulation Slice

- [x] Define a small deterministic grid world with robot position, direction, resources, inventory, and tick count.
- [x] Connect TapeScript VM output to game `ActionIntent` resolution through the hardware boundary.
- [x] Produce serializable snapshots for UI rendering.
- [x] Add explicit diff output for UI rendering.
- [x] Add offline fast-forward simulation.
- [x] Add tests for movement, pickup, resource collection, upgrades, snapshots, and arena preview.

## Milestone 3: Web UI Flow Slice

- [x] Create the first runnable Web UI app.
- [x] Provide a code editor area for TapeScript text.
- [x] Provide deploy/run/step/reset controls.
- [x] Render a grid map with robot state, scrap, cells, and logs.
- [x] Show compile/runtime feedback in a console panel.
- [x] Add progression panels for resources, tape capacity, upgrades, and robot modules.
- [x] Add hardware module upgrade actions that spend resources and update robot stats.
- [x] Add a local "arena preview" flow that can replay deterministic combat/scavenge results without network.
- [x] Add save/load flow that restores the current local game state in the Web UI.
- [x] Add visible full-flow checklist so smoke tests prove the complete UI path was exercised.
- [x] Add a smoke test that exercises the main UI flow in a browser.
- [x] Move player-facing localization text into `apps/web/i18n.csv` and load it into the Web UI dictionary at startup.
- [x] Rework the Web UI into location art, code, infinite-stage canvas, and collapsible systems columns.
- [x] Remove player-facing arena preview from the right sidebar; keep locked locations out of the sidebar.
- [x] Add pan/zoom behavior to the stage canvas and redesign map markers with glitch/noise styling.

## Milestone 4: Desktop/Web Packaging Path

- [x] Decide when to introduce Tauri versus keeping the Web UI as the first test harness.
- [x] Keep the simulation authoritative when Tauri arrives.
- [x] Keep Web/WASM and desktop IPC boundaries explicit.
- [ ] Document release and packaging commands once a desktop shell exists.

## Definition Of Done For A Small Item

Each small item is complete only after:

- Bug self-check: run the relevant tests or smoke checks and inspect behavior for obvious regressions.
- Architecture self-check: confirm file location, naming, dependencies, and domain boundaries match `docs/engineering-workflow.md`.
- Documentation check: update TODO or architecture notes if the change modifies scope, workflow, or behavior.
- Git hygiene: commit only the intended files and push to `origin/main`.
