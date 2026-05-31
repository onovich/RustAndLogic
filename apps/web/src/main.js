import {
  createGame,
  deployProgram,
  diffSnapshots,
  fastForwardOffline,
  previewArena,
  runGame,
  serializeGame,
  snapshot,
  stepGame,
  restoreGame,
  upgradeHardware,
  upgradeTape,
} from "../../../packages/game-sim/index.js";

let game = createGame();
let previousState = null;
let saveStatus = { key: "save.empty", values: {} };
const flow = {
  deploy: false,
  collect: false,
  tape: false,
  arena: false,
  offline: false,
  hardware: false,
  save: false,
};

const saveKey = "rust-and-logic.save.v1";
const languageKey = "rust-and-logic.language";
let language = detectLanguage();

const elements = {
  editor: query("tape-editor"),
  deploy: query("deploy-button"),
  step: query("step-button"),
  run: query("run-button"),
  reset: query("reset-button"),
  upgrade: query("upgrade-button"),
  armorUpgrade: query("armor-upgrade-button"),
  weaponUpgrade: query("weapon-upgrade-button"),
  arena: query("arena-button"),
  offline: query("offline-button"),
  save: query("save-button"),
  load: query("load-button"),
  grid: query("world-grid"),
  tick: query("tick"),
  tapeUsage: query("tape-usage"),
  vmState: query("vm-state"),
  capacityLabel: query("capacity-label"),
  robotPosition: query("robot-position"),
  scrap: query("scrap-count"),
  cells: query("cell-count"),
  blankTape: query("blank-tape-count"),
  armor: query("armor-level"),
  weapon: query("weapon-level"),
  hp: query("hp-value"),
  compileStatus: query("compile-status"),
  consoleLog: query("console-log"),
  diffCount: query("diff-count"),
  diffList: query("diff-list"),
  arenaSummary: query("arena-summary"),
  offlineSummary: query("offline-summary"),
  saveSummary: query("save-summary"),
  flowChecklist: query("flow-checklist"),
  languageSwitch: query("language-switch"),
};

