import { compileTapeScript, createVm, executeUntilPhysical } from "../tapescript-runtime/index.js";

const DIRECTIONS = ["N", "E", "S", "W"];
const DELTAS = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};
const ACTION_ENERGY_COST = {
  Move: 1,
  MoveToward: 1,
  Turn: 1,
  PickUp: 1,
  Drop: 1,
  Unload: 1,
  Craft: 1,
  Fire: 2,
  Wait: 1,
  Repair: 1,
};

export function createGame() {
  return {
    width: 7,
    height: 5,
    tick: 0,
    instructionCapacity: 12,
    resources: { scrap: 0, cells: 0, memoryShards: 1 },
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 6, maxEnergy: 6, cargo: [] },
    cargoCapacity: 3,
    base: { x: 0, y: 0 },
    lastDamageTick: null,
    obstacles: [{ id: "wall-a", x: 3, y: 1 }],
    deposits: [
      { id: "scrap-a", type: "scrap", x: 2, y: 2 },
      { id: "cell-a", type: "cell", x: 4, y: 1 },
      { id: "scrap-b", type: "scrap", x: 5, y: 3 },
    ],
    program: null,
    vm: null,
    logs: ["System ready. Load a script and press play."],
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
    resources: {
      ...base.resources,
      ...parsed.resources,
      memoryShards: parsed.resources?.memoryShards ?? base.resources.memoryShards,
    },
    robot: { ...base.robot, ...parsed.robot },
    deposits: Array.isArray(parsed.deposits) ? parsed.deposits : base.deposits,
    obstacles: Array.isArray(parsed.obstacles) ? parsed.obstacles : base.obstacles,
    base: { ...base.base, ...parsed.base },
    logs: Array.isArray(parsed.logs) ? parsed.logs : base.logs,
  };
}

export function deployProgram(game, source) {
  const program = compileTapeScript(source, { instructionCapacity: game.instructionCapacity });
  game.program = program;
  game.vm = createVm(program);
  if (program.ok) {
    game.logs.unshift(`Compile OK: ${program.instructionUsed}/${program.instructionCapacity} instruction slots used.`);
  } else {
    game.logs.unshift(`Deploy failed: ${program.errors.map((error) => error.message).join(" ")}`);
  }
  return snapshot(game);
}

