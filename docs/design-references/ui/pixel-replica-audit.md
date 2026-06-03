# Pixel Replica Audit

## pass24 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass24-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass24-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass24-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass24-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass24-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass24-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass24-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass24-zh.png`
- 本轮新增收边：
  - 将此前失配的字体名改成了浏览器可命中的本机字体别名，代码区、正文区、标题区分别绑定到真正可用的 mono/body/display 栈。
  - 代码区优先命中 `Cascadia Mono / Consolas`，中文正文优先命中 `Noto Sans SC`，标题区则走更硬朗的显示字体栈。
  - smoke 新增了计算后字体族断言，避免后续又回退成“CSS 里写了设计建议，但浏览器实际上没用上”。

## pass23 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass23-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass23-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass23-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass23-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass23-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass23-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass23-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass23-zh.png`
- 本轮新增收边：
  - 彻底移除了剧情遗留的固定 `story-spotlight` 占位层，不再在任何状态下额外绘制一个固定位置的 `R1` 假实体。
  - 同步删除了对应的 HTML 节点、样式块和 JS 显隐逻辑，避免以后又因为隐藏分支或状态切换把它带回来。

## pass22 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass22-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass22-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass22-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass22-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass22-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass22-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass22-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass22-zh.png`
- 本轮新增收边：
  - 按最新需求废除了“假图 / 真图”切换口径，页面启动即加载真实 world grid 和真实地图实体。
  - 剧情模式下只保留对话覆盖，不再把地图回退成 viewport 背景网格，也不再隐藏真实实体。
  - smoke 的开场断言同步改成“启动即存在真实地图实体与 world grid”，防止旧假设再次回流。

## pass21 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass21-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass21-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass21-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass21-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass21-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass21-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass21-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass21-zh.png`
- 本轮新增收边：
  - 将剧情态与挂机态的地图分层重新拆开：剧情态继续使用 viewport 假图网格，挂机态改为 world 层真图网格。
  - 真图网格跟着 `canvasWorld` 一起平移和缩放，拖拽相机、滚轮缩放时不再和实体脱节。
  - 重新校正 world 尺寸，让居中的真实地图锚点落在 40px 网格上，修复实体整体半格错位的问题。
  - smoke 额外断言了 story/idle 两种网格承载模式，避免之后又回退到“假图和真图混在一层”。

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
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass9.png`
  - 用于对照第九轮默认剧情态，采用英文模式截图，重点检查左侧地点栏压紧后与底部剧情框收边后的整体节奏
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass9.png`
  - 用于对照第九轮编辑器态，采用英文模式截图，重点检查左栏更紧凑后与候选词、诊断区的整体平衡
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass9.png`
  - 用于对照第九轮运行时中断态，采用英文模式截图，重点检查右栏字段再收细后与 halt toast 的层级关系
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass10.png`
  - 用于对照第十轮默认剧情态，采用英文模式截图，重点检查顶部彩虹条、扫描线终端感，以及左上地点图遮罩后的可读性
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass10.png`
  - 用于对照第十轮编辑器态，采用英文模式截图，重点检查新按钮基线、扫描线覆盖与候选词层级是否仍保持清晰
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass10.png`
  - 用于对照第十轮运行时中断态，采用英文模式截图，重点检查终端外壳效果加强后 halt toast 仍是否清晰可辨
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass11.png`
  - 用于对照第十一轮默认剧情态，采用英文模式截图，重点检查左上 hero 遮罩、对话框 blur、地图亮度和精确辉光口径
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass11.png`
  - 用于对照第十一轮编辑器态，采用英文模式截图，重点检查编辑器字号、行号栏、补全面板高亮与底部诊断密度
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass11.png`
  - 用于对照第十一轮运行时中断态，采用英文模式截图，重点检查 halt toast 阴影、进度条发光和舞台区亮度平衡
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass12.png`
  - 用于对照第十二轮默认剧情态，采用英文模式截图，重点检查任务列表竖线/复选框结构、标题栏与控制栏拆层、以及侧栏折叠按钮口径
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass12.png`
  - 用于对照第十二轮编辑器态，采用英文模式截图，重点检查控制栏拆层、行号居中、补全面板与诊断区在新框架下的贴稿程度
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass12.png`
  - 用于对照第十二轮运行时中断态，采用英文模式截图，重点检查新控制栏、任务栏激活态和 runtime halt 反馈在整体版式中的协调性
- `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass12.png`
  - 用于对照第十二轮 DevLog 展开态，采用英文模式截图，重点检查开发日志抽屉的展开高度、低优先级信息密度以及与右下动作按钮的关系

