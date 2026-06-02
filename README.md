# Rust & Logic

Rust & Logic is an automation/programming idle game prototype built around a small deterministic robot scripting runtime and a browser-served Web UI harness.<br/>**Rust & Logic 是一个自动化 / 编程放置游戏原型，由一个小型确定性机器人脚本运行时和一个通过浏览器运行的 Web UI 测试壳组成。**

The project is currently focused on validating the core UI flow, simulation contracts, and TapeScript runtime behavior before introducing a desktop shell.<br/>**当前项目重点是在引入桌面壳之前，验证核心 UI 流程、模拟契约和 TapeScript 运行时行为。**

## Status

- Current deliverable: local Web UI harness served over HTTP.<br/>**当前交付物：通过本地 HTTP 服务运行的 Web UI 测试壳。**
- Desktop/Tauri packaging is not implemented yet.<br/>**桌面端 / Tauri 打包尚未实现。**
- Player-facing resource language uses scripts, instruction slots, logic memory, and memory shards; the old paper-tape metaphor has been retired from the game layer.<br/>**面向玩家的资源语言已改为脚本、指令槽、逻辑内存和记忆晶片；旧的纸带隐喻已从游戏层废除。**

## Architecture

- `packages/tapescript-runtime/`: UI-independent compiler and VM harness for TapeScript.<br/>**`packages/tapescript-runtime/`：独立于 UI 的 TapeScript 编译器与 VM 测试实现。**
- `packages/game-sim/`: deterministic game simulation that consumes TapeScript through compiler, VM, and hardware boundaries.<br/>**`packages/game-sim/`：确定性游戏模拟层，通过编译器、VM 和硬件边界使用 TapeScript。**
- `apps/web/`: browser-facing Web UI for testing code editing, playback, map rendering, resources, saves, localization, and smoke flows.<br/>**`apps/web/`：面向浏览器的 Web UI，用于测试代码编辑、播放、地图渲染、资源、存档、本地化和 smoke 流程。**
- `docs/`: synced design documents, project brief, decisions, workflow notes, and development TODOs.<br/>**`docs/`：同步后的设计文档、项目简报、决策记录、工作流说明和开发待办。**
- `scripts/`: local server, runtime checks, architecture checks, and browser smoke tests.<br/>**`scripts/`：本地服务器、运行时检查、架构检查和浏览器 smoke 测试。**

## Run

Start the Web UI from the repository root:<br/>**在仓库根目录启动 Web UI：**

```bat
RunWebUI.cmd
```

The command serves the app at `http://127.0.0.1:4173/` and opens the browser automatically.<br/>**该命令会在 `http://127.0.0.1:4173/` 提供页面，并自动打开浏览器。**

You can also check the launch configuration without starting the server:<br/>**也可以只检查启动配置而不启动服务器：**

```bat
RunWebUI.cmd --check
```

## Validate

Run the configured project validation wrapper:<br/>**运行项目配置好的验证包装脚本：**

```bat
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
```

Run the browser smoke test wrapper:<br/>**运行浏览器 smoke 测试包装脚本：**

```bat
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
```

The direct Web UI/runtime check is also available:<br/>**也可以直接运行 Web UI / 运行时检查：**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-web-ui.ps1
```

The architecture gate is:<br/>**架构门禁命令是：**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-architecture.ps1
```

## Development Notes

TapeScript must remain independent from browser UI, Tauri, rendering, saves, economy, and progression code.<br/>**TapeScript 必须保持独立，不能依赖浏览器 UI、Tauri、渲染、存档、经济系统或进度系统代码。**

The game layer may depend on TapeScript only through explicit compiler, VM, and hardware-trait style boundaries.<br/>**游戏层只能通过明确的编译器、VM 和硬件接口式边界依赖 TapeScript。**

UI code should render snapshots and send commands, but it must not become the authoritative simulation.<br/>**UI 代码应该只渲染快照并发送命令，不能成为权威模拟逻辑所在。**

Before committing a slice, run the relevant bug self-check, the architecture self-check, update `docs/development-todo.md` when scope changes, then commit and push only the intended files.<br/>**提交一个小切片前，需要运行相关 bug 自检和架构自检；如果范围变化，更新 `docs/development-todo.md`；最后只提交并推送本次意图内文件。**

## Documentation

- Project brief: `docs/project-brief.md`.<br/>**项目简报：`docs/project-brief.md`。**
- Engineering workflow: `docs/engineering-workflow.md`.<br/>**工程工作流：`docs/engineering-workflow.md`。**
- Instruction catalog: `docs/tapescript-instruction-catalog.md`.<br/>**指令清单：`docs/tapescript-instruction-catalog.md`。**
- Source design mirrors: `docs/source-docs/`.<br/>**源设计文档镜像：`docs/source-docs/`。**
