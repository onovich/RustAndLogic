import {
  createGame,
  deployProgram,
  diffSnapshots,
  fastForwardOffline,
  previewArena,
  serializeGame,
  snapshot,
  stepGame,
  restoreGame,
  upgradeHardware,
  upgradeTape,
} from "../../../packages/game-sim/index.js";
import { compileTapeScript } from "../../../packages/tapescript-runtime/index.js";

let game = createGame();
let previousState = null;
let saveStatus = { key: "save.empty", values: {} };
let playbackMode = "stopped";
let speedIndex = 0;
let playbackTimer = 0;
let robotNode = null;
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
const speeds = [1, 5, 10];
const speedProfiles = {
  1: { interval: 720, duration: 420 },
  5: { interval: 170, duration: 130 },
  10: { interval: 90, duration: 70 },
};
const tapeActions = new Set(["MoveForward", "TurnLeft", "TurnRight", "PickUp", "Drop", "Fire"]);
const tapeQueries = new Set(["CheckScrap", "CheckEnemy", "CheckHP_Low"]);
const tapeBranches = new Set(["Jump", "JumpIfTrue", "JumpIfFalse"]);

const elements = {
  editor: query("tape-editor"),
  highlight: query("tape-highlight"),
  lineNumbers: query("tape-line-numbers"),
  diagnostics: query("tape-diagnostics"),
  deploy: query("deploy-button"),
  play: query("play-button"),
  pause: query("pause-button"),
  step: query("step-button"),
  speed: query("speed-button"),
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
    "action.play": "Play",
    "action.pause": "Pause",
    "action.resume": "Resume",
    "action.frame": "Frame",
    "action.speed": "Speed {speed}",
    "action.stop": "Stop",
    "action.upgradeTape": "Upgrade tape",
    "action.armorPlus": "Armor +",
    "action.weaponPlus": "Weapon +",
    "action.previewArena": "Preview arena",
    "action.offline": "Fast-forward 24",
    "action.save": "Save",
    "action.load": "Load",
    "diagnostic.line": "Line {line}",
    "diagnostic.general": "Tape",
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
    "action.play": "播放",
    "action.pause": "暂停",
    "action.resume": "恢复",
    "action.frame": "快进一帧",
    "action.speed": "速度 {speed}",
    "action.stop": "停止",
    "action.upgradeTape": "升级纸带",
    "action.armorPlus": "装甲 +",
    "action.weaponPlus": "武器 +",
    "action.previewArena": "预览竞技场",
    "action.offline": "快进 24",
    "action.save": "保存",
    "action.load": "读取",
    "diagnostic.line": "第 {line} 行",
    "diagnostic.general": "纸带",
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
  updateEditorTools();
  render(snapshot(game));
});
elements.editor.addEventListener("input", () => updateEditorTools());
elements.editor.addEventListener("scroll", syncEditorScroll);
elements.editor.addEventListener("click", (event) => {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }
  const token = tokenAtOffset(elements.editor.value, elements.editor.selectionStart);
  if (!token?.startsWith("@")) {
    return;
  }
  event.preventDefault();
  jumpToLabel(token.slice(1));
});

