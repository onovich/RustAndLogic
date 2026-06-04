import {
  createGame,
  deployProgram,
  diffSnapshots,
  serializeGame,
  snapshot,
  stepGame,
  restoreGame,
  upgradeHardware,
  expandLogicMemory,
} from "../../../packages/game-sim/index.js";
import { compileTapeScript } from "../../../packages/tapescript-runtime/index.js";

let game = createGame();
let previousState = null;
let saveStatus = { key: "save.empty", values: {} };
let playbackMode = "stopped";
let speedIndex = 0;
let playbackTimer = 0;
let robotNode = null;
let worldLayers = null;
let robotTweenFrame = 0;
let robotVisualTransform = "";
let activeSuggestions = [];
let activeSuggestionIndex = 0;
let deployedSource = "";
let currentPresetId = null;
let storyIndex = 0;
let storyActive = true;
let appData = null;
let storyPages = [];
let flow = {};
let runtimeToast = null;
let seenTeachingMoments = new Set();
let canvasModeTransitionTimer = 0;
let currentStageId = null;
const WORLD_CELL_SIZE = 40;
const ROBOT_WORLD_SIZE = 24;
const DEPOSIT_WORLD_SIZE = 22;
const BASE_WORLD_SIZE = 22;
const OBSTACLE_WORLD_SIZE = 36;
const canvasState = {
  x: 0,
  y: 0,
  scale: 1,
  targetScale: 1,
  minScale: 0.75,
  maxScale: 1.8,
  introPlayed: false,
  introActive: false,
  pointerId: null,
  dragStartX: 0,
  dragStartY: 0,
  originX: 0,
  originY: 0,
};

const saveKey = "rust-and-logic.save.v1";
const languageKey = "rust-and-logic.language";
let languageMode = detectLanguageMode();
let language = resolveLanguage(languageMode);
let speeds = [1];
let speedProfiles = { 1: { interval: 720, duration: 420 } };
let scriptActions = new Set();
let scriptQueries = new Set();
let scriptBranches = new Set();
let scriptValues = new Set();
let scriptCompletions = [];
let scriptPresets = [];
let taskDefinitions = [];
let stageDefinitions = [];

const elements = {
  editor: query("script-editor"),
  highlight: query("script-highlight"),
  lineNumbers: query("script-line-numbers"),
  diagnostics: query("script-diagnostics"),
  autocomplete: query("script-autocomplete"),
  deploy: query("deploy-button"),
  play: query("play-button"),
  step: query("step-button"),
  speed: query("speed-button"),
  reset: query("reset-button"),
  upgrade: query("upgrade-button"),
  armorUpgrade: query("armor-upgrade-button"),
  weaponUpgrade: query("weapon-upgrade-button"),
  save: query("save-button"),
  load: query("load-button"),
  grid: query("world-grid"),
  canvasViewport: query("world-canvas"),
  canvasWorld: query("world-canvas-world"),
  playfieldBarrier: document.querySelector(".playfield-barrier"),
  tick: query("tick"),
  instructionUsage: query("instruction-usage"),
  vmState: query("vm-state"),
  capacityLabel: query("capacity-label"),
  robotPosition: query("robot-position"),
  scrap: query("scrap-count"),
  cells: query("cell-count"),
  memoryShards: query("memory-shard-count"),
  cargoCount: query("cargo-count"),
  cargoManifest: query("cargo-manifest"),
  facilityList: query("facility-list"),
  armor: query("armor-level"),
  weapon: query("weapon-level"),
  hp: query("hp-value"),
  batteryValue: query("battery-value"),
  armorPercent: query("armor-percent"),
  energyPercent: query("energy-percent"),
  armorMeter: query("armor-meter"),
  energyMeter: query("energy-meter"),
  compileStatus: query("compile-status"),
  consoleLog: query("console-log"),
  diffCount: query("diff-count"),
  diffList: query("diff-list"),
  saveSummary: query("save-summary"),
  flowChecklist: query("flow-checklist"),
  flowProgress: query("flow-progress"),
  flowSummary: query("flow-summary"),
  locationKind: query("location-kind"),
  locationName: query("location-name"),
  locationDescription: query("location-description"),
  resourceGuidance: query("resource-guidance"),
  scriptGuidance: query("script-guidance"),
  languageSwitch: query("language-switch"),
  localizationButton: query("localization-button"),
  objectivesToggle: query("objectives-toggle"),
  rightSidebarToggle: query("right-sidebar-toggle"),
  settingsToggle: query("settings-toggle"),
  devlogToggle: query("devlog-toggle"),
  settingsPanel: document.querySelector(".settings-panel"),
  stageActions: query("stage-actions"),
  sampleActions: query("sample-actions"),
  devPanel: document.querySelector(".dev-panel"),
  stage: document.querySelector(".stage-panel"),
  storyDialogue: query("story-dialogue"),
  storySpeaker: query("story-speaker"),
  storyText: query("story-text"),
  storyPages: query("story-pages"),
  storyPrompt: query("story-prompt"),
  runtimeToast: query("runtime-toast"),
  runtimeToastTitle: query("runtime-toast-title"),
  runtimeToastBody: query("runtime-toast-body"),
  diagnosticCount: query("diagnostic-count"),
};

let i18n = { en: {}, zh: {} };

async function loadI18n() {
  i18n = parseI18nCsv(await loadTextAsset(["/apps/web/i18n.csv", "./i18n.csv"]));
}

async function loadAppData() {
  appData = JSON.parse(await loadTextAsset(["/apps/web/app-data.json", "./app-data.json"]));
}

async function loadTextAsset(paths) {
  const failures = [];
  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (response.ok) {
        return response.text();
      }
      failures.push(`${path}: ${response.status}`);
    } catch (error) {
      failures.push(`${path}: ${error.message}`);
    }
  }
  throw new Error(`Failed to load asset. Tried ${failures.join("; ")}`);
}

function getStageDefinition(stageId = currentStageId) {
  return stageDefinitions.find((stage) => stage.id === stageId) ?? stageDefinitions[0] ?? null;
}

function getStageTaskDefinitions(stage = getStageDefinition()) {
  const taskIds = stage?.taskIds ?? [];
  return taskIds
    .map((taskId) => taskDefinitions.find((task) => task.id === taskId))
    .filter(Boolean);
}

function createStageGame(stageId = currentStageId) {
  const stage = getStageDefinition(stageId);
  return createGame(stage?.game ?? {});
}

function getStageUi(stage = getStageDefinition()) {
  return stage?.ui ?? {};
}

function getStageRecommendedSpeed(stage = getStageDefinition()) {
  const recommended = Number(getStageUi(stage).recommendedSpeed);
  return speeds.includes(recommended) ? recommended : speeds[0];
}

function setStageRecommendedSpeed(stage = getStageDefinition()) {
  const recommended = getStageRecommendedSpeed(stage);
  const nextIndex = speeds.indexOf(recommended);
  speedIndex = nextIndex >= 0 ? nextIndex : 0;
}

function stageUpgradeEnabled(module, stage = getStageDefinition()) {
  const enabled = getStageUi(stage).enabledUpgrades ?? [];
  if (module === "memory") {
    return enabled.includes("memory");
  }
  return enabled.includes(module);
}

function stageVisibleFacilities(stage = getStageDefinition()) {
  const visible = getStageUi(stage).visibleFacilities;
  return Array.isArray(visible) && visible.length > 0
    ? new Set(visible)
    : new Set(["charger", "repairBay", "fabricator"]);
}

function getStageCompletionTasks(stage = getStageDefinition()) {
  const completionIds = stage?.completionTaskIds ?? [];
  return completionIds
    .map((taskId) => taskDefinitions.find((task) => task.id === taskId))
    .filter(Boolean);
}

function getStageSamplePresets(stage = getStageDefinition()) {
  const sampleIds = getStageUi(stage).samplePresetIds;
  if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
    return scriptPresets;
  }
  return sampleIds
    .map((presetId) => scriptPresets.find((preset) => preset.id === presetId))
    .filter(Boolean);
}

function getStageRecommendedPreset(stage = getStageDefinition()) {
  const recommendedId = getStageUi(stage).recommendedPresetId ?? stage?.presetId;
  return scriptPresets.find((preset) => preset.id === recommendedId) ?? null;
}

function getStageTeachingMoments(kind, stage = getStageDefinition()) {
  return stage?.teachingMoments?.[kind] ?? [];
}

function teachingMomentKey(stageId, kind, momentId) {
  return `${stageId}:${kind}:${momentId}`;
}

