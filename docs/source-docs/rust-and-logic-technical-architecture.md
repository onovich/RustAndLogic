# Rust & Logic 技术架构设计文档

Source: https://gemini.google.com/share/091e4889a3cb
Synced at: 2026-05-31T16:46:43.955Z
Gemini Share ID: 091e4889a3cb
Rendered title: ‎Gemini - 直接体验 Google AI 黑科技

---

登录
Gemini
关于 Gemini
在新窗口中打开
Gemini 应用
在新窗口中打开
订阅
在新窗口中打开
企业应用场景
在新窗口中打开
《Rust & Logic》技术架构设计文档 (Tauri 跨平台版)
1. 核心技术栈选型

采用“前后端完全分离的 Tauri 桌面应用”架构：

核心模拟与逻辑后端 (Backend)： Rust

打包分发容器 (Container)： Tauri (Win/Mac/Linux) / WebAssembly (纯 Web 版)

表现与 UI 前端 (Frontend)： TypeScript + React + Monaco Editor + Pixi.js (或 Canvas)

2. 表现与逻辑的绝对隔离架构

游戏系统被严格切割为平行的两条轨道，由 Tauri IPC 通信层连接。

2.1 前端边界 (Webview 进程)

职责：UI 渲染交互与动画表现。

利用 Monaco Editor 提供丝滑的代码编写体验（带高亮、补全、报错提示）。

接收后端的网格差量数据，维持独立高帧率（60FPS），利用 Tweening 缓动库播放精灵图（Sprites）的平滑走位与战斗特效。

2.2 后端边界 (Rust 原生进程)

职责：世界状态管理与无头引擎推演。

运行 TapeScript VM 与纯整数坐标网格系统。

完全剔除物理引擎浮点数误差，实现 100% 绝对确定性 (Deterministic) 的模拟运算。

3. 全局调度引擎 (Rust Tick Manager)

采用面向数据（DOP）设计。单次逻辑 Tick 执行管线：

Sensor System: 更新所有实体雷达与视野缓存。

VM System: 驱动 VM 执行 TapeScript 逻辑，收集 ActionIntents (如移动或开火意图)。

Resolver System: 结算坐标冲突，进行位移和伤害处理。

Snapshot Dispatch: 生成差量快照 (Diff JSON)，通过 IPC 发送至前端渲染。

4. 特色技术解决方案

后台极速演算： 离线拾荒无需挂机。玩家上线时，Rust 计算过去真实流逝的 Tick 数，瞬间进行无渲染的极速内存推演，产出分毫不差的真实离线掉落。

极低开销战斗回放： 保存录像仅需记录初始随机种子（Seed）与双方 TapeScript 文本代码，重播时底层再执行一次 Tick 即可完美复原战局。
