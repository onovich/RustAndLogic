# Pixel Replica Audit

这份清单用于记录当前这轮 UI 高保真复刻，哪些功能与设计稿已经有明确对应，哪些功能仍缺少足够细节，后续需要用户继续补图或补交互说明。

## 本轮已对齐的设计块

- 四栏整体布局：
  - 左侧地点栏
  - 中左代码编辑区
  - 中右演出/地图区
  - 右侧系统栏
- 左侧地点插画的用途与遮罩方式：
  - 使用 `sample2.avif`
  - 保持 `center / cover`
  - 使用自上而下的深色渐变融合到底色
- 左右侧栏的中部折叠拉手
- 代码区顶部终端式标题与运行控制按钮
- 代码区语法高亮、候选词下拉、点击跳转、底部诊断面板
- 演出区顶部状态条、无限画布地图、底部剧情对话框
- 运行时中断时的左下角错误提示
- 右侧系统栏的资源区、模块状态区、运行时环境区
- 右下角纵向动作按钮：
  - `SETTINGS`
  - `LOCALIZATION [...]`
  - `DEV_LOG [...]`
  - `SAVE_STATE`
- 开发者日志默认折叠，仅在需要时展开

## 已做截图核对

以下截图用于本地核对设计稿，不纳入仓库提交：

- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default.png`
  - 用于对照整体终端式版式、四栏比例、底部剧情框
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor.png`
  - 用于对照候选词下拉、诊断区、设置抽屉展开态
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime.png`
  - 用于对照运行时中断提示、开发日志展开态
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass2.png`
  - 用于对照第二轮收边后的左栏节奏、默认镜头和底部按钮比例
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass2.png`
  - 用于对照第二轮编辑器态，包括候选词下拉底部提示和右侧抽屉块感
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass2.png`
  - 用于对照第二轮运行时中断态，包括开发者日志展开后的底部层级关系
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass3.png`
  - 用于对照第三轮默认剧情态，重点检查外框圆角、顶部色带、底部对话框比例和右下动作区密度
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass3.png`
  - 用于对照第三轮编辑器态，重点检查候选词下拉、诊断区高度和四栏整体纵向节奏
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass3.png`
  - 用于对照第三轮运行时中断态，重点检查地图左下角运行时 halt toast 是否贴近参考稿样式
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass4.png`
  - 用于对照第四轮默认剧情态，重点检查剧情模式下地图 ghost 化后的存在感、对话框高度与四栏宽度分配
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass4.png`
  - 用于对照第四轮编辑器态，重点检查编辑区宽度、候选词弹层与右栏压缩后的整体比例
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass4.png`
  - 用于对照第四轮运行时中断态，重点检查运行时 halt toast 与系统栏的视觉重心是否更接近参考稿
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass5.png`
  - 用于对照第五轮默认剧情态，重点检查上方舞台焦点、ghost map 退场程度与底部对话框的主次关系
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass5.png`
  - 用于对照第五轮编辑器态，重点检查候选词弹层与第五轮整体比例调整后是否仍然稳定贴稿
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass5.png`
  - 用于对照第五轮运行时中断态，重点检查舞台焦点加入后运行时 toast 与默认地图层次是否仍然协调
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass6.png`
  - 用于对照第六轮默认剧情态，采用英文模式截图，重点检查剧情框尺寸、舞台焦点位置和与英文参考稿的版式贴合度
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass6.png`
  - 用于对照第六轮编辑器态，采用英文模式截图，重点检查英文文案长度下的候选词弹层和四栏比例
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass6.png`
  - 用于对照第六轮运行时中断态，采用英文模式截图，重点检查英文模式下 runtime halt 信息块与舞台层次关系
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass7.png`
  - 用于对照第七轮默认剧情态，采用英文模式截图，重点检查 ghost map 退场程度、右栏密度和右下动作区收窄后的整体贴稿程度
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass7.png`
  - 用于对照第七轮编辑器态，采用英文模式截图，重点检查候选词弹层与压缩后右栏节奏是否仍保持稳定层级
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass7.png`
  - 用于对照第七轮运行时中断态，采用英文模式截图，重点检查运行时 toast 与更收敛的右栏、按钮区是否仍然协调
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass8.png`
  - 用于对照第八轮默认剧情态，采用英文模式截图，重点检查舞台顶栏合并后地图起始高度、`859 SYNC` 落点和整体版式贴稿程度
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass8.png`
  - 用于对照第八轮编辑器态，采用英文模式截图，重点检查移除常驻状态行后编辑态的地图高度与候选词层级关系
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass8.png`
  - 用于对照第八轮运行时中断态，采用英文模式截图，重点检查 runtime halt toast 与抬高后的地图舞台是否仍然协调

