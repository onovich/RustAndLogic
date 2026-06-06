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
import {
  compileTapeScript,
  TAPE_SCRIPT_EDITOR_MODEL,
  getTapeScriptActionArgs,
  getTapeScriptCheckPredicates,
  getTapeScriptCheckValues,
} from "../../../packages/tapescript-runtime/index.js";

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
let graphicsEditorConfig = defaultGraphicsEditorConfig();
let defaultGraphicsTemplates = [];
let customGraphicsTemplates = [];
let recentGraphicsTemplateIds = [];
let graphicsTemplateFilterState = { mode: "all", category: "all" };
let defaultEntityVisualCatalog = { version: 1, entities: {} };
let entityVisualCatalog = { version: 1, entities: {} };
let selectedVisualEntityKey = "";
let selectedVisualLayerId = "";
let graphicsCopyResetTimer = 0;
const entityVisualDataUrlCache = new Map();
const entityVisualsKey = "rust-and-logic.entity-visuals.v1";
const graphicsTemplatesKey = "rust-and-logic.entity-templates.v1";
const graphicsRecentTemplatesKey = "rust-and-logic.template-history.v1";
const graphicsTemplateFilterKey = "rust-and-logic.template-filter.v1";

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
  chips: query("chip-count"),
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
  graphicsEntityName: query("graphics-entity-name"),
  graphicsEntityList: query("graphics-entity-list"),
  graphicsPreview: query("graphics-preview"),
  graphicsStudioButton: query("graphics-studio-button"),
  graphicsExportEntityButton: query("graphics-export-entity-button"),
  graphicsImportEntityButton: query("graphics-import-entity-button"),
  graphicsResetButton: query("graphics-reset-button"),
  graphicsCopyButton: query("graphics-copy-button"),
  graphicsLayerList: query("graphics-layer-list"),
  graphicsAddShapeButton: query("graphics-add-shape-button"),
  graphicsAddGlyphButton: query("graphics-add-glyph-button"),
  graphicsDuplicateLayerButton: query("graphics-duplicate-layer-button"),
  graphicsMoveLayerUpButton: query("graphics-move-layer-up-button"),
  graphicsMoveLayerDownButton: query("graphics-move-layer-down-button"),
  graphicsDeleteLayerButton: query("graphics-delete-layer-button"),
  graphicsForm: query("graphics-form"),
  graphicsRecentTemplates: query("graphics-recent-templates"),
  graphicsTemplateModeFilters: query("graphics-template-mode-filters"),
  graphicsTemplateCategoryFilters: query("graphics-template-category-filters"),
  graphicsTemplates: query("graphics-templates"),
  graphicsTemplateName: query("graphics-template-name"),
  graphicsSaveTemplateButton: query("graphics-save-template-button"),
  graphicsImportTemplateButton: query("graphics-import-template-button"),
  graphicsExportLibraryButton: query("graphics-export-library-button"),
  graphicsPresets: query("graphics-presets"),
  graphicsFillSwatches: query("graphics-fill-swatches"),
  graphicsTextureSwatches: query("graphics-texture-swatches"),
  graphicsEntityIo: query("graphics-entity-io"),
  graphicsExport: query("graphics-export"),
};

let i18n = { en: {}, zh: {} };

async function loadI18n() {
  i18n = parseI18nCsv(await loadTextAsset(["/apps/web/i18n.csv", "./i18n.csv"]));
}

async function loadAppData() {
  appData = JSON.parse(await loadTextAsset(["/apps/web/app-data.json", "./app-data.json"]));
}

function loadCustomGraphicsTemplates() {
  const stored = localStorage.getItem(graphicsTemplatesKey);
  if (!stored) {
    customGraphicsTemplates = [];
    return;
  }
  try {
    customGraphicsTemplates = normalizeGraphicsCustomTemplates(JSON.parse(stored));
  } catch (error) {
    console.warn("Failed to restore custom graphics templates.", error);
    customGraphicsTemplates = [];
  }
}

function loadRecentGraphicsTemplates() {
  const stored = localStorage.getItem(graphicsRecentTemplatesKey);
  if (!stored) {
    recentGraphicsTemplateIds = [];
    return;
  }
  try {
    recentGraphicsTemplateIds = normalizeRecentGraphicsTemplateIds(JSON.parse(stored));
  } catch (error) {
    console.warn("Failed to restore recent graphics templates.", error);
    recentGraphicsTemplateIds = [];
  }
}

function loadGraphicsTemplateFilterState() {
  const stored = localStorage.getItem(graphicsTemplateFilterKey);
  if (!stored) {
    graphicsTemplateFilterState = { mode: "all", category: "all" };
    return;
  }
  try {
    graphicsTemplateFilterState = normalizeGraphicsTemplateFilterState(JSON.parse(stored));
  } catch (error) {
    console.warn("Failed to restore graphics template filters.", error);
    graphicsTemplateFilterState = { mode: "all", category: "all" };
  }
}

async function loadEntityVisualCatalog() {
  const loaded = JSON.parse(await loadTextAsset(["/apps/web/entity-visuals.json", "./entity-visuals.json"]));
  defaultEntityVisualCatalog = cloneJson(loaded);
  entityVisualCatalog = cloneJson(loaded);

  const stored = localStorage.getItem(entityVisualsKey);
  if (stored) {
    try {
      entityVisualCatalog = mergeEntityVisualCatalogs(defaultEntityVisualCatalog, JSON.parse(stored));
    } catch (error) {
      console.warn("Failed to restore local entity visuals override.", error);
    }
  }

  selectedVisualEntityKey = Object.keys(entityVisualCatalog.entities ?? {})[0] ?? "";
  ensureSelectedVisualLayer();
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
  graphicsEditorConfig = normalizeGraphicsEditorConfig(appData.graphicsEditor);
  defaultGraphicsTemplates = cloneJson(graphicsEditorConfig.entityTemplates ?? []);
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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeEntityVisualCatalogs(baseCatalog, overrideCatalog) {
  const merged = cloneJson(baseCatalog);
  if (!overrideCatalog?.entities) {
    return merged;
  }

  for (const [entityKey, overrideVisual] of Object.entries(overrideCatalog.entities)) {
    merged.entities[entityKey] = cloneJson(overrideVisual);
  }

  return merged;
}

function initializeGraphicsEditor() {
  if (!elements.graphicsEntityList) {
    return;
  }

  elements.graphicsEntityList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-entity-key]");
    if (!button) {
      return;
    }
    selectedVisualEntityKey = button.dataset.entityKey ?? selectedVisualEntityKey;
    ensureSelectedVisualLayer();
    renderGraphicsEditor();
  });

  elements.graphicsLayerList?.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-layer-action]");
    if (actionButton) {
      const layerId = actionButton.dataset.layerId ?? "";
      const action = actionButton.dataset.layerAction ?? "";
      if (action === "visible") {
        toggleLayerVisible(layerId);
      } else if (action === "locked") {
        toggleLayerLocked(layerId);
      }
      return;
    }
    const button = event.target.closest("[data-layer-id]");
    if (!button) {
      return;
    }
    selectedVisualLayerId = button.dataset.layerId ?? selectedVisualLayerId;
    renderGraphicsEditor();
  });

  elements.graphicsAddShapeButton?.addEventListener("click", () => {
    const visual = getSelectedEntityVisual();
    if (!visual) {
      return;
    }
    visual.layers.push(createDefaultShapeLayer(visual));
    selectedVisualLayerId = visual.layers.at(-1)?.id ?? "";
    persistEntityVisualCatalog();
  });

  elements.graphicsAddGlyphButton?.addEventListener("click", () => {
    const visual = getSelectedEntityVisual();
    if (!visual) {
      return;
    }
    visual.layers.push(createDefaultGlyphLayer(visual, selectedVisualEntityKey));
    selectedVisualLayerId = visual.layers.at(-1)?.id ?? "";
    persistEntityVisualCatalog();
  });

  elements.graphicsDuplicateLayerButton?.addEventListener("click", () => {
    const visual = getSelectedEntityVisual();
    const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
    if (!visual || !layer) {
      return;
    }
    const duplicate = cloneJson(layer);
    duplicate.id = `${layer.id}-copy-${Date.now().toString(36)}`;
    const index = visual.layers.findIndex((item) => item.id === selectedVisualLayerId);
    visual.layers.splice(index + 1, 0, duplicate);
    selectedVisualLayerId = duplicate.id;
    persistEntityVisualCatalog();
  });

  elements.graphicsMoveLayerUpButton?.addEventListener("click", () => {
    moveSelectedVisualLayer(-1);
  });

  elements.graphicsMoveLayerDownButton?.addEventListener("click", () => {
    moveSelectedVisualLayer(1);
  });

  elements.graphicsStudioButton?.addEventListener("click", () => {
    setGraphicsStudioOpen(elements.devPanel?.dataset.studio !== "true");
  });

  elements.graphicsExportEntityButton?.addEventListener("click", () => {
    const visual = getSelectedEntityVisual();
    if (!visual || !elements.graphicsEntityIo) {
      return;
    }
    elements.graphicsEntityIo.value = JSON.stringify(visual, null, 2);
    elements.graphicsEntityIo.focus();
    elements.graphicsEntityIo.select();
  });

  elements.graphicsImportEntityButton?.addEventListener("click", () => {
    if (!elements.graphicsEntityIo) {
      return;
    }
    importSelectedEntityVisual(elements.graphicsEntityIo.value);
  });

  elements.graphicsDeleteLayerButton?.addEventListener("click", () => {
    const visual = getSelectedEntityVisual();
    if (!visual || !selectedVisualLayerId) {
      return;
    }
    visual.layers = visual.layers.filter((layer) => layer.id !== selectedVisualLayerId);
    ensureSelectedVisualLayer();
    persistEntityVisualCatalog();
  });

  elements.graphicsResetButton?.addEventListener("click", () => {
    entityVisualCatalog = cloneJson(defaultEntityVisualCatalog);
    localStorage.removeItem(entityVisualsKey);
    clearGraphicsCopyResetTimer();
    if (elements.graphicsCopyButton) {
      elements.graphicsCopyButton.textContent = t("graphics.copy");
    }
    ensureSelectedVisualLayer();
    renderGraphicsEditor();
    refreshWorldVisuals();
  });

  elements.graphicsCopyButton?.addEventListener("click", async () => {
    if (!elements.graphicsExport) {
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(elements.graphicsExport.value);
      } else {
        copyGraphicsExportWithExecCommand();
      }
      setGraphicsCopyButtonState("graphics.copied");
    } catch (error) {
      try {
        copyGraphicsExportWithExecCommand();
        setGraphicsCopyButtonState("graphics.copied");
      } catch (fallbackError) {
        console.warn("Failed to copy graphics JSON.", error, fallbackError);
        setGraphicsCopyButtonState("graphics.copy");
      }
    }
  });

  const handleGraphicsFormInput = (event) => {
    const input = event.target.closest("[data-field]");
    if (!input) {
      return;
    }
    const scope = input.dataset.scope ?? "layer";
    const field = input.dataset.field;
    const valueType = input.dataset.valueType ?? "string";
    const targetVisual = getSelectedEntityVisual();
    const target =
      scope === "entity"
        ? targetVisual
        : targetVisual?.layers.find((layer) => layer.id === selectedVisualLayerId);
    if (!target || !field) {
      return;
    }
    const nextValue = coerceGraphicsFieldValue(valueType, input.value);
    if (field === "type" && scope === "layer") {
      upgradeVisualLayerType(target, nextValue, targetVisual);
    } else {
      target[field] = nextValue;
    }
    if (field === "id" && scope === "layer") {
      selectedVisualLayerId = String(nextValue);
    }
    if ((field === "shape" || field === "type") && scope === "layer") {
      normalizeShapeLayer(target, targetVisual);
    }
    persistEntityVisualCatalog();
  };

  elements.graphicsForm?.addEventListener("input", handleGraphicsFormInput);
  elements.graphicsForm?.addEventListener("change", handleGraphicsFormInput);
  elements.graphicsPresets?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) {
      return;
    }
    applyShapePreset(button.dataset.preset ?? "");
  });
  elements.graphicsTemplates?.addEventListener("click", (event) => {
    const exportAction = event.target.closest("[data-template-action='export']");
    if (exportAction) {
      exportGraphicsTemplate(exportAction.dataset.templateId ?? "");
      return;
    }
    const deleteAction = event.target.closest("[data-template-action='delete']");
    if (deleteAction) {
      removeCustomGraphicsTemplate(deleteAction.dataset.templateId ?? "");
      return;
    }
    const button = event.target.closest("[data-template]");
    if (!button) {
      return;
    }
    applyEntityTemplate(button.dataset.template ?? "");
  });
  elements.graphicsRecentTemplates?.addEventListener("click", (event) => {
    const exportAction = event.target.closest("[data-template-action='export']");
    if (exportAction) {
      exportGraphicsTemplate(exportAction.dataset.templateId ?? "");
      return;
    }
    const deleteAction = event.target.closest("[data-template-action='delete']");
    if (deleteAction) {
      removeCustomGraphicsTemplate(deleteAction.dataset.templateId ?? "");
      return;
    }
    const button = event.target.closest("[data-template]");
    if (!button) {
      return;
    }
    applyEntityTemplate(button.dataset.template ?? "");
  });
  const handleGraphicsTemplateFilterClick = (event) => {
    const button = event.target.closest("[data-filter-kind][data-filter-value]");
    if (!button) {
      return;
    }
    const filterKind = button.dataset.filterKind ?? "";
    const filterValue = button.dataset.filterValue ?? "all";
    if (filterKind === "mode") {
      graphicsTemplateFilterState.mode = filterValue === "fit" ? "fit" : "all";
    } else if (filterKind === "category") {
      graphicsTemplateFilterState.category = filterValue || "all";
    } else {
      return;
    }
    persistGraphicsTemplateFilterState();
  };
  elements.graphicsTemplateModeFilters?.addEventListener("click", handleGraphicsTemplateFilterClick);
  elements.graphicsTemplateCategoryFilters?.addEventListener("click", handleGraphicsTemplateFilterClick);
  elements.graphicsSaveTemplateButton?.addEventListener("click", () => {
    saveCurrentEntityAsTemplate();
  });
  elements.graphicsImportTemplateButton?.addEventListener("click", () => {
    importGraphicsTemplate(elements.graphicsEntityIo?.value ?? "");
  });
  elements.graphicsExportLibraryButton?.addEventListener("click", () => {
    exportGraphicsTemplateLibrary();
  });
  elements.graphicsEntityIo?.addEventListener("input", () => {
    if (elements.graphicsImportTemplateButton) {
      elements.graphicsImportTemplateButton.disabled = !elements.graphicsEntityIo?.value.trim();
    }
  });
  elements.graphicsTemplateName?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    saveCurrentEntityAsTemplate();
  });
  const handleGraphicsSwatchClick = (event) => {
    const button = event.target.closest("[data-swatch-kind]");
    if (!button) {
      return;
    }
    applyGraphicsSwatch(button.dataset.swatchKind ?? "", button.dataset.swatchValue ?? "");
  };
  elements.graphicsFillSwatches?.addEventListener("click", handleGraphicsSwatchClick);
  elements.graphicsTextureSwatches?.addEventListener("click", handleGraphicsSwatchClick);
}

