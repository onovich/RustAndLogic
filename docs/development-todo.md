# Rust & Logic Development TODO

This TODO is the working backlog for reaching the first goal: a Web UI where the whole game UI flow can be tested end to end.

## Milestone 0: Project Control Plane

- [x] Sync source design documents into `docs/source-docs/`.
- [x] Establish the top-level architecture split between TapeScript and the game layer.
- [x] Initialize git, remote, and Codex workflow configuration.
- [x] Distill local design research into a reusable game design guide and planning roadmap.
- [x] Convert the planning next steps into stage, economy, and early-playable design docs.
- [x] Translate M1~M4 planning into concrete system requirements and domain-split implementation backlog docs.
- [x] Keep `docs/development-todo.md` current after each implementation slice.
- [x] Keep validation commands in `.codex/project-ops-workflow.json` aligned with the current stack.
- [x] Wire the git workflow validation step to the existing ops validation wrapper so commit/push runs the project gate automatically.
- [x] Keep the ops smoke workflow independent from fixed `4173` dev-server health checks.

## Milestone 1: TapeScript Core Slice

- [x] Define the TapeScript instruction model independent of UI and game progression.
- [x] Implement a two-pass compiler for labels, actions, queries, jumps, and comments.
- [x] Implement a deterministic VM state model with `pc`, `cf`, lifecycle state, and watchdog.
- [x] Define a hardware boundary for game/world actions.
- [x] Add the early `Check(Energy)` query path for low-power return logic.
- [x] Add tests for compile errors, label resolution, action suspension, and watchdog faults.
- [x] Replace the player-facing conditional syntax with `If` / `IfNot ... Then ...` sugar while keeping the TapeScript VM core unchanged.

## Milestone 2: Headless Game Simulation Slice