function resetCameraIntro() {
  canvasState.x = 0;
  canvasState.y = 0;
  canvasState.scale = 1;
  canvasState.targetScale = 1;
  canvasState.introPlayed = false;
  canvasState.introActive = false;
  canvasState.pointerId = null;
  if (elements.canvasViewport) {
    elements.canvasViewport.dataset.camera = "ready";
    elements.canvasViewport.dataset.dragging = "false";
  }
  if (elements.canvasWorld) {
    elements.canvasWorld.style.transition = "";
  }
}

function applyStageConfiguration(stageId, options = {}) {
  const stage = getStageDefinition(stageId);
  if (!stage) {
    return snapshot(game);
  }

  currentStageId = stage.id;
  storyPages = stage.storyPages ?? appData.storyPages ?? [];
  seenTeachingMoments = new Set();
  setStageRecommendedSpeed(stage);
  const nextFlow = Object.fromEntries(getStageTaskDefinitions(stage).map((task) => [task.id, false]));
  flow = nextFlow;
  game = createStageGame(stage.id);
  previousState = null;
  deployedSource = "";
  hideRuntimeToast();
  resetCameraIntro();
  if (options.resetStory) {
    storyIndex = 0;
    storyActive = true;
  }

  const preset = getStageRecommendedPreset(stage);
  currentPresetId = preset?.id ?? null;
  const sourceLines = preset?.lines ?? appData.script?.initialSource ?? [];
  elements.editor.value = sourceLines.join("\n");
  updateEditorTools();
  hideAutocomplete();
  renderStageCopy();
  renderScriptGuidance();
  renderFlowList();
  renderStageActions();
  renderSampleActions();
  if (options.resetSaveStatus !== false) {
    saveStatus = { key: "save.reset", values: {} };
  }
  const state = snapshot(game);
  if (options.renderNow !== false) {
    render(state, { animate: false });
  }
  return state;
}

function initializeAppData() {
  storyPages = appData.storyPages ?? [];
  speeds = appData.playback?.speeds ?? [1];
  speedProfiles = appData.playback?.profiles ?? { 1: { interval: 720, duration: 420 } };
  taskDefinitions = appData.taskDefinitions ?? appData.tasks ?? [];
  stageDefinitions = appData.stages ?? [];
  currentStageId = stageDefinitions[0]?.id ?? null;
  flow = {};
  scriptActions = new Set(appData.script?.syntax?.actions ?? []);
  scriptQueries = new Set(appData.script?.syntax?.queries ?? []);
  scriptBranches = new Set(appData.script?.syntax?.branches ?? []);
  scriptValues = new Set(appData.script?.syntax?.values ?? []);
  scriptCompletions = appData.script?.completions ?? [];
  scriptPresets = appData.scriptPresets ?? [];
  applyStageConfiguration(currentStageId, { renderNow: false, resetStory: false });
  renderStageActions();
  renderSampleActions();
}

function parseI18nCsv(source) {
  const rows = parseCsv(source.trim());
  const [header, ...entries] = rows;
  const keyIndex = header.indexOf("key");
  const enIndex = header.indexOf("en");
  const zhIndex = header.indexOf("zh");
  if (keyIndex < 0 || enIndex < 0 || zhIndex < 0) {
    throw new Error("i18n.csv must contain key,en,zh columns.");
  }
  const dictionary = { en: {}, zh: {} };
  for (const row of entries) {
    const key = row[keyIndex]?.trim();
    if (!key) {
      continue;
    }
    dictionary.en[key] = row[enIndex] ?? key;
    dictionary.zh[key] = row[zhIndex] ?? dictionary.en[key] ?? key;
  }
  return dictionary;
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = "";
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== '\r') {
      value += char;
    }
  }
  row.push(value);
  rows.push(row);
  return rows;
}

function setLanguageMode(mode) {
  languageMode = mode === "en" || mode === "zh" ? mode : "auto";
  language = resolveLanguage(languageMode);
  localStorage.setItem(languageKey, languageMode);
  applyLanguage();
  updateEditorTools();
  render(snapshot(game));
}

function nextLanguageMode(mode) {
  return mode === "auto" ? "en" : mode === "en" ? "zh" : "auto";
}

function resolveLanguage(mode) {
  if (mode === "en" || mode === "zh") {
    return mode;
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((item) => item?.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

function detectLanguageMode() {
  const saved = localStorage.getItem(languageKey);
  if (saved === "auto" || saved === "zh" || saved === "en") {
    return saved;
  }
  return "auto";
}

function updateSidebarToggles() {
  if (elements.objectivesToggle) {
    elements.objectivesToggle.textContent = document.body.dataset.objectivesCollapsed === "true" ? "▶" : "◀";
  }
  if (elements.rightSidebarToggle) {
    elements.rightSidebarToggle.textContent = document.body.dataset.rightCollapsed === "true" ? "◀" : "▶";
  }
}

function toggleDrawer(kind) {
  const isSettings = kind === "settings";
  if (elements.settingsPanel) {
    const next = isSettings && elements.settingsPanel.dataset.open !== "true";
    elements.settingsPanel.dataset.open = String(next);
  }
  if (elements.devPanel) {
    const next = !isSettings && elements.devPanel.dataset.open !== "true";
    elements.devPanel.dataset.open = String(next);
  }
  updateControls();
}

elements.languageSwitch?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-lang]");
  if (!button) {
    return;
  }
  setLanguageMode(button.dataset.lang ?? "auto");
});
elements.stageActions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stage]");
  if (!button) {
    return;
  }
  stopPlayback(false);
  applyStageConfiguration(button.dataset.stage, { resetStory: true });
});
elements.localizationButton?.addEventListener("click", () => {
  setLanguageMode(nextLanguageMode(languageMode));
});
elements.editor.addEventListener("input", () => {
  deployedSource = "";
  updateEditorTools();
  updateAutocomplete();
});
elements.editor.addEventListener("scroll", syncEditorScroll);
elements.editor.addEventListener("keyup", (event) => {
  if (!["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
    updateAutocomplete();
  }
});
elements.editor.addEventListener("keydown", handleAutocompleteKeydown);
elements.editor.addEventListener("click", (event) => {
  if (!event.ctrlKey && !event.metaKey) {
    updateAutocomplete();
    return;
  }
  const token = tokenAtOffset(elements.editor.value, elements.editor.selectionStart);
  if (!token?.startsWith("@")) {
    return;
  }
  event.preventDefault();
  jumpToLabel(token.slice(1));
  hideAutocomplete();
});
elements.autocomplete.addEventListener("mousedown", (event) => {
  event.preventDefault();
  const item = event.target.closest("[data-index]");
  if (!item) {
    return;
  }
  applySuggestion(Number(item.dataset.index));
});
document.addEventListener("mousedown", (event) => {
  if (!event.target.closest(".editor-stack")) {
    hideAutocomplete();
  }
});

if (elements.objectivesToggle) {
  elements.objectivesToggle.addEventListener("click", () => {
    document.body.dataset.objectivesCollapsed =
      document.body.dataset.objectivesCollapsed === "true" ? "false" : "true";
    updateSidebarToggles();
  });
}
if (elements.rightSidebarToggle) {
  elements.rightSidebarToggle.addEventListener("click", () => {
    document.body.dataset.rightCollapsed =
      document.body.dataset.rightCollapsed === "true" ? "false" : "true";
    updateSidebarToggles();
  });
}
elements.settingsToggle?.addEventListener("click", () => toggleDrawer("settings"));
elements.devlogToggle?.addEventListener("click", () => toggleDrawer("dev"));
if (elements.canvasViewport) {
  elements.canvasViewport.addEventListener("pointerdown", beginCanvasDrag);
  elements.canvasViewport.addEventListener("pointermove", dragCanvas);
  elements.canvasViewport.addEventListener("pointerup", endCanvasDrag);
  elements.canvasViewport.addEventListener("pointercancel", endCanvasDrag);
  elements.canvasViewport.addEventListener("wheel", zoomCanvas, { passive: false });
  window.addEventListener("resize", refreshCanvasCameraBounds);
}
if (elements.storyDialogue) {
  elements.storyDialogue.addEventListener("click", advanceStory);
}
if (elements.deploy) {
  elements.deploy.addEventListener("click", () => {
    stopPlayback(false);
    const state = deployCurrentTape();
    render(state, { animate: false });
  });
}
elements.play.addEventListener("click", () => startPlayback());
elements.step.addEventListener("click", () => advanceFrame({ manual: true }));
elements.speed.addEventListener("click", () => {
  speedIndex = (speedIndex + 1) % speeds.length;
  updateControls();
  if (playbackMode === "playing") {
    schedulePlayback();
  }
});
elements.upgrade.addEventListener("click", () => {
  stopPlayback(false);
  const state = expandLogicMemory(game);
  render(state, { animate: false });
});
elements.armorUpgrade.addEventListener("click", () => {
  stopPlayback(false);
  const state = upgradeHardware(game, "armor");
  render(state, { animate: false });
});
elements.weaponUpgrade.addEventListener("click", () => {
  stopPlayback(false);
  const state = upgradeHardware(game, "weapon");
  render(state, { animate: false });
});
elements.save.addEventListener("click", () => {
  stopPlayback(false);
  localStorage.setItem(saveKey, serializeGame(game));
  if ("save" in flow) {
    flow.save = true;
  }
  saveStatus = { key: "save.saved", values: { tick: game.tick } };
  render(snapshot(game), { animate: false });
});
elements.load.addEventListener("click", () => {
  stopPlayback(false);
  const serialized = localStorage.getItem(saveKey);
  if (!serialized) {
    saveStatus = { key: "save.missing", values: {} };
    render(snapshot(game), { animate: false });
    return;
  }
  const parsed = JSON.parse(serialized);
  const loadedStage = getStageDefinition(parsed.stageId);
  currentStageId = loadedStage?.id ?? currentStageId;
  storyPages = loadedStage?.storyPages ?? appData.storyPages ?? [];
  setStageRecommendedSpeed(loadedStage);
  flow = Object.fromEntries(getStageTaskDefinitions(loadedStage).map((task) => [task.id, false]));
  previousState = null;
  resetCameraIntro();
  renderFlowList();
  renderStageActions();
  if (loadedStage?.presetId) {
    const preset = scriptPresets.find((item) => item.id === loadedStage.presetId);
    if (preset) {
      elements.editor.value = (preset.lines ?? []).join("\n");
      deployedSource = "";
      updateEditorTools();
    }
  }
  game = restoreGame(parsed, loadedStage?.game ?? {});
  game.logs.unshift(t("log.save.loaded", { tick: game.tick }));
  if ("save" in flow) {
    flow.save = true;
  }
  saveStatus = { key: "save.loaded", values: { tick: game.tick } };
  render(snapshot(game), { animate: false });
});
elements.reset.addEventListener("click", () => {
  stopPlayback(false);
  applyStageConfiguration(currentStageId);
});

applyLanguage = function applyLanguagePatched() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of node.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":");
      if (attr && key) {
        node.setAttribute(attr, t(key));
      }
    }
  }
  for (const button of elements.languageSwitch?.querySelectorAll("[data-lang]") ?? []) {
    const active = button.dataset.lang === languageMode;
    button.setAttribute("aria-pressed", String(active));
    button.dataset.active = String(active);
  }
  renderStageCopy();
  renderScriptGuidance();
  renderFlowList();
  renderStageActions();
  renderSampleActions();
  updateControls();
};