function setGraphicsStudioOpen(isOpen) {
  if (!elements.devPanel) {
    return;
  }
  elements.devPanel.dataset.open = "true";
  elements.devPanel.dataset.studio = String(isOpen);
  document.body.dataset.graphicsStudio = String(isOpen);
  renderGraphicsEditor();
  updateControls();
}

function clearGraphicsCopyResetTimer() {
  if (graphicsCopyResetTimer) {
    window.clearTimeout(graphicsCopyResetTimer);
    graphicsCopyResetTimer = 0;
  }
}

function copyGraphicsExportWithExecCommand() {
  if (!elements.graphicsExport) {
    throw new Error("Missing graphics export textarea.");
  }
  elements.graphicsExport.focus();
  elements.graphicsExport.select();
  const copied = document.execCommand("copy");
  elements.graphicsExport.setSelectionRange(0, 0);
  if (!copied) {
    throw new Error("document.execCommand('copy') returned false.");
  }
}

function setGraphicsCopyButtonState(key) {
  if (!elements.graphicsCopyButton) {
    return;
  }
  clearGraphicsCopyResetTimer();
  elements.graphicsCopyButton.textContent = t(key);
  if (key !== "graphics.copy") {
    graphicsCopyResetTimer = window.setTimeout(() => {
      if (elements.graphicsCopyButton) {
        elements.graphicsCopyButton.textContent = t("graphics.copy");
      }
      graphicsCopyResetTimer = 0;
    }, 1200);
  }
}

function persistEntityVisualCatalog() {
  localStorage.setItem(entityVisualsKey, JSON.stringify(entityVisualCatalog));
  entityVisualDataUrlCache.clear();
  ensureSelectedVisualLayer();
  renderGraphicsEditor();
  refreshWorldVisuals();
}

function persistCustomGraphicsTemplates() {
  localStorage.setItem(graphicsTemplatesKey, JSON.stringify(customGraphicsTemplates));
  renderGraphicsEditor();
}

function persistRecentGraphicsTemplates() {
  recentGraphicsTemplateIds = normalizeRecentGraphicsTemplateIds(recentGraphicsTemplateIds);
  localStorage.setItem(graphicsRecentTemplatesKey, JSON.stringify(recentGraphicsTemplateIds));
  renderGraphicsEditor();
}

function persistGraphicsTemplateFilterState() {
  graphicsTemplateFilterState = normalizeGraphicsTemplateFilterState(graphicsTemplateFilterState);
  localStorage.setItem(graphicsTemplateFilterKey, JSON.stringify(graphicsTemplateFilterState));
  renderGraphicsEditor();
}

function refreshWorldVisuals() {
  const state = snapshot(game);
  renderGrid(state, state, { animate: false });
}

function renderGraphicsEditor() {
  if (!elements.graphicsEntityList || !elements.graphicsPreview || !elements.graphicsExport) {
    return;
  }

  ensureSelectedVisualLayer();
  renderGraphicsEntityList();
  renderGraphicsLayerList();
  renderGraphicsForm();
  renderGraphicsRecentTemplates();
  renderGraphicsTemplateFilters();
  renderGraphicsTemplates();
  renderGraphicsPresets();
  renderGraphicsSwatches();

  const visual = getSelectedEntityVisual();
  const previewUrl = visual ? buildEntityVisualDataUrl(selectedVisualEntityKey, visual) : "";
  elements.graphicsPreview.style.backgroundImage = previewUrl ? `url("${previewUrl}")` : "none";
  elements.graphicsPreview.setAttribute("aria-label", getGraphicsEntityLabel(selectedVisualEntityKey));
  elements.graphicsEntityName.textContent = getGraphicsEntityLabel(selectedVisualEntityKey);
  if (elements.graphicsEntityIo && !elements.graphicsEntityIo.value.trim()) {
    elements.graphicsEntityIo.placeholder = t("graphics.entityIoPlaceholder");
  }
  elements.graphicsExport.value = JSON.stringify(entityVisualCatalog, null, 2);
  if (elements.graphicsSaveTemplateButton) {
    elements.graphicsSaveTemplateButton.disabled = !selectedVisualEntityKey;
  }
  if (elements.graphicsImportTemplateButton) {
    elements.graphicsImportTemplateButton.disabled = !elements.graphicsEntityIo?.value.trim();
  }
  if (elements.graphicsExportLibraryButton) {
    elements.graphicsExportLibraryButton.disabled = customGraphicsTemplates.length === 0;
  }
  const layerIndex = visual?.layers.findIndex((item) => item.id === selectedVisualLayerId) ?? -1;
  const layerCount = visual?.layers.length ?? 0;
  const selectedLayer = visual?.layers.find((item) => item.id === selectedVisualLayerId) ?? null;
  const selectedLocked = Boolean(selectedLayer?.locked);
  if (elements.graphicsDuplicateLayerButton) {
    elements.graphicsDuplicateLayerButton.disabled = !selectedVisualLayerId;
  }
  if (elements.graphicsMoveLayerUpButton) {
    elements.graphicsMoveLayerUpButton.disabled = layerIndex <= 0;
  }
  if (elements.graphicsMoveLayerDownButton) {
    elements.graphicsMoveLayerDownButton.disabled = layerIndex < 0 || layerIndex >= layerCount - 1;
  }
  if (elements.graphicsDeleteLayerButton) {
    elements.graphicsDeleteLayerButton.disabled = !selectedVisualLayerId;
  }
  if (elements.graphicsCopyButton && !graphicsCopyResetTimer) {
    elements.graphicsCopyButton.textContent = t("graphics.copy");
  }
  if (elements.graphicsStudioButton) {
    const studioOpen = elements.devPanel?.dataset.studio === "true";
    elements.graphicsStudioButton.textContent = t(studioOpen ? "graphics.closeStudio" : "graphics.openStudio");
    elements.graphicsStudioButton.dataset.active = String(studioOpen);
  }
  if (elements.graphicsExportEntityButton) {
    elements.graphicsExportEntityButton.textContent = t("graphics.exportEntity");
  }
  if (elements.graphicsImportEntityButton) {
    elements.graphicsImportEntityButton.textContent = t("graphics.importEntity");
  }
  if (elements.graphicsForm) {
    for (const input of elements.graphicsForm.querySelectorAll("input, select")) {
      input.disabled = selectedLocked && input.dataset.scope === "layer";
    }
  }
}

function renderGraphicsEntityList() {
  if (!elements.graphicsEntityList) {
    return;
  }
  elements.graphicsEntityList.replaceChildren();
  for (const entityKey of Object.keys(entityVisualCatalog.entities ?? {})) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.entityKey = entityKey;
    button.dataset.active = String(entityKey === selectedVisualEntityKey);
    button.textContent = getGraphicsEntityLabel(entityKey);
    elements.graphicsEntityList.append(button);
  }
}

function renderGraphicsTemplates() {
  if (!elements.graphicsTemplates) {
    return;
  }
  elements.graphicsTemplates.replaceChildren();
  const group = elements.graphicsTemplates.closest(".visual-preset-group");
  if (!selectedVisualEntityKey) {
    elements.graphicsTemplates.hidden = true;
    if (group) {
      group.hidden = true;
    }
    return;
  }
  elements.graphicsTemplates.hidden = false;
  if (group) {
    group.hidden = false;
  }
  const templateGroups = getGroupedGraphicsTemplates();
  if (templateGroups.length === 0) {
    elements.graphicsTemplates.append(createGraphicsTemplateEmptyState());
    return;
  }
  for (const templateGroup of templateGroups) {
    elements.graphicsTemplates.append(createGraphicsTemplateSection(templateGroup));
  }
}

function renderGraphicsTemplateFilters() {
  renderGraphicsTemplateFilterRow(elements.graphicsTemplateModeFilters, getGraphicsTemplateModeOptions());
  renderGraphicsTemplateFilterRow(elements.graphicsTemplateCategoryFilters, getGraphicsTemplateCategoryOptions());
}

function renderGraphicsTemplateFilterRow(container, options) {
  if (!container) {
    return;
  }
  container.replaceChildren();
  if (!selectedVisualEntityKey || options.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-template-filter-button";
    button.dataset.filterKind = option.kind;
    button.dataset.filterValue = option.value;
    button.dataset.active = String(option.active);
    button.textContent = option.label;
    container.append(button);
  }
}

function renderGraphicsRecentTemplates() {
  if (!elements.graphicsRecentTemplates) {
    return;
  }
  elements.graphicsRecentTemplates.replaceChildren();
  const group = elements.graphicsRecentTemplates.closest(".visual-preset-group");
  const recentTemplates = getRecentGraphicsTemplates();
  if (!selectedVisualEntityKey || recentTemplates.length === 0) {
    elements.graphicsRecentTemplates.hidden = true;
    if (group) {
      group.hidden = true;
    }
    return;
  }
  elements.graphicsRecentTemplates.hidden = false;
  if (group) {
    group.hidden = false;
  }
  for (const template of recentTemplates) {
    elements.graphicsRecentTemplates.append(createGraphicsTemplateCard(template));
  }
}

function createGraphicsTemplateCard(template) {
  const card = document.createElement("div");
  card.className = "visual-template-card";
  card.dataset.templateSource = getGraphicsTemplateSource(template);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "visual-template-button";
  button.dataset.template = template.id;
  button.dataset.templateSource = getGraphicsTemplateSource(template);
  button.dataset.recommended = String(isGraphicsTemplateRecommended(template, selectedVisualEntityKey));
  const description = getGraphicsTemplateDescription(template);
  if (description) {
    button.title = description;
  }
  const preview = document.createElement("span");
  preview.className = "visual-template-preview";
  preview.style.backgroundImage = buildGraphicsTemplatePreview(template);
  const label = document.createElement("span");
  label.className = "visual-template-label";
  label.textContent = getGraphicsTemplateLabel(template);
  const meta = document.createElement("span");
  meta.className = "visual-template-meta";
  const metaParts = [];
  if (isGraphicsTemplateRecommended(template, selectedVisualEntityKey)) {
    metaParts.push(t("graphics.templateRecommended"));
  }
  const category = getGraphicsTemplateCategory(template);
  if (category) {
    metaParts.push(category);
  }
  meta.textContent = metaParts.join(" // ");
  button.append(preview, label, meta);
  card.append(button);
  card.append(createGraphicsTemplateActionRow(template));
  return card;
}

function createGraphicsTemplateActionRow(template) {
  const actions = document.createElement("div");
  actions.className = "visual-template-actions";
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "visual-template-action";
  exportButton.dataset.templateAction = "export";
  exportButton.dataset.templateId = template.id;
  exportButton.textContent = t("graphics.exportTemplate");
  exportButton.title = t("graphics.exportTemplate");
  actions.append(exportButton);
  if (isCustomGraphicsTemplate(template)) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "visual-template-action";
    deleteButton.dataset.templateAction = "delete";
    deleteButton.dataset.templateId = template.id;
    deleteButton.textContent = t("graphics.deleteTemplate");
    deleteButton.title = t("graphics.deleteTemplate");
    actions.append(deleteButton);
  }
  return actions;
}

