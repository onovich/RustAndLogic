import { compileTapeScript, createVm, executeUntilPhysical } from "../tapescript-runtime/index.js";

const DIRECTIONS = ["N", "E", "S", "W"];
const DELTAS = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

export function createGame() {
  return {
    width: 7,
    height: 5,
    tick: 0,
    tapeCapacity: 8,
    resources: { scrap: 0, cells: 0, blankTape: 1 },
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, cargo: [] },
    deposits: [
      { id: "scrap-a", type: "scrap", x: 2, y: 2 },
      { id: "cell-a", type: "cell", x: 4, y: 1 },
      { id: "scrap-b", type: "scrap", x: 5, y: 3 },
    ],
    program: null,
    vm: null,
    logs: ["System ready. Load a tape and deploy."],
    arena: null,
    offline: null,
  };
}

export function serializeGame(game) {
  return JSON.stringify(snapshot(game));
}

export function restoreGame(serialized) {
  const parsed = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
  const base = createGame();
  return {
    ...base,
    ...parsed,
    resources: { ...base.resources, ...parsed.resources },
    robot: { ...base.robot, ...parsed.robot },
    deposits: Array.isArray(parsed.deposits) ? parsed.deposits : base.deposits,
    logs: Array.isArray(parsed.logs) ? parsed.logs : base.logs,
  };
}

export function deployProgram(game, source) {
  const program = compileTapeScript(source, { tapeCapacity: game.tapeCapacity });
  game.program = program;
  game.vm = createVm(program);
  if (program.ok) {
    game.logs.unshift(`Deploy OK: ${program.tapeUsed}/${program.tapeCapacity} tape rows used.`);
  } else {
    game.logs.unshift(`Deploy failed: ${program.errors.map((error) => error.message).join(" ")}`);
  }
  return snapshot(game);
}

export function stepGame(game) {
  if (!game.program || !game.vm) {
    game.logs.unshift("No tape deployed.");
    return snapshot(game);
  }

  if (game.vm.state === "Halted" || game.vm.state === "Fault") {
    game.logs.unshift(`VM is ${game.vm.state}. Reset or deploy again.`);
    return snapshot(game);
  }

  game.vm.state = "Ready";
  const result = executeUntilPhysical(game.program, game.vm, makeHardware(game), { maxLogicSteps: 20 });
  game.tick += 1;
  for (const event of result.events.reverse()) {
    if (event.type === "trace") {
      game.logs.unshift(`PC ${event.pc}: ${event.source}`);
    } else if (event.type === "query") {
      game.logs.unshift(`${event.op} -> ${event.value}`);
    } else if (event.type === "branch") {
      game.logs.unshift(`${event.op} ${event.taken ? "taken" : "skipped"}`);
    } else if (event.type === "action") {
      game.logs.unshift(`${event.op}: ${event.result.message}`);
    } else if (event.type === "fault" || event.type === "halt") {
      game.logs.unshift(event.message);
    }
  }
  game.logs = game.logs.slice(0, 28);
  return snapshot(game);
}

export function runGame(game, steps = 6) {
  for (let index = 0; index < steps; index += 1) {
    stepGame(game);
    if (game.vm?.state === "Fault") {
      break;
    }
  }
  return snapshot(game);
}

export function upgradeTape(game) {
  if (game.resources.scrap < 1) {
    game.logs.unshift("Upgrade blocked: collect at least 1 scrap.");
    return snapshot(game);
  }
  game.resources.scrap -= 1;
  game.resources.blankTape += 1;
  game.tapeCapacity += 2;
  game.logs.unshift(`Tape upgraded. Capacity is now ${game.tapeCapacity}.`);
  return snapshot(game);
}

