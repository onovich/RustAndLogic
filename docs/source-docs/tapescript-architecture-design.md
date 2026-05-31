# TapeScript 架构设计文档

Source: https://gemini.google.com/share/6f592617a65e
Synced at: 2026-05-31T16:46:43.955Z
Gemini Share ID: 6f592617a65e
Rendered title: ‎Gemini - 直接体验 Google AI 黑科技

---

TapeScript 架构设计文档 (Rust Edition)
1. 总体架构管线

TapeScript 编译器和 VM 使用 纯 Rust 编写，编译为高效的机器码（供 Tauri 桌面端调用）或 WebAssembly（供纯网页端调用）。

[玩家文本源码 (React UI)] -> (Rust 两趟编译器) -> [Vec<Instruction>] -> (Rust VM 解释器)

2. 编译器模块 (Compiler)

编译器采用极度轻量的双趟扫描（Two-Pass）算法。利用 Rust 的模式匹配（Pattern Matching）特性实现高性能解析。

2.1 Pass 1: 符号解析与构建

输入：Vec<&str> (原始代码按行分割)

操作：从上到下顺序遍历。剔除注释和空白行。

输出：HashMap<String, usize> 符号表（Symbol Table）。键为 @Label 名称，值为其在最终有效指令数组中的绝对索引位置。

2.2 Pass 2: 字节码生成

输入：清洗后的代码数组与符号表。

操作：匹配指令关键词。绑定跳转目标索引。

输出：Result<Vec<Instruction>, CompileError>。通过 Rust 的 Result 类型直接拦截非法标签和未知指令，确保输入 VM 的数据 100% 绝对安全。

3. 核心数据结构 (Rust 定义)
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum OpCode {
    MoveForward = 0x01,
    TurnLeft = 0x02,
    CheckScrap = 0x20,
    Jump = 0x30,
    JumpIfTrue = 0x31,
    // ...
}

// 内存紧凑结构，利于 CPU 缓存
#[derive(Debug, Clone, Copy)]
pub struct Instruction {
    pub op: OpCode,
    pub target_index: Option<usize>, // 仅在 Jump 类指令时为 Some
}

4. 引擎集成设计 (Engine Integration)

TapeScript 的 VM 作为一个纯数据处理黑盒，不包含任何外部依赖。

隔离层 (Trait Boundary)： 游戏全局状态机实现 RobotHardware Trait。

VM 在执行动作指令时，调用接口方法如 hardware.try_move(entity_id)。

此设计确保了后端可以在无头（Headless）状态下进行无尽的千万倍速离线演算，或由服务器独立验证战斗结果。