const i18n = {
  en: {
    "app.eyebrow": "TapeScript test harness",
    "status.aria": "Simulation status",
    "status.tick": "Tick",
    "status.tape": "Tape",
    "status.vm": "VM",
    "language.aria": "Language switch",
    "workspace.aria": "Game UI flow",
    "tape.aria": "Tape editor",
    "tape.title": "Tape",
    "tape.controls": "Tape controls",
    "world.aria": "World map",
    "world.grid": "Robot grid",
    "side.aria": "Progression and arena",
    "world.title": "Scrapyard",
    "resources.title": "Resources",
    "resources.scrap": "Scrap",
    "resources.cells": "Cells",
    "resources.blankTape": "Blank tape",
    "modules.aria": "Robot modules",
    "modules.title": "Modules",
    "modules.armor": "Armor",
    "modules.weapon": "Weapon",
    "arena.aria": "Arena preview",
    "arena.title": "Arena Preview",
    "offline.aria": "Offline projection",
    "offline.title": "Offline Projection",
    "save.aria": "Save slot",
    "save.title": "Save Slot",
    "flow.aria": "Flow checklist",
    "flow.title": "Flow Checklist",
    "flow.deploy": "Deploy a valid tape",
    "flow.collect": "Collect scrap from the map",
    "flow.tape": "Upgrade tape capacity",
    "flow.arena": "Preview arena result",
    "flow.offline": "Resolve offline projection",
    "flow.hardware": "Upgrade robot hardware",
    "flow.save": "Save and reload progress",
    "console.aria": "Runtime console",
    "console.title": "Console",
    "diff.aria": "State diff",
    "diff.title": "Diff",
    "action.deploy": "Deploy",
    "action.step": "Step",
    "action.run": "Run 6",
    "action.reset": "Reset",
    "action.upgradeTape": "Upgrade tape",
    "action.armorPlus": "Armor +",
    "action.weaponPlus": "Weapon +",
    "action.previewArena": "Preview arena",
    "action.offline": "Fast-forward 24",
    "action.save": "Save",
    "action.load": "Load",
    "state.idle": "Idle",
    "state.waiting": "Waiting",
    "state.compileOk": "Compile OK",
    "state.compileError": "Compile error",
    "capacity": "Capacity {value}",
    "diff.count": "{count} {label}",
    "diff.change": "change",
    "diff.changes": "changes",
    "diff.empty": "No state changes yet.",
    "arena.empty": "No arena preview yet.",
    "arena.victory": "Victory",
    "arena.defeat": "Defeat",
    "arena.victorySummary": "The robot survived the ladder ghost and recovered a data cell.",
    "arena.defeatSummary": "The opponent forced a logic fault before extraction.",
    "arena.summary": "{result}: {summary} Score {score}/{enemyScore}.",
    "offline.empty": "No offline projection yet.",
    "offline.summary": "Fast-forwarded {ticks} ticks and recovered {scrap} scrap{cellsText}.",
    "offline.cellsText": " plus {cells} cells",
    "save.empty": "No save written this session.",
    "save.saved": "Saved tick {tick}.",
    "save.loaded": "Loaded tick {tick}.",
    "save.missing": "No save found.",
    "save.reset": "Reset local session state.",
    "vm.Ready": "Ready",
    "vm.Suspended": "Suspended",
    "vm.Halted": "Halted",
    "vm.Fault": "Fault",
  },
  zh: {
    "app.eyebrow": "TapeScript 测试工作台",
    "status.aria": "模拟状态",
    "status.tick": "回合",
    "status.tape": "纸带",
    "status.vm": "虚拟机",
    "language.aria": "语言切换",
    "workspace.aria": "游戏 UI 流程",
    "tape.aria": "纸带编辑器",
    "tape.title": "纸带",
    "tape.controls": "纸带控制",
    "world.aria": "世界地图",
    "world.grid": "机器人网格",
    "side.aria": "成长与竞技场",
    "world.title": "废土场",
    "resources.title": "资源",
    "resources.scrap": "废铁",
    "resources.cells": "电芯",
    "resources.blankTape": "空白纸带",
    "modules.aria": "机器人模块",
    "modules.title": "模块",
    "modules.armor": "装甲",
    "modules.weapon": "武器",
    "arena.aria": "竞技场预览",
    "arena.title": "竞技场预览",
    "offline.aria": "离线推演",
    "offline.title": "离线推演",
    "save.aria": "存档槽",
    "save.title": "存档槽",
    "flow.aria": "流程清单",
    "flow.title": "流程清单",
    "flow.deploy": "部署有效纸带",
    "flow.collect": "从地图收集废铁",
    "flow.tape": "升级纸带容量",
    "flow.arena": "预览竞技场结果",
    "flow.offline": "结算离线推演",
    "flow.hardware": "升级机器人硬件",
    "flow.save": "保存并读取进度",
    "console.aria": "运行控制台",
    "console.title": "控制台",
    "diff.aria": "状态差异",
    "diff.title": "差异",
    "action.deploy": "部署",
    "action.step": "步进",
    "action.run": "运行 6 步",
    "action.reset": "重置",
    "action.upgradeTape": "升级纸带",
    "action.armorPlus": "装甲 +",
    "action.weaponPlus": "武器 +",
    "action.previewArena": "预览竞技场",
    "action.offline": "快进 24",
    "action.save": "保存",
    "action.load": "读取",
    "state.idle": "空闲",
    "state.waiting": "等待中",
    "state.compileOk": "编译通过",
    "state.compileError": "编译错误",
    "capacity": "容量 {value}",
    "diff.count": "{count} 项变化",
    "diff.change": "项变化",
    "diff.changes": "项变化",
    "diff.empty": "暂无状态变化。",
    "arena.empty": "尚未预览竞技场。",
    "arena.victory": "胜利",
    "arena.defeat": "失败",
    "arena.victorySummary": "机器人撑过了天梯幽影，并回收了一枚数据电芯。",
    "arena.defeatSummary": "对手在撤离前诱发了逻辑故障。",
    "arena.summary": "{result}: {summary} 分数 {score}/{enemyScore}。",
    "offline.empty": "尚未进行离线推演。",
    "offline.summary": "已快进 {ticks} 回合，回收 {scrap} 废铁{cellsText}。",
    "offline.cellsText": "与 {cells} 电芯",
    "save.empty": "本轮尚未写入存档。",
    "save.saved": "已保存第 {tick} 回合。",
    "save.loaded": "已读取第 {tick} 回合。",
    "save.missing": "没有找到存档。",
    "save.reset": "已重置本地会话状态。",
    "vm.Ready": "就绪",
    "vm.Suspended": "暂停",
    "vm.Halted": "停止",
    "vm.Fault": "故障",
  },
};

