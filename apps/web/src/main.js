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
const flow = {
  deploy: false,
  collect: false,
  tape: false,
  arena: false,
  offline: false,
  hardware: false,
  save: false,
};

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
};

const saveKey = "rust-and-logic.save.v1";

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
  elements.saveSummary.textContent = `Saved tick ${game.tick}.`;
  render(snapshot(game));
});
elements.load.addEventListener("click", () => {
  const serialized = localStorage.getItem(saveKey);
  if (!serialized) {
    elements.saveSummary.textContent = "No save found.";
    return;
  }
  game = restoreGame(serialized);
  game.logs.unshift(`Loaded save from tick ${game.tick}.`);
  flow.save = true;
  elements.saveSummary.textContent = `Loaded tick ${game.tick}.`;
  render(snapshot(game));
});
elements.reset.addEventListener("click", () => {
  game = createGame();
  elements.saveSummary.textContent = "Reset local session state.";
  render(snapshot(game));
});

render(snapshot(game));

function render(state) {
  const diff = previousState ? diffSnapshots(previousState, state) : [];
  previousState = state;

  elements.tick.textContent = state.tick;
  elements.tapeUsage.textContent = state.program
    ? `${state.program.tapeUsed}/${state.tapeCapacity}`
    : `0/${state.tapeCapacity}`;
  elements.vmState.textContent = state.vm?.state ?? "Idle";
  elements.capacityLabel.textContent = `Capacity ${state.tapeCapacity}`;
  elements.robotPosition.textContent = `${state.robot.x},${state.robot.y} ${state.robot.dir}`;
  elements.scrap.textContent = state.resources.scrap;
  elements.cells.textContent = state.resources.cells;
  elements.blankTape.textContent = state.resources.blankTape;
  elements.armor.textContent = state.robot.armor;
  elements.weapon.textContent = state.robot.weapon;
  elements.hp.textContent = state.robot.hp;

  if (!state.program) {
    elements.compileStatus.textContent = "Waiting";
    elements.compileStatus.className = "";
  } else {
    elements.compileStatus.textContent = state.program.ok ? "Compile OK" : "Compile error";
    elements.compileStatus.className = state.program.ok ? "ok" : "error";
  }

  elements.arenaSummary.textContent = state.arena
    ? `${state.arena.result}: ${state.arena.summary} Score ${state.arena.score}/${state.arena.enemyScore}.`
    : "No arena preview yet.";
  elements.offlineSummary.textContent = state.offline
    ? state.offline.summary
    : "No offline projection yet.";

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
  elements.diffCount.textContent = `${diff.length} ${diff.length === 1 ? "change" : "changes"}`;
  elements.diffList.replaceChildren();

  if (diff.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No state changes yet.";
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
