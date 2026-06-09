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

export function runtimeFlowProgress(flow = {}) {
  const values = Object.values(flow);
  return {
    completed: values.filter(Boolean).length,
    total: values.length,
  };
}

export function formatRuntimeFlowProgress(flow = {}) {
  const progress = runtimeFlowProgress(flow);
  return `${progress.completed}/${progress.total}`;
}

export function selectRuntimeFlowSummary(completionTasks = [], flow = {}) {
  if (completionTasks.length === 0) {
    return { state: "none", task: null };
  }
  const firstPending = completionTasks.find((task) => !flow[task.id]);
  if (firstPending) {
    return { state: "pending", task: firstPending };
  }
  return {
    state: "complete",
    task: completionTasks[completionTasks.length - 1] ?? null,
  };
}

export function buildRuntimeFlowListItems(tasks = [], flow = {}) {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const checklistState = new Map(buildRuntimeFlowChecklistState(taskList.map((task) => task.id), flow).map((item) => [item.id, item]));
  return taskList.map((task) => {
    const state = checklistState.get(task.id);
    return {
      id: task.id,
      labelKey: task.labelKey,
      done: Boolean(state?.done),
      active: Boolean(state?.active),
    };
  });
}

export function buildRuntimeFlowSummaryModel(completionTasks = [], flow = {}) {
  const summary = selectRuntimeFlowSummary(completionTasks, flow);
  if (summary.state === "none") {
    return {
      state: "none",
      textKey: "flow.summary.none",
      labelKey: "",
    };
  }
  return {
    state: summary.state,
    textKey: summary.state === "complete" ? "flow.summary.complete" : "flow.summary.pending",
    labelKey: summary.task?.labelKey ?? "",
  };
}

export function formatRuntimeFlowSummary(summary = {}, translate = identityTranslate) {
  if (summary.state === "none") {
    return translate(summary.textKey);
  }
  return translate(summary.textKey, { label: translate(summary.labelKey) });
}

export function buildRuntimeFlowChecklistState(flowIds = [], flow = {}) {
  let firstPendingAssigned = false;
  return flowIds.map((id) => {
    const done = Boolean(flow[id]);
    const active = !done && !firstPendingAssigned;
    if (active) {
      firstPendingAssigned = true;
    }
    return {
      id,
      done,
      active,
    };
  });
}

export function storedInventoryTotal(resources = {}) {
  return (resources.scrap ?? 0) + (resources.cells ?? 0) + (resources.chips ?? 0);
}

export function isRobotHome(state = {}) {
  return state.robot?.x === state.base?.x && state.robot?.y === state.base?.y;
}

function identityTranslate(key) {
  return key;
}