function createGraphicsTemplateSection(templateGroup) {
  const section = document.createElement("section");
  section.className = "visual-template-section";
  section.dataset.templateGroup = templateGroup.id;
  const heading = document.createElement("div");
  heading.className = "visual-template-section-heading";
  heading.textContent = templateGroup.label;
  const strip = document.createElement("div");
  strip.className = "visual-template-section-grid";
  for (const template of templateGroup.templates) {
    strip.append(createGraphicsTemplateCard(template));
  }
  section.append(heading, strip);
  return section;
}

function createGraphicsTemplateEmptyState() {
  const empty = document.createElement("div");
  empty.className = "visual-template-empty";
  empty.textContent = t("graphics.templateEmpty");
  return empty;
}

function getSortedGraphicsTemplates(templates = getFilteredGraphicsTemplates()) {
  const entityKey = selectedVisualEntityKey;
  return [...templates].sort((left, right) => {
    const leftRecommended = isGraphicsTemplateRecommended(left, entityKey) ? 0 : 1;
    const rightRecommended = isGraphicsTemplateRecommended(right, entityKey) ? 0 : 1;
    if (leftRecommended !== rightRecommended) {
      return leftRecommended - rightRecommended;
    }
    const leftSource = getGraphicsTemplateSource(left) === "custom" ? 0 : 1;
    const rightSource = getGraphicsTemplateSource(right) === "custom" ? 0 : 1;
    if (leftSource !== rightSource) {
      return leftSource - rightSource;
    }
    if (leftSource === 0 && rightSource === 0) {
      const leftUpdated = Number(left.updatedAt ?? 0);
      const rightUpdated = Number(right.updatedAt ?? 0);
      if (leftUpdated !== rightUpdated) {
        return rightUpdated - leftUpdated;
      }
    }
    const leftCategory = getGraphicsTemplateCategory(left).toUpperCase();
    const rightCategory = getGraphicsTemplateCategory(right).toUpperCase();
    if (leftCategory !== rightCategory) {
      return leftCategory.localeCompare(rightCategory);
    }
    return getGraphicsTemplateLabel(left).localeCompare(getGraphicsTemplateLabel(right));
  });
}

function getGroupedGraphicsTemplates() {
  const templates = getSortedGraphicsTemplates(getFilteredGraphicsTemplates());
  const showRecommendedGroup = graphicsTemplateFilterState.mode !== "fit" && graphicsTemplateFilterState.category === "all";
  const recommended = showRecommendedGroup
    ? templates.filter((template) => isGraphicsTemplateRecommended(template, selectedVisualEntityKey))
    : [];
  const remaining = showRecommendedGroup ? templates.filter((template) => !isGraphicsTemplateRecommended(template, selectedVisualEntityKey)) : templates;
  const groups = [];
  if (recommended.length > 0) {
    groups.push({
      id: "recommended",
      label: t("graphics.templateGroup.recommended"),
      templates: recommended,
    });
  }

  const grouped = new Map();
  for (const template of remaining) {
    const groupId = getGraphicsTemplateGroupId(template);
    if (!grouped.has(groupId)) {
      grouped.set(groupId, []);
    }
    grouped.get(groupId).push(template);
  }

  for (const groupId of getGraphicsTemplateGroupOrder()) {
    const bucket = grouped.get(groupId);
    if (!bucket?.length) {
      continue;
    }
    groups.push({
      id: groupId,
      label: getGraphicsTemplateGroupLabel(groupId),
      templates: bucket,
    });
  }

  for (const [groupId, bucket] of grouped.entries()) {
    if (!bucket?.length || groups.some((group) => group.id === groupId)) {
      continue;
    }
    groups.push({
      id: groupId,
      label: getGraphicsTemplateGroupLabel(groupId),
      templates: bucket,
    });
  }

  return groups;
}

function getFilteredGraphicsTemplates() {
  let templates = getTemplatesForFilterMode();
  if (graphicsTemplateFilterState.category !== "all") {
    templates = templates.filter((template) => getGraphicsTemplateGroupId(template) === graphicsTemplateFilterState.category);
  }
  return templates;
}

function getTemplatesForFilterMode() {
  const templates = getAllGraphicsTemplates();
  if (graphicsTemplateFilterState.mode === "fit") {
    return templates.filter((template) => isGraphicsTemplateRecommended(template, selectedVisualEntityKey));
  }
  return templates;
}

function getGraphicsTemplateModeOptions() {
  return [
    {
      kind: "mode",
      value: "all",
      label: t("graphics.templateFilter.all"),
      active: graphicsTemplateFilterState.mode === "all",
    },
    {
      kind: "mode",
      value: "fit",
      label: t("graphics.templateFilter.fit"),
      active: graphicsTemplateFilterState.mode === "fit",
    },
  ];
}

function getGraphicsTemplateCategoryOptions() {
  const categories = getAvailableGraphicsTemplateCategories();
  if (graphicsTemplateFilterState.category !== "all" && !categories.includes(graphicsTemplateFilterState.category)) {
    graphicsTemplateFilterState.category = "all";
  }
  return [
    {
      kind: "category",
      value: "all",
      label: t("graphics.templateFilter.categoryAll"),
      active: graphicsTemplateFilterState.category === "all",
    },
    ...categories.map((category) => ({
      kind: "category",
      value: category,
      label: getGraphicsTemplateGroupLabel(category),
      active: graphicsTemplateFilterState.category === category,
    })),
  ];
}

function getAvailableGraphicsTemplateCategories() {
  const categories = new Set(getTemplatesForFilterMode().map((template) => getGraphicsTemplateGroupId(template)));
  const ordered = [];
  for (const groupId of getGraphicsTemplateGroupOrder()) {
    if (groupId !== "other" && categories.has(groupId)) {
      ordered.push(groupId);
      categories.delete(groupId);
    }
  }
  for (const groupId of categories) {
    ordered.push(groupId);
  }
  return ordered;
}

function isGraphicsTemplateRecommended(template, entityKey) {
  const entityKind = getGraphicsEntityKind(entityKey);
  const supportedKinds = template?.entityKinds ?? [];
  return Boolean(entityKind && Array.isArray(supportedKinds) && supportedKinds.includes(entityKind));
}

function getRecentGraphicsTemplates() {
  const templatesById = new Map(getAllGraphicsTemplates().map((template) => [template.id, template]));
  return recentGraphicsTemplateIds.map((templateId) => templatesById.get(templateId)).filter(Boolean);
}

function getAllGraphicsTemplates() {
  return [
    ...customGraphicsTemplates.map((template) => ({ ...template, source: "custom" })),
    ...defaultGraphicsTemplates.map((template) => ({ ...template, source: "builtin" })),
  ];
}

function getGraphicsTemplateSource(template) {
  return template?.source === "custom" ? "custom" : "builtin";
}

function isCustomGraphicsTemplate(template) {
  return getGraphicsTemplateSource(template) === "custom";
}

function getGraphicsTemplateLabel(template) {
  if (typeof template?.label === "string" && template.label.trim()) {
    return template.label.trim();
  }
  return t(template?.labelKey ?? "");
}

function getGraphicsTemplateDescription(template) {
  if (typeof template?.description === "string" && template.description.trim()) {
    return template.description.trim();
  }
  if (template?.descriptionKey) {
    return t(template.descriptionKey);
  }
  return "";
}

function getGraphicsTemplateCategory(template) {
  if (typeof template?.categoryLabel === "string" && template.categoryLabel.trim()) {
    return template.categoryLabel.trim();
  }
  if (template?.categoryKey) {
    return t(template.categoryKey);
  }
  return "";
}

function getGraphicsTemplateGroupId(template) {
  const categoryKey = template?.categoryKey ?? "";
  if (categoryKey.startsWith("graphics.templateCategory.")) {
    return categoryKey.replace("graphics.templateCategory.", "");
  }
  return "other";
}

function getGraphicsTemplateGroupLabel(groupId) {
  if (groupId === "recommended") {
    return t("graphics.templateGroup.recommended");
  }
  const key = `graphics.templateCategory.${groupId}`;
  const translated = t(key);
  return translated === key ? t("graphics.templateGroup.other") : translated;
}

function getGraphicsTemplateGroupOrder() {
  return ["custom", "actor", "pickup", "field", "structure", "anchor", "other"];
}

function buildGraphicsTemplatePreview(template) {
  if (!template?.visual) {
    return "none";
  }
  const previewUrl = buildEntityVisualDataUrl(`template:${template.id}`, template.visual);
  return previewUrl ? `url("${previewUrl}")` : "none";
}

function getGraphicsEntityKind(entityKey = selectedVisualEntityKey) {
  return graphicsEditorConfig.entityKinds?.[entityKey] ?? "";
}

function normalizeGraphicsCustomTemplates(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((template, index) => normalizeGraphicsCustomTemplate(template, index))
    .filter(Boolean);
}

function normalizeRecentGraphicsTemplateIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))].slice(0, 6);
}

function normalizeGraphicsTemplateFilterState(value) {
  return {
    mode: value?.mode === "fit" ? "fit" : "all",
    category: typeof value?.category === "string" && value.category.trim() ? value.category.trim() : "all",
  };
}

function normalizeGraphicsCustomTemplate(template, index) {
  if (!template || typeof template !== "object" || !template.visual || !Array.isArray(template.visual.layers)) {
    return null;
  }
  const label =
    typeof template.label === "string" && template.label.trim()
      ? template.label.trim()
      : `Template ${String(index + 1).padStart(2, "0")}`;
  return {
    id:
      typeof template.id === "string" && template.id.trim()
        ? template.id.trim()
        : `custom-template-${String(index + 1).padStart(2, "0")}`,
    label,
    description:
      typeof template.description === "string" && template.description.trim() ? template.description.trim() : "",
    categoryKey:
      typeof template.categoryKey === "string" && template.categoryKey.trim()
        ? template.categoryKey.trim()
        : "graphics.templateCategory.custom",
    categoryLabel:
      typeof template.categoryLabel === "string" && template.categoryLabel.trim() ? template.categoryLabel.trim() : "",
    entityKinds: Array.isArray(template.entityKinds) ? template.entityKinds.filter((item) => typeof item === "string") : [],
    originEntityKey:
      typeof template.originEntityKey === "string" && template.originEntityKey.trim() ? template.originEntityKey.trim() : "",
    updatedAt: Number.isFinite(Number(template.updatedAt)) ? Number(template.updatedAt) : 0,
    visual: cloneJson(template.visual),
  };
}

function renderGraphicsLayerList() {
  if (!elements.graphicsLayerList) {
    return;
  }
  elements.graphicsLayerList.replaceChildren();
  const visual = getSelectedEntityVisual();
  if (!visual) {
    return;
  }

  for (const layer of visual.layers ?? []) {
    const row = document.createElement("div");
    row.className = "visual-layer-item";
    row.dataset.hidden = String(layer.visible === false);
    row.dataset.locked = String(Boolean(layer.locked));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-layer-select";
    button.dataset.layerId = layer.id;
    button.dataset.active = String(layer.id === selectedVisualLayerId);
    const title = document.createElement("span");
    title.className = "visual-layer-title";
    title.textContent = describeVisualLayerTitle(layer);
    const meta = document.createElement("span");
    meta.className = "visual-layer-meta";
    meta.textContent = describeVisualLayerMeta(layer);
    button.append(title, meta);
    const controls = document.createElement("div");
    controls.className = "visual-layer-controls";
    const visibleButton = document.createElement("button");
    visibleButton.type = "button";
    visibleButton.dataset.layerAction = "visible";
    visibleButton.dataset.layerId = layer.id;
    visibleButton.dataset.active = String(layer.visible !== false);
    visibleButton.textContent = t(layer.visible === false ? "graphics.layerHidden" : "graphics.layerVisible");
    const lockedButton = document.createElement("button");
    lockedButton.type = "button";
    lockedButton.dataset.layerAction = "locked";
    lockedButton.dataset.layerId = layer.id;
    lockedButton.dataset.active = String(Boolean(layer.locked));
    lockedButton.textContent = t(layer.locked ? "graphics.layerLocked" : "graphics.layerUnlocked");
    controls.append(visibleButton, lockedButton);
    row.append(button, controls);
    elements.graphicsLayerList.append(row);
  }
}

function renderGraphicsPresets() {
  if (!elements.graphicsPresets) {
    return;
  }
  elements.graphicsPresets.replaceChildren();
  const group = elements.graphicsPresets.closest(".visual-preset-group");
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  if (!layer || layer.type !== "shape") {
    elements.graphicsPresets.hidden = true;
    if (group) {
      group.hidden = true;
    }
    return;
  }
  elements.graphicsPresets.hidden = false;
  if (group) {
    group.hidden = false;
  }
  for (const preset of graphicsEditorConfig.shapePresets ?? []) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = preset.id;
    button.textContent = t(preset.labelKey);
    button.disabled = Boolean(layer.locked);
    elements.graphicsPresets.append(button);
  }
}