export function stepGame(game) {
  if (!game.program || !game.vm) {
    game.logs.unshift("No script deployed.");
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

export function expandLogicMemory(game) {
  if (game.resources.scrap < 1) {
    game.logs.unshift("Upgrade blocked: collect at least 1 scrap.");
    return snapshot(game);
  }
  spendResource(game, "scrap", 1);
  game.resources.memoryShards += 1;
  game.instructionCapacity += 2;
  game.logs.unshift(`Logic memory expanded. Capacity is now ${game.instructionCapacity}.`);
  return snapshot(game);
}

export function upgradeHardware(game, module) {
  if (module === "armor") {
    if (game.resources.scrap < 2) {
      game.logs.unshift("Armor upgrade blocked: requires 2 scrap.");
      return snapshot(game);
    }
    spendResource(game, "scrap", 2);
    game.robot.armor += 1;
    game.robot.hp += 2;
    game.logs.unshift(`Armor upgraded to ${game.robot.armor}.`);
    return snapshot(game);
  }

  if (module === "weapon") {
    if (game.resources.cells < 1) {
      game.logs.unshift("Weapon upgrade blocked: requires 1 battery.");
      return snapshot(game);
    }
    spendResource(game, "cells", 1);
    game.robot.weapon += 1;
    game.logs.unshift(`Weapon upgraded to ${game.robot.weapon}.`);
    return snapshot(game);
  }

  game.logs.unshift(`Unknown hardware module: ${module}.`);
  return snapshot(game);
}

export function previewArena(game) {
  const instructionScore = game.program?.ok ? game.program.instructionUsed : 0;
  const offense = game.robot.weapon * 3 + instructionScore;
  const defense = game.robot.armor * 2 + game.robot.hp;
  const enemy = 15;
  const victory = offense + defense >= enemy;
  game.arena = {
    enemy: "Relay Bandit",
    score: offense + defense,
    enemyScore: enemy,
    result: victory ? "Victory" : "Defeat",
    summary: victory
      ? "The robot survived the ladder ghost and recovered a battery."
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
    game.logs.unshift("Offline projection blocked: compile a valid script first.");
    game.offline = {
      ticks: 0,
      scrap: 0,
      cells: 0,
      summary: "No valid script was available for offline work.",
    };
    return snapshot(game);
  }

  const safeTicks = Math.max(1, Math.floor(ticks));
  const efficiency = Math.max(1, game.program.instructionUsed + game.robot.armor + game.robot.weapon);
  const scrap = Math.max(1, Math.floor((safeTicks * efficiency) / 32));
  const cells = Math.floor((safeTicks * game.robot.weapon) / 48);

  game.tick += safeTicks;
  game.resources.scrap += scrap;
  game.resources.cells += cells;
  game.offline = {
    ticks: safeTicks,
    scrap,
    cells,
    summary: `Fast-forwarded ${safeTicks} ticks and recovered ${scrap} scrap${cells > 0 ? ` plus ${cells} batteries` : ""}.`,
  };
  game.logs.unshift(`Offline projection: +${scrap} scrap, +${cells} batteries over ${safeTicks} ticks.`);
  return snapshot(game);
}

export function snapshot(game) {
  return JSON.parse(JSON.stringify({
    width: game.width,
    height: game.height,
    tick: game.tick,
    instructionCapacity: game.instructionCapacity,
    resources: game.resources,
    robot: game.robot,
    cargoCapacity: game.cargoCapacity,
    base: game.base,
    lastDamageTick: game.lastDamageTick,
    obstacles: game.obstacles,
    deposits: game.deposits,
    program: game.program
      ? {
          ok: game.program.ok,
          errors: game.program.errors,
          instructions: game.program.instructions,
          labels: game.program.labels,
          instructionUsed: game.program.instructionUsed,
          instructionCapacity: game.program.instructionCapacity,
        }
      : null,
    vm: game.vm,
    logs: game.logs,
    arena: game.arena,
    offline: game.offline,
    facilities: snapshotFacilities(game),
  }));
}

export function diffSnapshots(before, after) {
  const changes = [];
  compare(changes, "tick", before?.tick, after?.tick);
  compare(changes, "instructionCapacity", before?.instructionCapacity, after?.instructionCapacity);
  compare(changes, "resources.scrap", before?.resources?.scrap, after?.resources?.scrap);
  compare(changes, "resources.cells", before?.resources?.cells, after?.resources?.cells);
  compare(changes, "resources.memoryShards", before?.resources?.memoryShards, after?.resources?.memoryShards);
  compare(changes, "robot.cargo.count", before?.robot?.cargo?.length ?? 0, after?.robot?.cargo?.length ?? 0);
  compare(changes, "robot.x", before?.robot?.x, after?.robot?.x);
  compare(changes, "robot.y", before?.robot?.y, after?.robot?.y);
  compare(changes, "robot.dir", before?.robot?.dir, after?.robot?.dir);
  compare(changes, "robot.hp", before?.robot?.hp, after?.robot?.hp);
  compare(changes, "robot.armor", before?.robot?.armor, after?.robot?.armor);
  compare(changes, "robot.weapon", before?.robot?.weapon, after?.robot?.weapon);
  compare(changes, "robot.energy", before?.robot?.energy, after?.robot?.energy);
  compare(changes, "program.ok", before?.program?.ok, after?.program?.ok);
  compare(changes, "program.instructionUsed", before?.program?.instructionUsed, after?.program?.instructionUsed);
  compare(changes, "vm.pc", before?.vm?.pc, after?.vm?.pc);
  compare(changes, "vm.state", before?.vm?.state, after?.vm?.state);
  compare(changes, "arena.result", before?.arena?.result, after?.arena?.result);
  compare(changes, "offline.ticks", before?.offline?.ticks, after?.offline?.ticks);
  compare(changes, "deposits.count", before?.deposits?.length ?? 0, after?.deposits?.length ?? 0);
  compare(changes, "obstacles.count", before?.obstacles?.length ?? 0, after?.obstacles?.length ?? 0);
  compare(changes, "logs.latest", before?.logs?.[0] ?? "", after?.logs?.[0] ?? "");
  return changes;
}

function makeHardware(game) {
  return {
    query(instruction) {
      if (instruction.target === "Cargo") {
        if (instruction.predicate === "Any") {
          return game.robot.cargo.length > 0;
        }
        if (instruction.predicate === "IsFull") {
          return game.robot.cargo.length >= game.cargoCapacity;
        }
        if (instruction.predicate === "Has") {
          return game.robot.cargo.includes(itemType(instruction.value));
        }
      }
      if (instruction.target === "HP") {
        return compareNumber(game.robot.hp, instruction.predicate, instruction.value);
      }
      if (instruction.target === "Energy") {
        return compareNumber(energyPercent(game), instruction.predicate, instruction.value);
      }
      if (instruction.target === "Damage") {
        const damage = game.lastDamageTick === game.tick ? 1 : 0;
        return compareNumber(damage, instruction.predicate, instruction.value);
      }

      const location = targetLocation(game, instruction.target);
      if (instruction.predicate === "Has") {
        if (instruction.value === "Enemy") {
          return hasEnemySignal(game);
        }
        return Boolean(findDeposit(game, location, itemType(instruction.value)));
      }
      if (instruction.predicate === "Is") {
        if (instruction.value === "Wall") {
          return isBlocked(game, location, { includeDeposits: false });
        }
        if (instruction.value === "Home") {
          return isHome(game, location);
        }
      }
      if (instruction.predicate === "IsEmpty") {
        return isEmpty(game, location);
      }
      return false;
    },
    action(instruction) {
      if (instruction.op === "Move") {
        return performPoweredAction(game, instruction.op, () => move(game, instruction.arg === "Back" ? -1 : 1));
      }
      if (instruction.op === "MoveToward") {
        return performPoweredAction(game, instruction.op, () => moveTowardHome(game));
      }
      if (instruction.op === "Turn") {
        const delta = { Left: -1, Right: 1, Around: 2 }[instruction.arg];
        return performPoweredAction(game, instruction.op, () => turn(game, delta));
      }
      if (instruction.op === "PickUp") {
        return performPoweredAction(game, instruction.op, () => pickUp(game));
      }
      if (instruction.op === "Drop") {
        return performPoweredAction(game, instruction.op, () => dropCargo(game));
      }
      if (instruction.op === "Unload") {
        return performPoweredAction(game, instruction.op, () => unloadCargo(game));
      }
      if (instruction.op === "Craft") {
        return performPoweredAction(game, instruction.op, () => craftAtBase(game));
      }
      if (instruction.op === "Fire") {
        return performPoweredAction(game, instruction.op, () => fireWeapon(game));
      }
      if (instruction.op === "Wait") {
        return performPoweredAction(game, instruction.op, () => ({ ok: true, message: "Waited." }));
      }
      if (instruction.op === "Repair") {
        return performPoweredAction(game, instruction.op, () => repairRobot(game));
      }
      return { ok: false, message: `Unknown action ${instruction.op}.` };
    },
  };
}

function targetLocation(game, target) {
  if (target === "Here") {
    return { x: game.robot.x, y: game.robot.y };
  }
  if (target === "Home") {
    return { ...game.base };
  }
  return aheadOf(game);
}

function itemType(value) {
  return value === "Battery" ? "cell" : value.toLowerCase();
}

function compareNumber(actual, predicate, expected) {
  if (predicate === "Below") {
    return actual < expected;
  }
  if (predicate === "Above") {
    return actual > expected;
  }
  return false;
}

function aheadOf(game, distance = 1) {
  const delta = DELTAS[game.robot.dir];
  return { x: game.robot.x + delta.x * distance, y: game.robot.y + delta.y * distance };
}

function move(game, distance) {
  const next = aheadOf(game, distance);
  if (isBlocked(game, next)) {
    return { ok: false, message: blockMessage(game, next) };
  }
  game.robot.x = next.x;
  game.robot.y = next.y;
  return { ok: true, message: `Moved to ${next.x},${next.y}.` };
}

function moveTowardHome(game) {
  if (isHome(game, game.robot)) {
    return { ok: false, message: "Already at home." };
  }
  const dx = game.base.x - game.robot.x;
  const dy = game.base.y - game.robot.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const nextDir = horizontal
    ? (dx > 0 ? "E" : "W")
    : (dy > 0 ? "S" : "N");
  const previousDir = game.robot.dir;
  game.robot.dir = nextDir;
  const result = move(game, 1);
  if (!result.ok) {
    game.robot.dir = previousDir;
  }
  return result.ok ? { ok: true, message: `Moved toward home to ${game.robot.x},${game.robot.y}.` } : result;
}

function turn(game, delta) {
  const current = DIRECTIONS.indexOf(game.robot.dir);
  game.robot.dir = DIRECTIONS[(current + delta + DIRECTIONS.length) % DIRECTIONS.length];
  return { ok: true, message: `Facing ${game.robot.dir}.` };
}

function pickUp(game) {
  const target = aheadOf(game);
  const deposit = findDeposit(game, target);
  if (!deposit) {
    return { ok: false, message: "Nothing ahead to pick up." };
  }
  if (game.robot.cargo.length >= game.cargoCapacity) {
    return { ok: false, message: "Cargo hold is full." };
  }
  game.deposits = game.deposits.filter((item) => item.id !== deposit.id);
  game.robot.cargo.push(deposit.type);
  return { ok: true, message: `Loaded ${deposit.type} into cargo.` };
}

function dropCargo(game) {
  const cargo = game.robot.cargo.pop();
  if (!cargo) {
    return { ok: false, message: "No cargo to drop." };
  }
  const target = aheadOf(game);
  if (!isInside(game, target)) {
    game.robot.cargo.push(cargo);
    return { ok: false, message: "Drop blocked by boundary." };
  }
  if (!isEmpty(game, target)) {
    game.robot.cargo.push(cargo);
    return { ok: false, message: "Drop blocked by occupied cell." };
  }
  game.deposits.push({
    id: `dropped-${cargo}-${game.tick}-${game.deposits.length}`,
    type: cargo,
    x: target.x,
    y: target.y,
  });
  return { ok: true, message: `Dropped ${cargo}.` };
}

function unloadCargo(game) {
  if (!isHome(game, game.robot)) {
    return { ok: false, message: "Unload requires home base." };
  }
  if (game.robot.cargo.length === 0) {
    return { ok: false, message: "No cargo to unload." };
  }
  const delivered = countCargo(game.robot.cargo);
  const count = game.robot.cargo.length;
  for (const item of game.robot.cargo) {
    if (item === "cell") {
      game.resources.cells += 1;
    } else {
      game.resources[item] = (game.resources[item] ?? 0) + 1;
    }
  }
  game.robot.cargo = [];
  return { ok: true, message: `Transferred ${count} cargo to base (${formatCargoCounts(delivered)}).` };
}

function fireWeapon(game) {
  if (!hasEnemySignal(game)) {
    return { ok: false, message: "No target lock." };
  }
  return { ok: true, message: "Weapon relay discharged." };
}

function hasEnemySignal(game) {
  return game.tick % 7 === 6;
}

function repairRobot(game) {
  const maxHp = maxRobotHp(game);
  if (game.robot.hp >= maxHp) {
    return { ok: false, message: "Repair blocked: HP is already full." };
  }
  if (!isHome(game, game.robot)) {
    return { ok: false, message: "Repair requires home base." };
  }
  if (game.resources.scrap < 1) {
    return { ok: false, message: "Repair blocked: requires 1 scrap." };
  }
  spendResource(game, "scrap", 1);
  game.robot.hp = Math.min(maxHp, game.robot.hp + 2);
  game.lastDamageTick = null;
  return { ok: true, message: `Repaired to ${game.robot.hp} HP.` };
}

function maxRobotHp(game) {
  return 8 + game.robot.armor * 2;
}

function spendResource(game, type, amount) {
  game.resources[type] = Math.max(0, (game.resources[type] ?? 0) - amount);
}

function spendFieldResource(game, type, amount) {
  const cargoType = type === "cells" ? "cell" : type;
  let remaining = amount;
  game.robot.cargo = game.robot.cargo.filter((item) => {
    if (item === cargoType && remaining > 0) {
      remaining -= 1;
      return false;
    }
    return true;
  });
  if (remaining > 0) {
    game.resources[type] = Math.max(0, (game.resources[type] ?? 0) - remaining);
  }
}

function craftAtBase(game) {
  if (!isHome(game, game.robot)) {
    return { ok: false, message: "Craft requires home base." };
  }
  if (game.resources.scrap < 2 || game.resources.cells < 1) {
    return { ok: false, message: "Craft blocked: requires 2 scrap and 1 battery." };
  }
  spendResource(game, "scrap", 2);
  spendResource(game, "cells", 1);
  game.resources.memoryShards += 1;
  return { ok: true, message: "Fabricated 1 memory shard." };
}

function isHome(game, location) {
  return location.x === game.base.x && location.y === game.base.y;
}

function isInside(game, location) {
  return location.x >= 0 && location.y >= 0 && location.x < game.width && location.y < game.height;
}

function isBlocked(game, location, options = {}) {
  const includeDeposits = options.includeDeposits ?? true;
  return (
    !isInside(game, location) ||
    game.obstacles.some((obstacle) => obstacle.x === location.x && obstacle.y === location.y) ||
    (includeDeposits && Boolean(findDeposit(game, location)))
  );
}

function isEmpty(game, location) {
  return isInside(game, location) &&
    !game.obstacles.some((obstacle) => obstacle.x === location.x && obstacle.y === location.y) &&
    !findDeposit(game, location) &&
    !(game.robot.x === location.x && game.robot.y === location.y);
}

function blockMessage(game, location) {
  if (!isInside(game, location)) {
    return "Blocked by boundary.";
  }
  if (game.obstacles.some((obstacle) => obstacle.x === location.x && obstacle.y === location.y)) {
    return "Blocked by wall.";
  }
  if (findDeposit(game, location)) {
    return "Blocked by occupied cell.";
  }
  return "Blocked.";
}

function findDeposit(game, location, type = "") {
  return game.deposits.find((deposit) => {
    const typeMatches = type ? deposit.type === type : true;
    return typeMatches && deposit.x === location.x && deposit.y === location.y;
  });
}

function performPoweredAction(game, op, run) {
  let relayMessage = "";
  if (isHome(game, game.robot) && game.robot.energy < game.robot.maxEnergy) {
    game.robot.energy = game.robot.maxEnergy;
    relayMessage = " Home relay restored battery.";
  }

  const cost = ACTION_ENERGY_COST[op] ?? 1;
  if (game.robot.energy < cost) {
    return { ok: false, message: "Battery depleted. Return home." };
  }

  const result = run();
  if (result.ok) {
    game.robot.energy = Math.max(0, game.robot.energy - cost);
    if (isHome(game, game.robot) && game.robot.energy < game.robot.maxEnergy) {
      game.robot.energy = game.robot.maxEnergy;
      relayMessage = " Home relay restored battery.";
    }
  }

  return relayMessage ? { ...result, message: `${result.message}${relayMessage}` } : result;
}

function energyPercent(game) {
  if (!game.robot.maxEnergy) {
    return 0;
  }
  return Math.round((game.robot.energy / game.robot.maxEnergy) * 100);
}

function countCargo(items) {
  return items.reduce((counts, item) => {
    const key = item === "cell" ? "battery" : item;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function formatCargoCounts(counts) {
  return Object.entries(counts)
    .map(([type, amount]) => `${type} x${amount}`)
    .join(", ");
}

function countCargoType(items, type) {
  return items.filter((item) => item === type).length;
}

function snapshotFacilities(game) {
  const home = isHome(game, game.robot);
  return {
    charger: {
      id: "charger",
      online: true,
      ready: home && game.robot.energy < game.robot.maxEnergy,
      status: home ? (game.robot.energy < game.robot.maxEnergy ? "charging" : "standby") : "remote",
    },
    repairBay: {
      id: "repair-bay",
      online: true,
      ready: home && game.robot.hp < maxRobotHp(game) && game.resources.scrap > 0,
      status: home
        ? (game.robot.hp < maxRobotHp(game) ? (game.resources.scrap > 0 ? "ready" : "missing") : "standby")
        : "remote",
    },
    fabricator: {
      id: "fabricator",
      online: true,
      ready: home && game.resources.scrap >= 2 && game.resources.cells >= 1,
      status: home ? (game.resources.scrap >= 2 && game.resources.cells >= 1 ? "ready" : "missing") : "remote",
      recipe: { scrap: 2, cells: 1, memoryShards: 1 },
    },
  };
}

function compare(changes, path, before, after) {
  if (JSON.stringify(before) === JSON.stringify(after)) {
    return;
  }
  changes.push({ path, before: before ?? null, after: after ?? null });
}