- [x] Define a small deterministic grid world with robot position, direction, resources, inventory, and tick count.
- [x] Connect TapeScript VM output to game `ActionIntent` resolution through the hardware boundary.
- [x] Produce serializable snapshots for UI rendering.
- [x] Add explicit diff output for UI rendering.
- [x] Add offline fast-forward simulation.
- [x] Split robot cargo from base inventory and make `Unload(Home)` transfer delivered items into base stock.
- [x] Add an early battery loop with home recharge and low-power blocking.
- [x] Add minimal base-facility semantics for charging, repair, and crafting with a snapshot-visible facility model.
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
- [x] Extract Web UI language-mode normalization and browser-language resolution into reusable pure helpers with direct tests.
- [x] Rework the Web UI into location art, code, infinite-stage canvas, and collapsible systems columns.
- [x] Extract Web UI sidebar-collapse labels and dataset toggling into reusable pure shell helpers with direct tests.
- [x] Extract Web UI settings/devlog drawer toggle state into reusable pure shell helpers with direct tests.
- [x] Extract Web UI Graphics Studio shell open/button state into reusable pure shell helpers with direct tests.
- [x] Remove player-facing arena preview from the right sidebar; keep locked locations out of the sidebar.
- [x] Add pan/zoom behavior to the stage canvas and redesign map markers with glitch/noise styling.
- [x] Split Web UI configuration into `apps/web/app-data.json` and keep player-facing text in `apps/web/i18n.csv`.
- [x] Extract Web UI asset loading, CSV/i18n parsing, and JSON clone helpers into reusable utility modules.
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
- [x] Complete a twentieth visual refinement pass for localized runtime halts, two-digit line numbers, and story-gated stage entity loading.
- [x] Complete a twenty-first visual refinement pass for story-vs-idle map layering and camera-synced world grid movement.
- [x] Complete a twenty-second visual refinement pass for immediate real-map loading from startup and removal of any fake-grid fallback.
- [x] Complete a twenty-third visual refinement pass for removing the fixed spotlight duplicate from the stage layer.
- [x] Complete a twenty-fourth visual refinement pass for binding the UI to actually available mono/body/display font stacks.
- [x] Document the current Web UI design system for future extension and reuse.
- [x] Surface base inventory, robot cargo, and battery state in the Web UI task and status panels.
- [x] Add facility status readouts and curated M1/M2/M3 sample scripts to the Web UI settings flow.
- [x] Bind M1/M2/M3 into explicit stage configurations so map state, objectives, and default scripts switch together.
- [x] Bind each stage's location copy, opening briefing, and resource-priority guidance to stage configuration data.
- [x] Bind each stage's recommended speed, available upgrades, visible facilities, and completion target summary to stage configuration data.
- [x] Bind each stage's script scaffolds, recommended sample presets, and runtime recovery hints to stage configuration data.
- [x] Bind each stage's one-time first-success and first-failure teaching prompts to stage configuration data.
- [x] Extract Web UI stage configuration selectors for tasks, speeds, upgrades, facilities, samples, and teaching moments into reusable pure helpers with direct tests.
- [x] Add the first M4 hot-zone slice with hazard tiles, chip recovery, and a hazard-aware retreat/repair script path.
- [x] Add the first M5 stock-balancing slice with base resource queries, a stock-aware sample script, and dynamic fabricator recipe readouts.
- [x] Add the second M5 dynamic-cost slice with `BelowCost(Craft)` queries and a two-shard stock-balancing objective.
- [x] Tune the M5 recovery lane energy budget so the cost-aware sample can complete the farthest scrap return and finish the second craft.
- [x] Add the first M6 combat slice with live hostile entities, real `Fire()` resolution, and a guarded-chip intercept script path.
- [x] Upgrade the TapeScript editor autocomplete from whole-line templates to context-aware segmented suggestions for `If` / `Check` / `Then` / targets / predicates / parameters / actions.
- [x] Chain TapeScript editor autocomplete steps so inserted `Check()` / `Move()` / `Turn()` / `Goto @` snippets place the caret in the next useful slot and immediately surface the next-stage suggestions.
- [x] Extend TapeScript editor autocomplete to carry `Check(target)` selections into predicates and to finish conditional queries into `Then`-stage action suggestions.
- [x] Add label-aware editor guidance so `Goto @...` autocomplete surfaces defined labels with line metadata and the highlighter distinguishes label definitions, resolved references, and missing references.
- [x] Harden TapeScript autocomplete matching so non-string suggestion values cannot crash segmented completion filtering.
- [x] Extract TapeScript editor autocomplete matching, suggestion normalization, snippet metadata, and dedupe helpers into a reusable pure module with direct tests.
- [x] Extract TapeScript editor autocomplete list display model into reusable pure autocomplete helpers with direct tests.
- [x] Extract TapeScript editor autocomplete popup positioning into reusable pure autocomplete helpers with direct tests.
- [x] Extract TapeScript editor token-range and label-definition scanning into reusable pure text helpers with direct tests.
- [x] Extract TapeScript editor syntax highlighting and diagnostic severity rules into reusable pure helpers with direct tests.
- [x] Extract TapeScript editor label lookup and line selection range calculations into reusable pure text helpers with direct tests.
- [x] Extract TapeScript editor diagnostic list view model into reusable pure highlight helpers with direct tests.
- [x] Lock TapeScript editing to the stopped state, make pause/resume continue from the current VM position, and make stop reset only the stage simulation instead of overwriting the current script.
- [x] Add a startup loading overlay so the player never sees the pre-hydration map shell drift into the fully loaded stage state.
- [x] Extract Web UI runtime halt cause detection, toast-key selection, and auto-pause checks into reusable pure helpers with direct tests.
- [x] Extract Web UI runtime toast title/body formatting and stage-hint text into reusable pure helpers with direct tests.
- [x] Extract Web UI runtime flow-progress rules into reusable pure helpers with direct tests.
- [x] Extract Web UI runtime flow progress labels and summary task selection into reusable pure helpers with direct tests.
- [x] Extract Web UI runtime flow summary text formatting into reusable pure helpers with direct tests.
- [x] Extract Web UI runtime teaching-moment selection into reusable pure helpers with direct tests.
- [x] Extract Web UI runtime teaching-moment toast text formatting into reusable pure helpers with direct tests.
- [x] Extract Web UI playback control labels, disabled states, speed labels, and timer delay calculations into reusable pure helpers with direct tests.
- [x] Extract Web UI playback control translated text and titles into reusable pure helpers with direct tests.
- [x] Remove the obsolete playback control fallback that referenced the old pause button after the patched control model became authoritative.
- [x] Extract Web UI runtime display labels, meter percentages, and cargo manifest summaries into reusable pure helpers with direct tests.
- [x] Extract Web UI cargo manifest display item normalization into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI cargo manifest localized text formatting into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI facility status and recipe description formatting into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI VM state label key and runtime meter text into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI tick, capacity label, and module stat fields into reusable pure runtime display model data with direct tests.
- [x] Extract Web UI compile-status visibility into reusable pure runtime display model data with direct tests.
- [x] Extract Web UI runtime checklist done/active state selection into reusable pure flow helpers with direct tests.
- [x] Extract Web UI facility list visibility and recipe display data into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI runtime log and diff display data into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI runtime diff row text and empty-key display data into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI runtime diff count and empty text formatting into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI save-status summary text formatting into reusable pure runtime display helpers with direct tests.
- [x] Extract Web UI stage and sample action button view models into reusable pure stage helpers with direct tests.
- [x] Extract Web UI stage location copy and guidance key selection into reusable pure stage helpers with direct tests.
- [x] Extract Web UI stage copy and guidance text formatting into reusable pure stage helpers with direct tests.
- [x] Extract Web UI story dialogue visibility, prompt, and page-dot view model into reusable pure stage helpers with direct tests.
- [x] Extract Web UI story dialogue text formatting into reusable pure stage helpers with direct tests.
- [x] Extract Web UI runtime flow list and summary view models into reusable pure flow helpers with direct tests.