elements.deploy.addEventListener("click", () => {
  stopPlayback(false);
  const state = deployProgram(game, elements.editor.value);
  flow.deploy = Boolean(state.program?.ok);
  updateEditorTools(state.program?.errors ?? []);
  render(state, { animate: false });
});
elements.play.addEventListener("click", () => startPlayback());
elements.pause.addEventListener("click", () => togglePause());
elements.step.addEventListener("click", () => advanceFrame({ manual: true }));
elements.speed.addEventListener("click", () => {
  speedIndex = (speedIndex + 1) % speeds.length;
  updateControls();
  if (playbackMode === "playing") {
    schedulePlayback();
  }
});
elements.upgrade.addEventListener("click", () => {
  stopPlayback(false);
  const state = upgradeTape(game);
  flow.tape = state.tapeCapacity > 8;
  render(state, { animate: false });
});
elements.armorUpgrade.addEventListener("click", () => {
  stopPlayback(false);
  const state = upgradeHardware(game, "armor");
  flow.hardware = state.robot.armor > 1 || state.robot.weapon > 1;
  render(state, { animate: false });
});
elements.weaponUpgrade.addEventListener("click", () => {
  stopPlayback(false);
  const state = upgradeHardware(game, "weapon");
  flow.hardware = state.robot.armor > 1 || state.robot.weapon > 1;
  render(state, { animate: false });
});
elements.arena.addEventListener("click", () => {
  stopPlayback(false);
  const state = previewArena(game);
  flow.arena = Boolean(state.arena);
  render(state, { animate: false });
});
elements.offline.addEventListener("click", () => {
  stopPlayback(false);
  const state = fastForwardOffline(game, 24);
  flow.offline = Boolean(state.offline?.ticks);
  render(state, { animate: false });
});
elements.save.addEventListener("click", () => {
  stopPlayback(false);
  localStorage.setItem(saveKey, serializeGame(game));
  flow.save = true;
  saveStatus = { key: "save.saved", values: { tick: game.tick } };
  render(snapshot(game), { animate: false });
});
elements.load.addEventListener("click", () => {
  stopPlayback(false);
  const serialized = localStorage.getItem(saveKey);
  if (!serialized) {
    saveStatus = { key: "save.missing", values: {} };
    render(snapshot(game), { animate: false });
    return;
  }
  game = restoreGame(serialized);
  game.logs.unshift(`Loaded save from tick ${game.tick}.`);
  flow.save = true;
  saveStatus = { key: "save.loaded", values: { tick: game.tick } };
  render(snapshot(game), { animate: false });
});
elements.reset.addEventListener("click", () => {
  stopPlayback(false);
  game = createGame();
  saveStatus = { key: "save.reset", values: {} };
  resetFlow();
  render(snapshot(game), { animate: false });
});

applyLanguage();
updateEditorTools();
render(snapshot(game), { animate: false });

function render(state, options = {}) {
  const beforeState = previousState;
  const diff = beforeState ? diffSnapshots(beforeState, state) : [];
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

  renderGrid(state, beforeState, options);
  renderLog(state.logs);
  renderDiff(diff);
  renderFlow();
  updateControls();
}

function startPlayback() {
  if (!game.program?.ok) {
    const state = deployProgram(game, elements.editor.value);
    flow.deploy = Boolean(state.program?.ok);
    render(state, { animate: false });
    if (!state.program?.ok) {
      stopPlayback(false);
      return;
    }
  }
  playbackMode = "playing";
  updateControls();
  schedulePlayback();
}

function togglePause() {
  if (playbackMode === "playing") {
    playbackMode = "paused";
    clearPlaybackTimer();
  } else if (playbackMode === "paused") {
    playbackMode = "playing";
    schedulePlayback();
  }
  updateControls();
}

function advanceFrame(options = {}) {
  if (options.manual) {
    clearPlaybackTimer();
    if (playbackMode === "playing") {
      playbackMode = "paused";
    }
  }
  const before = snapshot(game);
  const state = stepGame(game);
  flow.collect = state.resources.scrap > 0 || state.deposits.length < 3;
  render(state, {
    animate: true,
    animationDuration: currentSpeedProfile().duration,
  });
  if (!options.manual && shouldAutoPause(before, state)) {
    pauseForBlock(state);
  }
  return state;
}

function schedulePlayback() {
  clearPlaybackTimer();
  if (playbackMode !== "playing") {
    return;
  }
  const profile = currentSpeedProfile();
  playbackTimer = window.setTimeout(() => {
    advanceFrame();
    schedulePlayback();
  }, Math.max(profile.interval, profile.duration + 20));
}

function pauseForBlock(state) {
  playbackMode = "paused";
  clearPlaybackTimer();
  if (!state.logs[0]?.startsWith("Auto-paused:")) {
    game.logs.unshift("Auto-paused: robot could not continue safely.");
    render(snapshot(game), { animate: false });
  }
  updateControls();
}

function shouldAutoPause(before, state) {
  if (!state.program?.ok || state.vm?.state === "Fault" || state.vm?.state === "Halted") {
    return true;
  }
  const latestLog = state.logs[0] ?? "";
  if (
    latestLog.includes("Blocked by boundary") ||
    latestLog.includes("No tape deployed") ||
    latestLog.includes("Unknown action") ||
    latestLog.includes("Logic Overload") ||
    latestLog.includes("Program counter left the tape")
  ) {
    return true;
  }
  return before.tick === state.tick && before.vm?.pc === state.vm?.pc;
}

function stopPlayback(resetMode = true) {
  playbackMode = "stopped";
  clearPlaybackTimer();
  if (resetMode) {
    game = createGame();
    previousState = null;
    resetFlow();
    saveStatus = { key: "save.reset", values: {} };
    render(snapshot(game), { animate: false });
  } else {
    updateControls();
  }
}

