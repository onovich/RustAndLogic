# TapeScript 指令清单

这份文档是 TapeScript 指令变更的唯一人工编辑入口。

编辑方式：

- 如果要修改指令名称，修改 `目标名称`。
- 如果要新增指令，在 `拟新增指令` 表格里添加一行。
- 如果要删除或暂缓某条指令，把 `状态` 改成 `remove` 或 `later`。
- 请优先用自然语言描述“这个指令在游戏里做什么”。实现细节可以先写得粗略。
- 指令名建议保持 PascalCase 或 PascalCase_with_Suffix，例如 `MoveForward`、`CheckHP_Low`。

## 当前指令

| 状态 | 类型 | 当前名称 | 目标名称 | 自然语言功能描述 | 结果 / 失败行为 | 示例 |
| --- | --- | --- | --- | --- | --- | --- |
| keep | 动作 | `MoveForward` | `MoveForward` | 让机器人朝当前面向的方向移动一格。 | 如果目标格在地图外，或被障碍物阻挡，动作失败，自动播放应暂停。 | `MoveForward` |
| keep | 动作 |  | `MoveBack` | 让机器人朝背后的方向移动一格，并且不改变朝向。 | 如果目标格在地图外，或被障碍物阻挡，动作失败，自动播放应暂停。 | `MoveBack` |
| keep | 动作 | `TurnLeft` | `TurnLeft` | 让机器人原地向左转 90 度，不移动位置。 | 除非机器人处于无法行动状态，否则总是成功。 | `TurnLeft` |
| keep | 动作 | `TurnRight` | `TurnRight` | 让机器人原地向右转 90 度，不移动位置。 | 除非机器人处于无法行动状态，否则总是成功。 | `TurnRight` |
| keep | 动作 | `PickUp` | `PickUp` | 拾取机器人脚下或正前方一格内的资源。 | 如果范围内没有可拾取资源，动作失败，自动播放应暂停。 | `PickUp` |
| keep | 动作 | `Drop` | `Drop` | 把机器人最近携带的一份货物放到当前格子。 | 如果没有货物，或当前格子已经有资源，动作失败，自动播放应暂停。成功时从资源计数中扣回对应货物，并在当前格生成资源。 | `Drop` |
| keep | 动作 | `Fire` | `Fire` | 在探测到敌人时触发机器人的武器继电器并开火。 | 如果当前没有目标锁定，动作失败，自动播放应暂停。 | `Fire` |
| keep | 查询 | `CheckScrap` | `CheckScrap` | 检查机器人正前方一格是否有废铁。 | 设置条件标志为 true 或 false。查询本身不消耗物理动作 tick。 | `CheckScrap` |
| keep | 查询 | `CheckEnemy` | `CheckEnemy` | 检查当前是否探测到敌人。 | 设置条件标志为 true 或 false。当前原型使用确定性占位规则。 | `CheckEnemy` |
| keep | 查询 | `CheckHP_Low` | `CheckHP_Low` | 检查机器人生命值是否处于低血量状态。 | 当 HP 小于等于低血量阈值时，把条件标志设为 true。 | `CheckHP_Low` |
| keep | 跳转 | `Jump` | `Jump` | 无条件跳转到指定标签。 | 如果目标标签不存在，编译失败。 | `Jump @Loop` |
| keep | 跳转 | `JumpIfTrue` | `JumpIfTrue` | 当条件标志为 true 时跳转到指定标签。 | 如果目标标签不存在，编译失败。 | `JumpIfTrue @Grab` |
| keep | 跳转 | `JumpIfFalse` | `JumpIfFalse` | 当条件标志为 false 时跳转到指定标签。 | 如果目标标签不存在，编译失败。 | `JumpIfFalse @Patrol` |

## 语言形式

| 状态 | 形式 | 当前语法 | 目标语法 | 自然语言功能描述 | 示例 |
| --- | --- | --- | --- | --- | --- |
| keep | 标签 | `@Name` | `@Name` | 定义一个可跳转的位置。标签和普通指令一样占用纸带容量。 | `@Loop` |
| keep | 注释 | `// text` | `// text` | 给人看的备注，编译器会忽略。注释不占用纸带容量。 | `// 巡逻路线` |

## 拟新增指令

在这里添加新指令。下面只是示例，可以直接改掉或删除。

| 状态 | 类型 | 目标名称 | 自然语言功能描述 | 结果 / 失败行为 | 示例 |
| --- | --- | --- | --- | --- | --- |
| later | 查询 | `CheckWall` | 检查机器人正前方一格是否是墙、障碍物或地图边界。 | 设置条件标志为 true 或 false。 | `CheckWall` |
| later | 查询 | `CheckCell` | 检查机器人正前方一格是否有数据电芯。 | 设置条件标志为 true 或 false。 | `CheckCell` |
| later | 查询 | `CheckCargo` | 检查机器人当前是否携带任何货物。 | 设置条件标志为 true 或 false。 | `CheckCargo` |
| later | 查询 | `CheckCargoFull` | 检查机器人货舱是否已满。 | 设置条件标志为 true 或 false。需要先定义货舱容量。 | `CheckCargoFull` |
| later | 查询 | `CheckHome` | 检查机器人是否站在基地、回收点或安全区。 | 设置条件标志为 true 或 false。需要先定义基地格子。 | `CheckHome` |
| later | 动作 | `TurnAround` | 让机器人原地转身 180 度。 | 除非机器人处于无法行动状态，否则总是成功。 | `TurnAround` |
| later | 动作 | `Wait` | 消耗一个动作 tick，什么也不做。 | 除非机器人处于无法行动状态，否则总是成功。 | `Wait` |
| later | 动作 | `Repair` | 消耗资源或能量，恢复机器人 HP。 | 如果资源不足，则动作失败。 | `Repair` |
| later | 动作 | `Unload` | 在基地或回收点卸下全部货物。 | 如果不在可卸货位置，动作失败。需要先定义基地格子和货物结算规则。 | `Unload` |

## 命名风格备注

当前语言仍然坚持“一行一个指令”，避免引入参数语法。因此像 `CheckHP_Low` 这种指令暂时用后缀表达条件。

如果觉得下划线不统一，后续可以考虑把它改名为 `CheckLowHP`。这个名字仍然是一条完整指令，不需要引入 `Check HP Low` 这种更复杂的多 token 语法。

## 给 Codex 的实现说明

当这份文档被你修改后，Codex 需要把状态为 `keep` 的现有指令变更，以及你明确要求实现的新指令，落到以下位置：

- `packages/tapescript-runtime/index.js`：指令名称、解析规则、校验规则、标签、错误信息。
- `packages/game-sim/index.js`：硬件查询/动作行为、执行结果、日志、必要的快照字段。
- `apps/web/src/main.js`：语法高亮、候选词、必要的界面文本。
- `scripts/test-runtime.mjs`：编译器、VM、游戏模拟测试。
- `scripts/smoke-web-ui.mjs`：浏览器端可见行为的 smoke test。

除非你明确要求实现，否则不要实现状态为 `later`、`remove` 或 `question` 的行。