updateControls = function updateControlsPatched() {
  elements.play.textContent =
    playbackMode === "playing" ? t("action.pause") : playbackMode === "paused" ? t("action.resume") : t("action.play");
  elements.step.textContent = t("action.frame");
  elements.reset.textContent = t("action.stop");
  elements.play.disabled = storyActive;
  if (!storyActive && playbackMode !== "stopped") {
    elements.play.disabled = false;
  }
  elements.step.disabled = storyActive;
  elements.speed.disabled = storyActive;
  elements.speed.textContent = `${speeds[speedIndex]}X`;
  elements.play.title = t("action.play");
  elements.step.title = t("action.frame");
  elements.reset.title = t("action.stop");
  elements.speed.title = t("action.speed", { speed: `${speeds[speedIndex]}X` });
  elements.play.dataset.active = String(playbackMode === "playing");
  elements.speed.dataset.active = String(playbackMode !== "stopped");
  if (elements.settingsToggle) {
    elements.settingsToggle.textContent = t("settings.title");
    elements.settingsToggle.dataset.active = String(elements.settingsPanel?.dataset.open === "true");
  }
  if (elements.devlogToggle) {
    const devOpen = elements.devPanel?.dataset.open === "true";
    elements.devlogToggle.textContent = t(devOpen ? "action.devLogOpen" : "action.devLogClosed");
    elements.devlogToggle.dataset.active = String(devOpen);
  }
  if (elements.localizationButton) {
    elements.localizationButton.textContent = t("action.localizationMode", {
      mode: t(`language.mode.${languageMode}`),
    });
  }
  if (elements.upgrade) {
    elements.upgrade.dataset.stageEnabled = String(stageUpgradeEnabled("memory"));
    elements.upgrade.disabled = storyActive || !stageUpgradeEnabled("memory");
  }
  if (elements.armorUpgrade) {
    elements.armorUpgrade.dataset.stageEnabled = String(stageUpgradeEnabled("armor"));
    elements.armorUpgrade.disabled = storyActive || !stageUpgradeEnabled("armor");
  }
  if (elements.weaponUpgrade) {
    elements.weaponUpgrade.dataset.stageEnabled = String(stageUpgradeEnabled("weapon"));
    elements.weaponUpgrade.disabled = storyActive || !stageUpgradeEnabled("weapon");
  }
};

await loadI18n();
await loadAppData();
initializeAppData();
applyLanguage();
updateSidebarToggles();
updateEditorTools();
applyCanvasTransform();
renderStoryDialogue();
render(snapshot(game), { animate: false });

function render(state, options = {}) {
  const beforeState = previousState;
  const flowBefore = { ...flow };
  const diff = beforeState ? diffSnapshots(beforeState, state) : [];
  previousState = state;
  syncFlowState(beforeState, state);

  elements.tick.textContent = state.tick;
  elements.instructionUsage.textContent = state.program
    ? `${state.program.instructionUsed}/${state.instructionCapacity}`
    : `0/${state.instructionCapacity}`;
  elements.vmState.textContent = translateVmState(state.vm?.state);
  elements.capacityLabel.textContent = t("capacity", { value: state.instructionCapacity });
  elements.robotPosition.textContent = `R1 // ${state.robot.x},${state.robot.y} ${state.robot.dir}`;
  elements.scrap.textContent = state.resources.scrap;
  elements.cells.textContent = state.resources.cells;
  elements.memoryShards.textContent = state.resources.memoryShards;
  elements.cargoCount.textContent = `${state.robot.cargo.length}/${state.cargoCapacity}`;
  elements.cargoManifest.textContent = formatCargoManifest(state.robot.cargo);
  renderFacilities(state.facilities);
  elements.armor.textContent = state.robot.armor;
  elements.weapon.textContent = state.robot.weapon;
  elements.hp.textContent = state.robot.hp;
  elements.batteryValue.textContent = `${state.robot.energy}/${state.robot.maxEnergy}`;
  const armorPercent = Math.max(0, Math.min(100, Math.round((state.robot.hp / (8 + state.robot.armor * 2)) * 100)));
  const energyPercent = state.robot.maxEnergy
    ? Math.max(0, Math.min(100, Math.round((state.robot.energy / state.robot.maxEnergy) * 100)))
    : 0;
  elements.armorPercent.textContent = `${armorPercent}%`;
  elements.energyPercent.textContent = `${energyPercent}%`;
  elements.armorMeter.style.width = `${armorPercent}%`;
  elements.energyMeter.style.width = `${energyPercent}%`;

  const compileStatusHost = elements.compileStatus.closest(".stage-mode");
  if (!state.program || state.program.ok) {
    elements.compileStatus.textContent = "";
    elements.compileStatus.className = "";
    compileStatusHost?.setAttribute("data-visible", "false");
  } else {
    elements.compileStatus.textContent = "";
    elements.compileStatus.className = "";
    compileStatusHost?.setAttribute("data-visible", "false");
  }

  elements.saveSummary.textContent = t(saveStatus.key, saveStatus.values);
  elements.flowProgress.textContent = `${Object.values(flow).filter(Boolean).length}/${Object.keys(flow).length}`;

  renderStageCopy();
  renderGrid(state, beforeState, options);
  renderLog(state.logs);
  renderDiff(diff);
  renderFlow();
  renderStoryDialogue();
  if (playbackMode !== "paused") {
    hideRuntimeToast();
  }
  updateControls();
  maybeShowSuccessTeachingMoment(flowBefore);
}

