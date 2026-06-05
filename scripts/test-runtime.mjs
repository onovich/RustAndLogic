import assert from "node:assert/strict";
import { compileTapeScript, createVm, describeInstruction, executeUntilPhysical } from "../packages/tapescript-runtime/index.js";
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
  expandLogicMemory,
} from "../packages/game-sim/index.js";

testCompiler();
testVmExecution();
testGameSimulation();

console.log("Runtime tests passed.");

function testCompiler() {
  const program = compileTapeScript(`
// comments do not consume instruction slots
@Loop
Check().Has(Scrap)
IfTrue Goto @Grab
Move()
Goto @Loop
@Grab
PickUp()
`, { instructionCapacity: 7 });

  assert.equal(program.ok, true);
  assert.equal(program.instructionUsed, 7);
  assert.equal(program.labels.Loop, 0);
  assert.equal(program.labels.Grab, 5);
  assert.equal(program.instructions[2].inner.target, 5);
  assert.equal(program.instructions[4].target, 0);

  const overCapacity = compileTapeScript("Move()\nTurn(Left)", { instructionCapacity: 1 });
  assert.equal(overCapacity.ok, false);
  assert.match(overCapacity.errors[0].message, /Instruction memory exceeded/);

  const moveBack = compileTapeScript("Move(Back)", { instructionCapacity: 1 });
  assert.equal(moveBack.ok, true);

  const energyQuery = compileTapeScript("Check(Energy).Below(40)", { instructionCapacity: 1 });
  assert.equal(energyQuery.ok, true);

  const hazardQuery = compileTapeScript("Check().Is(Hazard)", { instructionCapacity: 1 });
  assert.equal(hazardQuery.ok, true);

  const chipQuery = compileTapeScript("Check(Cargo).Has(Chip)", { instructionCapacity: 1 });
  assert.equal(chipQuery.ok, true);

  const stockQuery = compileTapeScript("Check(Scrap).Below(2)", { instructionCapacity: 1 });
  assert.equal(stockQuery.ok, true);

  const stockCostQuery = compileTapeScript("Check(Scrap).BelowCost(Craft)", { instructionCapacity: 1 });
  assert.equal(stockCostQuery.ok, true);

  const memoryQuery = compileTapeScript("Check(Memory).Above(2)", { instructionCapacity: 1 });
  assert.equal(memoryQuery.ok, true);

  const craftCall = compileTapeScript("Craft(Home)", { instructionCapacity: 1 });
  assert.equal(craftCall.ok, true);

  const missingLabel = compileTapeScript("Goto @Missing", { instructionCapacity: 3 });
  assert.equal(missingLabel.ok, false);
  assert.match(missingLabel.errors[0].message, /Unknown label/);

  const oldSyntax = compileTapeScript("MoveForward\nCheckScrap\nJumpIfTrue @Loop", { instructionCapacity: 8 });
  assert.equal(oldSyntax.ok, false);
  assert.equal(oldSyntax.errors.some((error) => error.message.includes("Unknown instruction: MoveForward")), true);
}

function testVmExecution() {
  const program = compileTapeScript(`
@Loop
Check().Has(Scrap)
IfTrue Goto @Grab
Move()
@Grab
PickUp()
`, { instructionCapacity: 8 });
  const vm = createVm(program);
  const calls = [];
  const hardware = {
    query(op) {
      calls.push(describeInstruction(op));
      return true;
    },
    action(op) {
      calls.push(describeInstruction(op));
      return { ok: true, message: "picked" };
    },
  };

  const result = executeUntilPhysical(program, vm, hardware, { maxLogicSteps: 8 });
  assert.equal(result.status, "suspended");
  assert.deepEqual(calls, ["Check().Has(Scrap)", "PickUp()"]);
  assert.equal(vm.pc, 6);
  assert.equal(vm.state, "Suspended");

  const infinite = compileTapeScript("@Loop\nGoto @Loop", { instructionCapacity: 2 });
  const infiniteVm = createVm(infinite);
  const overload = executeUntilPhysical(infinite, infiniteVm, hardware, { maxLogicSteps: 3 });
  assert.equal(overload.status, "fault");
  assert.match(infiniteVm.fault, /Logic Overload/);
}