## 本轮新增收边

- 压缩了左侧地点插画高度，让任务区更靠近设计稿的紧凑节奏
- 修正了左侧任务列表的纵向分布，不再被容器高度拉得过散
- 微调了代码区列宽、按钮尺寸和终端按钮字重
- 给候选词下拉补了终端式底部按键提示
- 收窄了底部动作按钮、设置抽屉和开发日志抽屉的尺寸与间距
- 将剧情演出态的地图内容进一步压暗、缩远、上提，使舞台更接近“剧情优先、地图退后”的设计观感
- 给整套界面补上了更接近设计稿的外框圆角、顶部细色带和整体包裹感
- 进一步压紧了左栏目标列表、右栏系统分区和底部动作区的节奏，减少视觉松散感
- 收小了演出区底部对话框和运行时 halt toast，使它们更接近参考稿里的低姿态终端块
- 补上 `scripts/capture-ui-compare.mjs`，让后续每轮复刻都能稳定产出默认态 / 编辑器态 / 运行时态对照截图
- 将截图脚本改成支持命令行后缀，后续可直接生成 `pass4 / pass5` 等新一轮对照图，而不需要重复改脚本
- 进一步调整了四栏宽度，让左栏、代码区和右栏的占比更贴近参考稿
- 将剧情模式下的地图再做了一轮降存在感处理：更小、更淡、更像演出背景里的 ghost map
- 顺手修正了 `serve-web-ui.mjs` 对非端口命令行参数的兼容问题，避免截图脚本传后缀时误把后缀当端口
- 在剧情模式下补了独立的舞台焦点标记，让默认态更接近设计稿里“上方亮点 + 下方弱背景”的构图关系
- 继续压了右下动作区按钮的高度和字重，让它和参考稿的细终端按钮更接近
- 将截图脚本继续升级为支持语言参数，后续可以直接生成英文模式对照图，更贴近当前英文设计稿
- 微调了剧情焦点的落点和对话框尺寸，让默认剧情态更贴近参考稿的上下主次关系
- 将剧情模式下的 ghost map 进一步压低存在感，让默认演出态更接近参考稿里“空舞台 + 单焦点”的观感
- 继续压紧右栏资源、模块、运行时字段的纵向节奏，减少与参考稿相比偏松的问题
- 收窄了右下动作按钮的可见宽度和高度，让底部按钮栈更接近参考稿的细长终端条感
- 将演出区顶部第二条常驻状态行改为非占位隐藏信息层，把地图起始高度抬回更接近参考稿的位置
- 将 `859 SYNC` 并回舞台顶栏右侧，让顶栏信息结构更贴近参考稿的一行式布局
- 将机器人坐标改为仅保留技术信息，不再占据玩家可见的舞台顶栏位置

## 当前仍缺设计细节，需要补全

### 1. 设置抽屉内部布局

当前为了保留现有功能，可在 `SETTINGS` 抽屉里访问：

- `LOAD`
- `EXPAND MEMORY`
- `ARMOR +`
- `WEAPON +`

但设计稿没有给出这些功能在终端 UI 里的正式位置、层级和常态/悬停/激活样式。目前只是先做了功能保留位，不应视为最终设计。

### 2. 右侧运行时字段的语义映射

设计稿右栏的字段更像风格化终端字段，例如：

- `859 SYNC`
- `CYCLE_COUNT`
- `VM_LOAD`
- `OPS_LIMIT`

但没有逐项定义它们与真实游戏数据的严格映射关系。当前实现采用了较合理的近似映射，但仍需要最终口径：

- 哪个字段展示 `tick`
- 哪个字段展示 `VM state`
- 哪个字段展示逻辑容量 / 指令占用
- `SYNC` 是纯装饰还是有真实数值来源