export function upgradeHardware(game, module) {
  if (module === "armor") {
    if (game.resources.scrap < 2) {
      game.logs.unshift("Armor upgrade blocked: requires 2 scrap.");
      return snapshot(game);
    }
    game.resources.scrap -= 2;
    game.robot.armor += 1;
    game.robot.hp += 2;
    game.logs.unshift(`Armor upgraded to ${game.robot.armor}.`);
    return snapshot(game);
  }

  if (module === "weapon") {
    if (game.resources.cells < 1) {
      game.logs.unshift("Weapon upgrade blocked: requires 1 cell.");
      return snapshot(game);
    }
    game.resources.cells -= 1;
    game.robot.weapon += 1;
    game.logs.unshift(`Weapon upgraded to ${game.robot.weapon}.`);
    return snapshot(game);
  }

  game.logs.unshift(`Unknown hardware module: ${module}.`);
  return snapshot(game);
}

export function previewArena(game) {
  const tapeScore = game.program?.ok ? game.program.tapeUsed : 0;
  const offense = game.robot.weapon * 3 + tapeScore;
  const defense = game.robot.armor * 2 + game.robot.hp;
  const enemy = 15;
  const victory = offense + defense >= enemy;
  game.arena = {
    enemy: "Relay Bandit",
    score: offense + defense,
    enemyScore: enemy,
    result: victory ? "Victory" : "Defeat",
    summary: victory
      ? "The robot survived the ladder ghost and recovered a data cell."
      : "The opponent forced a logic fault before extraction.",
  };
  if (victory) {
    game.resources.cells += 1;
  }
  game.logs.unshift(`Arena preview: ${game.arena.result}.`);
  return snapshot(game);
}

export function fastForwardOffline(game, ticks = 24) {
  if (!game.program?.ok) {
    game.logs.unshift("Offline projection blocked: deploy a valid tape first.");
    game.offline = {
      ticks: 0,
      scrap: 0,
      cells: 0,
      summary: "No valid tape was available for offline work.",
    };
    return snapshot(game);
  }

  const safeTicks = Math.max(1, Math.floor(ticks));
  const efficiency = Math.max(1, game.program.tapeUsed + game.robot.armor + game.robot.weapon);
  const scrap = Math.max(1, Math.floor((safeTicks * efficiency) / 32));
  const cells = Math.floor((safeTicks * game.robot.weapon) / 48);

  game.tick += safeTicks;
  game.resources.scrap += scrap;
  game.resources.cells += cells;
  game.offline = {
    ticks: safeTicks,
    scrap,
    cells,
    summary: `Fast-forwarded ${safeTicks} ticks and recovered ${scrap} scrap${cells > 0 ? ` plus ${cells} cells` : ""}.`,
  };
  game.logs.unshift(`Offline projection: +${scrap} scrap, +${cells} cells over ${safeTicks} ticks.`);
  return snapshot(game);
}

export function snapshot(game) {
  return JSON.parse(JSON.stringify({
    width: game.width,
    height: game.height,
    tick: game.tick,
    tapeCapacity: game.tapeCapacity,
    resources: game.resources,
    robot: game.robot,
    deposits: game.deposits,
    program: game.program
      ? {
          ok: game.program.ok,
          errors: game.program.errors,
          instructions: game.program.instructions,
          labels: game.program.labels,
          tapeUsed: game.program.tapeUsed,
          tapeCapacity: game.program.tapeCapacity,
        }
      : null,
    vm: game.vm,
    logs: game.logs,
    arena: game.arena,
    offline: game.offline,
  }));
}

