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
- [x] Add progression panels for resources, logic memory, upgrades, and robot modules.
- [x] Add hardware module upgrade actions that spend resources and update robot stats.
- [x] Add a local "arena preview" flow that can replay deterministic combat/scavenge results without network.
- [x] Add save/load flow that restores the current local game state in the Web UI.
- [x] Add visible full-flow checklist so smoke tests prove the complete UI path was exercised.
- [x] Add a smoke test that exercises the main UI flow in a browser.
- [x] Move player-facing localization text into `apps/web/i18n.csv` and load it into the Web UI dictionary at startup.
- [x] Rework the Web UI into location art, code, infinite-stage canvas, and collapsible systems columns.
- [x] Remove player-facing arena preview from the right sidebar; keep locked locations out of the sidebar.
- [x] Add pan/zoom behavior to the stage canvas and redesign map markers with glitch/noise styling.
- [x] Split Web UI configuration into `apps/web/app-data.json` and keep player-facing text in `apps/web/i18n.csv`.
- [x] Add a root `RunWebUI.cmd` command for manual browser testing.
- [x] Make Web UI data loading tolerate both current and previously running static server asset paths.
- [x] Redesign map symbols and barrier styling toward a quieter minimalist wabi-sabi visual language.
- [x] Add a constrained intro camera for the map canvas with brighter stage rendering.
- [x] Center the default map camera after the intro fit animation.
- [x] Align the collapsed left-sidebar toggle spacing and state with the right sidebar.
- [x] Retire legacy player-facing resource language in favor of script, logic memory, and memory shards.
- [x] Add a compact bilingual README with truthful run, validation, and architecture notes.
- [x] Archive the latest user-provided UI reference images under `docs/design-references/ui/`.
- [x] Archive the editor diagnostics, autocomplete, and runtime halt UI reference images under `docs/design-references/ui/`.
- [x] Document the placeholder location-art asset usage and overlay rules in `docs/design-references/ui/README.md`.
- [x] Record designer-provided UI implementation risk notes with applicability guidance in `docs/design-references/ui/README.md`.
- [x] Deliver the first high-fidelity terminal-style Web UI pass and record unresolved design gaps in `docs/design-references/ui/pixel-replica-audit.md`.
- [x] Tighten the terminal-style Web UI replica with a second visual refinement pass and refreshed local comparison screenshots.
- [x] Add a reusable screenshot capture script and complete a third visual refinement pass for shell framing, dialogue density, and runtime halt styling.
- [x] Complete a fourth visual refinement pass for story-mode stage composition, four-column proportions, and suffix-based compare screenshots.
- [x] Complete a fifth visual refinement pass for story-mode focal composition and tighter action-stack sizing.
- [x] Add language-aware compare screenshots and complete a sixth visual refinement pass for English draft alignment.
- [x] Complete a seventh visual refinement pass for quieter story-stage composition, denser systems rhythm, and narrower action-stack buttons.
- [x] Complete an eighth visual refinement pass for single-line stage headers and higher map start alignment.
- [x] Complete a ninth visual refinement pass for denser left-column rhythm, tighter dialogue framing, and slimmer systems fields.
- [x] Complete a tenth visual refinement pass for terminal shell effects, location-art readability, and button baseline alignment.
- [x] Complete an eleventh visual refinement pass for exact glow, blur, mask, and motion-parameter alignment.
- [x] Complete a twelfth visual refinement pass for task-list structure, split editor controls, sidebar handles, and DevLog reveal behavior.
- [x] Complete a thirteenth visual refinement pass for Chinese font layering across terminal, display, and narrative text zones.
- [x] Complete a fourteenth visual refinement pass for dialogue pagination affordances, runtime halt texture, and action-stack width alignment.
- [x] Complete a fifteenth visual refinement pass for diagnostics severity treatment, autocomplete density, and tighter systems-field rhythm.
- [x] Complete a sixteenth visual refinement pass for location-hero cadence, task-list compaction, and DevLog drawer framing.
- [x] Complete a seventeenth visual refinement pass for stage-dialogue balance, right-sidebar lower-region cadence, and richer DevLog comparison captures.
- [x] Complete an eighteenth visual refinement pass for location-hero compression and tighter right-action docking.
- [x] Complete a nineteenth visual refinement pass for editor-interaction density and runtime-halt toast compaction.

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
