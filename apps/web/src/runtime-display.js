export function buildRuntimeDisplayModel(state = {}) {
  const robot = state.robot ?? {};
  const resources = state.resources ?? {};
  return {
    instructionUsage: formatInstructionUsage(state.program, state.instructionCapacity),
    robotPosition: `R1 // ${robot.x},${robot.y} ${robot.dir}`,
    cargoCount: `${robot.cargo?.length ?? 0}/${state.cargoCapacity ?? 0}`,
    cargoManifestItems: summarizeCargoManifest(robot.cargo ?? []),
    batteryValue: `${robot.energy}/${robot.maxEnergy}`,
    armorPercent: calculateArmorPercent(robot),
    energyPercent: calculateEnergyPercent(robot),
    resources: {
      scrap: resources.scrap ?? 0,
      cells: resources.cells ?? 0,
      chips: resources.chips ?? 0,
      memoryShards: resources.memoryShards ?? 0,
    },
  };
}

export function formatInstructionUsage(program, capacity = 0) {
  return program ? `${program.instructionUsed}/${capacity}` : `0/${capacity}`;
}

export function summarizeCargoManifest(cargo = []) {
  return cargo.reduce((summary, item) => {
    const key = item === "cell" ? "battery" : item;
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
}

export function calculateArmorPercent(robot = {}) {
  const maxHp = 8 + (robot.armor ?? 0) * 2;
  return clampPercent(maxHp ? Math.round(((robot.hp ?? 0) / maxHp) * 100) : 0);
}

export function calculateEnergyPercent(robot = {}) {
  return robot.maxEnergy ? clampPercent(Math.round(((robot.energy ?? 0) / robot.maxEnergy) * 100)) : 0;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}