elements.languageSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lang]");
  if (!button) {
    return;
  }
  language = button.dataset.lang === "zh" ? "zh" : "en";
  localStorage.setItem(languageKey, language);
  applyLanguage();
  render(snapshot(game));
});

elements.deploy.addEventListener("click", () => {
  const state = deployProgram(game, elements.editor.value);
  flow.deploy = Boolean(state.program?.ok);
  render(state);
});
elements.step.addEventListener("click", () => {
  const state = stepGame(game);
  flow.collect = state.resources.scrap > 0 || state.deposits.length < 3;
  render(state);
});
elements.run.addEventListener("click", () => render(runGame(game, 6)));
elements.upgrade.addEventListener("click", () => {
  const state = upgradeTape(game);
  flow.tape = state.tapeCapacity > 8;
  render(state);
});
elements.armorUpgrade.addEventListener("click", () => {
  const state = upgradeHardware(game, "armor");
  flow.hardware = state.robot.armor > 1 || state.robot.weapon > 1;
  render(state);
});
elements.weaponUpgrade.addEventListener("click", () => {
  const state = upgradeHardware(game, "weapon");
  flow.hardware = state.robot.armor > 1 || state.robot.weapon > 1;
  render(state);
});
elements.arena.addEventListener("click", () => {
  const state = previewArena(game);
  flow.arena = Boolean(state.arena);
  render(state);
});
elements.offline.addEventListener("click", () => {
  const state = fastForwardOffline(game, 24);
  flow.offline = Boolean(state.offline?.ticks);
  render(state);
});
elements.save.addEventListener("click", () => {
  localStorage.setItem(saveKey, serializeGame(game));
  flow.save = true;
  saveStatus = { key: "save.saved", values: { tick: game.tick } };
  render(snapshot(game));
});
elements.load.addEventListener("click", () => {
  const serialized = localStorage.getItem(saveKey);
  if (!serialized) {
    saveStatus = { key: "save.missing", values: {} };
    render(snapshot(game));
    return;
  }
  game = restoreGame(serialized);
  game.logs.unshift(`Loaded save from tick ${game.tick}.`);
  flow.save = true;
  saveStatus = { key: "save.loaded", values: { tick: game.tick } };
  render(snapshot(game));
});
elements.reset.addEventListener("click", () => {
  game = createGame();
  saveStatus = { key: "save.reset", values: {} };
  render(snapshot(game));
});

applyLanguage();
render(snapshot(game));

