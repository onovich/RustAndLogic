# Rust & Logic 项目路线图

Source: https://gemini.google.com/share/6dba14985ac5
Synced at: 2026-05-31T16:46:43.955Z
Gemini Share ID: 6dba14985ac5
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
《Rust & Logic》项目路线图 (Tauri & Rust Roadmap)

本项目预计研发周期为 8 - 12 个月。分为以下五个关键里程碑阶段。

Phase 1: 核心引擎与编译器 (M1) - 约 4 周

目标：在后端跑通核心的确定性逻辑与 TapeScript 编译。

[Rust] 实现 TapeScript 双趟编译器，定义 Instruction 与 OpCode。

[Rust] 构建虚拟机的指令跳转逻辑与状态寄存体系。

[Rust] 开发无图形化的网格系统与基础 Tick 调度器。

里程碑验证： 通过 Rust CLI 测试用例，输出编译并执行后的机器人坐标变化日志。

Phase 2: Tauri 前后端联调与 MVP (M2) - 约 6 周

目标：打通全栈通讯，实现核心循环的可视化。

[React] 搭建前端，整合 Monaco Editor 完成具有废土风格的代码编辑终端。

[Tauri] 打通 IPC 通道，实现“前端传代码 -> 后端编译运行 -> 前端接回状态”。

[Pixi.js] 在前端实现二维网格渲染，解析 Rust 传来的坐标差量并执行平滑移动动画。

里程碑验证： 首个垂直切片。玩家在左侧屏幕敲代码部署，右侧屏幕的机器人在大地图上开始自动化执行动作。

Phase 3: 游戏系统与成长闭环 (M3 - Alpha) - 约 3 个月

目标：实装科技树养成与独特的离线推演机制。

[Rust] 完成离线推演算法（Fast-Forward Tick 计算器）。

[Rust/React] 实装基于本地文件的安全存档持久化系统。

[Game Design] 落地硬件模块升级路线（升级代码行数上限、新型传感器固件等）。

[UI/Audio] 全面铺开废土风 UI 设计，接入机械感环境音与反馈音效。

Phase 4: 异步角斗场网络化 (M4 - Beta) - 约 2 个月

目标：验证确定性引擎的终极应用场景——玩家对战。

搭建基础云端验证服务器。

构建“异步天梯”：允许玩家上传本地机甲的“属性+代码”配置包。

玩家下载对手数据，利用本地或服务端的 Rust 引擎进行 100% 精确的确定性互殴验证。

实装战斗表现特效（爆炸、护盾、逻辑报错特效）。

Phase 5: 优化与跨平台发行 (M5 - Launch) - 约 2 个月

目标：极致打磨，正式推向市场。

处理极端情况（死循环、多线程死锁）导致的系统异常恢复机制。

WASM 编译测试： 适配无 Tauri 环境下的通信层，生成纯 Web 网页端演示版本供玩家体验社区传播。

优化 macOS/Windows Tauri 打包配置，将包体压缩至最小。

准备多语言支持，搭建 Steam 页面与最终发售。