function startPlayback() {
  if (storyActive) {
    return;
  }
  if (playbackMode === "playing") {
    playbackMode = "paused";
    clearPlaybackTimer();
    updateControls();
    return;
  }
  if (playbackMode === "paused") {
    playbackMode = "playing";
    updateControls();
    schedulePlayback();
    return;
  }
  const deployed = ensureProgramDeployed();
  if (!deployed.program?.ok) {
    render(deployed, { animate: false });
    stopPlayback(false);
    return;
  }
  hideRuntimeToast();
  playbackMode = "playing";
  updateControls();
  schedulePlayback();
}

function advanceFrame(options = {}) {
  if (storyActive) {
    return snapshot(game);
  }
  hideRuntimeToast();
  if (options.manual) {
    clearPlaybackTimer();
    if (playbackMode === "playing") {
      playbackMode = "paused";
    }
  }
  const deployed = ensureProgramDeployed();
  if (!deployed.program?.ok) {
    render(deployed, { animate: false });
    return deployed;
  }
  const before = snapshot(game);
  const state = stepGame(game);
  render(state, {
    animate: true,
    animationDuration: currentSpeedProfile().duration,
  });
  if (!options.manual && shouldAutoPause(before, state)) {
    pauseForBlock(state);
  }
  return state;
}

function ensureProgramDeployed() {
  if (game.program?.ok && deployedSource === elements.editor.value) {
    return snapshot(game);
  }
  return deployCurrentTape();
}

function deployCurrentTape() {
  const state = deployProgram(game, elements.editor.value);
  deployedSource = elements.editor.value;
  flow.deploy = Boolean(state.program?.ok);
  updateEditorTools(state.program?.errors ?? []);
  return state;
}

function schedulePlayback() {
  clearPlaybackTimer();
  if (playbackMode !== "playing") {
    return;
  }
  const profile = currentSpeedProfile();
  playbackTimer = window.setTimeout(() => {
    advanceFrame();
    schedulePlayback();
  }, Math.max(profile.interval, profile.duration + 20));
}

function pauseForBlock(state) {
  playbackMode = "paused";
  clearPlaybackTimer();
  const message = t("log.autoPaused");
  if (state.logs[0] !== message) {
    game.logs.unshift(message);
    render(snapshot(game), { animate: false });
  }
  const teachingMoment = consumeFailureTeachingMoment(detectRuntimeCause(state));
  if (teachingMoment) {
    showToast(teachingMoment, "guide");
  } else {
    showRuntimeToast(state);
  }
  updateControls();
}

function showRuntimeToast(state) {
  if (!elements.runtimeToast || !elements.runtimeToastTitle || !elements.runtimeToastBody) {
    return;
  }
  showToast(summarizeRuntimeToast(state), "failure");
}

function hideRuntimeToast() {
  runtimeToast = null;
  if (elements.runtimeToast) {
    elements.runtimeToast.hidden = true;
    elements.runtimeToast.dataset.kind = "";
  }
}

function showToast(toast, kind = "failure") {
  if (!elements.runtimeToast || !elements.runtimeToastTitle || !elements.runtimeToastBody) {
    return;
  }
  runtimeToast = toast;
  elements.runtimeToast.dataset.kind = kind;
  elements.runtimeToastTitle.textContent = toast.title;
  elements.runtimeToastBody.textContent = toast.body;
  elements.runtimeToast.hidden = false;
}

function summarizeRuntimeToast(state) {
  const cause = detectRuntimeCause(state);
  const runtimeToastKeys = {
    boundary: ["runtime.blockedBoundary", "runtime.recodeBoundary"],
    wall: ["runtime.blockedWall", "runtime.recodeWall"],
    occupied: ["runtime.blockedOccupied", "runtime.recodeOccupied"],
    empty: ["runtime.blockedEmpty", "runtime.recodeEmpty"],
    power: ["runtime.blockedPower", "runtime.recodePower"],
    logic: ["runtime.logicFault", "runtime.recodeLogic"],
    compile: ["runtime.compileFault", "runtime.recodeCompile"],
    generic: ["runtime.haltGeneric", "runtime.recodeGeneric"],
  };
  const [titleKey, bodyKey] = runtimeToastKeys[cause] ?? runtimeToastKeys.generic;
  const stage = getStageDefinition();
  const stageHint = stage?.runtimeHintKey ? t(stage.runtimeHintKey) : "";
  return {
    title: t(titleKey),
    body: stageHint ? `${t(bodyKey)} // ${stageHint}` : t(bodyKey),
  };
}

function detectRuntimeCause(state) {
  const latestLog = state.logs[0] ?? "";
  if (!state.program?.ok || latestLog.includes("No script deployed") || latestLog.includes("Deploy failed")) {
    return "compile";
  }
  if (latestLog.includes("Blocked by boundary") || latestLog.includes("Drop blocked by boundary")) {
    return "boundary";
  }
  if (latestLog.includes("Blocked by wall")) {
    return "wall";
  }
  if (latestLog.includes("Battery depleted")) {
    return "power";
  }
  if (latestLog.includes("occupied") || latestLog.includes("Drop blocked")) {
    return "occupied";
  }
  if (
    latestLog.includes("Nothing ahead") ||
    latestLog.includes("No target lock") ||
    latestLog.includes("No cargo to drop") ||
    latestLog.includes("No cargo to unload") ||
    latestLog.includes("Unload requires")
  ) {
    return "empty";
  }
  if (
    state.vm?.state === "Fault" ||
    state.vm?.state === "Halted" ||
    latestLog.includes("Logic Overload") ||
    latestLog.includes("Program counter") ||
    latestLog.includes("Cargo hold is full") ||
    latestLog.includes("Repair blocked") ||
    latestLog.includes("Already at home") ||
    latestLog.includes("Unknown action")
  ) {
    return "logic";
  }
  return "generic";
}

function maybeShowSuccessTeachingMoment(flowBefore) {
  const stage = getStageDefinition();
  for (const moment of getStageTeachingMoments("success", stage)) {
    const momentKey = teachingMomentKey(stage.id, "success", moment.id);
    if (seenTeachingMoments.has(momentKey)) {
      continue;
    }
    if (!flowBefore[moment.taskId] && flow[moment.taskId]) {
      seenTeachingMoments.add(momentKey);
      showToast({ title: t(moment.titleKey), body: t(moment.bodyKey) }, "success");
      return;
    }
  }
}

function consumeFailureTeachingMoment(cause) {
  const stage = getStageDefinition();
  for (const moment of getStageTeachingMoments("failure", stage)) {
    const momentKey = teachingMomentKey(stage.id, "failure", moment.id);
    if (seenTeachingMoments.has(momentKey) || moment.cause !== cause) {
      continue;
    }
    seenTeachingMoments.add(momentKey);
    return { title: t(moment.titleKey), body: t(moment.bodyKey) };
  }
  return null;
}

function advanceStory() {
  if (!storyActive) {
    return;
  }
  storyIndex += 1;
  if (storyIndex >= storyPages.length) {
    animateCanvasModeShift();
    storyActive = false;
    if (elements.stage) {
      elements.stage.dataset.mode = "idle";
    }
    if (elements.storyDialogue) {
      elements.storyDialogue.hidden = true;
    }
    render(snapshot(game), { animate: false });
    return;
  }
  renderStoryDialogue();
}

function renderStoryDialogue() {
  if (
    !elements.storyDialogue ||
    !elements.storyText ||
    !elements.storySpeaker ||
    !elements.storyPages ||
    !elements.storyPrompt ||
    !elements.stage
  ) {
    return;
  }
  if (!storyActive) {
    elements.stage.dataset.mode = "idle";
    elements.storyDialogue.hidden = true;
    elements.storyPages.replaceChildren();
    applyCanvasTransform();
    return;
  }
  const page = storyPages[storyIndex];
  elements.stage.dataset.mode = "story";
  elements.storyDialogue.hidden = false;
  elements.storySpeaker.textContent = t(page.speakerKey);
  elements.storyText.textContent = t(page.textKey);
  renderStoryPageDots();
  elements.storyPrompt.textContent =
    storyIndex === storyPages.length - 1 ? t("story.prompt.begin") : t("story.prompt.continue");
  applyCanvasTransform();
}

function renderStoryPageDots() {
  elements.storyPages.replaceChildren();
  for (let index = 0; index < storyPages.length; index += 1) {
    const dot = document.createElement("span");
    dot.className = "story-page-dot";
    dot.dataset.active = String(index === storyIndex);
    elements.storyPages.append(dot);
  }
}

