# TapeScript 指令清单

这份文档是 TapeScript 指令变更的人工编辑入口。当前语法已经废除旧式 `MoveForward`、`CheckScrap`、`JumpIfTrue` 等整词指令，改为短函数式语法。

编辑方式：
- 如果要调整现有语句，修改“当前语法”表格。
- 如果要新增指令，在“拟新增指令”表格里添加一行。
- 注释和描述请优先用中文自然语言说明“这个指令在游戏里做什么”。
- 第一版仍然保持“一行一条语句”，不引入块语法。

## 语法原则

- 标签：`@Name`
- 注释：`// text`
- 无条件跳转：`Goto @Label`
- 条件前缀：`IfTrue <动作或跳转>`、`IfFalse <动作或跳转>`
- 查询语句会写入条件标志 `cf`，随后由 `IfTrue` / `IfFalse` 消费。
- 如果参数本来就是 `Forward`，可以省略：`Move()` 等价于 `Move(Forward)`，`PickUp()` 等价于 `PickUp(Forward)`。
- 不使用 `Item.Scrap`、`Cell.Forward` 这类枚举前缀，靠函数位置消歧。
- 为避免歧义，电芯在脚本语法中命名为 `Battery`，不再使用 `Cell`。

## 默认示例

```tapescript
@Loop
PickUp()
Check().Has(Scrap)
IfTrue Goto @Loop
Move()
Turn(Right)
Goto @Loop
```

## 当前语法

| 状态 | 类型 | 语句 | 自然语言功能描述 | 结果 / 失败行为 | 示例 |
| --- | --- | --- | --- | --- | --- |
| keep | 动作 | `Move(Forward)` / `Move()` | 让机器人朝当前面向方向移动一格。 | 如果目标格在地图外，或被障碍物、货物阻挡，动作失败，自动播放应暂停。 | `Move()` |
| keep | 动作 | `Move(Back)` | 让机器人向背后一格移动，不改变朝向。 | 如果目标格在地图外，或被障碍物、货物阻挡，动作失败，自动播放应暂停。 | `Move(Back)` |
| keep | 动作 | `MoveToward(Home)` | 让机器人朝基地移动一格，并自动转向本次移动方向。 | 如果已经在基地，或路线被阻挡，动作失败，自动播放应暂停。 | `MoveToward(Home)` |
| keep | 动作 | `Turn(Left)` | 让机器人原地左转 90 度。 | 通常总是成功。 | `Turn(Left)` |
| keep | 动作 | `Turn(Right)` | 让机器人原地右转 90 度。 | 通常总是成功。 | `Turn(Right)` |
| keep | 动作 | `Turn(Around)` | 让机器人原地转身 180 度。 | 通常总是成功。 | `Turn(Around)` |
| keep | 动作 | `PickUp(Forward)` / `PickUp()` | 拾取机器人正前方一格的资源。 | 如果正前方没有可拾取资源，或货舱已满，动作失败，自动播放应暂停。 | `PickUp()` |
| keep | 动作 | `Drop(Forward)` / `Drop()` | 把最近携带的一份货物放到正前方一格。 | 如果没有货物、正前方在地图外，或正前方已被占用，动作失败，自动播放应暂停。 | `Drop()` |
| keep | 动作 | `Unload(Home)` | 在基地卸下当前携带的全部货物。 | 如果不在基地，或没有携带货物，动作失败，自动播放应暂停。 | `Unload(Home)` |
| keep | 动作 | `Craft(Home)` | 在基地合成一份记忆晶片。 | 如果不在基地，或基地库存不足 `2 Scrap + 1 Battery`，动作失败，自动播放应暂停。 | `Craft(Home)` |
| keep | 动作 | `Fire(Forward)` / `Fire()` | 向前方开火。 | 如果当前没有目标锁定，动作失败，自动播放应暂停。 | `Fire()` |
| keep | 动作 | `Wait()` | 消耗一个动作 tick，什么也不做。 | 通常总是成功。 | `Wait()` |
| keep | 动作 | `Repair()` | 在基地维修台消耗 1 份废铁，恢复 2 点 HP，不超过 HP 上限。 | 如果不在基地、HP 已满或基地库存废铁不足，动作失败，自动播放应暂停。 | `Repair()` |
| keep | 查询 | `Check(Forward).Has(Scrap)` / `Check().Has(Scrap)` | 检查正前方一格是否有废铁。 | 设置条件标志为 true 或 false；查询本身不消耗物理动作 tick。 | `Check().Has(Scrap)` |
| keep | 查询 | `Check(Forward).Has(Battery)` / `Check().Has(Battery)` | 检查正前方一格是否有电池。 | 设置条件标志为 true 或 false。 | `Check().Has(Battery)` |
| keep | 查询 | `Check(Forward).Has(Enemy)` / `Check().Has(Enemy)` | 检查当前是否有敌人目标信号。 | 设置条件标志为 true 或 false；当前原型使用确定性占位规则。 | `Check().Has(Enemy)` |
| keep | 查询 | `Check(Forward).Is(Wall)` / `Check().Is(Wall)` | 检查正前方一格是否是墙、障碍物或地图边界。 | 设置条件标志为 true 或 false。 | `Check().Is(Wall)` |
| keep | 查询 | `Check(Forward).IsEmpty()` / `Check().IsEmpty()` | 检查正前方一格是否为空，可移动或放下货物。 | 设置条件标志为 true 或 false。 | `Check().IsEmpty()` |
| keep | 查询 | `Check(Here).Is(Home)` | 检查机器人是否站在基地。 | 设置条件标志为 true 或 false。 | `Check(Here).Is(Home)` |
| keep | 查询 | `Check(Cargo).Any()` | 检查机器人是否携带任何货物。 | 设置条件标志为 true 或 false。 | `Check(Cargo).Any()` |
| keep | 查询 | `Check(Cargo).IsFull()` | 检查机器人货舱是否已满。 | 设置条件标志为 true 或 false；当前货舱容量为 3。 | `Check(Cargo).IsFull()` |
| keep | 查询 | `Check(Cargo).Has(Scrap)` | 检查货舱里是否有废铁。 | 设置条件标志为 true 或 false。 | `Check(Cargo).Has(Scrap)` |
| keep | 查询 | `Check(Cargo).Has(Battery)` | 检查货舱里是否有电池。 | 设置条件标志为 true 或 false。 | `Check(Cargo).Has(Battery)` |
| keep | 查询 | `Check(Scrap).Below(2)` | 检查基地库存里的废铁是否低于指定阈值。 | 设置条件标志为 true 或 false。 | `Check(Scrap).Below(2)` |
| keep | 查询 | `Check(Battery).Below(1)` | 检查基地库存里的电池是否低于指定阈值。 | 设置条件标志为 true 或 false。 | `Check(Battery).Below(1)` |
| keep | 查询 | `Check(Chip).Above(0)` | 检查基地是否已经回收过至少一枚芯片。 | 设置条件标志为 true 或 false。 | `Check(Chip).Above(0)` |
| keep | 查询 | `Check(HP).Below(30)` | 检查 HP 是否低于指定阈值。 | 设置条件标志为 true 或 false。 | `Check(HP).Below(30)` |
| keep | 查询 | `Check(HP).Above(70)` | 检查 HP 是否高于指定阈值。 | 设置条件标志为 true 或 false。 | `Check(HP).Above(70)` |
| keep | 查询 | `Check(Energy).Below(40)` | 检查当前电量百分比是否低于指定阈值。 | 设置条件标志为 true 或 false；数值按 0~100 的电量百分比计算。 | `Check(Energy).Below(40)` |
| keep | 查询 | `Check(Energy).Above(80)` | 检查当前电量百分比是否高于指定阈值。 | 设置条件标志为 true 或 false；数值按 0~100 的电量百分比计算。 | `Check(Energy).Above(80)` |
| keep | 查询 | `Check(Damage).Above(0)` | 检查当前 tick 是否刚受到伤害。 | 设置条件标志为 true 或 false；当前由模拟状态的伤害标记决定。 | `Check(Damage).Above(0)` |
| keep | 跳转 | `Goto @Label` | 无条件跳转到指定标签。 | 如果目标标签不存在，编译失败。 | `Goto @Loop` |
| keep | 条件前缀 | `IfTrue Goto @Label` | 当上一次查询结果为 true 时跳转。 | 如果条件不满足，则跳过这一行继续向下执行。 | `IfTrue Goto @Grab` |
| keep | 条件前缀 | `IfFalse Goto @Label` | 当上一次查询结果为 false 时跳转。 | 如果条件不满足，则跳过这一行继续向下执行。 | `IfFalse Goto @Patrol` |
| keep | 条件前缀 | `IfTrue <Action>` / `IfFalse <Action>` | 条件满足时执行冒号后那一个动作。 | 条件不满足时不消耗物理动作 tick；条件满足时按该动作的规则执行。 | `IfTrue PickUp()` |

