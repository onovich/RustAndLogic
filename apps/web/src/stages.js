export function getStageDefinition(stageDefinitions, stageId) {
  const stages = Array.isArray(stageDefinitions) ? stageDefinitions : [];
  return stages.find((stage) => stage.id === stageId) ?? stages[0] ?? null;
}

export function getStageTaskDefinitions(stage, taskDefinitions) {
  const tasks = Array.isArray(taskDefinitions) ? taskDefinitions : [];
  const taskIds = stage?.taskIds ?? [];
  return taskIds.map((taskId) => tasks.find((task) => task.id === taskId)).filter(Boolean);
}

export function buildStageFlow(stage, taskDefinitions) {
  return Object.fromEntries(getStageTaskDefinitions(stage, taskDefinitions).map((task) => [task.id, false]));
}

export function getStageUi(stage) {
  return stage?.ui ?? {};
}

export function getStageRecommendedSpeed(stage, speeds) {
  const speedList = Array.isArray(speeds) ? speeds : [];
  const recommended = Number(getStageUi(stage).recommendedSpeed);
  return speedList.includes(recommended) ? recommended : speedList[0];
}

export function getStageSpeedIndex(stage, speeds) {
  const speedList = Array.isArray(speeds) ? speeds : [];
  const recommended = getStageRecommendedSpeed(stage, speedList);
  const nextIndex = speedList.indexOf(recommended);
  return nextIndex >= 0 ? nextIndex : 0;
}

export function isStageUpgradeEnabled(module, stage) {
  const enabled = getStageUi(stage).enabledUpgrades ?? [];
  if (module === "memory") {
    return enabled.includes("memory");
  }
  return enabled.includes(module);
}

export function getStageVisibleFacilities(stage) {
  const visible = getStageUi(stage).visibleFacilities;
  return Array.isArray(visible) && visible.length > 0
    ? new Set(visible)
    : new Set(["charger", "repairBay", "fabricator"]);
}

export function getStageCompletionTasks(stage, taskDefinitions) {
  const tasks = Array.isArray(taskDefinitions) ? taskDefinitions : [];
  const completionIds = stage?.completionTaskIds ?? [];
  return completionIds.map((taskId) => tasks.find((task) => task.id === taskId)).filter(Boolean);
}

export function getStageSamplePresets(stage, scriptPresets) {
  const presets = Array.isArray(scriptPresets) ? scriptPresets : [];
  const sampleIds = getStageUi(stage).samplePresetIds;
  if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
    return presets;
  }
  return sampleIds.map((presetId) => presets.find((preset) => preset.id === presetId)).filter(Boolean);
}

export function getStageRecommendedPreset(stage, scriptPresets) {
  const presets = Array.isArray(scriptPresets) ? scriptPresets : [];
  const recommendedId = getStageUi(stage).recommendedPresetId ?? stage?.presetId;
  return presets.find((preset) => preset.id === recommendedId) ?? null;
}

export function buildStageActionItems(stageDefinitions = [], currentStageId = "", playbackMode = "stopped") {
  const disabled = playbackMode !== "stopped";
  return (Array.isArray(stageDefinitions) ? stageDefinitions : []).map((stage) => ({
    id: stage.id,
    labelKey: stage.labelKey,
    active: stage.id === currentStageId,
    disabled,
  }));
}

export function buildStageSampleActionItems(stage, scriptPresets = [], currentPresetId = "", playbackMode = "stopped") {
  const disabled = playbackMode !== "stopped";
  return getStageSamplePresets(stage, scriptPresets).map((preset) => ({
    id: preset.id,
    labelKey: preset.labelKey,
    active: preset.id === currentPresetId,
    disabled,
  }));
}

export function getStageTeachingMoments(stage, kind) {
  return stage?.teachingMoments?.[kind] ?? [];
}

export function buildTeachingMomentKey(stageId, kind, momentId) {
  return `${stageId}:${kind}:${momentId}`;
}