## 本轮新增收边

- 将左侧任务清单从伪元素占位改成了更贴设计稿的“2px 竖线 + 8px 复选框 + 12px 缩进”结构，并补上首个未完成任务的激活态
- 将代码区改成了“标题栏 / 控制栏 / 编辑器 / 诊断区”的四层结构，让控制按钮终于从标题行里拆出来，更接近参考稿的三明治分层
- 侧边栏折叠按钮改回更贴稿的窄条箭头结构，宽高、贴边关系和折叠后残留窄轨都更接近设计图
- DevLog 改成默认收起、通过 `max-height` 展开的抽屉模型，并补拍了专门的展开态对照图
- 同步修正了 smoke，使验证逻辑跟上新的 DevLog 抽屉实现和侧栏箭头状态，避免测试还停在旧 UI 假设上
- 吸收了设计师补充的精确滤镜与辉光参数：统一 `--accent-glow`、扫描线密度、顶部彩虹条颜色带与暗晕口径
- 将左上地点 hero 的遮罩、标题字级和副文案可读性进一步收回到更接近设计稿的状态，并补上更明确的琥珀文字辉光
- 提高了编辑器区的代码字号、行号栏密度和诊断面板高度，让编辑器态更接近参考稿里的终端编排
- 重做了候选词下拉、剧情对话框和运行时 halt toast 的阴影/blur/高亮参数，使交互浮层更贴近设计师提供的精确数值
- 微调了舞台区底色与网格亮度，并给进度条填充补上统一的发光与过渡口径，减少地图相对其余区域偏暗的问题
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
- 继续压缩了左侧地点插画、地点文案和任务清单的纵向节奏，让左栏更接近参考稿的紧凑密度
- 收了一轮剧情对话框的内边距、字级和行距，让底部台词框更像设计稿里的低姿态终端块
- 继续压细右栏标题、字段与仪表条密度，让资源区、模块区和运行时区更贴近参考稿的字段节奏
- 吸收了设计师数值参考里最明确的终端外壳参数：补上全屏扫描线和连续顶部彩虹条，让整体壳层更接近原稿
- 重做了左上地点图的多层渐变遮罩与文字压暗适配，修正此前“文字浮在亮底图上、可读性不足”的问题
- 将通用按钮默认态、悬停态和激活态往参数稿的透明描边终端按钮口径上收了一步

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

### 12. 倍速按钮的最终视觉口径

当前产品逻辑是一个循环切换的单按钮：

- `1X`
- `5X`
- `10X`

但参考设计里出现过：

- 右侧单个激活态 `1X`
- 右侧双按钮 `1X / 5X`

它没有完整覆盖当前实际产品的单按钮循环态，也没有明确：

- `10X` 时的正式视觉
- 单按钮循环与多按钮并排二选一时，最终以哪套为准
- 激活态是否总是用琥珀底，还是只在当前倍率高亮描边 / 内发光

## 当前判断

这轮实现已经把“整体版式、主要气质、关键交互位置”继续往设计稿上压了一步，适合继续做第五轮后的局部像素级校准。

接下来若要继续提高精度，优先级建议是：

1. 补齐上面 12 个缺设计点
2. 针对左侧插画裁切口径、剧情模式焦点落点，以及右栏字段语义映射后的最终排版继续做下一轮像素级微调
3. 再补一轮对应截图，逐张贴着设计稿收细节

## pass13 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass13-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass13-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass13-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass13-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass13-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass13-zh.png`
- 本轮新增收边：
  - 将字体正式拆成 `--font-mono`、`--font-display`、`--font-body` 三层，避免中文进入后把终端式对齐和信息密度打散。
  - 等宽信息区继续保持终端基线，优先覆盖代码区、行号、日志与诊断。
  - 标题与状态标签单独切到 display 字体栈，让中文标题保持更硬朗的机械感，同时不影响代码区宽度节奏。
  - 对话正文、地点说明、抽屉说明文案切到 body 字体栈，提升中文可读性，并避免剧情文本被强制全大写带来的观感噪声。

## pass14 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass14-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass14-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass14-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass14-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass14-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass14-zh.png`
- 本轮新增收边：
  - 给演出区底部对话补上了设计稿里明确存在的分页点，让多页剧情的翻页反馈不再只靠文案提示。
  - 将对话框底部提示改成更接近稿子的 bracket 口径，并压细了 speaker 与正文的主次关系。
  - 把右下动作按钮栈收回到更接近参考稿的满宽终端条比例，减少此前左右留白过多导致的按钮显瘦问题。
  - 给运行时 halt toast 补上了更贴近设计稿的横向扫线质感，让错误块从纯色警报条更靠近终端红色告警片。