function testGameSimulation() {
  const game = createGame();
  const source = `@Loop
PickUp()
Check().Has(Scrap)
IfTrue Goto @Loop
Move()
Turn(Right)
Goto @Loop`;

  let state = deployProgram(game, source);
  assert.equal(state.program.ok, true);
  assert.equal(state.resources.scrap, 0);

  const beforeStep = state;
  state = stepGame(game);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.robot.cargo.length, 1);
  assert.equal(state.deposits.some((deposit) => deposit.id === "scrap-a"), false);
  assert.equal(state.vm.state, "Suspended");
  const stepDiff = diffSnapshots(beforeStep, state);
  assert.equal(stepDiff.some((change) => change.path === "robot.cargo.count" && change.after === 1), true);
  assert.equal(stepDiff.some((change) => change.path === "deposits.count" && change.after === 2), true);

  state = stepGame(game);
  assert.equal(state.robot.x, 2);
  assert.equal(state.robot.y, 2);
  assert.equal(state.vm.state, "Suspended");

  game.resources.scrap = 1;
  state = expandLogicMemory(game);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.instructionCapacity, 14);

  state = runGame(game, 6);
  assert.equal(state.tick, 8);
  assert.equal(state.vm.state, "Suspended");

  state = previewArena(game);
  assert.equal(state.arena.result, "Victory");
  assert.equal(state.resources.cells, 1);

  state = fastForwardOffline(game, 24);
  assert.equal(state.offline.ticks, 24);
  assert.equal(state.offline.scrap, 6);
  assert.equal(state.resources.scrap, 6);
  assert.equal(state.tick, 32);
  assert.equal(diffSnapshots(beforeStep, state).some((change) => change.path === "offline.ticks"), true);

  state = upgradeHardware(game, "weapon");
  assert.equal(state.robot.weapon, 2);
  assert.equal(state.resources.cells, 0);

  state = upgradeHardware(game, "armor");
  assert.equal(state.robot.armor, 2);
  assert.equal(state.robot.hp, 12);
  assert.equal(state.resources.scrap, 4);

  const frozen = snapshot(game);
  frozen.resources.cells = 99;
  assert.equal(game.resources.cells, 0);

  const restored = restoreGame(serializeGame(game));
  assert.equal(restored.tick, game.tick);
  assert.equal(restored.robot.armor, 2);
  assert.equal(restored.robot.weapon, 2);
  assert.equal(restored.resources.scrap, 4);
  const resumed = stepGame(restored);
  assert.equal(resumed.tick, game.tick + 1);
  assert.equal(resumed.program.ok, true);

  const movementGame = createGame();
  state = deployProgram(movementGame, "Move(Back)");
  state = stepGame(movementGame);
  assert.equal(state.robot.x, 0);
  assert.equal(state.robot.y, 2);
  assert.equal(state.robot.dir, "E");

  const cargoGame = createGame();
  state = deployProgram(cargoGame, "PickUp()\nDrop()");
  state = stepGame(cargoGame);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.robot.cargo.length, 1);
  state = stepGame(cargoGame);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.robot.cargo.length, 0);
  assert.equal(state.deposits.some((deposit) => deposit.type === "scrap" && deposit.x === 2 && deposit.y === 2), true);

  const footPickupGame = createGame();
  footPickupGame.deposits = [{ id: "underfoot", type: "scrap", x: 1, y: 2 }];
  state = deployProgram(footPickupGame, "PickUp()");
  state = stepGame(footPickupGame);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.logs.includes("PickUp(): Nothing ahead to pick up."), true);

  const occupiedDropGame = createGame();
  occupiedDropGame.robot.cargo.push("scrap");
  occupiedDropGame.resources.scrap = 1;
  occupiedDropGame.deposits = [{ id: "front", type: "cell", x: 2, y: 2 }];
  state = deployProgram(occupiedDropGame, "Drop()");
  state = stepGame(occupiedDropGame);
  assert.equal(state.robot.cargo.length, 1);
  assert.equal(state.resources.scrap, 1);
  assert.equal(state.logs.includes("Drop(): Drop blocked by occupied cell."), true);

  const fireGame = createGame();
  fireGame.tick = 6;
  state = deployProgram(fireGame, "Fire()");
  state = stepGame(fireGame);
  assert.equal(state.logs.includes("Fire(): Weapon relay discharged."), true);

  const duelGame = createGame({
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 6, maxEnergy: 6, cargo: [] },
    enemies: [{ id: "bandit-front", name: "relay bandit", x: 2, y: 2, hp: 1, damage: 2, dropType: "chip" }],
    deposits: [],
  });
  state = deployProgram(duelGame, "Fire()");
  state = stepGame(duelGame);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.deposits.some((deposit) => deposit.type === "chip" && deposit.x === 2 && deposit.y === 2), true);
  assert.equal(state.logs.includes("Fire(): Neutralized relay bandit."), true);

  const missGame = createGame();
  state = deployProgram(missGame, "Fire()");
  state = stepGame(missGame);
  assert.equal(state.logs.includes("Fire(): No target lock."), true);

  const queryGame = createGame();
  queryGame.deposits = [{ id: "front-cell", type: "cell", x: 2, y: 2 }];
  state = deployProgram(queryGame, "Check().Has(Battery)");
  state = stepGame(queryGame);
  assert.equal(state.vm.cf, true);

  const enemySignalGame = createGame({
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 6, maxEnergy: 6, cargo: [] },
    enemies: [{ id: "bandit-a", name: "relay bandit", x: 2, y: 2, hp: 2, damage: 2 }],
    deposits: [],
  });
  state = deployProgram(enemySignalGame, "Check().Has(Enemy)");
  state = stepGame(enemySignalGame);
  assert.equal(state.vm.cf, true);

  const hazardQueryGame = createGame({
    instructionCapacity: 16,
    base: { x: 0, y: 2 },
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 7, maxEnergy: 7, cargo: [] },
    hazards: [{ id: "hot-a", x: 2, y: 2, damage: 3 }],
    deposits: [{ id: "chip-a", type: "chip", x: 3, y: 2 }],
    resources: { scrap: 1, cells: 0, chips: 0, memoryShards: 1 },
  });
  state = deployProgram(hazardQueryGame, "Check().Is(Hazard)\nIfTrue Move()");
  state = stepGame(hazardQueryGame);
  assert.equal(state.vm.cf, true);
  assert.equal(state.robot.x, 2);
  assert.equal(state.robot.y, 2);
  assert.equal(state.robot.hp, 7);
  assert.equal(state.hazards.length, 1);
  assert.equal(state.logs.some((line) => line.includes("Hull scored by radiation")), true);

  const hazardHaulGame = createGame({
    instructionCapacity: 16,
    base: { x: 0, y: 2 },
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 7, maxEnergy: 7, cargo: [] },
    hazards: [{ id: "hot-a", x: 2, y: 2, damage: 3 }],
    deposits: [{ id: "chip-a", type: "chip", x: 3, y: 2 }],
    resources: { scrap: 1, cells: 0, chips: 0, memoryShards: 1 },
  });
  state = deployProgram(hazardHaulGame, [
    "Check().Is(Hazard)",
    "IfFalse Goto @Advance",
    "Check(HP).Below(7)",
    "IfTrue Goto @Return",
    "@Advance",
    "Move()",
    "Check().Has(Chip)",
    "IfTrue PickUp()",
    "@Return",
    "MoveToward(Home)",
    "MoveToward(Home)",
    "Check(Here).Is(Home)",
    "IfTrue Unload(Home)",
    "IfTrue Repair()",
  ].join("\n"));
  state = runGame(hazardHaulGame, 6);
  assert.equal(state.resources.chips, 1);
  assert.equal(state.robot.cargo.length, 0);
  assert.equal(state.robot.hp, 6);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.logs.some((line) => line.includes("Transferred 1 cargo to base (chip x1)")), true);

  const hazardFaultGame = createGame({
    instructionCapacity: 16,
    base: { x: 0, y: 2 },
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 7, maxEnergy: 7, cargo: [] },
    hazards: [{ id: "hot-a", x: 2, y: 2, damage: 3 }],
    deposits: [{ id: "chip-a", type: "chip", x: 3, y: 2 }],
  });
  state = deployProgram(hazardFaultGame, [
    "@Loop",
    "Check(HP).Below(8)",
    "IfTrue Repair()",
    "Move()",
    "Goto @Loop",
  ].join("\n"));
  state = runGame(hazardFaultGame, 3);
  assert.equal(state.logs.includes("Repair(): Repair requires home base."), true);

  const energyQueryGame = createGame();
  energyQueryGame.robot.energy = 2;
  energyQueryGame.robot.maxEnergy = 6;
  state = deployProgram(energyQueryGame, "Check(Energy).Below(40)");
  state = stepGame(energyQueryGame);
  assert.equal(state.vm.cf, true);

  const stockQueryGame = createGame();
  stockQueryGame.resources.scrap = 1;
  state = deployProgram(stockQueryGame, "Check(Scrap).Below(2)");
  state = stepGame(stockQueryGame);
  assert.equal(state.vm.cf, true);

  const batteryStockGame = createGame();
  batteryStockGame.resources.cells = 1;
  state = deployProgram(batteryStockGame, "Check(Battery).Above(0)");
  state = stepGame(batteryStockGame);
  assert.equal(state.vm.cf, true);

  const craftCostGame = createGame();
  craftCostGame.resources.scrap = 1;
  state = deployProgram(craftCostGame, "Check(Scrap).BelowCost(Craft)");
  state = stepGame(craftCostGame);
  assert.equal(state.vm.cf, true);

  const memoryQueryGame = createGame();
  memoryQueryGame.resources.memoryShards = 3;
  state = deployProgram(memoryQueryGame, "Check(Memory).Above(2)");
  state = stepGame(memoryQueryGame);
  assert.equal(state.vm.cf, true);

  const wallGame = createGame();
  wallGame.robot.x = 0;
  wallGame.robot.dir = "W";
  state = deployProgram(wallGame, "Check().Is(Wall)");
  state = stepGame(wallGame);
  assert.equal(state.vm.cf, true);

  const emptyGame = createGame();
  emptyGame.deposits = [];
  state = deployProgram(emptyGame, "Check().IsEmpty()");
  state = stepGame(emptyGame);
  assert.equal(state.vm.cf, true);

  for (const query of ["Check(Cargo).Any()", "Check(Cargo).IsFull()", "Check(Cargo).Has(Scrap)", "Check(Cargo).Has(Battery)"]) {
    const cargoQueryGame = createGame();
    cargoQueryGame.robot.cargo = ["scrap", "cell", "scrap"];
    state = deployProgram(cargoQueryGame, query);
    state = stepGame(cargoQueryGame);
    assert.equal(state.vm.cf, true);
  }

  const homeGame = createGame();
  homeGame.robot.x = 0;
  homeGame.robot.y = 0;
  state = deployProgram(homeGame, "Check(Here).Is(Home)");
  state = stepGame(homeGame);
  assert.equal(state.vm.cf, true);

  const damageGame = createGame();
  damageGame.lastDamageTick = 0;
  state = deployProgram(damageGame, "Check(Damage).Above(0)");
  state = stepGame(damageGame);
  assert.equal(state.vm.cf, true);

  const turnAroundGame = createGame();
  state = deployProgram(turnAroundGame, "Turn(Around)");
  state = stepGame(turnAroundGame);
  assert.equal(state.robot.dir, "W");

  const homeMoveGame = createGame();
  homeMoveGame.deposits = [];
  homeMoveGame.robot.x = 1;
  homeMoveGame.robot.y = 0;
  homeMoveGame.robot.dir = "E";
  state = deployProgram(homeMoveGame, "MoveToward(Home)");
  state = stepGame(homeMoveGame);
  assert.equal(state.robot.x, 0);
  assert.equal(state.robot.y, 0);
  assert.equal(state.robot.dir, "W");

  const waitGame = createGame();
  state = deployProgram(waitGame, "Wait()");
  state = stepGame(waitGame);
  assert.equal(state.logs.includes("Wait(): Waited."), true);

  const repairGame = createGame();
  repairGame.robot.hp = 5;
  repairGame.resources.scrap = 1;
  repairGame.robot.x = 0;
  repairGame.robot.y = 0;
  state = deployProgram(repairGame, "Repair()");
  state = stepGame(repairGame);
  assert.equal(state.robot.hp, 7);
  assert.equal(state.resources.scrap, 0);

  const fieldRepairGame = createGame();
  fieldRepairGame.robot.hp = 5;
  fieldRepairGame.resources.scrap = 2;
  state = deployProgram(fieldRepairGame, "Repair()");
  state = stepGame(fieldRepairGame);
  assert.equal(state.robot.hp, 5);
  assert.equal(state.logs.includes("Repair(): Repair requires home base."), true);

  const unloadGame = createGame();
  unloadGame.robot.x = 0;
  unloadGame.robot.y = 0;
  unloadGame.robot.cargo = ["scrap", "cell"];
  state = deployProgram(unloadGame, "Unload(Home)");
  state = stepGame(unloadGame);
  assert.equal(state.robot.cargo.length, 0);
  assert.equal(state.resources.scrap, 1);
  assert.equal(state.resources.cells, 1);
  assert.equal(state.logs.some((line) => line.includes("Transferred 2 cargo to base")), true);

  const craftGame = createGame();
  craftGame.robot.x = 0;
  craftGame.robot.y = 0;
  craftGame.resources.scrap = 2;
  craftGame.resources.cells = 1;
  state = deployProgram(craftGame, "Craft(Home)");
  state = stepGame(craftGame);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.resources.cells, 0);
  assert.equal(state.resources.memoryShards, 2);
  assert.equal(state.logs.includes("Craft(Home): Fabricated 1 memory shard. Home relay restored battery."), true);

  const craftBlockedGame = createGame();
  craftBlockedGame.robot.x = 0;
  craftBlockedGame.robot.y = 0;
  craftBlockedGame.resources.scrap = 1;
  state = deployProgram(craftBlockedGame, "Craft(Home)");
  state = stepGame(craftBlockedGame);
  assert.equal(state.resources.memoryShards, 1);
  assert.equal(state.logs.includes("Craft(Home): Craft blocked: requires 2 scrap and 1 battery."), true);

  const facilityGame = createGame();
  facilityGame.robot.x = 0;
  facilityGame.robot.y = 0;
  facilityGame.resources.scrap = 2;
  facilityGame.resources.cells = 1;
  facilityGame.robot.hp = 6;
  state = snapshot(facilityGame);
  assert.equal(state.facilities.charger.status, "standby");
  assert.equal(state.facilities.repairBay.status, "ready");
  assert.equal(state.facilities.fabricator.status, "ready");
  assert.deepEqual(state.facilities.fabricator.recipe, { scrap: 2, cells: 1, memoryShards: 1 });

  const secondRecipeGame = createGame();
  secondRecipeGame.robot.x = 0;
  secondRecipeGame.robot.y = 0;
  secondRecipeGame.resources.scrap = 2;
  secondRecipeGame.resources.cells = 1;
  state = deployProgram(secondRecipeGame, "Craft(Home)");
  state = stepGame(secondRecipeGame);
  secondRecipeGame.resources.scrap = 3;
  secondRecipeGame.resources.cells = 1;
  const secondRecipeState = snapshot(secondRecipeGame);
  assert.deepEqual(secondRecipeState.facilities.fabricator.recipe, { scrap: 3, cells: 1, memoryShards: 1 });

  const stockBalancerGame = createGame({
    stageId: "m5",
    instructionCapacity: 41,
    width: 6,
    height: 5,
    base: { x: 0, y: 2 },
    robot: { x: 0, y: 2, dir: "W", hp: 8, armor: 1, weapon: 1, energy: 16, maxEnergy: 16, cargo: [] },
    resources: { scrap: 1, cells: 0, chips: 0, memoryShards: 1 },
    deposits: [
      { id: "scrap-b", type: "scrap", x: 1, y: 1 },
      { id: "scrap-c", type: "scrap", x: 2, y: 1 },
      { id: "scrap-d", type: "scrap", x: 3, y: 1 },
      { id: "scrap-e", type: "scrap", x: 4, y: 1 },
      { id: "cell-b", type: "cell", x: 1, y: 3 },
      { id: "cell-c", type: "cell", x: 2, y: 3 },
    ],
    obstacles: [],
  });
  state = deployProgram(stockBalancerGame, [
    "@Loop",
    "Check(Memory).Above(2)",
    "IfTrue Goto @Done",
    "Check(Cargo).Any()",
    "IfTrue Unload(Home)",
    "Check(Scrap).BelowCost(Craft)",
    "IfTrue Goto @ScrapRun",
    "Check(Battery).BelowCost(Craft)",
    "IfTrue Goto @BatteryRun",
    "Craft(Home)",
    "Goto @Loop",
    "@ScrapRun",
    "Turn(Around)",
    "Move()",
    "@ScrapSeek",
    "Turn(Left)",
    "Check().Has(Scrap)",
    "IfTrue PickUp()",
    "IfTrue Goto @Return",
    "Turn(Right)",
    "Move()",
    "Goto @ScrapSeek",
    "@BatteryRun",
    "Turn(Around)",
    "Move()",
    "@BatterySeek",
    "Turn(Right)",
    "Check().Has(Battery)",
    "IfTrue PickUp()",
    "IfTrue Goto @Return",
    "Turn(Left)",
    "Move()",
    "Goto @BatterySeek",
    "@Return",
    "Check(Here).Is(Home)",
    "IfFalse MoveToward(Home)",
    "IfFalse Goto @Return",
    "Goto @Loop",
    "@Done",
    "Wait()",
    "Goto @Done",
  ].join("\n"));
  state = runGame(stockBalancerGame, 80);
  assert.equal(state.resources.memoryShards, 3);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.resources.cells, 0);
  assert.equal(state.vm.state, "Suspended");

  const combatLoopGame = createGame({
    stageId: "m6",
    instructionCapacity: 24,
    width: 7,
    height: 5,
    base: { x: 0, y: 2 },
    robot: { x: 1, y: 2, dir: "E", hp: 10, armor: 1, weapon: 1, energy: 10, maxEnergy: 10, cargo: [] },
    resources: { scrap: 1, cells: 0, chips: 0, memoryShards: 1 },
    obstacles: [],
    hazards: [],
    enemies: [{ id: "bandit-a", name: "relay bandit", x: 4, y: 2, hp: 2, damage: 2, dropType: "chip" }],
    deposits: [],
  });
  state = deployProgram(combatLoopGame, [
    "@Loop",
    "Check(Cargo).Any()",
    "IfTrue Goto @Return",
    "Check().Has(Enemy)",
    "IfTrue Fire()",
    "IfTrue Goto @Loop",
    "Check().Has(Chip)",
    "IfTrue PickUp()",
    "IfTrue Goto @Loop",
    "Check(HP).Below(9)",
    "IfTrue Goto @Recover",
    "Move()",
    "Goto @Loop",
    "@Recover",
    "Check(Here).Is(Home)",
    "IfTrue Repair()",
    "IfFalse MoveToward(Home)",
    "Goto @Loop",
    "@Return",
    "MoveToward(Home)",
    "Check(Here).Is(Home)",
    "IfTrue Unload(Home)",
    "Goto @Loop",
  ].join("\n"));
  state = runGame(combatLoopGame, 10);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.resources.chips, 1);
  assert.equal(state.robot.hp, 10);
  assert.equal(state.robot.cargo.length, 0);

  const rechargeGame = createGame();
  rechargeGame.robot.x = 1;
  rechargeGame.robot.y = 0;
  rechargeGame.robot.dir = "W";
  rechargeGame.robot.energy = 1;
  state = deployProgram(rechargeGame, "Move()");
  state = stepGame(rechargeGame);
  assert.equal(state.robot.x, 0);
  assert.equal(state.robot.y, 0);
  assert.equal(state.robot.energy, state.robot.maxEnergy);
  assert.equal(state.logs.some((line) => line.includes("Home relay restored battery")), true);

  const depletedGame = createGame();
  depletedGame.robot.energy = 0;
  state = deployProgram(depletedGame, "Move()");
  state = stepGame(depletedGame);
  assert.equal(state.robot.x, 1);
  assert.equal(state.robot.y, 2);
  assert.equal(state.logs.includes("Move(): Battery depleted. Return home."), true);

  const stageGame = createGame({
    stageId: "m2",
    width: 8,
    height: 6,
    base: { x: 2, y: 1 },
    robot: { x: 4, y: 5, dir: "N", cargo: ["scrap"] },
    deposits: [{ id: "stage-cell", type: "cell", x: 6, y: 2 }],
    obstacles: [{ id: "stage-wall", x: 3, y: 3 }],
    resources: { scrap: 2, cells: 1, memoryShards: 3 },
  });
  assert.equal(stageGame.stageId, "m2");
  assert.equal(stageGame.width, 8);
  assert.equal(stageGame.height, 6);
  assert.deepEqual(stageGame.base, { x: 2, y: 1 });
  assert.equal(stageGame.robot.x, 4);
  assert.equal(stageGame.robot.dir, "N");
  assert.deepEqual(stageGame.robot.cargo, ["scrap"]);
  assert.equal(stageGame.resources.memoryShards, 3);
  assert.equal(stageGame.deposits[0].id, "stage-cell");
  assert.equal(stageGame.obstacles[0].id, "stage-wall");

  const stageRestored = restoreGame(serializeGame(stageGame), {
    stageId: "fallback",
    width: 4,
    height: 4,
    robot: { x: 0, y: 0, dir: "E" },
  });
  assert.equal(stageRestored.stageId, "m2");
  assert.equal(stageRestored.width, 8);
  assert.equal(stageRestored.robot.x, 4);
  assert.deepEqual(stageRestored.robot.cargo, ["scrap"]);
}
