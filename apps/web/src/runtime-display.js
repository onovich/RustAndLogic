const facilityEntries = [
  { key: "charger", labelKey: "facilities.charger" },
  { key: "repairBay", labelKey: "facilities.repairBay" },
  { key: "fabricator", labelKey: "facilities.fabricator" },
];

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

export function buildFacilityDisplayItems(facilities = {}, visibleFacilities = new Set(), entries = facilityEntries) {
  return entries
    .filter((entry) => visibleFacilities.has(entry.key) && facilities?.[entry.key])
    .map((entry) => {
      const facility = facilities[entry.key];
      const recipe = entry.key === "fabricator" && facility.recipe
        ? {
            scrap: facility.recipe.scrap ?? 0,
            cells: facility.recipe.cells ?? 0,
            memoryShards: facility.recipe.memoryShards ?? 1,
          }
        : null;
      return {
        key: entry.key,
        labelKey: entry.labelKey,
        statusKey: `facilities.status.${facility.status}`,
        recipe,
      };
    });
}

export function buildCargoManifestDisplayItems(manifestItems = {}) {
  const entries = manifestItems instanceof Map ? [...manifestItems.entries()] : Object.entries(manifestItems ?? {});
  return {
    empty: entries.length === 0,
    items: entries.map(([item, count]) => ({ item, count })),
  };
}

export function buildRuntimeLogItems(logs = []) {
  return Array.isArray(logs) ? logs : [];
}

export function buildRuntimeDiffDisplay(diff = [], limit = 18) {
  const changes = Array.isArray(diff) ? diff : [];
  return {
    count: changes.length,
    countLabelKey: changes.length === 1 ? "diff.change" : "diff.changes",
    empty: changes.length === 0,
    items: changes.slice(0, limit).map((change) => ({
      path: change.path,
      before: formatRuntimeValue(change.before),
      after: formatRuntimeValue(change.after),
    })),
  };
}

export function formatInstructionUsage(program, capacity = 0) {
  return program ? `${program.instructionUsed}/${capacity}` : `0/${capacity}`;
}

export function formatRuntimeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
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