function clearPlaybackTimer() {
  if (playbackTimer) {
    window.clearTimeout(playbackTimer);
    playbackTimer = 0;
  }
}

function currentSpeedProfile() {
  return speedProfiles[speeds[speedIndex]];
}

function updateControls() {
  elements.pause.textContent = playbackMode === "paused" ? t("action.resume") : t("action.pause");
  elements.pause.disabled = playbackMode === "stopped";
  elements.play.disabled = playbackMode === "playing";
  elements.speed.textContent = t("action.speed", { speed: `x${speeds[speedIndex]}` });
  elements.play.dataset.active = String(playbackMode === "playing");
  elements.pause.dataset.active = String(playbackMode === "paused");
}

function resetFlow() {
  for (const key of Object.keys(flow)) {
    flow[key] = false;
  }
}

function updateEditorTools(errors = null) {
  const program = errors ? null : compileTapeScript(elements.editor.value, { tapeCapacity: game.tapeCapacity });
  const activeErrors = errors ?? program.errors;
  renderTapeHighlight(activeErrors);
  renderDiagnostics(activeErrors);
  syncEditorScroll();
}

function renderTapeHighlight(errors) {
  const errorLines = new Set(errors.filter((error) => error.line > 0).map((error) => error.line));
  const lines = elements.editor.value.split("\n");
  elements.lineNumbers.textContent = lines.map((_, index) => String(index + 1)).join("\n");
  elements.highlight.innerHTML = lines
    .map((line, index) => {
      const className = errorLines.has(index + 1) ? "code-line has-error" : "code-line";
      return `<span class="${className}">${highlightLine(line) || " "}</span>`;
    })
    .join("");
}

function renderDiagnostics(errors) {
  elements.diagnostics.replaceChildren();
  elements.editor.dataset.invalid = String(errors.length > 0);
  if (errors.length === 0) {
    return;
  }
  for (const error of errors) {
    const item = document.createElement("li");
    item.dataset.line = String(error.line);
    const location = error.line > 0 ? t("diagnostic.line", { line: error.line }) : t("diagnostic.general");
    item.textContent = `${location}: ${error.message}`;
    if (error.line > 0) {
      item.tabIndex = 0;
      item.addEventListener("click", () => jumpToLine(error.line));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          jumpToLine(error.line);
        }
      });
    }
    elements.diagnostics.append(item);
  }
}

function highlightLine(line) {
  const commentStart = line.indexOf("//");
  const code = commentStart >= 0 ? line.slice(0, commentStart) : line;
  const comment = commentStart >= 0 ? line.slice(commentStart) : "";
  const pieces = [];
  const pattern = /(@[A-Za-z][A-Za-z0-9_]*|[A-Za-z][A-Za-z0-9_]*|\s+|.)/g;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    const token = match[0];
    if (/^\s+$/.test(token)) {
      pieces.push(escapeHtml(token));
    } else if (token.startsWith("@")) {
      pieces.push(`<span class="tok-label">${escapeHtml(token)}</span>`);
    } else if (tapeActions.has(token)) {
      pieces.push(`<span class="tok-action">${escapeHtml(token)}</span>`);
    } else if (tapeQueries.has(token)) {
      pieces.push(`<span class="tok-query">${escapeHtml(token)}</span>`);
    } else if (tapeBranches.has(token)) {
      pieces.push(`<span class="tok-branch">${escapeHtml(token)}</span>`);
    } else if (/^[A-Za-z]/.test(token)) {
      pieces.push(`<span class="tok-unknown">${escapeHtml(token)}</span>`);
    } else {
      pieces.push(escapeHtml(token));
    }
  }
  if (comment) {
    pieces.push(`<span class="tok-comment">${escapeHtml(comment)}</span>`);
  }
  return pieces.join("");
}

function syncEditorScroll() {
  elements.highlight.scrollTop = elements.editor.scrollTop;
  elements.highlight.scrollLeft = elements.editor.scrollLeft;
  elements.lineNumbers.scrollTop = elements.editor.scrollTop;
}

function tokenAtOffset(text, offset) {
  const left = text.slice(0, offset).search(/[@A-Za-z0-9_]*$/);
  const start = left < 0 ? offset : left;
  const right = text.slice(offset).match(/^[@A-Za-z0-9_]*/)?.[0].length ?? 0;
  const token = text.slice(start, offset + right);
  return /^@[A-Za-z][A-Za-z0-9_]*$/.test(token) ? token : "";
}