## Milestone 4: Desktop/Web Packaging Path

- [x] Decide when to introduce Tauri versus keeping the Web UI as the first test harness.
- [x] Keep the simulation authoritative when Tauri arrives.
- [x] Keep Web/WASM and desktop IPC boundaries explicit.
- [x] Add a GitHub Pages deployment path for the current Web UI harness.
- [x] Serve the GitHub Pages build directly from the repository root path and preserve the `blog.onovich.com` custom-domain artifact during deployment.
- [ ] Document release and packaging commands once a desktop shell exists.

## Milestone 5: Developer Visual Authoring Tooling

- [x] Add the first developer-only graphics editor slice with a local visual catalog, live preview, map integration, local persistence, and JSON export.
- [x] Add a developer-only graphics editor entry for authoring entity visuals for robots, items, obstacles, walls, and other map entities.
- [x] Support layered composition per entity with editable glyph and shape controls:
  `character glyph`, `font size`, `glyph color`, `glyph position`, `background color`, `stroke color`, `shape type` (`rectangle`, `circle`, `regular polygon`, `star polygon`), `corner radius`, `polygon side count`, `star inner radius`, `star outer radius`, `star point count`, `stripe texture` (`color`, `width`, `angle`, `gap`), `pixel-dither texture` (`scale`, `texture type`), and multi-shape stacking where each shape carries the same editable styling model.