function renderGraphicsSwatches() {
  renderGraphicsSwatchStrip(elements.graphicsFillSwatches, buildFillSwatchesForSelection());
  renderGraphicsSwatchStrip(elements.graphicsTextureSwatches, buildTextureSwatchesForSelection());
}

function renderGraphicsSwatchStrip(container, swatches) {
  if (!container) {
    return;
  }
  container.replaceChildren();
  const group = container.closest(".visual-preset-group");
  if (!swatches.length) {
    container.hidden = true;
    if (group) {
      group.hidden = true;
    }
    return;
  }
  container.hidden = false;
  if (group) {
    group.hidden = false;
  }
  for (const swatch of swatches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-swatch";
    button.dataset.swatchKind = swatch.kind;
    button.dataset.swatchValue = swatch.value;
    button.dataset.selected = String(Boolean(swatch.selected));
    button.disabled = Boolean(swatch.disabled);
    button.title = swatch.title;
    button.setAttribute("aria-label", swatch.title);
    button.style.setProperty("--swatch-color", swatch.value);
    if (swatch.preview) {
      button.style.setProperty("--swatch-preview", swatch.preview);
    } else {
      button.style.removeProperty("--swatch-preview");
    }
    container.append(button);
  }
}

function renderGraphicsForm() {
  if (!elements.graphicsForm) {
    return;
  }
  elements.graphicsForm.replaceChildren();
  const visual = getSelectedEntityVisual();
  if (!visual) {
    return;
  }

  renderGraphicsFieldSchema("entity", visual, graphicsEditorConfig.entityFields);

  const layer = visual.layers.find((item) => item.id === selectedVisualLayerId);
  if (!layer) {
    const placeholder = document.createElement("div");
    placeholder.className = "visual-field";
    const label = document.createElement("label");
    label.textContent = t("graphics.noLayer");
    placeholder.append(label);
    elements.graphicsForm.append(placeholder);
    return;
  }

  renderGraphicsFieldSchema("layer", layer, graphicsEditorConfig.layerBaseFields);

  if (layer.type === "glyph") {
    renderGraphicsFieldSchema("layer", layer, graphicsEditorConfig.glyphFields);
    return;
  }

  renderGraphicsFieldSchema("layer", layer, graphicsEditorConfig.shapeFields);
}

function renderGraphicsFieldSchema(scope, source, schema) {
  for (const fieldConfig of Array.isArray(schema) ? schema : []) {
    if (!fieldConfig || !fieldConfig.field || !shouldRenderGraphicsField(fieldConfig, source)) {
      continue;
    }
    appendGraphicsFieldFromSchema(scope, source, fieldConfig);
  }
}

function shouldRenderGraphicsField(fieldConfig, source) {
  const condition = fieldConfig.showWhen;
  if (!condition) {
    return true;
  }
  const currentValue = source?.[condition.field];
  if (Object.prototype.hasOwnProperty.call(condition, "equals")) {
    return currentValue === condition.equals;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "notEquals")) {
    return currentValue !== condition.notEquals;
  }
  return true;
}

function appendGraphicsFieldFromSchema(scope, source, fieldConfig) {
  const label = t(fieldConfig.labelKey ?? fieldConfig.field);
  const value = resolveGraphicsFieldValue(source, fieldConfig);
  if (fieldConfig.type === "select") {
    appendGraphicsSelectField({
      scope,
      field: fieldConfig.field,
      label,
      value,
      options: buildGraphicsSelectOptions(graphicsEditorConfig[fieldConfig.optionsKey]),
    });
    return;
  }
  appendGraphicsField({
    scope,
    field: fieldConfig.field,
    label,
    type: fieldConfig.type ?? "text",
    value,
    valueType: fieldConfig.valueType ?? (fieldConfig.type === "number" ? "number" : "string"),
    min: fieldConfig.min,
    max: fieldConfig.max,
    step: fieldConfig.step,
  });
}

function resolveGraphicsFieldValue(source, fieldConfig) {
  const rawValue = source?.[fieldConfig.field];
  if (fieldConfig.type === "color") {
    return normalizeColorValue(rawValue, fieldConfig.fallback ?? "#000000");
  }
  if (rawValue === undefined || rawValue === null) {
    return fieldConfig.defaultValue ?? "";
  }
  return rawValue;
}

