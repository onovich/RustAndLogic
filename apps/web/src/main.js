import {
  createGame,
  deployProgram,
  fastForwardOffline,
  previewArena,
  runGame,
  snapshot,
  stepGame,
  upgradeHardware,
  upgradeTape,
} from "../../../packages/game-sim/index.js";

let game = createGame();

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
  arenaSummary: query("arena-summary"),
  offlineSummary: query("offline-summary"),
};

elements.deploy.addEventListener("click", () => render(deployProgram(game, elements.editor.value)));
elements.step.addEventListener("click", () => render(stepGame(game)));
elements.run.addEventListener("click", () => render(runGame(game, 6)));
elements.upgrade.addEventListener("click", () => render(upgradeTape(game)));
elements.armorUpgrade.addEventListener("click", () => render(upgradeHardware(game, "armor")));
elements.weaponUpgrade.addEventListener("click", () => render(upgradeHardware(game, "weapon")));
elements.arena.addEventListener("click", () => render(previewArena(game)));
elements.offline.addEventListener("click", () => render(fastForwardOffline(game, 24)));
elements.reset.addEventListener("click", () => {
  game = createGame();
  render(snapshot(game));
});

render(snapshot(game));

function render(state) {
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

function query(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}