export function diffSnapshots(before, after) {
  const changes = [];
  compare(changes, "tick", before?.tick, after?.tick);
  compare(changes, "tapeCapacity", before?.tapeCapacity, after?.tapeCapacity);
  compare(changes, "resources.scrap", before?.resources?.scrap, after?.resources?.scrap);
  compare(changes, "resources.cells", before?.resources?.cells, after?.resources?.cells);
  compare(changes, "resources.blankTape", before?.resources?.blankTape, after?.resources?.blankTape);
  compare(changes, "robot.x", before?.robot?.x, after?.robot?.x);
  compare(changes, "robot.y", before?.robot?.y, after?.robot?.y);
  compare(changes, "robot.dir", before?.robot?.dir, after?.robot?.dir);
  compare(changes, "robot.hp", before?.robot?.hp, after?.robot?.hp);
  compare(changes, "robot.armor", before?.robot?.armor, after?.robot?.armor);
  compare(changes, "robot.weapon", before?.robot?.weapon, after?.robot?.weapon);
  compare(changes, "program.ok", before?.program?.ok, after?.program?.ok);
  compare(changes, "program.tapeUsed", before?.program?.tapeUsed, after?.program?.tapeUsed);
  compare(changes, "vm.pc", before?.vm?.pc, after?.vm?.pc);
  compare(changes, "vm.state", before?.vm?.state, after?.vm?.state);
  compare(changes, "arena.result", before?.arena?.result, after?.arena?.result);
  compare(changes, "offline.ticks", before?.offline?.ticks, after?.offline?.ticks);
  compare(changes, "deposits.count", before?.deposits?.length ?? 0, after?.deposits?.length ?? 0);
  compare(changes, "logs.latest", before?.logs?.[0] ?? "", after?.logs?.[0] ?? "");
  return changes;
}

function makeHardware(game) {
  return {
    query(op) {
      if (op === "CheckScrap") {
        return Boolean(findDeposit(game, aheadOf(game), "scrap"));
      }
      if (op === "CheckEnemy") {
        return game.tick % 7 === 6;
      }
      if (op === "CheckHP_Low") {
        return game.robot.hp <= 3;
      }
      return false;
    },
    action(op) {
      if (op === "MoveForward") {
        return moveForward(game);
      }
      if (op === "TurnLeft" || op === "TurnRight") {
        return turn(game, op === "TurnRight" ? 1 : -1);
      }
      if (op === "PickUp") {
        return pickUp(game);
      }
      if (op === "Drop") {
        return { ok: true, message: "Cargo clamps opened." };
      }
      if (op === "Fire") {
        return { ok: true, message: "Weapon relay discharged." };
      }
      return { ok: false, message: `Unknown action ${op}.` };
    },
  };
}

function aheadOf(game) {
  const delta = DELTAS[game.robot.dir];
  return { x: game.robot.x + delta.x, y: game.robot.y + delta.y };
}

function moveForward(game) {
  const next = aheadOf(game);
  if (next.x < 0 || next.y < 0 || next.x >= game.width || next.y >= game.height) {
    return { ok: false, message: "Blocked by boundary." };
  }
  game.robot.x = next.x;
  game.robot.y = next.y;
  return { ok: true, message: `Moved to ${next.x},${next.y}.` };
}

function turn(game, delta) {
  const current = DIRECTIONS.indexOf(game.robot.dir);
  game.robot.dir = DIRECTIONS[(current + delta + DIRECTIONS.length) % DIRECTIONS.length];
  return { ok: true, message: `Facing ${game.robot.dir}.` };
}

function pickUp(game) {
  const locations = [{ x: game.robot.x, y: game.robot.y }, aheadOf(game)];
  for (const location of locations) {
    const deposit = findDeposit(game, location);
    if (!deposit) {
      continue;
    }
    game.deposits = game.deposits.filter((item) => item.id !== deposit.id);
    game.resources[deposit.type] += 1;
    game.robot.cargo.push(deposit.type);
    return { ok: true, message: `Collected ${deposit.type}.` };
  }
  return { ok: false, message: "Nothing in reach." };
}

function findDeposit(game, location, type = "") {
  return game.deposits.find((deposit) => {
    const typeMatches = type ? deposit.type === type : true;
    return typeMatches && deposit.x === location.x && deposit.y === location.y;
  });
}

function compare(changes, path, before, after) {
  if (JSON.stringify(before) === JSON.stringify(after)) {
    return;
  }
  changes.push({ path, before: before ?? null, after: after ?? null });
}