function appendGraphicsField({
  scope,
  field,
  label,
  type,
  value,
  valueType = type === "number" ? "number" : "string",
  min,
  max,
  step,
}) {
  if (!elements.graphicsForm) {
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "visual-field";
  const labelNode = document.createElement("label");
  labelNode.textContent = label;
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.dataset.scope = scope;
  input.dataset.field = field;
  input.dataset.valueType = valueType;
  if (min !== undefined) {
    input.min = String(min);
  }
  if (max !== undefined) {
    input.max = String(max);
  }
  if (step !== undefined) {
    input.step = String(step);
  }
  wrapper.append(labelNode, input);
  elements.graphicsForm.append(wrapper);
}

function appendGraphicsSelectField({ scope, field, label, value, options }) {
  if (!elements.graphicsForm) {
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "visual-field";
  const labelNode = document.createElement("label");
  labelNode.textContent = label;
  const select = document.createElement("select");
  select.dataset.scope = scope;
  select.dataset.field = field;
  select.dataset.valueType = "string";
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    node.selected = option.value === value;
    select.append(node);
  }
  wrapper.append(labelNode, select);
  elements.graphicsForm.append(wrapper);
}

function buildGraphicsSelectOptions(options) {
  return (Array.isArray(options) ? options : [])
    .filter((option) => option && typeof option.value === "string")
    .map((option) => ({
      value: option.value,
      label: option.labelKey ? t(option.labelKey) : option.label ?? option.value,
    }));
}

function coerceGraphicsFieldValue(valueType, rawValue) {
  if (valueType === "number") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (valueType === "integer") {
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return rawValue;
}

function ensureSelectedVisualLayer() {
  const visual = getSelectedEntityVisual();
  if (!visual) {
    selectedVisualLayerId = "";
    return;
  }
  const ids = new Set((visual.layers ?? []).map((layer) => layer.id));
  if (!selectedVisualLayerId || !ids.has(selectedVisualLayerId)) {
    selectedVisualLayerId = visual.layers?.[0]?.id ?? "";
  }
}

function getSelectedEntityVisual() {
  return getEntityVisual(selectedVisualEntityKey);
}

function getEntityVisual(entityKey) {
  return entityVisualCatalog.entities?.[entityKey] ?? null;
}

function getGraphicsEntityLabel(entityKey) {
  const labelKey = `graphics.entity.${entityKey}`;
  const translated = t(labelKey);
  if (translated !== labelKey) {
    return translated;
  }
  return getEntityVisual(entityKey)?.label ?? entityKey;
}

function defaultGraphicsEditorConfig() {
  return {
    entityKinds: {
      robot: "actor",
      enemy: "actor",
      scrap: "pickup",
      cell: "pickup",
      chip: "pickup",
      hazard: "field",
      obstacle: "structure",
      wall: "structure",
      base: "anchor",
    },
    entityTemplates: [
      {
        id: "frameBot",
        labelKey: "graphics.template.frameBot",
        visual: {
          canvasSize: 24,
          layers: [
            {
              id: "template-body",
              type: "shape",
              shape: "rectangle",
              x: { kind: "center" },
              y: { kind: "center" },
              width: { scale: 0.82, min: 16 },
              height: { scale: 0.82, min: 16 },
              fill: "#ee9041",
              fillOpacity: 0.94,
              stroke: "#ffcd9f",
              strokeWidth: 1,
              radius: 3,
              textureType: "stripes",
              textureColor: "#6b2f14",
              textureScale: 4,
              stripeWidth: 1.2,
              stripeAngle: 90,
              stripeGap: 5,
            },
            {
              id: "template-glyph",
              type: "glyph",
              glyph: { kind: "entityInitial" },
              x: { kind: "center" },
              y: { kind: "center", offset: 0.2 },
              fontSize: { scale: 0.31, min: 7 },
              glyphColor: "#201006",
              stroke: "#ffe2b9",
              strokeWidth: 0,
            },
          ],
        },
      },
      {
        id: "signalToken",
        labelKey: "graphics.template.signalToken",
        visual: {
          canvasSize: 22,
          layers: [
            {
              id: "template-token",
              type: "shape",
              shape: "circle",
              x: { kind: "center" },
              y: { kind: "center" },
              width: { scale: 0.76, min: 14 },
              height: { scale: 0.76, min: 14 },
              fill: "#1e120b",
              fillOpacity: 0.9,
              stroke: "#f2a860",
              strokeWidth: 1,
              textureType: "dither",
              textureColor: "#f2a860",
              textureScale: 3,
            },
            {
              id: "template-glyph",
              type: "glyph",
              glyph: { kind: "entityInitial" },
              x: { kind: "center" },
              y: { kind: "center" },
              fontSize: { scale: 0.34, min: 7 },
              glyphColor: "#ffdcb4",
              stroke: "#1a0d08",
              strokeWidth: 0,
            },
          ],
        },
      },
      {
        id: "hazardBeacon",
        labelKey: "graphics.template.hazardBeacon",
        visual: {
          canvasSize: 40,
          layers: [
            {
              id: "template-field",
              type: "shape",
              shape: "rectangle",
              x: { kind: "center" },
              y: { kind: "center" },
              width: { scale: 1, min: 40 },
              height: { scale: 1, min: 40 },
              fill: "#ff8e3f",
              fillOpacity: 0.08,
              stroke: "#ff9e5c",
              strokeWidth: 1,
              radius: 0,
              textureType: "stripes",
              textureColor: "#ffb25e",
              textureScale: 4,
              stripeWidth: 1.5,
              stripeAngle: 135,
              stripeGap: 7,
            },
            {
              id: "template-core",
              type: "shape",
              shape: "star",
              x: { kind: "center" },
              y: { kind: "center" },
              width: { scale: 0.42, min: 12 },
              height: { scale: 0.42, min: 12 },
              points: 5,
              outerRadius: { scale: 0.18, min: 6 },
              innerRadius: { scale: 0.08, min: 3 },
              fill: "#ffbe7e",
              fillOpacity: 0.86,
              stroke: "#ffe4c2",
              strokeWidth: 0,
            },
          ],
        },
      },
      {
        id: "platedBlock",
        labelKey: "graphics.template.platedBlock",
        visual: {
          canvasSize: 36,
          layers: [
            {
              id: "template-shell",
              type: "shape",
              shape: "rectangle",
              x: { kind: "center" },
              y: { kind: "center" },
              width: { scale: 0.94, min: 28 },
              height: { scale: 0.94, min: 28 },
              fill: "#0b0603",
              fillOpacity: 0.96,
              stroke: "#aa865f",
              strokeWidth: 1,
              radius: 0,
              textureType: "stripes",
              textureColor: "#6a4d32",
              textureScale: 5,
              stripeWidth: 2,
              stripeAngle: 45,
              stripeGap: 6,
            },
            {
              id: "template-core",
              type: "shape",
              shape: "rectangle",
              x: { kind: "center" },
              y: { kind: "center" },
              width: { scale: 0.56, min: 16 },
              height: { scale: 0.56, min: 16 },
              fill: "#1a120b",
              fillOpacity: 0.72,
              stroke: "#33261c",
              strokeWidth: 1,
              radius: 0,
              textureType: "dither",
              textureVariant: "cross",
              textureColor: "#8f6a4a",
              textureScale: 3,
            },
          ],
        },
      },
    ],
    layerTypeOptions: [
      { value: "shape", labelKey: "graphics.option.layer.shape" },
      { value: "glyph", labelKey: "graphics.option.layer.glyph" },
    ],
    shapeOptions: [
      { value: "rectangle", labelKey: "graphics.option.shape.rectangle" },
      { value: "circle", labelKey: "graphics.option.shape.circle" },
      { value: "polygon", labelKey: "graphics.option.shape.polygon" },
      { value: "star", labelKey: "graphics.option.shape.star" },
    ],
    textureTypeOptions: [
      { value: "none", labelKey: "graphics.option.texture.none" },
      { value: "stripes", labelKey: "graphics.option.texture.stripes" },
      { value: "dither", labelKey: "graphics.option.texture.dither" },
    ],
    ditherVariantOptions: [
      { value: "checker", labelKey: "graphics.option.dither.checker" },
      { value: "noise", labelKey: "graphics.option.dither.noise" },
      { value: "cross", labelKey: "graphics.option.dither.cross" },
    ],
    defaultShapeLayer: {
      shape: "rectangle",
      x: { kind: "center" },
      y: { kind: "center" },
      width: { scale: 0.72, min: 8, round: "integer" },
      height: { scale: 0.72, min: 8, round: "integer" },
      fill: "#f28d35",
      fillOpacity: 0.9,
      stroke: "#ffd8ad",
      strokeWidth: 1,
      radius: 2,
      rotation: 0,
      sides: 6,
      points: 5,
      innerRadius: { scale: 0.18, min: 3 },
      outerRadius: { scale: 0.34, min: 5 },
      textureType: "none",
      textureVariant: "checker",
      textureColor: "#33261c",
      textureScale: 4,
      stripeWidth: 1,
      stripeAngle: 45,
      stripeGap: 5,
    },
    defaultGlyphLayer: {
      glyph: { kind: "entityInitial" },
      x: { kind: "center" },
      y: { kind: "center" },
      fontSize: { scale: 0.32, min: 7 },
      glyphColor: "#f0d8bb",
      stroke: "#0d0805",
      strokeWidth: 0,
      rotation: 0,
    },
    shapePresets: [
      {
        id: "panel",
        labelKey: "graphics.preset.panel",
        patch: {
          shape: "rectangle",
          x: { kind: "center" },
          y: { kind: "center" },
          width: { scale: 0.82, min: 10 },
          height: { scale: 0.62, min: 10 },
          radius: { scale: 0.08, min: 1 },
          rotation: 0,
          fillOpacity: 0.92,
          textureType: "stripes",
          textureVariant: "checker",
          stripeWidth: 1,
          stripeAngle: 0,
          stripeGap: 5,
        },
      },
      {
        id: "token",
        labelKey: "graphics.preset.token",
        patch: {
          shape: "circle",
          x: { kind: "center" },
          y: { kind: "center" },
          width: { scale: 0.76, min: 10 },
          height: { scale: 0.76, min: 10 },
          radius: 0,
          rotation: 0,
          fillOpacity: 0.94,
          textureType: "dither",
          textureVariant: "checker",
          textureScale: 3,
        },
      },
      {
        id: "shard",
        labelKey: "graphics.preset.shard",
        patch: {
          shape: "polygon",
          x: { kind: "center" },
          y: { kind: "center" },
          width: { scale: 0.7, min: 10 },
          height: { scale: 0.8, min: 10 },
          radius: 0,
          rotation: 45,
          sides: 4,
          fillOpacity: 0.9,
          textureType: "stripes",
          textureVariant: "checker",
          stripeWidth: 1,
          stripeAngle: 45,
          stripeGap: 4,
        },
      },
      {
        id: "beacon",
        labelKey: "graphics.preset.beacon",
        patch: {
          shape: "star",
          x: { kind: "center" },
          y: { kind: "center" },
          width: { scale: 0.72, min: 10 },
          height: { scale: 0.72, min: 10 },
          radius: 0,
          rotation: 0,
          points: 5,
          outerRadius: { scale: 0.36, min: 5 },
          innerRadius: { scale: 0.18, min: 3 },
          fillOpacity: 0.94,
          textureType: "dither",
          textureVariant: "cross",
          textureScale: 3,
        },
      },
    ],
    fillSwatches: [
      { id: "accent", value: "#f28d35" },
      { id: "sand", value: "#ffd8ad" },
      { id: "iron", value: "#8f6a4a" },
      { id: "ash", value: "#33261c" },
      { id: "signal", value: "#00ff88" },
      { id: "hazard", value: "#db5a42" },
    ],
    textureSwatches: [
      { id: "char", value: "#33261c" },
      { id: "rust", value: "#a64f21" },
      { id: "sand", value: "#ffd8ad" },
      { id: "teal", value: "#4fa3a5" },
      { id: "violet", value: "#7a5ed1" },
      { id: "ember", value: "#f28d35" },
    ],
  };
}

function normalizeGraphicsEditorConfig(config = {}) {
  const fallback = defaultGraphicsEditorConfig();
  return {
    entityKinds:
      config.entityKinds && typeof config.entityKinds === "object"
        ? cloneJson(config.entityKinds)
        : fallback.entityKinds,
    entityTemplates:
      Array.isArray(config.entityTemplates) && config.entityTemplates.length > 0
        ? cloneJson(config.entityTemplates)
        : fallback.entityTemplates,
    entityFields:
      Array.isArray(config.entityFields) && config.entityFields.length > 0
        ? cloneJson(config.entityFields)
        : fallback.entityFields,
    layerBaseFields:
      Array.isArray(config.layerBaseFields) && config.layerBaseFields.length > 0
        ? cloneJson(config.layerBaseFields)
        : fallback.layerBaseFields,
    glyphFields:
      Array.isArray(config.glyphFields) && config.glyphFields.length > 0
        ? cloneJson(config.glyphFields)
        : fallback.glyphFields,
    shapeFields:
      Array.isArray(config.shapeFields) && config.shapeFields.length > 0
        ? cloneJson(config.shapeFields)
        : fallback.shapeFields,
    layerTypeOptions:
      Array.isArray(config.layerTypeOptions) && config.layerTypeOptions.length > 0
        ? cloneJson(config.layerTypeOptions)
        : fallback.layerTypeOptions,
    shapeOptions:
      Array.isArray(config.shapeOptions) && config.shapeOptions.length > 0
        ? cloneJson(config.shapeOptions)
        : fallback.shapeOptions,
    textureTypeOptions:
      Array.isArray(config.textureTypeOptions) && config.textureTypeOptions.length > 0
        ? cloneJson(config.textureTypeOptions)
        : fallback.textureTypeOptions,
    ditherVariantOptions:
      Array.isArray(config.ditherVariantOptions) && config.ditherVariantOptions.length > 0
        ? cloneJson(config.ditherVariantOptions)
        : fallback.ditherVariantOptions,
    defaultShapeLayer:
      config.defaultShapeLayer && typeof config.defaultShapeLayer === "object"
        ? cloneJson(config.defaultShapeLayer)
        : fallback.defaultShapeLayer,
    defaultGlyphLayer:
      config.defaultGlyphLayer && typeof config.defaultGlyphLayer === "object"
        ? cloneJson(config.defaultGlyphLayer)
        : fallback.defaultGlyphLayer,
    shapePresets:
      Array.isArray(config.shapePresets) && config.shapePresets.length > 0
        ? cloneJson(config.shapePresets)
        : fallback.shapePresets,
    fillSwatches:
      Array.isArray(config.fillSwatches) && config.fillSwatches.length > 0
        ? cloneJson(config.fillSwatches)
        : fallback.fillSwatches,
    textureSwatches:
      Array.isArray(config.textureSwatches) && config.textureSwatches.length > 0
        ? cloneJson(config.textureSwatches)
        : fallback.textureSwatches,
  };
}

function createDefaultShapeLayer(visual) {
  const canvasSize = Number(visual.canvasSize ?? 24);
  const template = resolveGraphicsTemplateObject(graphicsEditorConfig.defaultShapeLayer ?? {}, {
    canvasSize,
    entityKey: selectedVisualEntityKey,
  });
  return {
    id: `${selectedVisualEntityKey}-shape-${Date.now().toString(36)}`,
    type: "shape",
    ...template,
  };
}

function createDefaultGlyphLayer(visual, entityKey) {
  const canvasSize = Number(visual.canvasSize ?? 24);
  const template = resolveGraphicsTemplateObject(graphicsEditorConfig.defaultGlyphLayer ?? {}, {
    canvasSize,
    entityKey,
  });
  return {
    id: `${selectedVisualEntityKey}-glyph-${Date.now().toString(36)}`,
    type: "glyph",
    ...template,
  };
}

function upgradeVisualLayerType(layer, nextType, visual) {
  layer.type = nextType;
  if (nextType === "glyph") {
    Object.assign(layer, createDefaultGlyphLayer(visual, selectedVisualEntityKey), {
      id: layer.id,
      type: "glyph",
      x: layer.x ?? (visual?.canvasSize ?? 24) / 2,
      y: layer.y ?? (visual?.canvasSize ?? 24) / 2,
    });
    return;
  }
  Object.assign(layer, createDefaultShapeLayer(visual), {
    id: layer.id,
    type: "shape",
    x: layer.x ?? (visual?.canvasSize ?? 24) / 2,
    y: layer.y ?? (visual?.canvasSize ?? 24) / 2,
  });
}

function normalizeShapeLayer(layer, visual = getSelectedEntityVisual()) {
  if (layer.type !== "shape") {
    return;
  }
  const canvasSize = Number(visual?.canvasSize ?? 24);
  if (layer.shape === "polygon" && !layer.sides) {
    layer.sides = 6;
  }
  if (layer.shape === "star") {
    if (!layer.points) {
      layer.points = 5;
    }
    if (!layer.outerRadius) {
      layer.outerRadius = Math.max(layer.width ?? 6, layer.height ?? 6) / 2;
    }
    if (!layer.innerRadius) {
      layer.innerRadius = layer.outerRadius * 0.55;
    }
  }
  if (layer.x === undefined) {
    layer.x = canvasSize / 2;
  }
  if (layer.y === undefined) {
    layer.y = canvasSize / 2;
  }
}

function describeVisualLayerTitle(layer) {
  const layerType = t(`graphics.option.layer.${layer.type ?? "shape"}`);
  const detail = layer.type === "glyph" ? layer.glyph ?? "" : t(`graphics.option.shape.${layer.shape ?? "rectangle"}`);
  return `${layerType} // ${detail}`;
}

function describeVisualLayerMeta(layer) {
  const flags = [
    layer.visible === false ? t("graphics.layerHidden") : t("graphics.layerVisible"),
    layer.locked ? t("graphics.layerLocked") : t("graphics.layerUnlocked"),
  ];
  return `${layer.id} // ${flags.join(" / ")}`;
}

function moveSelectedVisualLayer(delta) {
  const visual = getSelectedEntityVisual();
  if (!visual || !selectedVisualLayerId) {
    return;
  }
  const index = visual.layers.findIndex((layer) => layer.id === selectedVisualLayerId);
  if (index < 0) {
    return;
  }
  const nextIndex = clamp(index + delta, 0, visual.layers.length - 1);
  if (nextIndex === index) {
    return;
  }
  const [layer] = visual.layers.splice(index, 1);
  visual.layers.splice(nextIndex, 0, layer);
  persistEntityVisualCatalog();
}

function normalizeColorValue(value, fallback) {
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value;
  }
  return fallback;
}

function buildEntityVisualDataUrl(entityKey, visual = getEntityVisual(entityKey)) {
  if (!visual) {
    return "";
  }
  const cacheKey = `${entityKey}:${JSON.stringify(visual)}`;
  if (entityVisualDataUrlCache.has(cacheKey)) {
    return entityVisualDataUrlCache.get(cacheKey);
  }
  const svg = renderEntityVisualSvg(visual);
  const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  entityVisualDataUrlCache.set(cacheKey, dataUrl);
  return dataUrl;
}

function renderEntityVisualSvg(visual) {
  const canvasSize = Number(visual.canvasSize ?? 24);
  const defs = [];
  const body = (visual.layers ?? [])
    .map((layer, index) => renderEntityVisualLayer(layer, index, defs))
    .join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="${canvasSize}" height="${canvasSize}">`,
    defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "",
    body,
    "</svg>",
  ].join("");
}

function renderEntityVisualLayer(layer, index, defs) {
  if (layer.visible === false) {
    return "";
  }
  if (layer.type === "glyph") {
    return renderGlyphLayer(layer);
  }
  return renderShapeLayer(layer, index, defs);
}

function toggleLayerVisible(layerId) {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === layerId);
  if (!layer) {
    return;
  }
  layer.visible = layer.visible === false;
  persistEntityVisualCatalog();
}

function toggleLayerLocked(layerId) {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === layerId);
  if (!layer) {
    return;
  }
  layer.locked = !layer.locked;
  persistEntityVisualCatalog();
}

function importSelectedEntityVisual(source) {
  const entityKey = selectedVisualEntityKey;
  if (!entityKey) {
    return;
  }
  try {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.layers)) {
      throw new Error("Missing layers array.");
    }
    entityVisualCatalog.entities[entityKey] = cloneJson(parsed);
    ensureSelectedVisualLayer();
    persistEntityVisualCatalog();
    showToast({ title: t("graphics.importSuccess"), body: getGraphicsEntityLabel(entityKey) }, "success");
  } catch (error) {
    console.warn("Failed to import selected entity visual.", error);
    showToast({ title: t("graphics.importFailed"), body: String(error.message ?? error) }, "failure");
  }
}

function exportGraphicsTemplate(templateId) {
  const template = getAllGraphicsTemplates().find((item) => item.id === templateId);
  if (!template || !elements.graphicsEntityIo) {
    return;
  }
  elements.graphicsEntityIo.value = JSON.stringify(serializeGraphicsTemplate(template), null, 2);
  elements.graphicsEntityIo.focus();
  elements.graphicsEntityIo.select();
  renderGraphicsEditor();
  showToast({ title: t("graphics.templateExported"), body: getGraphicsTemplateLabel(template) }, "success");
}

function exportGraphicsTemplateLibrary() {
  if (!elements.graphicsEntityIo) {
    return;
  }
  const payload = serializeGraphicsTemplateLibrary(customGraphicsTemplates);
  elements.graphicsEntityIo.value = JSON.stringify(payload, null, 2);
  elements.graphicsEntityIo.focus();
  elements.graphicsEntityIo.select();
  renderGraphicsEditor();
  showToast(
    {
      title: t("graphics.templateLibraryExported"),
      body: t("graphics.templateLibraryCount", { count: payload.templates.length }),
    },
    "success",
  );
}

function applyEntityTemplate(templateId) {
  const entityKey = selectedVisualEntityKey;
  if (!entityKey) {
    return;
  }
  const template = getAllGraphicsTemplates().find((item) => item.id === templateId);
  if (!template?.visual) {
    return;
  }
  const currentVisual = getSelectedEntityVisual();
  const nextCanvasSize = Number(template.visual.canvasSize ?? currentVisual?.canvasSize ?? 24);
  const resolvedVisual = resolveGraphicsTemplateValue(template.visual, {
    canvasSize: nextCanvasSize,
    entityKey,
  });
  entityVisualCatalog.entities[entityKey] = {
    label: currentVisual?.label ?? getGraphicsEntityLabel(entityKey),
    canvasSize: Number(resolvedVisual.canvasSize ?? nextCanvasSize),
    layers: Array.isArray(resolvedVisual.layers) ? resolvedVisual.layers : [],
  };
  ensureSelectedVisualLayer();
  persistEntityVisualCatalog();
  recordRecentGraphicsTemplate(template.id);
  showToast({ title: t("graphics.templateApplied"), body: getGraphicsTemplateLabel(template) }, "success");
}

function saveCurrentEntityAsTemplate() {
  const entityKey = selectedVisualEntityKey;
  const visual = getSelectedEntityVisual();
  if (!entityKey || !visual) {
    return;
  }
  const nextLabel = elements.graphicsTemplateName?.value.trim() || buildDefaultCustomTemplateLabel(entityKey);
  const normalizedTemplate = normalizeGraphicsCustomTemplate(
    {
      id: buildCustomTemplateId(entityKey, nextLabel),
      label: nextLabel,
      description: getGraphicsEntityLabel(entityKey),
      categoryKey: "graphics.templateCategory.custom",
      entityKinds: getGraphicsEntityKind(entityKey) ? [getGraphicsEntityKind(entityKey)] : [],
      originEntityKey: entityKey,
      updatedAt: Date.now(),
      visual: cloneJson(visual),
    },
    customGraphicsTemplates.length,
  );
  if (!normalizedTemplate) {
    return;
  }
  upsertCustomGraphicsTemplate(normalizedTemplate);
  if (elements.graphicsTemplateName) {
    elements.graphicsTemplateName.value = "";
  }
  showToast({ title: t("graphics.templateSaved"), body: normalizedTemplate.label }, "success");
}

function importGraphicsTemplate(source) {
  try {
    const parsed = JSON.parse(source);
    if (isGraphicsTemplateLibraryPayload(parsed)) {
      importGraphicsTemplateLibrary(parsed);
      return;
    }
    if (parsed?.kind && parsed.kind !== "graphics-template") {
      throw new Error("Unsupported template payload.");
    }
    if (!parsed || typeof parsed !== "object" || !parsed.visual || !Array.isArray(parsed.visual.layers)) {
      throw new Error("Missing visual.layers in template payload.");
    }
    const normalizedTemplate = normalizeGraphicsCustomTemplate(
      {
        ...parsed,
        id: resolveImportedGraphicsTemplateId(parsed),
        updatedAt: Date.now(),
      },
      customGraphicsTemplates.length,
    );
    if (!normalizedTemplate) {
      throw new Error("Template payload could not be normalized.");
    }
    upsertCustomGraphicsTemplate(normalizedTemplate);
    if (elements.graphicsTemplateName && !elements.graphicsTemplateName.value.trim()) {
      elements.graphicsTemplateName.value = normalizedTemplate.label;
    }
    showToast({ title: t("graphics.templateImported"), body: normalizedTemplate.label }, "success");
  } catch (error) {
    console.warn("Failed to import graphics template.", error);
    showToast({ title: t("graphics.templateImportFailed"), body: String(error.message ?? error) }, "failure");
  }
}

function importGraphicsTemplateLibrary(payload) {
  const templates = Array.isArray(payload?.templates) ? payload.templates : [];
  if (templates.length === 0) {
    throw new Error("Template library payload is empty.");
  }
  const normalizedTemplates = templates
    .map((template, index) =>
      normalizeGraphicsCustomTemplate(
        {
          ...template,
          id: resolveImportedGraphicsTemplateId(template),
          updatedAt: Date.now() + index,
        },
        customGraphicsTemplates.length + index,
      ),
    )
    .filter(Boolean);
  if (normalizedTemplates.length === 0) {
    throw new Error("Template library payload could not be normalized.");
  }
  upsertCustomGraphicsTemplates(normalizedTemplates);
  showToast(
    {
      title: t("graphics.templateLibraryImported"),
      body: t("graphics.templateLibraryCount", { count: normalizedTemplates.length }),
    },
    "success",
  );
}

function recordRecentGraphicsTemplate(templateId) {
  if (!templateId) {
    return;
  }
  recentGraphicsTemplateIds = [templateId, ...recentGraphicsTemplateIds.filter((item) => item !== templateId)];
  persistRecentGraphicsTemplates();
}

function recordRecentGraphicsTemplates(templateIds) {
  if (!Array.isArray(templateIds) || templateIds.length === 0) {
    return;
  }
  const uniqueIds = [...new Set(templateIds.filter(Boolean))];
  recentGraphicsTemplateIds = [
    ...uniqueIds,
    ...recentGraphicsTemplateIds.filter((item) => !uniqueIds.includes(item)),
  ];
  persistRecentGraphicsTemplates();
}

function upsertCustomGraphicsTemplate(template) {
  customGraphicsTemplates = [template, ...customGraphicsTemplates.filter((item) => item.id !== template.id)];
  persistCustomGraphicsTemplates();
  recordRecentGraphicsTemplate(template.id);
}

function upsertCustomGraphicsTemplates(templates) {
  if (!Array.isArray(templates) || templates.length === 0) {
    return;
  }
  const importedIds = new Set(templates.map((template) => template.id));
  customGraphicsTemplates = [...templates, ...customGraphicsTemplates.filter((item) => !importedIds.has(item.id))];
  persistCustomGraphicsTemplates();
  recordRecentGraphicsTemplates(templates.map((template) => template.id));
}

function resolveImportedGraphicsTemplateId(template) {
  const desiredId =
    typeof template?.id === "string" && template.id.trim()
      ? template.id.trim()
      : buildCustomTemplateId(template?.originEntityKey ?? selectedVisualEntityKey ?? "template", template?.label ?? "imported");
  const builtinConflict = defaultGraphicsTemplates.some((item) => item.id === desiredId);
  if (builtinConflict) {
    return `custom-import-${Date.now().toString(36)}`;
  }
  return desiredId;
}

function buildDefaultCustomTemplateLabel(entityKey) {
  const entityLabel = getGraphicsEntityLabel(entityKey);
  const similarCount = customGraphicsTemplates.filter((template) => template.originEntityKey === entityKey).length + 1;
  return `${entityLabel} // ${String(similarCount).padStart(2, "0")}`;
}

function buildCustomTemplateId(entityKey, label) {
  const slug = String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `custom-${entityKey}-${slug || "template"}-${Date.now().toString(36)}`;
}

function removeCustomGraphicsTemplate(templateId) {
  if (!templateId) {
    return;
  }
  const template = customGraphicsTemplates.find((item) => item.id === templateId);
  if (!template) {
    return;
  }
  customGraphicsTemplates = customGraphicsTemplates.filter((item) => item.id !== templateId);
  recentGraphicsTemplateIds = recentGraphicsTemplateIds.filter((item) => item !== templateId);
  persistCustomGraphicsTemplates();
  persistRecentGraphicsTemplates();
  showToast({ title: t("graphics.templateDeleted"), body: getGraphicsTemplateLabel(template) }, "success");
}

function serializeGraphicsTemplate(template) {
  return {
    kind: "graphics-template",
    version: 1,
    id: template.id,
    label: getGraphicsTemplateLabel(template),
    description: getGraphicsTemplateDescription(template),
    categoryKey: template.categoryKey ?? "graphics.templateCategory.custom",
    categoryLabel: typeof template.categoryLabel === "string" ? template.categoryLabel : "",
    entityKinds: Array.isArray(template.entityKinds) ? [...template.entityKinds] : [],
    originEntityKey: template.originEntityKey ?? "",
    updatedAt: Number(template.updatedAt ?? Date.now()),
    visual: cloneJson(template.visual),
  };
}

function serializeGraphicsTemplateLibrary(templates) {
  return {
    kind: "graphics-template-library",
    version: 1,
    exportedAt: Date.now(),
    templates: templates.map((template) => serializeGraphicsTemplate(template)),
  };
}

function isGraphicsTemplateLibraryPayload(payload) {
  return (
    payload?.kind === "graphics-template-library" ||
    (Array.isArray(payload?.templates) && (!payload.kind || payload.kind === "graphics-template-library"))
  );
}

function applyShapePreset(presetId) {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  if (!visual || !layer || layer.type !== "shape" || layer.locked) {
    return;
  }
  const canvasSize = Number(visual.canvasSize ?? 24);
  const preset = (graphicsEditorConfig.shapePresets ?? []).find((item) => item.id === presetId);
  if (!preset) {
    return;
  }
  Object.assign(
    layer,
    resolveGraphicsTemplateObject(preset.patch ?? {}, {
      canvasSize,
      entityKey: selectedVisualEntityKey,
    }),
  );
  normalizeShapeLayer(layer, visual);
  persistEntityVisualCatalog();
}

function resolveGraphicsTemplateObject(patch, context) {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, resolveGraphicsTemplateValue(value, context)]),
  );
}