function shouldAutoPause(before, state) {
  if (detectRuntimeCause(state) !== "generic") {
    return true;
  }
  return before.tick === state.tick && before.vm?.pc === state.vm?.pc;
}

function stopPlayback(resetMode = true) {
  playbackMode = "stopped";
  clearPlaybackTimer();
  hideRuntimeToast();
  if (resetMode) {
    applyStageConfiguration(currentStageId);
  } else {
    updateControls();
  }
}

function clearPlaybackTimer() {
  if (playbackTimer) {
    window.clearTimeout(playbackTimer);
    playbackTimer = 0;
  }
}

function currentSpeedProfile() {
  return speedProfiles[speeds[speedIndex]];
}

function updateControls() {
  elements.play.textContent = "▶";
  elements.step.textContent = "⏭";
  elements.reset.textContent = "■";
  elements.pause.textContent = playbackMode === "paused" ? "▶" : "Ⅱ";
  elements.pause.disabled = playbackMode === "stopped" || storyActive;
  elements.play.disabled = playbackMode === "playing" || storyActive;
  elements.step.disabled = storyActive;
  elements.speed.disabled = storyActive;
  elements.speed.textContent = `x${speeds[speedIndex]}`;
  elements.play.title = t("action.play");
  elements.step.title = t("action.frame");
  elements.pause.title = playbackMode === "paused" ? t("action.resume") : t("action.pause");
  elements.reset.title = t("action.stop");
  elements.speed.title = t("action.speed", { speed: `x${speeds[speedIndex]}` });
  elements.play.dataset.active = String(playbackMode === "playing");
  elements.pause.dataset.active = String(playbackMode === "paused");
}

function resetFlow() {
  for (const key of Object.keys(flow)) {
    flow[key] = false;
  }
}

function renderFlowList() {
  elements.flowChecklist.replaceChildren();
  for (const task of getStageTaskDefinitions()) {
    const item = document.createElement("li");
    item.dataset.flow = task.id;
    const checkbox = document.createElement("span");
    checkbox.className = "task-checkbox";
    checkbox.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "task-copy";
    copy.dataset.i18n = task.labelKey;
    copy.textContent = t(task.labelKey);
    item.append(checkbox, copy);
    elements.flowChecklist.append(item);
  }
  renderFlowSummary();
  renderFlow();
}

function renderFlowSummary() {
  if (!elements.flowSummary) {
    return;
  }
  const completionTasks = getStageCompletionTasks();
  if (completionTasks.length === 0) {
    elements.flowSummary.textContent = t("flow.summary.none");
    return;
  }
  const firstPending = completionTasks.find((task) => !flow[task.id]);
  if (!firstPending) {
    const lastTask = completionTasks[completionTasks.length - 1];
    elements.flowSummary.textContent = t("flow.summary.complete", { label: t(lastTask.labelKey) });
    return;
  }
  elements.flowSummary.textContent = t("flow.summary.pending", { label: t(firstPending.labelKey) });
}

function renderStageCopy() {
  const stage = getStageDefinition();
  const location = stage?.location ?? {};
  if (elements.locationKind) {
    elements.locationKind.textContent = t(location.kindKey ?? "location.kind");
  }
  if (elements.locationName) {
    elements.locationName.textContent = t(location.nameKey ?? "world.title");
  }
  if (elements.locationDescription) {
    elements.locationDescription.textContent = t(location.descriptionKey ?? "location.description");
  }
  if (elements.resourceGuidance) {
    elements.resourceGuidance.textContent = stage?.resourceGuidanceKey ? t(stage.resourceGuidanceKey) : "";
  }
}

function renderScriptGuidance() {
  if (!elements.scriptGuidance) {
    return;
  }
  const stage = getStageDefinition();
  elements.scriptGuidance.textContent = stage?.scriptGuidanceKey ? t(stage.scriptGuidanceKey) : "";
}

function renderStageActions() {
  if (!elements.stageActions) {
    return;
  }
  elements.stageActions.replaceChildren();
  for (const stage of stageDefinitions) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.stage = stage.id;
    button.dataset.active = String(stage.id === currentStageId);
    button.textContent = t(stage.labelKey);
    elements.stageActions.append(button);
  }
}

function renderSampleActions() {
  if (!elements.sampleActions) {
    return;
  }
  elements.sampleActions.replaceChildren();
  for (const preset of getStageSamplePresets()) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = preset.id;
    button.dataset.active = String(preset.id === currentPresetId);
    button.textContent = t(preset.labelKey);
    button.addEventListener("click", () => loadScriptPreset(preset.id));
    elements.sampleActions.append(button);
  }
}

function loadScriptPreset(presetId) {
  const preset = scriptPresets.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }
  stopPlayback(false);
  elements.editor.value = (preset.lines ?? []).join("\n");
  currentPresetId = preset.id;
  deployedSource = "";
  updateEditorTools();
  renderSampleActions();
  hideAutocomplete();
}

function syncFlowState(beforeState, state) {
  if ("deploy" in flow) {
    flow.deploy = Boolean(state.program?.ok);
  }
  if ("collect" in flow) {
    flow.collect = flow.collect || state.robot.cargo.length > 0;
  }
  if ("unload" in flow) {
    flow.unload = flow.unload || storedInventoryTotal(state.resources) > 0;
  }
  if ("craft" in flow) {
    flow.craft = flow.craft || (beforeState ? state.resources.memoryShards > beforeState.resources.memoryShards : state.resources.memoryShards > 1);
  }
  if ("repair" in flow) {
    flow.repair = flow.repair || Boolean(beforeState && state.robot.hp > beforeState.robot.hp);
  }
  if ("recharge" in flow && !flow.recharge && beforeState?.robot) {
    const recharged =
      state.robot.energy === state.robot.maxEnergy &&
      beforeState.robot.energy < beforeState.robot.maxEnergy &&
      isRobotHome(state);
    flow.recharge = recharged;
  }
}

function updateEditorTools(errors = null) {
  currentPresetId = scriptPresets.find((preset) => (preset.lines ?? []).join("\n") === elements.editor.value)?.id ?? null;
  const program = errors ? null : compileTapeScript(elements.editor.value, { instructionCapacity: game.instructionCapacity });
  const activeErrors = errors ?? program.errors;
  renderScriptHighlight(activeErrors);
  renderDiagnostics(activeErrors);
  renderSampleActions();
  syncEditorScroll();
}

function renderScriptHighlight(errors) {
  const errorLines = new Set(errors.filter((error) => error.line > 0).map((error) => error.line));
  const lines = elements.editor.value.split("\n");
  elements.lineNumbers.textContent = lines.map((_, index) => String(index + 1).padStart(2, "0")).join("\n");
  elements.highlight.innerHTML = lines
    .map((line, index) => {
      const className = errorLines.has(index + 1) ? "code-line has-error" : "code-line";
      return `<span class="${className}">${highlightLine(line) || " "}</span>`;
    })
    .join("");
}

function renderDiagnostics(errors) {
  elements.diagnostics.replaceChildren();
  elements.editor.dataset.invalid = String(errors.length > 0);
  if (elements.diagnosticCount) {
    elements.diagnosticCount.textContent = t(
      errors.length === 1 ? "diagnostic.issueCount.one" : "diagnostic.issueCount.other",
      { count: errors.length },
    );
  }
  if (errors.length === 0) {
    return;
  }
  for (const error of errors) {
    const item = document.createElement("li");
    item.dataset.line = String(error.line);
    const severity = classifyDiagnosticSeverity(error.message);
    item.dataset.severity = severity;
    const location = error.line > 0 ? t("diagnostic.line", { line: error.line }) : t("diagnostic.general");
    const topline = document.createElement("div");
    topline.className = "diagnostic-topline";
    const severityNode = document.createElement("span");
    severityNode.className = "diagnostic-severity";
    severityNode.textContent = severity === "warning" ? t("diagnostic.severity.warning") : t("diagnostic.severity.error");
    const locationNode = document.createElement("span");
    locationNode.className = "diagnostic-location";
    locationNode.textContent = location;
    topline.append(severityNode, locationNode);
    const messageNode = document.createElement("span");
    messageNode.className = "diagnostic-message";
    messageNode.textContent = error.message;
    item.append(topline, messageNode);
    if (error.line > 0) {
      item.tabIndex = 0;
      item.addEventListener("click", () => jumpToLine(error.line));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          jumpToLine(error.line);
        }
      });
    }
    elements.diagnostics.append(item);
  }
}

