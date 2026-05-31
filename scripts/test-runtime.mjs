import assert from "node:assert/strict";
import { compileTapeScript, createVm, executeUntilPhysical } from "../packages/tapescript-runtime/index.js";
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
} from "../packages/game-sim/index.js";

testCompiler();
testVmExecution();
testGameSimulation();

console.log("Runtime tests passed.");

function testCompiler() {
  const program = compileTapeScript(`
// comments do not consume tape
@Loop
CheckScrap
JumpIfTrue @Grab
MoveForward
Jump @Loop
@Grab
PickUp
`, { tapeCapacity: 7 });

  assert.equal(program.ok, true);
  assert.equal(program.tapeUsed, 7);
  assert.equal(program.labels.Loop, 0);
  assert.equal(program.labels.Grab, 5);
  assert.equal(program.instructions[2].target, 5);
  assert.equal(program.instructions[4].target, 0);

  const overCapacity = compileTapeScript("MoveForward\nTurnLeft", { tapeCapacity: 1 });
  assert.equal(overCapacity.ok, false);
  assert.match(overCapacity.errors[0].message, /Tape capacity exceeded/);

  const missingLabel = compileTapeScript("Jump @Missing", { tapeCapacity: 3 });
  assert.equal(missingLabel.ok, false);
  assert.match(missingLabel.errors[0].message, /Unknown label/);
}

function testVmExecution() {
  const program = compileTapeScript(`
@Loop
CheckScrap
JumpIfTrue @Grab
MoveForward
@Grab
PickUp
`, { tapeCapacity: 8 });
  const vm = createVm(program);
  const calls = [];
  const hardware = {
    query(op) {
      calls.push(op);
      return true;
    },
    action(op) {
      calls.push(op);
      return { ok: true, message: "picked" };
    },
  };

  const result = executeUntilPhysical(program, vm, hardware, { maxLogicSteps: 8 });
  assert.equal(result.status, "suspended");
  assert.deepEqual(calls, ["CheckScrap", "PickUp"]);
  assert.equal(vm.pc, 6);
  assert.equal(vm.state, "Suspended");

  const infinite = compileTapeScript("@Loop\nJump @Loop", { tapeCapacity: 2 });
  const infiniteVm = createVm(infinite);
  const overload = executeUntilPhysical(infinite, infiniteVm, hardware, { maxLogicSteps: 3 });
  assert.equal(overload.status, "fault");
  assert.match(infiniteVm.fault, /Logic Overload/);
}

function testGameSimulation() {
  const game = createGame();
  const source = `@Loop
PickUp
CheckScrap
JumpIfTrue @Loop
MoveForward
TurnRight
Jump @Loop`;

  let state = deployProgram(game, source);
  assert.equal(state.program.ok, true);
  assert.equal(state.resources.scrap, 0);

  const beforeStep = state;
  state = stepGame(game);
  assert.equal(state.resources.scrap, 1);
  assert.equal(state.deposits.some((deposit) => deposit.id === "scrap-a"), false);
  assert.equal(state.vm.state, "Suspended");
  const stepDiff = diffSnapshots(beforeStep, state);
  assert.equal(stepDiff.some((change) => change.path === "resources.scrap" && change.after === 1), true);
  assert.equal(stepDiff.some((change) => change.path === "deposits.count" && change.after === 2), true);

  state = stepGame(game);
  assert.equal(state.robot.x, 2);
  assert.equal(state.robot.y, 2);
  assert.equal(state.vm.state, "Suspended");

  state = upgradeTape(game);
  assert.equal(state.resources.scrap, 0);
  assert.equal(state.tapeCapacity, 10);

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
}