function resolveGraphicsTemplateValue(value, context) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveGraphicsTemplateValue(item, context));
  }
  if (value === null || value === undefined || typeof value !== "object") {
    return value;
  }
  if (value.kind === "center") {
    const canvasSize = Number(context.canvasSize ?? 24);
    return canvasSize / 2 + Number(value.offset ?? 0);
  }
  if (value.kind === "entityInitial") {
    return String(context.entityKey ?? "?").slice(0, 1).toUpperCase() || "?";
  }
  if ("scale" in value) {
    const canvasSize = Number(context.canvasSize ?? 24);
    let resolved = canvasSize * Number(value.scale ?? 0);
    if (value.round === "integer") {
      resolved = Math.round(resolved);
    }
    if (Number.isFinite(Number(value.min))) {
      resolved = Math.max(resolved, Number(value.min));
    }
    if (Number.isFinite(Number(value.max))) {
      resolved = Math.min(resolved, Number(value.max));
    }
    return resolved;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, resolveGraphicsTemplateValue(child, context)]),
  );
}

function buildFillSwatchesForSelection() {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  if (!layer) {
    return [];
  }
  const field = layer.type === "glyph" ? "glyphColor" : "fill";
  const currentValue = normalizeColorValue(layer[field], field === "glyphColor" ? "#f0d8bb" : "#f28d35").toLowerCase();
  return (graphicsEditorConfig.fillSwatches ?? []).map((swatch) => ({
    kind: "fill",
    value: normalizeColorValue(swatch.value, "#f28d35"),
    selected: normalizeColorValue(swatch.value, "#f28d35").toLowerCase() === currentValue,
    disabled: Boolean(layer.locked),
    title: `${t("graphics.fillSwatches")} // ${swatch.id ?? swatch.value}`,
    preview: buildGraphicsColorPreview(normalizeColorValue(swatch.value, "#f28d35")),
  }));
}

function buildTextureSwatchesForSelection() {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  if (!layer || layer.type !== "shape" || (layer.textureType ?? "none") === "none") {
    return [];
  }
  const currentValue = normalizeColorValue(layer.textureColor, "#33261c").toLowerCase();
  return (graphicsEditorConfig.textureSwatches ?? []).map((swatch) => {
    const color = normalizeColorValue(swatch.value, "#33261c");
    return {
      kind: "texture",
      value: color,
      selected: color.toLowerCase() === currentValue,
      disabled: Boolean(layer.locked),
      title: `${t("graphics.textureSwatches")} // ${swatch.id ?? swatch.value}`,
      preview: buildGraphicsTexturePreview(color, layer.textureType),
    };
  });
}

function buildGraphicsColorPreview(color) {
  return `linear-gradient(180deg, ${color}, ${color})`;
}

function buildGraphicsTexturePreview(color, textureType) {
  if (textureType === "stripes") {
    return `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 5px), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`;
  }
  return `radial-gradient(circle at 25% 25%, ${color} 0 1px, transparent 1px 100%), radial-gradient(circle at 75% 75%, ${color} 0 1px, transparent 1px 100%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`;
}

function applyGraphicsSwatch(kind, value) {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  if (!visual || !layer || layer.locked) {
    return;
  }
  if (kind === "fill") {
    if (layer.type === "glyph") {
      layer.glyphColor = value;
    } else {
      layer.fill = value;
    }
    persistEntityVisualCatalog();
    return;
  }
  if (kind === "texture" && layer.type === "shape" && (layer.textureType ?? "none") !== "none") {
    layer.textureColor = value;
    persistEntityVisualCatalog();
  }
}

