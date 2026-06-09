const facilityEntries = [
  { key: "charger", labelKey: "facilities.charger" },
  { key: "repairBay", labelKey: "facilities.repairBay" },
  { key: "fabricator", labelKey: "facilities.fabricator" },
];

export function buildRuntimeDisplayModel(state = {}) {
  const robot = state.robot ?? {};
  const resources = state.resources ?? {};
  const armorPercent = calculateArmorPercent(robot);
  const energyPercent = calculateEnergyPercent(robot);
  return {
    tick: state.tick ?? 0,
    instructionUsage: formatInstructionUsage(state.program, state.instructionCapacity),
    vmStateKey: selectVmStateLabelKey(state.vm?.state),
    capacityLabelKey: "capacity",
    capacityLabelValues: { value: state.instructionCapacity ?? 0 },
    robotPosition: `R1 // ${robot.x},${robot.y} ${robot.dir}`,
    moduleStats: {
      armor: robot.armor ?? 0,
      weapon: robot.weapon ?? 0,
      hp: robot.hp ?? 0,
    },
    cargoCount: `${robot.cargo?.length ?? 0}/${state.cargoCapacity ?? 0}`,
    cargoManifestItems: summarizeCargoManifest(robot.cargo ?? []),
    batteryValue: `${robot.energy}/${robot.maxEnergy}`,
    armorPercent,
    armorPercentText: formatPercentText(armorPercent),
    armorMeterWidth: formatPercentText(armorPercent),
    energyPercent,
    energyPercentText: formatPercentText(energyPercent),
    energyMeterWidth: formatPercentText(energyPercent),
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

export function formatFacilityDescription(facilityItem = {}, translate = identityTranslate) {
  const status = translate(facilityItem.statusKey);
  if (!facilityItem.recipe) {
    return status;
  }
  const recipe = facilityItem.recipe;
  return (
    `${status} // ${recipe.scrap} ${translate("resources.item.scrap")} + ` +
    `${recipe.cells} ${translate("resources.item.battery")} -> ` +
    `${recipe.memoryShards} ${translate("resources.memoryShards")}`
  );
}

export function buildCargoManifestDisplayItems(manifestItems = {}) {
  const entries = manifestItems instanceof Map ? [...manifestItems.entries()] : Object.entries(manifestItems ?? {});
  return {
    empty: entries.length === 0,
    items: entries.map(([item, count]) => ({ item, count })),
  };
}

export function formatCargoManifestDisplay(manifestItems = {}, translate = identityTranslate) {
  const manifest = buildCargoManifestDisplayItems(manifestItems);
  if (manifest.empty) {
    return translate("resources.cargoEmpty");
  }
  return manifest.items
    .map(({ item, count }) => `${translate(`resources.item.${item}`)} x${count}`)
    .join(", ");
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
    emptyKey: "diff.empty",
    items: changes.slice(0, limit).map((change) => ({
      path: change.path,
      before: formatRuntimeValue(change.before),
      after: formatRuntimeValue(change.after),
      text: formatRuntimeDiffItem(change),
    })),
  };
}

export function formatInstructionUsage(program, capacity = 0) {
  return program ? `${program.instructionUsed}/${capacity}` : `0/${capacity}`;
}

export function selectVmStateLabelKey(state) {
  return state ? `vm.${state}` : "state.idle";
}

export function formatPercentText(value) {
  return `${value}%`;
}

export function formatRuntimeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

export function formatRuntimeDiffItem(change = {}) {
  return `${change.path}: ${formatRuntimeValue(change.before)} -> ${formatRuntimeValue(change.after)}`;
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

function identityTranslate(key) {
  return key;
}
