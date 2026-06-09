const runtimeToastKeys = {
  boundary: ["runtime.blockedBoundary", "runtime.recodeBoundary"],
  wall: ["runtime.blockedWall", "runtime.recodeWall"],
  occupied: ["runtime.blockedOccupied", "runtime.recodeOccupied"],
  empty: ["runtime.blockedEmpty", "runtime.recodeEmpty"],
  power: ["runtime.blockedPower", "runtime.recodePower"],
  hazard: ["runtime.hazardFault", "runtime.recodeHazard"],
  combat: ["runtime.combatFault", "runtime.recodeCombat"],
  logic: ["runtime.logicFault", "runtime.recodeLogic"],
  compile: ["runtime.compileFault", "runtime.recodeCompile"],
  generic: ["runtime.haltGeneric", "runtime.recodeGeneric"],
};

export function buildRuntimeToastModel(state, stage) {
  const cause = detectRuntimeCause(state);
  const [titleKey, bodyKey] = runtimeToastKeys[cause] ?? runtimeToastKeys.generic;
  return {
    cause,
    titleKey,
    bodyKey,
    stageHintKey: stage?.runtimeHintKey ?? "",
  };
}

export function detectRuntimeCause(state = {}) {
  const logs = Array.isArray(state.logs) ? state.logs : [];
  const recentLogText = logs.slice(0, 10).join(" | ");
  if (!state.program?.ok || recentLogText.includes("No script deployed") || recentLogText.includes("Deploy failed")) {
    return "compile";
  }
  if (recentLogText.includes("Blocked by boundary") || recentLogText.includes("Drop blocked by boundary")) {
    return "boundary";
  }
  if (recentLogText.includes("Blocked by wall")) {
    return "wall";
  }
  if (recentLogText.includes("Battery depleted")) {
    return "power";
  }
  if (recentLogText.includes("occupied") || recentLogText.includes("Drop blocked")) {
    return "occupied";
  }
  if (
    recentLogText.includes("Nothing ahead") ||
    recentLogText.includes("No target lock") ||
    recentLogText.includes("No cargo to drop") ||
    recentLogText.includes("No cargo to unload") ||
    recentLogText.includes("Unload requires")
  ) {
    return "empty";
  }
  if (recentLogText.includes("Enemy strike") || recentLogText.includes("hostile contact destroyed")) {
    return "combat";
  }
  if (
    (state.hazards?.length ?? 0) > 0 &&
    (recentLogText.includes("Repair requires home base") || recentLogText.includes("Hazard breach"))
  ) {
    return "hazard";
  }
  if (
    state.vm?.state === "Fault" ||
    state.vm?.state === "Halted" ||
    recentLogText.includes("Logic Overload") ||
    recentLogText.includes("Program counter") ||
    recentLogText.includes("Cargo hold is full") ||
    recentLogText.includes("Repair blocked") ||
    recentLogText.includes("Already at home") ||
    recentLogText.includes("Unknown action")
  ) {
    return "logic";
  }
  return "generic";
}

export function shouldAutoPause(before = {}, state = {}) {
  if (detectRuntimeCause(state) !== "generic") {
    return true;
  }
  return before.tick === state.tick && before.vm?.pc === state.vm?.pc;
}