function classifyDiagnosticSeverity(message) {
  return /unreachable|unused|redundant/i.test(message) ? "warning" : "error";
}

function highlightLine(line) {
  const commentStart = line.indexOf("//");
  const code = commentStart >= 0 ? line.slice(0, commentStart) : line;
  const comment = commentStart >= 0 ? line.slice(commentStart) : "";
  const pieces = [];
  const pattern = /(@[A-Za-z][A-Za-z0-9_]*|[A-Za-z][A-Za-z0-9_]*|\s+|.)/g;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    const token = match[0];
    if (/^\s+$/.test(token)) {
      pieces.push(escapeHtml(token));
    } else if (token.startsWith("@")) {
      pieces.push(`<span class="tok-label">${escapeHtml(token)}</span>`);
    } else if (scriptActions.has(token)) {
      pieces.push(`<span class="tok-action">${escapeHtml(token)}</span>`);
    } else if (scriptQueries.has(token)) {
      pieces.push(`<span class="tok-query">${escapeHtml(token)}</span>`);
    } else if (scriptBranches.has(token)) {
      pieces.push(`<span class="tok-branch">${escapeHtml(token)}</span>`);
    } else if (scriptValues.has(token)) {
      pieces.push(`<span class="tok-value">${escapeHtml(token)}</span>`);
    } else if (/^[A-Za-z]/.test(token)) {
      pieces.push(`<span class="tok-unknown">${escapeHtml(token)}</span>`);
    } else {
      pieces.push(escapeHtml(token));
    }
  }
  if (comment) {
    pieces.push(`<span class="tok-comment">${escapeHtml(comment)}</span>`);
  }
  return pieces.join("");
}

function syncEditorScroll() {
  elements.highlight.scrollTop = elements.editor.scrollTop;
  elements.highlight.scrollLeft = elements.editor.scrollLeft;
  elements.lineNumbers.scrollTop = elements.editor.scrollTop;
  updateAutocompletePosition();
}

function tokenAtOffset(text, offset) {
  const range = tokenRangeAtOffset(text, offset);
  const token = text.slice(range.start, range.end);
  return /^@[A-Za-z][A-Za-z0-9_]*$/.test(token) ? token : "";
}

function tokenRangeAtOffset(text, offset) {
  const before = text.slice(0, offset);
  const left = before.search(/[@A-Za-z0-9_]*$/);
  const start = left < 0 ? offset : left;
  const right = text.slice(offset).match(/^[@A-Za-z0-9_]*/)?.[0].length ?? 0;
  return {
    start,
    end: offset + right,
    token: text.slice(start, offset + right),
  };
}

function updateAutocomplete() {
  const context = getAutocompleteContext();
  if (!context) {
    hideAutocomplete();
    return;
  }

  activeSuggestions = findSuggestions(context);
  activeSuggestionIndex = 0;
  if (activeSuggestions.length === 0) {
    hideAutocomplete();
    return;
  }

  elements.autocomplete.replaceChildren();
  activeSuggestions.forEach((suggestion, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "autocomplete-item";
    item.dataset.index = String(index);
    item.dataset.active = String(index === activeSuggestionIndex);
    item.innerHTML =
      `<span>${escapeHtml(suggestion.value)}</span>` +
      `<small>${escapeHtml(t(suggestion.kindKey))} / ${escapeHtml(t(suggestion.hintKey))}</small>`;
    elements.autocomplete.append(item);
  });
  const footer = document.createElement("div");
  footer.className = "autocomplete-footer";
  footer.textContent = "[TAB] Accept   [ESC] Close";
  elements.autocomplete.append(footer);
  elements.autocomplete.hidden = false;
  updateAutocompletePosition(context);
}

function getAutocompleteContext() {
  const editor = elements.editor;
  if (editor.selectionStart !== editor.selectionEnd) {
    return null;
  }

  const range = tokenRangeAtOffset(editor.value, editor.selectionStart);
  const lineStart = editor.value.lastIndexOf("\n", range.start - 1) + 1;
  const lineEndIndex = editor.value.indexOf("\n", range.start);
  const lineEnd = lineEndIndex >= 0 ? lineEndIndex : editor.value.length;
  const line = editor.value.slice(lineStart, lineEnd);
  const beforeToken = editor.value.slice(lineStart, range.start);
  const token = range.token;
  const lineNumber = editor.value.slice(0, range.start).split("\n").length;
  const column = range.start - lineStart;

  if (line.trimStart().startsWith("//")) {
    return null;
  }

  const labelContext = token.startsWith("@") || /\bGoto\s+@?[A-Za-z0-9_]*$/.test(beforeToken.trimStart());
  if (!token && !labelContext) {
    return null;
  }

  return {
    range,
    prefix: token,
    line,
    lineNumber,
    column,
    mode: labelContext ? "label" : "instruction",
  };
}

function findSuggestions(context) {
  if (context.mode === "label") {
    const prefix = context.prefix.startsWith("@") ? context.prefix.slice(1) : context.prefix;
    return currentLabels()
      .filter((label) => matchesCompletion(label, prefix))
      .slice(0, 8)
      .map((label) => ({
        value: `@${label}`,
        kindKey: "completion.kind.label",
        hintKey: "completion.label.target",
      }));
  }

  return scriptCompletions
    .filter((item) => matchesCompletion(item.value, context.prefix))
    .slice(0, 8);
}

function matchesCompletion(value, prefix) {
  if (!prefix) {
    return true;
  }
  const normalizedValue = value.toLowerCase();
  const normalizedPrefix = prefix.toLowerCase().replace(/^@/, "");
  if (normalizedValue.startsWith(normalizedPrefix)) {
    return true;
  }
  return splitCompletionSegments(value).some((segment) =>
    segment.toLowerCase().startsWith(normalizedPrefix),
  );
}

function splitCompletionSegments(value) {
  return (value.match(/[A-Za-z][A-Za-z0-9_]*/g) ?? [])
    .flatMap((segment) => segment.split(/(?=[A-Z])|_/))
    .filter(Boolean);
}

function currentLabels() {
  return elements.editor.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^@[A-Za-z][A-Za-z0-9_]*$/.test(line))
    .map((line) => line.slice(1));
}

function handleAutocompleteKeydown(event) {
  if (elements.autocomplete.hidden) {
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveSuggestion(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveSuggestion(-1);
  } else if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault();
    applySuggestion(activeSuggestionIndex);
  } else if (event.key === "Escape") {
    event.preventDefault();
    hideAutocomplete();
  }
}

function moveSuggestion(delta) {
  activeSuggestionIndex = (activeSuggestionIndex + delta + activeSuggestions.length) % activeSuggestions.length;
  for (const item of elements.autocomplete.querySelectorAll("[data-index]")) {
    item.dataset.active = String(Number(item.dataset.index) === activeSuggestionIndex);
  }
}

function applySuggestion(index) {
  const suggestion = activeSuggestions[index];
  const context = getAutocompleteContext();
  if (!suggestion || !context) {
    return;
  }
  elements.editor.setRangeText(suggestion.value, context.range.start, context.range.end, "end");
  elements.editor.focus();
  hideAutocomplete();
  updateEditorTools();
}

function hideAutocomplete() {
  activeSuggestions = [];
  activeSuggestionIndex = 0;
  elements.autocomplete.hidden = true;
  elements.autocomplete.replaceChildren();
}

function updateAutocompletePosition(context = getAutocompleteContext()) {
  if (elements.autocomplete.hidden || !context) {
    return;
  }
  const style = getComputedStyle(elements.editor);
  const lineHeight = Number.parseFloat(style.lineHeight) || 20;
  const fontSize = Number.parseFloat(style.fontSize) || 14;
  const columnWidth = fontSize * 0.62;
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const left = paddingLeft + context.column * columnWidth - elements.editor.scrollLeft;
  const top = paddingTop + context.lineNumber * lineHeight - elements.editor.scrollTop + 4;
  elements.autocomplete.style.left = `${Math.max(8, Math.min(left, elements.editor.clientWidth - 196))}px`;
  elements.autocomplete.style.top = `${Math.max(8, top)}px`;
}

function jumpToLabel(label) {
  const lines = elements.editor.value.split("\n");
  const lineIndex = lines.findIndex((line) => line.trim() === `@${label}`);
  if (lineIndex >= 0) {
    jumpToLine(lineIndex + 1);
  }
}