function jumpToLabel(label) {
  const lines = elements.editor.value.split("\n");
  const lineIndex = lines.findIndex((line) => line.trim() === `@${label}`);
  if (lineIndex >= 0) {
    jumpToLine(lineIndex + 1);
  }
}

function jumpToLine(lineNumber) {
  const lines = elements.editor.value.split("\n");
  const safeLine = Math.min(Math.max(lineNumber, 1), lines.length);
  const start = lines.slice(0, safeLine - 1).reduce((total, line) => total + line.length + 1, 0);
  const end = start + lines[safeLine - 1].length;
  elements.editor.focus();
  elements.editor.setSelectionRange(start, end);
  const lineHeight = Number.parseFloat(getComputedStyle(elements.editor).lineHeight) || 20;
  elements.editor.scrollTop = Math.max(0, (safeLine - 2) * lineHeight);
  syncEditorScroll();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderGrid(state, beforeState, options = {}) {
  const previousDeposits = beforeState?.deposits ?? [];
  const removedDeposits = previousDeposits.filter(
    (deposit) => !state.deposits.some((item) => item.id === deposit.id),
  );

  elements.grid.replaceChildren();
  elements.grid.style.setProperty("--cols", state.width);
  elements.grid.style.setProperty("--rows", state.height);
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

      elements.grid.append(cell);
    }
  }
  renderRobot(state, options);
  if (options.animate !== false) {
    for (const deposit of removedDeposits) {
      animatePickup(deposit, state.robot, options.animationDuration);
    }
  }
}

function renderRobot(state, options = {}) {
  if (!robotNode) {
    robotNode = document.createElement("div");
    robotNode.className = "robot robot-avatar";
  }
  robotNode.title = `Robot facing ${state.robot.dir}`;
  robotNode.dataset.dir = state.robot.dir;
  robotNode.style.transitionDuration = `${options.animationDuration ?? currentSpeedProfile().duration}ms`;
  elements.grid.append(robotNode);

  const position = gridPositionFor(state.robot.x, state.robot.y);
  if (!position) {
    return;
  }

  const size = Math.min(position.width * 0.64, 42);
  robotNode.style.width = `${size}px`;
  robotNode.style.height = `${size}px`;
  robotNode.style.transform = `translate(${position.left + (position.width - size) / 2}px, ${position.top + (position.height - size) / 2}px) rotate(${directionDegrees(state.robot.dir)}deg)`;
  if (options.animate === false) {
    robotNode.style.transitionDuration = "0ms";
    requestAnimationFrame(() => {
      if (robotNode) {
        robotNode.style.transitionDuration = `${currentSpeedProfile().duration}ms`;
      }
    });
  }
}

function animatePickup(deposit, robot, duration = currentSpeedProfile().duration) {
  const from = gridPositionFor(deposit.x, deposit.y);
  const to = gridPositionFor(robot.x, robot.y);
  if (!from || !to) {
    return;
  }

  const size = Math.min(from.width * 0.5, 34);
  const ghost = document.createElement("div");
  ghost.className = `deposit pickup-ghost ${deposit.type}`;
  ghost.style.width = `${size}px`;
  ghost.style.height = `${size}px`;
  ghost.style.transitionDuration = `${duration}ms`;
  ghost.style.transform = `translate(${from.left + (from.width - size) / 2}px, ${from.top + (from.height - size) / 2}px) scale(1)`;
  elements.grid.append(ghost);

  requestAnimationFrame(() => {
    ghost.style.opacity = "0";
    ghost.style.transform = `translate(${to.left + (to.width - size) / 2}px, ${to.top + (to.height - size) / 2}px) scale(0.25)`;
  });
  window.setTimeout(() => ghost.remove(), duration + 80);
}

function gridPositionFor(x, y) {
  const cell = elements.grid.querySelector(`[data-coord="${x},${y}"]`);
  if (!cell) {
    return null;
  }
  return {
    left: cell.offsetLeft,
    top: cell.offsetTop,
    width: cell.offsetWidth,
    height: cell.offsetHeight,
  };
}

function directionDegrees(direction) {
  return { N: 0, E: 90, S: 180, W: 270 }[direction] ?? 0;
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
  updateControls();
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