- [x] Promote the graphics lab into a dedicated full-screen developer studio mode while keeping its local catalog, preview, diff, and runtime console linked to the same Web UI state.
- [x] Add per-layer visibility and lock controls plus selected-entity import/export so developers can manage iteration without replacing the entire visual catalog each time.
- [x] Extract Graphics Studio layer action disabled-state rules into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer list row view-model construction into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio shape-preset list visibility and button view models into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio template action disabled-state rules into reusable pure template helpers with direct tests.
- [x] Extract Graphics Studio locked-layer form control disabled-state rules into reusable pure form-schema helpers with direct tests.
- [x] Add quick shape presets and denser layer-state readouts so common silhouette changes take one click instead of manual field edits.
- [x] Externalize Graphics Studio presets and editor swatches into app data so common authoring helpers stay data-driven instead of living in the Web UI implementation.
- [x] Extract Graphics Studio swatch strip visibility state into reusable pure swatch helpers with direct tests.
- [x] Externalize Graphics Studio default shape/glyph layer templates into app data so newly added layers follow editable authoring defaults instead of JS-only constants.
- [x] Externalize Graphics Studio option catalogs for layer type, shape, texture mode, and dither variant so editor dropdown vocabulary also lives in app data.
- [x] Externalize Graphics Studio field schema for entity, glyph, and shape editors so form structure and conditional field visibility no longer live only in `main.js`.
- [x] Extract Graphics Studio field schema view-model construction into reusable pure form-schema helpers with direct tests.
- [x] Add data-driven entity templates/prefabs so developers can replace the current entity visual with a whole layered preset in one click.
- [x] Add template applicability metadata and recommendation ordering so the Studio template library surfaces better matches for the currently selected entity.
- [x] Add local custom-template saving so developers can capture the current entity visual into a reusable Studio template library entry.
- [x] Add per-template thumbnail previews so the Studio library can be browsed visually instead of only by label.
- [x] Add a recent-template strip so developers can quickly reapply the last few visuals they were iterating with.
- [x] Group the template library into localized recommendation/category sections so the Studio reads more like a browsable asset catalog.
- [x] Add template filter controls for fit/current-category browsing so developers can narrow the Studio catalog without losing the grouped library model.
- [x] Add single-template export/import so Studio templates can move through a portable JSON exchange flow instead of staying trapped in one browser profile.
- [x] Add full custom-template-library export/import so developers can move whole local asset packs between browsers and machines.
- [x] Extract Graphics Studio entity visual SVG/Data URL rendering into a reusable pure module with direct tests.
- [x] Extract Graphics Studio template normalization, serialization, and placeholder resolution into a reusable pure module with direct tests.
- [x] Extract Graphics Studio storage restore, persistence, and entity-visual catalog merge helpers into a reusable module with direct tests.
- [x] Extract Graphics Studio form schema visibility, value resolution, select option, and input coercion helpers into a reusable pure module with direct tests.
- [x] Extract Graphics Studio layer creation, type upgrade, preset patching, ordering, and display-summary helpers into a reusable pure module with direct tests.
- [x] Extract Graphics Studio fill/texture swatch view-model generation and layer application helpers into a reusable pure module with direct tests.
- [x] Extract Graphics Studio template library source tagging, filtering, sorting, grouping, recommendation, and filter-option helpers into a reusable pure module with direct tests.
- [x] Extract Graphics Studio default editor configuration and config normalization into a reusable pure module with direct tests.
- [x] Extract Graphics Studio custom-template recent, upsert, removal, import-id, and default-label helpers into reusable pure functions with direct tests.
- [x] Extract Graphics Studio template filter row visibility state into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio template card metadata and action view models into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio template library and recent-template strip visibility models into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio entity selector labels and active-state items into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio entity preview background and label model into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio entity IO export text, placeholder, and action-label model into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio layer toolbar disabled and selected-lock state into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio copy/reset and studio-shell button model into reusable pure shell helpers with direct tests.
- [x] Extract Graphics Studio form-control disabled-state list into reusable pure form-schema helpers with direct tests.
- [x] Split Graphics Studio entity preview and IO DOM application into a focused internal render helper with smoke coverage.
- [x] Split Graphics Studio template action, layer toolbar, shell control, and form-control DOM application into focused internal render helpers with smoke coverage.
- [x] Extract Graphics Studio field schema model list generation into reusable pure form-schema helpers with direct tests.
- [x] Extract Graphics Studio full form model assembly into reusable pure form-schema helpers with direct tests.
- [x] Extract Graphics Studio selected-layer fallback resolution into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer duplication into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer visibility and lock toggles into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer removal into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio default layer addition into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio form field mutation into reusable pure form-schema helpers with direct tests.
- [x] Extract Graphics Studio template-library import normalization into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio single-template import normalization into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio save-current-entity template creation into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio template application visual model into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio entity visual import normalization into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio entity visual export model into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio template export payload models into reusable pure template helpers with direct tests.
- [x] Extract Graphics Studio template filter state transitions into reusable pure template-library helpers with direct tests.
- [x] Extract Graphics Studio entity selection state resolution into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio entity visual reset state resolution into reusable pure entity-visual helpers with direct tests.
- [x] Extract Graphics Studio layer removal selection fallback into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer duplication selection state into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio default layer addition selection state into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer movement selection state into reusable pure layer helpers with direct tests.
- [x] Extract Graphics Studio layer visibility/lock selection state into reusable pure layer helpers with direct tests.
- [x] Add a focused Graphics Studio layer-state smoke script for token-light refactor validation.
- [x] Extract Graphics Studio layer row selection state into reusable pure layer helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio selected-layer shape preset application into reusable pure layer helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio selected-layer swatch application into reusable pure swatch helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio selected-entity visual import state into reusable pure entity-visual helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio selected-entity template application state into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio selected-entity custom-template save state into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio custom-template import state into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio custom-template delete state into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio template-application recent-template state into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio template export selection model into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio selected-entity export model into reusable pure entity-visual helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio template-card click action dispatch into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio layer-list click action dispatch into reusable pure layer helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio swatch click action dispatch into reusable pure swatch helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio entity-list click action dispatch into reusable pure entity-visual helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio shape-preset click action dispatch into reusable pure layer helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio template-filter click action dispatch into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio form-field edit action dispatch into reusable pure form-schema helpers with direct tests and smoke coverage.
- [x] Extract Graphics Studio template-name submit key action into reusable pure template-library helpers with direct tests and smoke coverage.
- [x] Split Graphics Studio DOM rendering into a focused render module so `main.js` keeps only state and event orchestration for the Studio path.
- [x] Split Graphics Studio DOM event binding into a focused events module so `main.js` maps event actions to state commands.

## Definition Of Done For A Small Item

Each small item is complete only after:

- Bug self-check: run the relevant tests or smoke checks and inspect behavior for obvious regressions.
- Architecture self-check: confirm file location, naming, dependencies, and domain boundaries match `docs/engineering-workflow.md`.
- Documentation check: update TODO or architecture notes if the change modifies scope, workflow, or behavior.
- Git hygiene: commit only the intended files and push to `origin/main`.
