export function updateRuntimeFlow(flow = {}, beforeState, state = {}) {
  const nextFlow = { ...flow };
  if ("deploy" in nextFlow) {
    nextFlow.deploy = Boolean(state.program?.ok);
  }
  if ("collect" in nextFlow) {
    nextFlow.collect = nextFlow.collect || (state.robot?.cargo?.length ?? 0) > 0;
  }
  if ("unload" in nextFlow) {
    nextFlow.unload = nextFlow.unload || storedInventoryTotal(state.resources) > 0;
  }
  if ("craft" in nextFlow) {
    const currentShards = state.resources?.memoryShards ?? 0;
    const previousShards = beforeState?.resources?.memoryShards ?? 0;
    nextFlow.craft = nextFlow.craft || (beforeState ? currentShards > previousShards : currentShards > 1);
  }
  if ("stockBalance" in nextFlow) {
    nextFlow.stockBalance = nextFlow.stockBalance || (state.resources?.memoryShards ?? 0) >= 3;
  }
  if ("combat" in nextFlow && !nextFlow.combat && beforeState?.enemies) {
    nextFlow.combat = (state.enemies?.length ?? 0) < (beforeState.enemies?.length ?? 0);
  }
  if ("repair" in nextFlow) {
    nextFlow.repair = nextFlow.repair || Boolean(beforeState && (state.robot?.hp ?? 0) > (beforeState.robot?.hp ?? 0));
  }
  if ("chip" in nextFlow && !nextFlow.chip && beforeState?.resources) {
    nextFlow.chip = (state.resources?.chips ?? 0) > (beforeState.resources?.chips ?? 0);
  }
  if ("recharge" in nextFlow && !nextFlow.recharge && beforeState?.robot) {
    nextFlow.recharge =
      (state.robot?.energy ?? 0) === (state.robot?.maxEnergy ?? 0) &&
      (beforeState.robot?.energy ?? 0) < (beforeState.robot?.maxEnergy ?? 0) &&
      isRobotHome(state);
  }
  return nextFlow;
}

export function storedInventoryTotal(resources = {}) {
  return (resources.scrap ?? 0) + (resources.cells ?? 0) + (resources.chips ?? 0);
}

export function isRobotHome(state = {}) {
  return state.robot?.x === state.base?.x && state.robot?.y === state.base?.y;
}
