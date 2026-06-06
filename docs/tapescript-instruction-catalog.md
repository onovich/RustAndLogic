# TapeScript 指令清单

这份文档是 TapeScript 当前公开语法的人工编辑入口。

当前版本已经废除旧式 `IfTrue ...` / `IfFalse ...` 条件前缀。新的推荐写法统一为：

```tapescript
If Check(...).Predicate(...) Then ActionOrGoto
IfNot Check(...).Predicate(...) Then ActionOrGoto
```

## 语法原则

- 一行一条语句。
- 标签写法：`@Label`
- 注释写法：`// comment`
- 无条件跳转：`Goto @Label`
- 条件分支：
  - `If Check(...).Predicate(...) Then <动作或跳转>`
  - `IfNot Check(...).Predicate(...) Then <动作或跳转>`
- 如果参数本来就是 `Forward`，可以省略：
  - `Move()` 等价于 `Move(Forward)`
  - `PickUp()` 等价于 `PickUp(Forward)`
  - `Drop()` 等价于 `Drop(Forward)`
  - `Fire()` 等价于 `Fire(Forward)`
- 不使用 `Item.Scrap`、`Direction.Forward` 这类长枚举前缀，靠参数位置消歧。
- 电池统一命名为 `Battery`，不再暴露旧的 `Cell` 命名。

## 推荐示例

```tapescript
@Loop
If Check(Energy).Below(40) Then MoveToward(Home)
If Check(Cargo).IsFull() Then MoveToward(Home)
If Check().Has(Scrap) Then PickUp()
IfNot Check().Has(Scrap) Then Move()
If Check(Here).Is(Home) Then Unload(Home)
Goto @Loop
```

## 当前语法

| 状态 | 类型 | 语句 | 中文功能描述 | 结果 / 失败行为 | 示例 |
| --- | --- | --- | --- | --- | --- |
| keep | 动作 | `Move()` / `Move(Forward)` | 朝当前朝向前进一步。 | 出界、撞墙、撞货物时失败，并触发自动暂停。 | `Move()` |
| keep | 动作 | `Move(Back)` | 朝背后退一格，不改变朝向。 | 出界、撞墙、撞货物时失败，并触发自动暂停。 | `Move(Back)` |
| keep | 动作 | `MoveToward(Home)` | 朝基地方向移动一格，并自动转向本次移动方向。 | 已在基地或路线被阻挡时失败。 | `MoveToward(Home)` |
| keep | 动作 | `Turn(Left)` | 原地左转 90 度。 | 通常成功。 | `Turn(Left)` |
| keep | 动作 | `Turn(Right)` | 原地右转 90 度。 | 通常成功。 | `Turn(Right)` |
| keep | 动作 | `Turn(Around)` | 原地转身 180 度。 | 通常成功。 | `Turn(Around)` |
| keep | 动作 | `PickUp()` / `PickUp(Forward)` | 拾取正前方一格的资源。 | 前方没有资源或货舱已满时失败。 | `PickUp()` |
| keep | 动作 | `Drop()` / `Drop(Forward)` | 把最近携带的一件货物放到正前方一格。 | 没有货物、前方出界、或前方已被占用时失败。 | `Drop()` |
| keep | 动作 | `Unload(Home)` | 在基地卸下当前携带的全部货物。 | 不在基地或没有货物时失败。 | `Unload(Home)` |
| keep | 动作 | `Craft(Home)` | 在基地合成记忆晶片。 | 材料不足或不在基地时失败。 | `Craft(Home)` |
| keep | 动作 | `Fire()` / `Fire(Forward)` | 对正前方敌人开火。 | 前方没有敌人时失败。 | `Fire()` |
| keep | 动作 | `Wait()` | 消耗一个动作 tick，不做别的事。 | 通常成功。 | `Wait()` |
| keep | 动作 | `Repair()` | 在基地消耗废铁修复 HP。 | 不在基地、HP 已满、或废铁不足时失败。 | `Repair()` |
| keep | 查询 | `Check().Has(Scrap)` | 检查正前方是否有废铁。 | 产生 true / false 查询结果。 | `Check().Has(Scrap)` |
| keep | 查询 | `Check().Has(Battery)` | 检查正前方是否有电池。 | 产生 true / false 查询结果。 | `Check().Has(Battery)` |
| keep | 查询 | `Check().Has(Chip)` | 检查正前方是否有芯片。 | 产生 true / false 查询结果。 | `Check().Has(Chip)` |
| keep | 查询 | `Check().Has(Enemy)` | 检查正前方是否有敌对目标。 | 产生 true / false 查询结果。 | `Check().Has(Enemy)` |
| keep | 查询 | `Check().Is(Wall)` | 检查正前方是否是墙、障碍物或边界。 | 产生 true / false 查询结果。 | `Check().Is(Wall)` |
| keep | 查询 | `Check().Is(Hazard)` | 检查正前方是否是危险区。 | 产生 true / false 查询结果。 | `Check().Is(Hazard)` |
| keep | 查询 | `Check().IsEmpty()` | 检查正前方是否为空。 | 产生 true / false 查询结果。 | `Check().IsEmpty()` |
| keep | 查询 | `Check(Here).Is(Home)` | 检查机器人是否正站在基地。 | 产生 true / false 查询结果。 | `Check(Here).Is(Home)` |
| keep | 查询 | `Check(Cargo).Any()` | 检查货舱是否非空。 | 产生 true / false 查询结果。 | `Check(Cargo).Any()` |
| keep | 查询 | `Check(Cargo).IsFull()` | 检查货舱是否已满。 | 产生 true / false 查询结果。 | `Check(Cargo).IsFull()` |
| keep | 查询 | `Check(Cargo).Has(Scrap)` | 检查货舱里是否有废铁。 | 产生 true / false 查询结果。 | `Check(Cargo).Has(Scrap)` |
| keep | 查询 | `Check(Cargo).Has(Battery)` | 检查货舱里是否有电池。 | 产生 true / false 查询结果。 | `Check(Cargo).Has(Battery)` |
| keep | 查询 | `Check(Cargo).Has(Chip)` | 检查货舱里是否有芯片。 | 产生 true / false 查询结果。 | `Check(Cargo).Has(Chip)` |
| keep | 查询 | `Check(Scrap).Below(2)` | 检查基地废铁是否低于阈值。 | 产生 true / false 查询结果。 | `Check(Scrap).Below(2)` |
| keep | 查询 | `Check(Battery).Below(1)` | 检查基地电池是否低于阈值。 | 产生 true / false 查询结果。 | `Check(Battery).Below(1)` |
| keep | 查询 | `Check(Chip).Above(0)` | 检查基地是否已有芯片。 | 产生 true / false 查询结果。 | `Check(Chip).Above(0)` |
| keep | 查询 | `Check(Memory).Above(2)` | 检查基地记忆晶片是否高于阈值。 | 产生 true / false 查询结果。 | `Check(Memory).Above(2)` |
| keep | 查询 | `Check(Scrap).BelowCost(Craft)` | 检查基地废铁是否低于当前合成成本。 | 产生 true / false 查询结果。 | `Check(Scrap).BelowCost(Craft)` |
| keep | 查询 | `Check(Battery).BelowCost(Craft)` | 检查基地电池是否低于当前合成成本。 | 产生 true / false 查询结果。 | `Check(Battery).BelowCost(Craft)` |
| keep | 查询 | `Check(HP).Below(30)` | 检查 HP 是否低于阈值。 | 产生 true / false 查询结果。 | `Check(HP).Below(30)` |
| keep | 查询 | `Check(HP).Above(70)` | 检查 HP 是否高于阈值。 | 产生 true / false 查询结果。 | `Check(HP).Above(70)` |
| keep | 查询 | `Check(Energy).Below(40)` | 检查电量百分比是否低于阈值。 | 产生 true / false 查询结果。 | `Check(Energy).Below(40)` |
| keep | 查询 | `Check(Energy).Above(80)` | 检查电量百分比是否高于阈值。 | 产生 true / false 查询结果。 | `Check(Energy).Above(80)` |
| keep | 查询 | `Check(Damage).Above(0)` | 检查当前 tick 是否刚受伤。 | 产生 true / false 查询结果。 | `Check(Damage).Above(0)` |
| keep | 跳转 | `Goto @Label` | 无条件跳转。 | 标签不存在时编译失败。 | `Goto @Loop` |
| keep | 条件 | `If Check(... ) Then ...` | 查询为真时执行动作或跳转。 | 查询本身不消耗物理动作 tick；条件不满足时只跳过该行。 | `If Check().Has(Scrap) Then PickUp()` |
| keep | 条件 | `IfNot Check(... ) Then ...` | 查询为假时执行动作或跳转。 | 查询本身不消耗物理动作 tick；条件不满足时只跳过该行。 | `IfNot Check().Is(Wall) Then Move()` |