## pass15 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass15-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass15-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass15-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass15-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass15-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass15-zh.png`
- 本轮新增收边：
  - 将编辑器底部诊断从“纯文本行”收成更接近设计稿的二层结构：严重级别标签、定位信息、正文描述分层展示。
  - 诊断计数从裸数字改为 `N issue(s)` 口径，更贴近参考稿的底栏反馈方式。
  - 把补全面板的字号、内边距和副说明压紧一档，让候选词层级更接近参考稿里的终端密度。
  - 继续压细右栏资源区、模块区和运行时区的字号、行高与间距，让字段节奏更像参考稿的紧凑工程面板。

## pass16 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass16-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass16-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass16-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass16-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass16-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass16-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass16-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass16-zh.png`
- 本轮新增收边：
  - 继续压地点图区的遮罩、裁切和文案层级，让左上角插画与标题更接近参考稿里的“被底色吞进去”的状态。
  - 收紧任务栏的顶部内边距、列表行距和条目密度，让左栏更接近参考稿的紧凑节奏。
  - 收边 DevLog 抽屉的展开高度、标题区分隔和日志字号，让展开态更像参考稿里的低优先级调试面板。
  - 将对照截图脚本补成默认也能产出 DevLog 展开态截图，避免这块后续继续微调时失去稳定对照基线。

## pass17 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass17-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass17-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass17-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass17-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass17-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass17-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass17-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass17-zh.png`
- 本轮新增收边：
  - 继续压缩了演出区底部对话框的左右留白、底边距、内边距与页脚间距，让剧情框和舞台的主次关系更接近参考稿里的低姿态终端块。
  - 微调了对话正文的最大宽度、行距和提示层级，让底部对白在英文与中文模式下都更稳地贴近参考稿节奏。
  - 继续压紧了右下角抽屉区的整体垂直节奏，包括 `sidebar-drawers` 间距、DevLog 展开态高度、日志字号与按钮栈间隔，让 DevLog 与动作按钮的上下关系更贴近参考稿。
  - 将 DevLog 对照截图从“空抽屉展开态”改成“先跑出真实运行日志再展开”的状态，补强了右下角调试区域的像素级对照证据，避免后续收边时只盯着空态。

## pass18 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass18-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass18-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass18-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass18-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass18-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass18-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass18-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass18-zh.png`
- 本轮新增收边：
  - 继续压紧了左上地点插画里的文字块：缩小主标题字级、压低副文案行距、缩窄文案宽度，并把文字整体再往底色里压了一点，让地点识别区更接近参考稿那种“信息被场景吞进去”的感觉。
  - 轻微收窄了右下角动作按钮与抽屉区的底部留白，并把按钮高度再压细一档，让 `SETTINGS / LOCALIZATION / DEV_LOG / SAVE_STATE` 更接近参考稿里的细长终端条比例。

## pass19 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass19-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass19-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass19-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass19-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass19-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass19-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass19-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass19-zh.png`
- 本轮新增收边：
  - 继续压紧了编辑器自动补全面板的宽度、条目内边距、副说明字号和底部快捷键提示，让它更接近参考稿里的轻薄终端下拉，而不是偏厚的菜单卡片。
  - 收细了底部诊断区的高度、条目内边距、严重级别字号和正文行距，让报错列表更贴近参考稿里“低位终端问题栏”的密度。
  - 将运行时中断 toast 再往左下角样张靠拢了一步：缩小宽度、减小内边距与字号、微调左下落点，让运行时报错更像参考稿里的紧凑红色告警片。
## pass20 补充

- 新增截图：
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass20-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass20-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass20-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass20-en.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-default-pass20-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-devlog-pass20-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-editor-pass20-zh.png`
  - `D:\LabProjects\RustAndLogic\.codex-artifacts\compare-runtime-pass20-zh.png`
- 本轮新增收边：
  - 运行时中断提示改为统一的本地化归类输出，避免暂停后仍出现未翻译的英文 halt 文案。
  - 代码区行号补齐为两位数，和设计稿里的终端式编号口径保持一致。
  - 舞台地图废除旧的格子 DOM 渲染方式，不再额外绘制边框、数字坐标和第二套背景网格，只保留贴着舞台背景网格的实体层。
  - 剧情演出模式下不再提前加载真实地图实体；只有剧情结束回到挂机模式后，障碍、资源、基地和机器人本体才进入舞台。
  - 机器人与地图实体的步进、摆放都改为基于 40px 世界网格的中心点对齐，避免逻辑格与显示格再出现半格错位。