function jumpToLine(lineNumber) {
  const lines = elements.editor.value.split("\n");
  const safeLine = Math.min(Math.max(lineNumber, 1), lines.length);
  const start = lines.slice(0, safeLine - 1).reduce((total, line) => total + line.length + 1, 0);
  const end = start + lines[safeLine - 1].length;
  elements.editor.focus();
  elements.editor.setSelectionRange(start, end);
  const lineHeight = Number.parseFloat(getComputedStyle(elements.editor).lineHeight) || 20;
  elements.editor.scrollTop = Math.max(0, (safeLine - 2) * lineHeight);
  syncEditorScroll();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function beginCanvasDrag(event) {
  if (!elements.canvasViewport || canvasState.introActive || event.button !== 0) {
    return;
  }
  canvasState.pointerId = event.pointerId;
  canvasState.dragStartX = event.clientX;
  canvasState.dragStartY = event.clientY;
  canvasState.originX = canvasState.x;
  canvasState.originY = canvasState.y;
  elements.canvasViewport.dataset.dragging = "true";
  elements.canvasViewport.setPointerCapture(event.pointerId);
}

function dragCanvas(event) {
  if (canvasState.pointerId !== event.pointerId) {
    return;
  }
  canvasState.x = canvasState.originX + event.clientX - canvasState.dragStartX;
  canvasState.y = canvasState.originY + event.clientY - canvasState.dragStartY;
  clampCanvasOffset();
  applyCanvasTransform();
}

function endCanvasDrag(event) {
  if (canvasState.pointerId !== event.pointerId) {
    return;
  }
  canvasState.pointerId = null;
  if (elements.canvasViewport) {
    elements.canvasViewport.dataset.dragging = "false";
    elements.canvasViewport.releasePointerCapture?.(event.pointerId);
  }
}

function zoomCanvas(event) {
  if (!elements.canvasViewport) {
    return;
  }
  event.preventDefault();
  if (canvasState.introActive) {
    return;
  }
  const rect = elements.canvasViewport.getBoundingClientRect();
  const beforeScale = canvasState.scale;
  const nextScale = clamp(beforeScale * (event.deltaY < 0 ? 1.12 : 0.88), canvasState.minScale, canvasState.maxScale);
  const anchorX = event.clientX - rect.left - rect.width / 2;
  const anchorY = event.clientY - rect.top - rect.height / 2;
  canvasState.x = anchorX - ((anchorX - canvasState.x) / beforeScale) * nextScale;
  canvasState.y = anchorY - ((anchorY - canvasState.y) / beforeScale) * nextScale;
  canvasState.scale = nextScale;
  clampCanvasOffset();
  applyCanvasTransform();
}

function applyCanvasTransform() {
  if (!elements.canvasWorld) {
    return;
  }
  const storyScale = storyActive ? 0.82 : 1;
  const storyOffsetY = storyActive ? 26 : 0;
  elements.canvasWorld.style.transform =
    `translate(calc(-50% + ${canvasState.x}px), calc(-50% + ${canvasState.y + storyOffsetY}px)) scale(${canvasState.scale * storyScale})`;
}

function animateCanvasModeShift() {
  if (!elements.canvasWorld || canvasState.introActive) {
    return;
  }
  if (canvasModeTransitionTimer) {
    window.clearTimeout(canvasModeTransitionTimer);
    canvasModeTransitionTimer = 0;
  }
  elements.canvasWorld.style.transition = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
  canvasModeTransitionTimer = window.setTimeout(() => {
    if (!elements.canvasWorld || canvasState.introActive) {
      return;
    }
    elements.canvasWorld.style.transition = "";
    canvasModeTransitionTimer = 0;
  }, 460);
}

function setupCanvasCamera() {
  const target = getRecommendedCamera();
  if (!target) {
    return;
  }
  canvasState.targetScale = target.scale;
  canvasState.minScale = target.minScale;
  canvasState.maxScale = target.maxScale;
  if (canvasState.introPlayed) {
    clampCanvasOffset();
    applyCanvasTransform();
    return;
  }

  canvasState.introPlayed = true;
  canvasState.introActive = true;
  elements.canvasViewport.dataset.camera = "intro";
  canvasState.scale = target.scale * 0.9;
  canvasState.x = -22;
  canvasState.y = -42;
  clampCanvasOffset();
  elements.canvasWorld.style.transition = "transform 680ms cubic-bezier(0.22, 1, 0.36, 1)";
  applyCanvasTransform();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      canvasState.scale = target.scale;
      canvasState.x = 0;
      canvasState.y = 0;
      applyCanvasTransform();
    });
  });

  window.setTimeout(() => {
    canvasState.introActive = false;
    elements.canvasViewport.dataset.camera = "ready";
    elements.canvasWorld.style.transition = "";
    clampCanvasOffset();
    applyCanvasTransform();
  }, 760);
}

function refreshCanvasCameraBounds() {
  const target = getRecommendedCamera();
  if (!target) {
    return;
  }
  canvasState.targetScale = target.scale;
  canvasState.minScale = target.minScale;
  canvasState.maxScale = target.maxScale;
  canvasState.scale = clamp(canvasState.scale, canvasState.minScale, canvasState.maxScale);
  clampCanvasOffset();
  applyCanvasTransform();
}

function getRecommendedCamera() {
  if (!elements.canvasViewport || !elements.playfieldBarrier) {
    return null;
  }
  const viewportWidth = elements.canvasViewport.clientWidth;
  const viewportHeight = elements.canvasViewport.clientHeight;
  const playfieldWidth = elements.playfieldBarrier.offsetWidth + 96;
  const playfieldHeight = elements.playfieldBarrier.offsetHeight + 96;
  if (!viewportWidth || !viewportHeight || !playfieldWidth || !playfieldHeight) {
    return null;
  }
  const marginX = clamp(viewportWidth * 0.18, 96, 180);
  const marginY = clamp(viewportHeight * 0.18, 76, 150);
  const fitScale = Math.min(
    (viewportWidth - marginX * 2) / playfieldWidth,
    (viewportHeight - marginY * 2) / playfieldHeight,
  );
  const scale = clamp(fitScale, 0.88, 1.48);
  return {
    scale,
    minScale: clamp(scale * 0.72, 0.62, 1.12),
    maxScale: clamp(scale * 1.42, 1.25, 2.1),
  };
}