### 3. 地图图例的最终语义

当前地图里已经重做了机器人、资源、障碍、基地标记，但设计稿没有完整展示：

- 废铁与电芯的终态图例差异
- 基地标记在终端风格下的最终形态
- 敌人、攻击、火焰、掉落等未来元素的统一视觉语言

这部分目前只是第一轮高保真近似，不算最终锁定。

### 4. Play / Pause / Resume 的完整视觉稿

已有交互约定是：

- `Play` 启动
- 运行中同一按钮变 `Pause`
- 暂停后再变 `Resume`

但设计图里主要展示的是静态 `PLAY` 状态，缺少运行中与暂停后的明确样式。当前实现已按交互文档落地逻辑，但视觉态仍需要最终稿确认。

### 5. 存档反馈的正式位置

当前保存/读取反馈收在设置抽屉内，是一个不打断主界面的折中方案。设计稿没有明确说明：

- 保存成功提示应出现在哪
- 读取成功提示应出现在哪
- 是否需要 toast
- 是否需要时间戳 / tick 信息

### 6. DEV_LOG 与差异信息的关系

当前 `DEV_LOG` 展开后承载：

- 日志列表
- diff 计数

但设计稿只明确了“开发者日志区域会向上展开”，没有进一步说明：

- 差异列表是否并入日志
- 差异是否单独分页
- 开发者调试信息是否需要更多分组

### 7. 大地图 / 多地点切换视图

这套终端式设计稿聚焦在单地点挂机/演出界面，没有覆盖：

- 抵达出口后的大地图
- 已解锁地点入口
- 地点切换过渡
- 左侧地点插画在多地点之间的切换表现

这属于后续必须补图的高优先级空白。

### 8. 多语言按钮的完整展开态

当前底部按钮显示 `LOCALIZATION [AUTO/EN/ZH]`，设置抽屉中保留了显式语言切换按钮，但设计稿没有给出：

- 多语言按钮展开态的正式视觉
- `AUTO` 的解释文案
- 中英文混排时的宽度与对齐标准

### 9. 外框与顶部分段色带是否属于最终规范

第三轮复刻已经补上了更接近参考稿的外框圆角和顶部分段细色带，用来贴近整体终端外壳观感。但设计稿本身不是工程标注稿，因此仍缺一个最终口径：

- 外框圆角是否应固定为当前强度，还是在最终稿继续减弱
- 顶部分段色带是否只是展示稿强调线，还是每个栏目都应保留为正式视觉语言
- 演出模式、全屏地图态和未来大地图态下，这套外框 / 色带是否继续保留

### 10. 剧情模式下 ghost map 的最终构图口径

第五轮复刻已经在剧情模式下加入了独立舞台焦点，并把 ghost map 继续压成背景层，尽量贴近设计稿里“演出优先、地图退后”的观感。但设计稿依然没有给出明确的工程标注，因此还有一层未定：

- 剧情模式下是否应保留完整的 ghost map，还是只保留少量实体与极淡的轮廓
- ghost map 在舞台中的垂直位置是否应该继续下移，还是保持当前居中偏下
- 角色高亮点在剧情模式下是否要强化到更接近“唯一视觉焦点”的程度
- 独立舞台焦点标记是否应固定在当前上方构图位置，还是应随地点 / 剧情镜头变化而变化

### 11. 像素对照应以哪种语言模式为准

第六轮开始，截图脚本已经支持显式语言参数，并补了一套英文模式的对照图，因为当前参考稿本身使用英文文案。这里仍然需要一个最终口径：

- 像素级复刻时，应以英文稿为主做版式还原，还是以中文本地化后的真实产品形态为主
- 若两种语言都会长期存在，是否需要分别维护一套英文 / 中文的对照截图基线
- 某些按钮或标题在中英文下长度差异明显时，优先服从哪个版本的视觉比例

## 当前判断

这轮实现已经把“整体版式、主要气质、关键交互位置”继续往设计稿上压了一步，适合继续做第五轮后的局部像素级校准。

接下来若要继续提高精度，优先级建议是：

1. 补齐上面 11 个缺设计点
2. 针对左侧地点栏密度、剧情对话框内边距和右栏字段语义表现继续做下一轮像素级微调
3. 再补一轮对应截图，逐张贴着设计稿收细节