function render(state) {
  const diff = previousState ? diffSnapshots(previousState, state) : [];
  previousState = state;

  elements.tick.textContent = state.tick;
  elements.tapeUsage.textContent = state.program
    ? `${state.program.tapeUsed}/${state.tapeCapacity}`
    : `0/${state.tapeCapacity}`;
  elements.vmState.textContent = translateVmState(state.vm?.state);
  elements.capacityLabel.textContent = t("capacity", { value: state.tapeCapacity });
  elements.robotPosition.textContent = `${state.robot.x},${state.robot.y} ${state.robot.dir}`;
  elements.scrap.textContent = state.resources.scrap;
  elements.cells.textContent = state.resources.cells;
  elements.blankTape.textContent = state.resources.blankTape;
  elements.armor.textContent = state.robot.armor;
  elements.weapon.textContent = state.robot.weapon;
  elements.hp.textContent = state.robot.hp;

  if (!state.program) {
    elements.compileStatus.textContent = t("state.waiting");
    elements.compileStatus.className = "";
  } else {
    elements.compileStatus.textContent = state.program.ok ? t("state.compileOk") : t("state.compileError");
    elements.compileStatus.className = state.program.ok ? "ok" : "error";
  }

  elements.arenaSummary.textContent = state.arena
    ? t("arena.summary", {
        result: state.arena.result === "Victory" ? t("arena.victory") : t("arena.defeat"),
        summary: state.arena.result === "Victory" ? t("arena.victorySummary") : t("arena.defeatSummary"),
        score: state.arena.score,
        enemyScore: state.arena.enemyScore,
      })
    : t("arena.empty");
  elements.offlineSummary.textContent = state.offline
    ? t("offline.summary", {
        ticks: state.offline.ticks,
        scrap: state.offline.scrap,
        cellsText: state.offline.cells > 0 ? t("offline.cellsText", { cells: state.offline.cells }) : "",
      })
    : t("offline.empty");
  elements.saveSummary.textContent = t(saveStatus.key, saveStatus.values);

  renderGrid(state);
  renderLog(state.logs);
  renderDiff(diff);
  renderFlow();
}

function renderGrid(state) {
  elements.grid.replaceChildren();
  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.coord = `${x},${y}`;
      cell.dataset.testid = `cell-${x}-${y}`;

      const deposit = state.deposits.find((item) => item.x === x && item.y === y);
      if (deposit) {
        const marker = document.createElement("div");
        marker.className = `deposit ${deposit.type}`;
        marker.title = deposit.type;
        cell.append(marker);
      }

      if (state.robot.x === x && state.robot.y === y) {
        const robot = document.createElement("div");
        robot.className = "robot";
        robot.dataset.dir = state.robot.dir;
        robot.title = `Robot facing ${state.robot.dir}`;
        cell.append(robot);
      }

      elements.grid.append(cell);
    }
  }
}

function renderLog(logs) {
  elements.consoleLog.replaceChildren();
  for (const message of logs) {
    const item = document.createElement("li");
    item.textContent = message;
    elements.consoleLog.append(item);
  }
}

function renderDiff(diff) {
  elements.diffCount.textContent = t("diff.count", {
    count: diff.length,
    label: diff.length === 1 ? t("diff.change") : t("diff.changes"),
  });
  elements.diffList.replaceChildren();

  if (diff.length === 0) {
    const item = document.createElement("li");
    item.textContent = t("diff.empty");
    elements.diffList.append(item);
    return;
  }

  for (const change of diff.slice(0, 18)) {
    const item = document.createElement("li");
    item.textContent = `${change.path}: ${formatValue(change.before)} -> ${formatValue(change.after)}`;
    elements.diffList.append(item);
  }
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of node.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":");
      if (attr && key) {
        node.setAttribute(attr, t(key));
      }
    }
  }
  for (const button of elements.languageSwitch.querySelectorAll("[data-lang]")) {
    const active = button.dataset.lang === language;
    button.setAttribute("aria-pressed", String(active));
    button.dataset.active = String(active);
  }
}

function detectLanguage() {
  const saved = localStorage.getItem(languageKey);
  if (saved === "zh" || saved === "en") {
    return saved;
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((item) => item?.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

function t(key, values = {}) {
  const template = i18n[language]?.[key] ?? i18n.en[key] ?? key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function translateVmState(state) {
  if (!state) {
    return t("state.idle");
  }
  return t(`vm.${state}`);
}

function renderFlow() {
  const items = elements.flowChecklist.querySelectorAll("[data-flow]");
  for (const item of items) {
    const key = item.dataset.flow;
    item.dataset.done = flow[key] ? "true" : "false";
  }
}

function query(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}