function renderGlyphLayer(layer) {
  const transform = buildLayerTransform(layer);
  const strokeWidth = Number(layer.strokeWidth ?? 0);
  const stroke = strokeWidth > 0 ? normalizeColorValue(layer.stroke, "#000000") : "none";
  return [
    `<text`,
    ` x="${Number(layer.x ?? 0)}"`,
    ` y="${Number(layer.y ?? 0)}"`,
    ` fill="${normalizeColorValue(layer.glyphColor, "#f0d8bb")}"`,
    ` font-family="RAL Mono, monospace"`,
    ` font-size="${Number(layer.fontSize ?? 8)}"`,
    ` text-anchor="middle"`,
    ` dominant-baseline="central"`,
    ` stroke="${stroke}"`,
    ` stroke-width="${strokeWidth}"`,
    transform ? ` transform="${transform}"` : "",
    ` paint-order="stroke fill">`,
    escapeXml(layer.glyph ?? ""),
    `</text>`,
  ].join("");
}

function renderShapeLayer(layer, index, defs) {
  const fill = normalizeColorValue(layer.fill, "#f28d35");
  const fillOpacity = Number(layer.fillOpacity ?? 1);
  const strokeWidth = Number(layer.strokeWidth ?? 0);
  const stroke = strokeWidth > 0 ? normalizeColorValue(layer.stroke, "#000000") : "none";
  const baseShape = buildShapeMarkup(layer, {
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
  });
  if (!layer.textureType || layer.textureType === "none") {
    return baseShape;
  }

  const patternId = `texture-${index}`;
  defs.push(buildTexturePattern(patternId, layer));
  const textureShape = buildShapeMarkup(layer, {
    fill: `url(#${patternId})`,
    fillOpacity: 0.68,
    stroke: "none",
    strokeWidth: 0,
  });
  return `${baseShape}${textureShape}`;
}

function buildShapeMarkup(layer, { fill, fillOpacity, stroke, strokeWidth }) {
  const common = {
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    transform: buildLayerTransform(layer),
  };
  switch (layer.shape) {
    case "circle":
      return buildEllipseMarkup(layer, common);
    case "polygon":
      return buildPolygonMarkup(layer, common, Number(layer.sides ?? 6));
    case "star":
      return buildStarMarkup(layer, common);
    case "rectangle":
    default:
      return buildRectangleMarkup(layer, common);
  }
}

function buildRectangleMarkup(layer, common) {
  const width = Number(layer.width ?? 0);
  const height = Number(layer.height ?? 0);
  const x = Number(layer.x ?? 0) - width / 2;
  const y = Number(layer.y ?? 0) - height / 2;
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}"`,
    ` rx="${Number(layer.radius ?? 0)}"`,
    buildCommonSvgAttributes(common),
    ` />`,
  ].join("");
}

function buildEllipseMarkup(layer, common) {
  return [
    `<ellipse cx="${Number(layer.x ?? 0)}" cy="${Number(layer.y ?? 0)}"`,
    ` rx="${Number(layer.width ?? 0) / 2}"`,
    ` ry="${Number(layer.height ?? 0) / 2}"`,
    buildCommonSvgAttributes(common),
    ` />`,
  ].join("");
}

function buildPolygonMarkup(layer, common, sides) {
  const points = buildRegularPolygonPoints(layer, sides);
  return `<polygon points="${points}"${buildCommonSvgAttributes(common)} />`;
}

function buildStarMarkup(layer, common) {
  const points = buildStarPolygonPoints(layer);
  return `<polygon points="${points}"${buildCommonSvgAttributes(common)} />`;
}

function buildCommonSvgAttributes({ fill, fillOpacity, stroke, strokeWidth, transform }) {
  return [
    ` fill="${fill}"`,
    ` fill-opacity="${fillOpacity}"`,
    ` stroke="${stroke}"`,
    ` stroke-width="${strokeWidth}"`,
    transform ? ` transform="${transform}"` : "",
  ].join("");
}

function buildRegularPolygonPoints(layer, sides) {
  const cx = Number(layer.x ?? 0);
  const cy = Number(layer.y ?? 0);
  const rx = Number(layer.width ?? 0) / 2;
  const ry = Number(layer.height ?? 0) / 2;
  const angleOffset = (-90 * Math.PI) / 180;
  return Array.from({ length: Math.max(3, sides) }, (_, index) => {
    const angle = angleOffset + (index * Math.PI * 2) / Math.max(3, sides);
    return `${(cx + Math.cos(angle) * rx).toFixed(3)},${(cy + Math.sin(angle) * ry).toFixed(3)}`;
  }).join(" ");
}

function buildStarPolygonPoints(layer) {
  const cx = Number(layer.x ?? 0);
  const cy = Number(layer.y ?? 0);
  const points = Math.max(3, Number(layer.points ?? 5));
  const outerRadius = Number(layer.outerRadius ?? Math.max(layer.width ?? 0, layer.height ?? 0) / 2);
  const innerRadius = Number(layer.innerRadius ?? outerRadius * 0.55);
  const angleOffset = (-90 * Math.PI) / 180;
  return Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = angleOffset + (index * Math.PI) / points;
    return `${(cx + Math.cos(angle) * radius).toFixed(3)},${(cy + Math.sin(angle) * radius).toFixed(3)}`;
  }).join(" ");
}

function buildLayerTransform(layer) {
  const rotation = Number(layer.rotation ?? 0);
  if (!rotation) {
    return "";
  }
  return `rotate(${rotation} ${Number(layer.x ?? 0)} ${Number(layer.y ?? 0)})`;
}

function buildTexturePattern(patternId, layer) {
  if (layer.textureType === "dither") {
    return buildDitherPattern(patternId, layer);
  }
  return buildStripePattern(patternId, layer);
}

function buildStripePattern(patternId, layer) {
  const scale = Math.max(1, Number(layer.textureScale ?? 4));
  const gap = Math.max(1, Number(layer.stripeGap ?? 5)) * (scale / 4);
  const stripeWidth = Math.max(0.5, Number(layer.stripeWidth ?? 1)) * (scale / 4);
  const color = normalizeColorValue(layer.textureColor, "#33261c");
  const angle = Number(layer.stripeAngle ?? 45);
  return [
    `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${gap}" height="${gap}"`,
    ` patternTransform="rotate(${angle})">`,
    `<rect width="${stripeWidth}" height="${gap}" fill="${color}" fill-opacity="0.75" />`,
    `</pattern>`,
  ].join("");
}

