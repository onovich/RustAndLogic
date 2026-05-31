# Project Decisions

## 2026-06-01: Web UI Harness Before Tauri

Decision: keep the current deliverable as a browser-served Web UI harness until the core UI flow, TapeScript runtime behavior, and deterministic simulation contracts are stable.

Rationale:

- The current goal is to test the whole game UI flow in a Web UI.
- The Rust/Tauri shell should not be introduced before the simulation and UI contracts have a stable shape.
- The Web UI harness keeps iteration fast while still respecting the target architecture: UI renders snapshots and sends commands, while simulation logic stays outside DOM code.

Current command:

```powershell
C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts/serve-web-ui.mjs 4173
```

Follow-up:

- Introduce Tauri only after the Web UI harness has stabilized around a real Rust or WASM simulation package.
- Keep future Tauri IPC as a transport boundary, not a place for game rules.
- Keep desktop packaging commands out of the workflow config until a desktop shell exists.