## 可用短参数

| 类别 | 参数 |
| --- | --- |
| 方位 / 目标格 | `Forward` `Back` `Here` `Home` |
| 转向 | `Left` `Right` `Around` |
| 物品 | `Scrap` `Battery` `Chip` |
| 实体 | `Enemy` |
| 地形 / 标记 | `Wall` `Home` `Hazard` |
| 状态量 | `Cargo` `HP` `Energy` `Damage` `Scrap` `Battery` `Chip` `Memory` |

## 拟新增指令

| 状态 | 类型 | 语句 | 中文功能描述 | 备注 | 示例 |
| --- | --- | --- | --- | --- | --- |
| later | 查询 | `Check(Left).Is(Wall)` | 检查左侧一格是否是墙、障碍或边界。 | 需要先定义相对目标 `Left`。 | `Check(Left).Is(Wall)` |
| later | 查询 | `Check(Right).Is(Wall)` | 检查右侧一格是否是墙、障碍或边界。 | 需要先定义相对目标 `Right`。 | `Check(Right).Is(Wall)` |
| later | 动作 | `Scan()` | 扫描周边，把结果写入短期感知。 | 需要先定义扫描半径与表现。 | `Scan()` |
| later | 动作 | `Ping()` | 发出脉冲，用于探测隐藏资源或敌人。 | 需要先定义能量开销。 | `Ping()` |
| later | 动作 | `Shield()` | 本 tick 提升防护或抵消一次伤害。 | 需要先定义战斗规则。 | `Shield()` |

## 给 Codex 的实现约束

当这份文档被修改后，需要同步检查以下边界：

- `packages/tapescript-runtime/index.js`：解析、校验、标签、错误信息、IR 降级编译。
- `packages/game-sim/index.js`：查询输入、动作语义、日志与快照。
- `apps/web/src/main.js`：高亮、候选词、跳转、错误展示。
- `apps/web/app-data.json`：默认脚本、候选词、教学样例。
- `scripts/test-runtime.mjs`：编译器、VM、模拟测试。
- `scripts/smoke-web-ui.mjs`：浏览器端 smoke test。

除非用户明确要求，否则不要实现状态为 `later` 的条目。