## 可用短参数

| 类别 | 参数 |
| --- | --- |
| 方位 / 目标格 | `Forward`、`Back`、`Here`、`Home` |
| 转向 | `Left`、`Right`、`Around` |
| 物品 | `Scrap`、`Battery`、`Chip` |
| 实体 | `Enemy` |
| 地形 / 标记 | `Wall`、`Home` |
| 状态量 | `Cargo`、`HP`、`Energy`、`Damage`、`Scrap`、`Battery`、`Chip` |

## 拟新增指令

| 状态 | 类型 | 语句 | 自然语言功能描述 | 结果 / 失败行为 | 示例 |
| --- | --- | --- | --- | --- | --- |
| later | 查询 | `Check(Left).Is(Wall)` | 检查机器人左侧一格是否是墙、障碍物或地图边界。 | 需要先定义相对目标 `Left`。 | `Check(Left).Is(Wall)` |
| later | 查询 | `Check(Right).Is(Wall)` | 检查机器人右侧一格是否是墙、障碍物或地图边界。 | 需要先定义相对目标 `Right`。 | `Check(Right).Is(Wall)` |
| later | 动作 | `Scan()` | 扫描附近一圈，把附近资源或敌人写入日志或短期记忆。 | 需要先定义扫描半径和可视化。 | `Scan()` |
| later | 动作 | `Ping()` | 发出声呐脉冲，用于发现隐藏资源或敌人。 | 如果能量不足则失败；需要先引入能量系统。 | `Ping()` |
| later | 动作 | `Shield()` | 本 tick 提升防御或抵消一次伤害。 | 如果能量不足则失败；需要先引入能量 / 伤害系统。 | `Shield()` |

## 给 Codex 的实现说明

当这份文档被修改后，Codex 需要把状态为 `keep` 的语法落到以下位置：
- `packages/tapescript-runtime/index.js`：解析规则、校验规则、标签、错误信息、VM 指令结构。
- `packages/game-sim/index.js`：硬件查询、动作行为、执行结果、日志、必要的快照字段。
- `apps/web/src/main.js`：语法高亮、候选词、标签补全、必要的界面文本。
- `apps/web/app-data.json`：默认脚本示例与候选词数据。
- `scripts/test-runtime.mjs`：编译器、VM、游戏模拟测试。
- `scripts/smoke-web-ui.mjs`：浏览器端可见行为 smoke test。

除非用户明确要求实现，否则不要实现状态为 `later`、`remove` 或 `question` 的行。
