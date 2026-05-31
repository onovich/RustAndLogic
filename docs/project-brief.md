# Rust & Logic Project Brief

Source baseline: synced Gemini share mirrors in `docs/source-docs/`.
Last updated: 2026-06-01.

## Top-Level Split

This project has two first-class parts that should stay separated at the architecture level:

1. TapeScript language and runtime
   - A tiny, deterministic, line-oriented DSL for robot behavior.
   - Scope: compiler, bytecode/ISA, VM, watchdog, hardware trait boundary, testable headless simulation hooks.
   - Suggested future home: `crates/tapescript-*` or an equivalent standalone Rust workspace layer.

2. Rust & Logic game
   - The game that uses TapeScript as its player-facing programming mechanic.
   - Scope: world simulation, progression, resources, Tauri IPC, React/Monaco/Pixi UI, saves, offline rewards, arena systems.
   - Suggested future home: game-specific Rust crates plus frontend app packages that depend on TapeScript through explicit APIs.

TapeScript should not depend on game UI, Tauri, rendering, saves, economy, or progression. The game may depend on TapeScript through stable compiler/VM/hardware traits.

## TapeScript Understanding

TapeScript is intentionally minimal: one instruction per line, no nested syntax, no variables, no scopes, and strict top-to-bottom execution. Labels start with `@` and consume tape capacity just like executable instructions, making control flow a physical resource decision.

The VM model is Rust-first and deterministic. Each programmable robot owns a VM state with `pc`, `cf`, and lifecycle state. Physical actions suspend execution for the current tick, while pure logic instructions can continue inside a tick until an action or watchdog limit is reached.

The compiler should remain lightweight and probably two-pass:

- Pass 1 strips comments/blank lines and builds the label symbol table.
- Pass 2 emits `Instruction` values and resolves jump targets.

The engine boundary should be a trait such as `RobotHardware`, so the VM remains a pure, headless, deterministic box.

## Game Understanding

Rust & Logic is an automation/programming idle game with asynchronous arena and retro sci-fi presentation. The loop is:

- write and deploy TapeScript,
- let robots scavenge resources,
- upgrade tape capacity, sensors, hardware, armor, and weapons,
- use deterministic simulation for offline rewards and arena replays.

Core resources are Scrap, Cells, and Blank Tape. Blank Tape is the central progression constraint because it directly expands executable program length.

The target application architecture is Tauri plus Rust backend and React frontend:

- Rust backend owns world state, TapeScript VM execution, tick scheduling, deterministic simulation, and diff snapshots.
- Webview frontend owns Monaco editing, UI interaction, rendering, animation, and presentation.
- IPC passes source code and state/diff snapshots, not authoritative game logic.

## Roadmap Shape

The synced roadmap suggests five broad phases:

1. Core Rust engine and TapeScript compiler/VM.
2. Tauri + React MVP with code editor and visual robot execution.
3. Progression, offline simulation, saves, UI/audio polish.
4. Asynchronous arena and deterministic validation.
5. Optimization, WASM/web demo, packaging, localization, Steam launch.

## Local Documentation

- TapeScript language design: `docs/source-docs/tapescript-language-design.md`
- TapeScript technical spec: `docs/source-docs/tapescript-technical-spec.md`
- TapeScript architecture: `docs/source-docs/tapescript-architecture-design.md`
- Game design: `docs/source-docs/rust-and-logic-game-design.md`
- Game technical architecture: `docs/source-docs/rust-and-logic-technical-architecture.md`
- Roadmap: `docs/source-docs/rust-and-logic-roadmap.md`