function buildDitherPattern(patternId, layer) {
  const scale = Math.max(1, Number(layer.textureScale ?? 4));
  const size = Math.max(2, scale * 2);
  const color = normalizeColorValue(layer.textureColor, "#33261c");
  const variant = layer.textureVariant ?? "checker";
  let body = `<rect width="${size / 2}" height="${size / 2}" fill="${color}" fill-opacity="0.72" />`;
  if (variant === "noise") {
    body = [
      `<rect x="0" y="0" width="${size / 3}" height="${size / 3}" fill="${color}" fill-opacity="0.72" />`,
      `<rect x="${size / 2}" y="${size / 3}" width="${size / 4}" height="${size / 4}" fill="${color}" fill-opacity="0.54" />`,
      `<rect x="${size / 4}" y="${size / 1.6}" width="${size / 5}" height="${size / 5}" fill="${color}" fill-opacity="0.48" />`,
    ].join("");
  } else if (variant === "cross") {
    body = [
      `<rect x="${size / 2 - 0.5}" y="0" width="1" height="${size}" fill="${color}" fill-opacity="0.72" />`,
      `<rect x="0" y="${size / 2 - 0.5}" width="${size}" height="1" fill="${color}" fill-opacity="0.72" />`,
    ].join("");
  }
  return `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">${body}</pattern>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function applyEntityVisual(node, entityKey) {
  if (!node || !entityKey) {
    return;
  }
  const dataUrl = buildEntityVisualDataUrl(entityKey);
  if (!dataUrl) {
    node.classList.remove("entity-visualized");
    node.style.backgroundImage = "";
    return;
  }
  node.classList.add("entity-visualized");
  node.style.backgroundImage = `url("${dataUrl}")`;
  node.style.backgroundRepeat = "no-repeat";
  node.style.backgroundPosition = "center";
  node.style.backgroundSize = "contain";
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
    if (!next) {
      elements.devPanel.dataset.studio = "false";
      document.body.dataset.graphicsStudio = "false";
    }
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
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.devPanel?.dataset.studio === "true") {
    setGraphicsStudioOpen(false);
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
initializeGraphicsEditor();

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
  renderGraphicsEditor();
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
loadCustomGraphicsTemplates();
loadRecentGraphicsTemplates();
loadGraphicsTemplateFilterState();
await loadEntityVisualCatalog();
initializeAppData();
applyLanguage();
updateSidebarToggles();
updateEditorTools();
renderGraphicsEditor();
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
  elements.chips.textContent = state.resources.chips ?? 0;
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
    hazard: ["runtime.hazardFault", "runtime.recodeHazard"],
    combat: ["runtime.combatFault", "runtime.recodeCombat"],
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
  const recentLogText = state.logs.slice(0, 10).join(" | ");
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
  if (
    recentLogText.includes("Enemy strike") ||
    recentLogText.includes("hostile contact destroyed")
  ) {
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
  if ("stockBalance" in flow) {
    flow.stockBalance = flow.stockBalance || state.resources.memoryShards >= 3;
  }
  if ("combat" in flow && !flow.combat && beforeState?.enemies) {
    flow.combat = (state.enemies?.length ?? 0) < (beforeState.enemies?.length ?? 0);
  }
  if ("repair" in flow) {
    flow.repair = flow.repair || Boolean(beforeState && state.robot.hp > beforeState.robot.hp);
  }
  if ("chip" in flow && !flow.chip && beforeState?.resources) {
    flow.chip = (state.resources.chips ?? 0) > (beforeState.resources.chips ?? 0);
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
      `<span>${escapeHtml(suggestion.label ?? suggestion.value)}</span>` +
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
  const prefixText = editor.value.slice(lineStart, editor.selectionStart);
  const token = range.token;
  const lineNumber = editor.value.slice(0, range.start).split("\n").length;
  const column = range.start - lineStart;

  if (line.trimStart().startsWith("//")) {
    return null;
  }

  const labelContext = token.startsWith("@") || /\bGoto\s+@?[A-Za-z0-9_]*$/.test(beforeToken.trimStart());
  if (labelContext) {
    return {
      range,
      prefix: token,
      line,
      lineNumber,
      column,
      mode: "label",
    };
  }

  const explicitContext = getExplicitAutocompleteContext({
    line,
    lineStart,
    lineNumber,
    column,
    range,
    token,
    beforeToken,
    prefixText,
  });
  if (explicitContext) {
    return explicitContext;
  }

  if (!token) {
    return null;
  }

  return {
    range,
    prefix: token,
    line,
    lineNumber,
    column,
    mode: "instruction",
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

  if (context.mode === "explicit") {
    const contextual = context.suggestions
      .filter((item) => matchesCompletion(item.matchText ?? item.value, context.prefix))
      .slice(0, 8);
    const fallback = scriptCompletions
      .filter((item) => matchesCompletion(item.value, context.prefix))
      .slice(0, 8);
    return dedupeSuggestions([...contextual, ...fallback]).slice(0, 8);
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

function getExplicitAutocompleteContext(context) {
  const { line, lineStart, lineNumber, column, range, token, beforeToken, prefixText } = context;
  const trimmedPrefix = prefixText.trimStart();

  if (/^I[A-Za-z]*$/i.test(trimmedPrefix)) {
    return explicitAutocompleteContext({
      context,
      prefix: token || trimmedPrefix,
      suggestions: createAutocompleteSuggestions(
        TAPE_SCRIPT_EDITOR_MODEL.conditionals.map((keyword) => ({
          value: `${keyword} `,
          label: keyword,
          kindKey: "completion.kind.keyword",
          hintKey: "completion.hint.keyword",
        })),
      ),
    });
  }

  const queryPrefixMatch = trimmedPrefix.match(/^(If|IfNot)\s+([A-Za-z0-9_]*)$/);
  if (queryPrefixMatch) {
    return explicitAutocompleteContext({
      context,
      prefix: queryPrefixMatch[2].trim(),
      slot: "ifQueryStart",
      suggestions: createAutocompleteSuggestions([{
        value: "Check()",
        label: "Check()",
        kindKey: "completion.kind.query",
        hintKey: "completion.hint.query",
        matchText: "Check",
        selectionStartOffset: 6,
        selectionEndOffset: 6,
        triggerAutocomplete: true,
      }]),
    });
  }

  const targetMatch = prefixText.match(/Check\(([^()]*)$/);
  if (targetMatch) {
    return explicitAutocompleteContext({
      context,
      prefix: targetMatch[1].trim(),
      slot: "checkTarget",
      suggestions: createAutocompleteSuggestions(
        TAPE_SCRIPT_EDITOR_MODEL.checkTargets.map((target) => ({
          value: target,
          kindKey: "completion.kind.query",
          hintKey: "completion.hint.target",
        })),
      ),
    });
  }

  const predicateArgMatch = prefixText.match(/Check\(([^()]*)\)\.([A-Za-z][A-Za-z0-9_]*)\(([^()]*)$/);
  if (predicateArgMatch) {
    const target = predicateArgMatch[1].trim() || "Forward";
    const predicate = predicateArgMatch[2];
    const values = getTapeScriptCheckValues(target, predicate);
    if (values.length > 0) {
      return explicitAutocompleteContext({
        context,
        prefix: predicateArgMatch[3].trim(),
        slot: "checkValue",
        suggestions: createAutocompleteSuggestions(
          values.map((value) => ({
            value,
            kindKey: "completion.kind.query",
            hintKey: "completion.hint.value",
          })),
        ),
      });
    }
  }

  const predicateMatch = prefixText.match(/Check\(([^()]*)\)\.([A-Za-z0-9_]*)$/);
  if (predicateMatch) {
    const target = predicateMatch[1].trim() || "Forward";
    const predicates = getTapeScriptCheckPredicates(target);
    if (predicates.length > 0) {
      return explicitAutocompleteContext({
        context,
        prefix: predicateMatch[2].trim(),
        slot: "checkPredicate",
        suggestions: createAutocompleteSuggestions(
          predicates.map((predicate) => ({
            value: predicateCallSnippet(predicate),
            label: predicateCallSnippet(predicate),
            kindKey: "completion.kind.query",
            hintKey: "completion.hint.predicate",
            matchText: predicate,
            ...predicateSnippetMeta(predicate),
          })),
        ),
      });
    }
  }

  const thenMatch = prefixText.match(/(?:^|\s)(If|IfNot)\s+Check\([^()]*\)\.[A-Za-z][A-Za-z0-9_]*\([^()]*\)\s+([A-Za-z]*)$/);
  if (thenMatch) {
    return explicitAutocompleteContext({
      context,
      prefix: thenMatch[2].trim(),
      slot: "ifThen",
      suggestions: createAutocompleteSuggestions([{
        value: "Then ",
        label: "Then",
        kindKey: "completion.kind.keyword",
        hintKey: "completion.hint.keyword",
      }]),
    });
  }

  const actionAfterThenMatch = prefixText.match(/\bThen\s+([A-Za-z0-9_]*)$/);
  if (actionAfterThenMatch) {
    return explicitAutocompleteContext({
      context,
      prefix: actionAfterThenMatch[1].trim(),
      slot: "actionAfterThen",
      suggestions: actionKeywordSuggestions(),
    });
  }

  const actionArgMatch = prefixText.match(/\b([A-Za-z][A-Za-z0-9_]*)\(([^()]*)$/);
  if (actionArgMatch) {
    const action = actionArgMatch[1];
    const args = getTapeScriptActionArgs(action);
    if (args.length > 0) {
      return explicitAutocompleteContext({
        context,
        prefix: actionArgMatch[2].trim(),
        slot: "actionArg",
        suggestions: createAutocompleteSuggestions(
          args.map((value) => ({
            value,
            kindKey: "completion.kind.action",
            hintKey: "completion.hint.actionArg",
          })),
        ),
      });
    }
  }

  if (/^[A-Za-z0-9_]*$/.test(trimmedPrefix) && !trimmedPrefix.includes(" ")) {
    return explicitAutocompleteContext({
      context,
      prefix: token || trimmedPrefix,
      suggestions: [
        ...createAutocompleteSuggestions(
          TAPE_SCRIPT_EDITOR_MODEL.conditionals.map((keyword) => ({
            value: `${keyword} `,
            label: keyword,
            kindKey: "completion.kind.keyword",
            hintKey: "completion.hint.keyword",
          })),
        ),
        ...createAutocompleteSuggestions([{
          value: "Goto @",
          label: "Goto",
          kindKey: "completion.kind.branch",
          hintKey: "completion.goto.loop",
          selectionStartOffset: 6,
          selectionEndOffset: 6,
          triggerAutocomplete: true,
        }, {
          value: "Check()",
          label: "Check()",
          kindKey: "completion.kind.query",
          hintKey: "completion.hint.query",
          matchText: "Check",
          selectionStartOffset: 6,
          selectionEndOffset: 6,
          triggerAutocomplete: true,
        }]),
        ...actionKeywordSuggestions(),
      ],
    });
  }

  return null;
}

function explicitAutocompleteContext({ context, prefix, suggestions, slot = "" }) {
  const { range, line, lineNumber, column } = context;
  return {
    range,
    prefix,
    line,
    lineNumber,
    column,
    mode: "explicit",
    slot,
    suggestions,
  };
}

function predicateCallSnippet(predicate) {
  return `${predicate}()`;
}

function predicateSnippetMeta(predicate) {
  if (["Has", "Is", "Below", "Above", "BelowCost"].includes(predicate)) {
    const inside = predicate.length + 1;
    return {
      selectionStartOffset: inside,
      selectionEndOffset: inside,
      triggerAutocomplete: true,
      requiresQueryValue: true,
    };
  }
  if (["Any", "IsFull", "IsEmpty"].includes(predicate)) {
    return {
      completesQueryImmediately: true,
    };
  }
  return {};
}

function actionInsertSnippet(action) {
  if (action === "Move") {
    return "Move()";
  }
  if (action === "MoveToward") {
    return "MoveToward(Home)";
  }
  if (action === "Turn") {
    return "Turn()";
  }
  if (["PickUp", "Drop", "Fire", "Wait", "Repair"].includes(action)) {
    return `${action}()`;
  }
  if (action === "Unload" || action === "Craft") {
    return `${action}(Home)`;
  }
  return `${action}()`;
}

function actionKeywordSuggestions() {
  return createAutocompleteSuggestions([
    {
      value: "Goto @",
      label: "Goto",
      kindKey: "completion.kind.branch",
      hintKey: "completion.goto.loop",
      selectionStartOffset: 6,
      selectionEndOffset: 6,
      triggerAutocomplete: true,
    },
    ...TAPE_SCRIPT_EDITOR_MODEL.actions.map((action) => ({
      value: actionInsertSnippet(action),
      label: actionInsertSnippet(action),
      kindKey: "completion.kind.action",
      hintKey: "completion.hint.action",
      matchText: action,
      ...actionSnippetMeta(action),
    })),
  ]);
}

function actionSnippetMeta(action) {
  if (action === "Move" || action === "Turn") {
    const inside = action.length + 1;
    return {
      selectionStartOffset: inside,
      selectionEndOffset: inside,
      triggerAutocomplete: true,
    };
  }
  return {};
}

function createAutocompleteSuggestions(items) {
  return items.map((item) => ({
    matchText: item.matchText ?? item.label ?? item.value,
    ...item,
  }));
}

function dedupeSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.value}::${item.kindKey}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
  if (Number.isFinite(suggestion.selectionStartOffset)) {
    const selectionStart = context.range.start + suggestion.selectionStartOffset;
    const selectionEnd = context.range.start + (suggestion.selectionEndOffset ?? suggestion.selectionStartOffset);
    elements.editor.setSelectionRange(selectionStart, selectionEnd);
  }
  const shouldTriggerAutocomplete = applySuggestionFollowup(suggestion, context) || suggestion.triggerAutocomplete;
  elements.editor.focus();
  hideAutocomplete();
  updateEditorTools();
  if (shouldTriggerAutocomplete) {
    requestAnimationFrame(() => updateAutocomplete());
  }
}

function applySuggestionFollowup(suggestion, context) {
  if (context.mode !== "explicit") {
    return false;
  }

  if (context.slot === "checkTarget") {
    advanceCheckTargetSlot();
    return true;
  }

  if (context.slot === "checkValue") {
    return finalizeQueryAfterSelection(context);
  }

  if (context.slot === "checkPredicate" && suggestion.completesQueryImmediately) {
    return finalizeQueryAfterSelection(context);
  }

  if (context.slot === "actionArg") {
    advancePastClosingParen();
    return false;
  }

  return false;
}

function advanceCheckTargetSlot() {
  const caret = elements.editor.selectionStart;
  const nextChar = elements.editor.value[caret];
  if (nextChar === ")") {
    if (elements.editor.value[caret + 1] !== ".") {
      elements.editor.setRangeText(".", caret + 1, caret + 1, "end");
    } else {
      elements.editor.setSelectionRange(caret + 2, caret + 2);
    }
    return;
  }
  elements.editor.setRangeText(").", caret, caret, "end");
}

function finalizeQueryAfterSelection(context) {
  const conditionalLine = context.line.trimStart().startsWith("If ") || context.line.trimStart().startsWith("IfNot ");
  if (!conditionalLine) {
    advancePastClosingParen();
    return false;
  }

  const caret = elements.editor.selectionStart;
  if (elements.editor.value[caret] === ")" || elements.editor.value[caret - 1] === ")") {
    const afterClose = elements.editor.value[caret] === ")" ? caret + 1 : caret;
    const tail = elements.editor.value.slice(afterClose);
    const existingThen = tail.match(/^\s+Then\s+/);
    if (existingThen) {
      const next = afterClose + existingThen[0].length;
      elements.editor.setSelectionRange(next, next);
      return true;
    }
    elements.editor.setRangeText(" Then ", afterClose, afterClose, "end");
    return true;
  }

  elements.editor.setRangeText(") Then ", caret, caret, "end");
  return true;
}

function advancePastClosingParen() {
  const caret = elements.editor.selectionStart;
  if (elements.editor.value[caret] === ")") {
    elements.editor.setSelectionRange(caret + 1, caret + 1);
    return;
  }
  if (elements.editor.value[caret - 1] === ")") {
    return;
  }
  elements.editor.setRangeText(")", caret, caret, "end");
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
    worldLayers.obstacles.append(
      createWorldEntity("obstacle", obstacle.x, obstacle.y, OBSTACLE_WORLD_SIZE, "wall", "obstacle"),
    );
  }

  for (const hazard of state.hazards ?? []) {
    worldLayers.hazards.append(
      createWorldEntity("hazard-zone", hazard.x, hazard.y, WORLD_CELL_SIZE, "hazard", "hazard"),
    );
  }

  for (const enemy of state.enemies ?? []) {
    worldLayers.enemies.append(
      createWorldEntity("enemy enemy-entity", enemy.x, enemy.y, ROBOT_WORLD_SIZE, enemy.name ?? "hostile", "enemy"),
    );
  }

  if (state.base) {
    worldLayers.base.append(
      createWorldEntity("base-marker", state.base.x, state.base.y, BASE_WORLD_SIZE, "home base", "base"),
    );
  }

  for (const deposit of state.deposits) {
    worldLayers.deposits.append(
      createWorldEntity(
        `deposit ${deposit.type}`,
        deposit.x,
        deposit.y,
        DEPOSIT_WORLD_SIZE,
        deposit.type,
        visualEntityKeyForDeposit(deposit.type),
      ),
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
  const hazards = document.createElement("div");
  hazards.className = "world-layer world-layer-hazards";
  const enemies = document.createElement("div");
  enemies.className = "world-layer world-layer-enemies";
  const base = document.createElement("div");
  base.className = "world-layer world-layer-base";
  const deposits = document.createElement("div");
  deposits.className = "world-layer world-layer-deposits";
  const effects = document.createElement("div");
  effects.className = "world-layer world-layer-effects";
  const actors = document.createElement("div");
  actors.className = "world-layer world-layer-actors";

  worldLayers = { obstacles, hazards, enemies, base, deposits, effects, actors };
  elements.grid.replaceChildren(obstacles, hazards, enemies, base, deposits, effects, actors);
  return worldLayers;
}

function clearWorldLayers() {
  if (!worldLayers) {
    return;
  }
  worldLayers.obstacles.replaceChildren();
  worldLayers.hazards.replaceChildren();
  worldLayers.enemies.replaceChildren();
  worldLayers.base.replaceChildren();
  worldLayers.deposits.replaceChildren();
}

function renderRobot(state, options = {}) {
  if (!robotNode) {
    robotNode = document.createElement("div");
    robotNode.className = "robot robot-avatar";
  }
  applyEntityVisual(robotNode, "robot");
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
  applyEntityVisual(ghost, visualEntityKeyForDeposit(deposit.type));
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

function createWorldEntity(className, x, y, size, title = "", entityKey = "") {
  const node = document.createElement("div");
  node.className = className;
  applyEntityVisual(node, entityKey);
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

function visualEntityKeyForDeposit(type) {
  if (type === "cell") {
    return "cell";
  }
  if (type === "chip") {
    return "chip";
  }
  return "scrap";
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
      const outputs = facility.recipe.memoryShards ?? 1;
      desc.textContent =
        `${status} // ${facility.recipe.scrap} ${t("resources.item.scrap")} + ` +
        `${facility.recipe.cells} ${t("resources.item.battery")} -> ${outputs} ${t("resources.memoryShards")}`;
    } else {
      desc.textContent = status;
    }
    row.append(term, desc);
    elements.facilityList.append(row);
  }
}

function storedInventoryTotal(resources) {
  return (resources.scrap ?? 0) + (resources.cells ?? 0) + (resources.chips ?? 0);
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