function clampCanvasOffset() {
  if (!elements.canvasViewport || !elements.playfieldBarrier) {
    return;
  }
  const viewportWidth = elements.canvasViewport.clientWidth;
  const viewportHeight = elements.canvasViewport.clientHeight;
  const playfieldWidth = (elements.playfieldBarrier.offsetWidth + 96) * canvasState.scale;
  const playfieldHeight = (elements.playfieldBarrier.offsetHeight + 96) * canvasState.scale;
  const maxX = Math.max(72, (playfieldWidth - viewportWidth) / 2 + 148);
  const maxY = Math.max(72, (playfieldHeight - viewportHeight) / 2 + 128);
  canvasState.x = clamp(canvasState.x, -maxX, maxX);
  canvasState.y = clamp(canvasState.y, -maxY, maxY);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderGrid(state, beforeState, options = {}) {
  const previousDeposits = beforeState?.deposits ?? [];
  const removedDeposits = previousDeposits.filter(
    (deposit) => !state.deposits.some((item) => item.id === deposit.id),
  );

  syncWorldBounds(state);
  ensureWorldLayers();
  clearWorldLayers();
  elements.grid.dataset.loaded = "true";

  for (const obstacle of state.obstacles ?? []) {
    worldLayers.obstacles.append(createWorldEntity("obstacle", obstacle.x, obstacle.y, OBSTACLE_WORLD_SIZE, "wall"));
  }

  if (state.base) {
    worldLayers.base.append(createWorldEntity("base-marker", state.base.x, state.base.y, BASE_WORLD_SIZE, "home base"));
  }

  for (const deposit of state.deposits) {
    worldLayers.deposits.append(
      createWorldEntity(`deposit ${deposit.type}`, deposit.x, deposit.y, DEPOSIT_WORLD_SIZE, deposit.type),
    );
  }

  renderRobot(state, options);
  setupCanvasCamera();
  if (options.animate !== false) {
    for (const deposit of removedDeposits) {
      animatePickup(deposit, state.robot, options.animationDuration);
    }
  }
}

function ensureWorldLayers() {
  if (worldLayers) {
    return worldLayers;
  }

  const obstacles = document.createElement("div");
  obstacles.className = "world-layer world-layer-obstacles";
  const base = document.createElement("div");
  base.className = "world-layer world-layer-base";
  const deposits = document.createElement("div");
  deposits.className = "world-layer world-layer-deposits";
  const effects = document.createElement("div");
  effects.className = "world-layer world-layer-effects";
  const actors = document.createElement("div");
  actors.className = "world-layer world-layer-actors";

  worldLayers = { obstacles, base, deposits, effects, actors };
  elements.grid.replaceChildren(obstacles, base, deposits, effects, actors);
  return worldLayers;
}

function clearWorldLayers() {
  if (!worldLayers) {
    return;
  }
  worldLayers.obstacles.replaceChildren();
  worldLayers.base.replaceChildren();
  worldLayers.deposits.replaceChildren();
}

function renderRobot(state, options = {}) {
  if (!robotNode) {
    robotNode = document.createElement("div");
    robotNode.className = "robot robot-avatar";
  }
  robotNode.title = `Robot facing ${state.robot.dir}`;
  robotNode.dataset.dir = state.robot.dir;
  const duration = options.animationDuration ?? currentSpeedProfile().duration;
  if (robotNode.parentNode !== worldLayers?.actors) {
    ensureWorldLayers();
    worldLayers.actors.append(robotNode);
  }

  const position = gridPositionFor(state.robot.x, state.robot.y);
  if (!position) {
    return;
  }

  const size = ROBOT_WORLD_SIZE;
  const nextTransform =
    `translate(${position.left + (position.width - size) / 2}px, ${position.top + (position.height - size) / 2}px) rotate(${directionDegrees(state.robot.dir)}deg)`;

  robotNode.style.width = `${size}px`;
  robotNode.style.height = `${size}px`;
  if (options.animate === false || !robotVisualTransform) {
    if (robotTweenFrame) {
      cancelAnimationFrame(robotTweenFrame);
      robotTweenFrame = 0;
    }
    robotNode.style.transitionDuration = "0ms";
    robotNode.style.transform = nextTransform;
    robotVisualTransform = nextTransform;
    requestAnimationFrame(() => {
      if (robotNode) {
        robotNode.style.transitionDuration = `${currentSpeedProfile().duration}ms`;
      }
    });
    return;
  }

  if (robotVisualTransform === nextTransform) {
    return;
  }

  if (robotTweenFrame) {
    cancelAnimationFrame(robotTweenFrame);
  }
  robotNode.style.transitionDuration = `${duration}ms`;
  robotTweenFrame = requestAnimationFrame(() => {
    robotNode.style.transform = nextTransform;
    robotTweenFrame = 0;
  });
  robotVisualTransform = nextTransform;
}

function animatePickup(deposit, robot, duration = currentSpeedProfile().duration) {
  const from = gridPositionFor(deposit.x, deposit.y);
  const to = gridPositionFor(robot.x, robot.y);
  if (!from || !to) {
    return;
  }

  const size = DEPOSIT_WORLD_SIZE;
  const ghost = document.createElement("div");
  ghost.className = `deposit pickup-ghost ${deposit.type}`;
  ghost.style.width = `${size}px`;
  ghost.style.height = `${size}px`;
  ghost.style.transitionDuration = `${duration}ms`;
  ghost.style.transform = `translate(${from.left + (from.width - size) / 2}px, ${from.top + (from.height - size) / 2}px) scale(1)`;
  ensureWorldLayers();
  worldLayers.effects.append(ghost);

  requestAnimationFrame(() => {
    ghost.style.opacity = "0";
    ghost.style.transform = `translate(${to.left + (to.width - size) / 2}px, ${to.top + (to.height - size) / 2}px) scale(0.25)`;
  });
  window.setTimeout(() => ghost.remove(), duration + 80);
}

function gridPositionFor(x, y) {
  if (x < 0 || y < 0) {
    return null;
  }
  return {
    left: x * WORLD_CELL_SIZE,
    top: y * WORLD_CELL_SIZE,
    width: WORLD_CELL_SIZE,
    height: WORLD_CELL_SIZE,
  };
}

function syncWorldBounds(state) {
  const width = state.width * WORLD_CELL_SIZE;
  const height = state.height * WORLD_CELL_SIZE;
  elements.grid.style.width = `${width}px`;
  elements.grid.style.height = `${height}px`;
  if (elements.playfieldBarrier) {
    elements.playfieldBarrier.style.width = `${width}px`;
    elements.playfieldBarrier.style.height = `${height}px`;
  }
}

function createWorldEntity(className, x, y, size, title = "") {
  const node = document.createElement("div");
  node.className = className;
  if (title) {
    node.title = title;
  }
  const position = gridPositionFor(x, y);
  if (position) {
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    node.style.transform = `translate(${position.left + (position.width - size) / 2}px, ${position.top + (position.height - size) / 2}px)`;
  }
  return node;
}

function directionDegrees(direction) {
  return { N: 0, E: 90, S: 180, W: 270 }[direction] ?? 0;
}

function renderLog(logs) {
  elements.consoleLog.replaceChildren();
  for (const message of logs) {
    const item = document.createElement("li");
    item.textContent = message;
    elements.consoleLog.append(item);
  }
}

function renderDiff(diff) {
  elements.diffCount.textContent = t("diff.count", {
    count: diff.length,
    label: diff.length === 1 ? t("diff.change") : t("diff.changes"),
  });
  elements.diffList.replaceChildren();

  if (diff.length === 0) {
    const item = document.createElement("li");
    item.textContent = t("diff.empty");
    elements.diffList.append(item);
    return;
  }

  for (const change of diff.slice(0, 18)) {
    const item = document.createElement("li");
    item.textContent = `${change.path}: ${formatValue(change.before)} -> ${formatValue(change.after)}`;
    elements.diffList.append(item);
  }
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return String(value);
}

function formatCargoManifest(cargo) {
  if (!cargo.length) {
    return t("resources.cargoEmpty");
  }
  const counts = cargo.reduce((summary, item) => {
    const key = item === "cell" ? "battery" : item;
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
  return Object.entries(counts)
    .map(([item, count]) => `${t(`resources.item.${item}`)} x${count}`)
    .join(", ");
}

function renderFacilities(facilities) {
  if (!elements.facilityList) {
    return;
  }
  elements.facilityList.replaceChildren();
  const visibleFacilities = stageVisibleFacilities();
  const entries = [
    { key: "charger", labelKey: "facilities.charger" },
    { key: "repairBay", labelKey: "facilities.repairBay" },
    { key: "fabricator", labelKey: "facilities.fabricator" },
  ];
  for (const entry of entries) {
    if (!visibleFacilities.has(entry.key)) {
      continue;
    }
    const facility = facilities?.[entry.key];
    if (!facility) {
      continue;
    }
    const row = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = t(entry.labelKey);
    const desc = document.createElement("dd");
    const status = t(`facilities.status.${facility.status}`);
    if (entry.key === "fabricator" && facility.recipe) {
      desc.textContent = `${status} // 2 ${t("resources.item.scrap")} + 1 ${t("resources.item.battery")} -> 1 ${t("resources.memoryShards")}`;
    } else {
      desc.textContent = status;
    }
    row.append(term, desc);
    elements.facilityList.append(row);
  }
}

function storedInventoryTotal(resources) {
  return (resources.scrap ?? 0) + (resources.cells ?? 0);
}

function isRobotHome(state) {
  return state.robot.x === state.base.x && state.robot.y === state.base.y;
}

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of node.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":");
      if (attr && key) {
        node.setAttribute(attr, t(key));
      }
    }
  }
  for (const button of elements.languageSwitch.querySelectorAll("[data-lang]")) {
    const active = button.dataset.lang === language;
    button.setAttribute("aria-pressed", String(active));
    button.dataset.active = String(active);
  }
  updateControls();
}

function detectLanguage() {
  const saved = localStorage.getItem(languageKey);
  if (saved === "zh" || saved === "en") {
    return saved;
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((item) => item?.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

function t(key, values = {}) {
  const template = i18n[language]?.[key] ?? i18n.en[key] ?? key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function translateVmState(state) {
  if (!state) {
    return t("state.idle");
  }
  return t(`vm.${state}`);
}

function renderFlow() {
  renderFlowSummary();
  const items = elements.flowChecklist.querySelectorAll("[data-flow]");
  let firstPendingAssigned = false;
  for (const item of items) {
    const key = item.dataset.flow;
    const done = flow[key] ? "true" : "false";
    item.dataset.done = done;
    if (done === "false" && !firstPendingAssigned) {
      item.dataset.active = "true";
      firstPendingAssigned = true;
    } else {
      item.dataset.active = "false";
    }
  }
}

function query(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}
