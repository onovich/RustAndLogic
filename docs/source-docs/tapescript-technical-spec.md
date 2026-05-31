# TapeScript 技术规范文档

Source: https://gemini.google.com/share/23269d541a39
Synced at: 2026-05-31T16:46:43.955Z
Gemini Share ID: 23269d541a39
Rendered title: ‎Gemini - 直接体验 Google AI 黑科技

---

TapeScript 技术规范文档 (Rust Edition)
1. 虚拟机规范 (Virtual Machine Specs)

TapeScript VM 是一个微型解释器，使用 Rust 编写，以追求极致的性能和零 GC（垃圾回收）开销。 每个可编程机器人实体在运行时都由底层的 Rust 引擎分配一个独立的 VM 状态实例。

1.1 核心寄存器与状态

pc (Program Counter): usize 类型，记录当前执行指令在字节码数组中的索引。

cf (Condition Flag): bool 类型，存储上一次 Check* 族指令的返回值。

state: 枚举类型（如 Ready, Suspended, Fault），用于管理 VM 在全局 Tick 中的生命周期。

1.2 指令周期 (Instruction Cycle)

VM 的执行由 Rust 后端的全局 Tick 系统驱动。

物理指令： 诸如 MoveForward、Fire 等改变世界状态的指令，执行后将 VM 状态设为 Suspended，交出当前 Tick 的执行权，等待下一个逻辑 Tick。

逻辑指令： 诸如 CheckScrap、Jump 等计算指令，不消耗游戏内的物理时间。VM 会在一个 Tick 内通过循环连续执行，直到遇到物理指令或达到安全阈值。

2. 标准指令集 (ISA) 规范
2.1 基础位移 (Movement)

0x01 MoveForward : 向实体当前朝向移动一格。若被阻挡，动作失效，消耗一回合。

0x02 TurnLeft : 逆时针旋转 90 度。

0x03 TurnRight: 顺时针旋转 90 度。

2.2 交互与战斗 (Interaction)

0x10 PickUp : 拾取脚下/前方的物品，存入货舱。

0x11 Drop : 丢弃货舱中的一件物品。

0x12 Fire : 激活武器模块，向前方开火。

2.3 传感器 (Sensors)

0x20 CheckScrap : 判定前方一格是否含有废料。结果写入 cf。

0x21 CheckEnemy : 判定探测雷达内是否有敌对实体。结果写入 cf。

2.4 控制流 (Branching)

0x30 Jump [TargetIndex] : 无条件将 pc 设为 TargetIndex。

0x31 JumpIfTrue [TargetIndex] : 若 cf == true，则 pc = TargetIndex，否则 pc += 1。

0x32 JumpIfFalse [TargetIndex]: 若 cf == false，则 pc = TargetIndex，否则 pc += 1。

3. 异常与安全中断 (Rust Watchdog)

为防止玩家代码死循环导致底层的 Rust 线程卡死：

单回合安全阈值 (Max Steps Per Tick): 单个 Tick 内每个 VM 最多执行 20 条无副作用的逻辑指令。超过该阈值，VM 状态转为 Fault (Logic Overload) 并挂起，抛出错误反馈给前端控制台。
