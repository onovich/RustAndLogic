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
import {
  buildEntityVisualDataUrl as buildEntityVisualDataUrlFromVisual,
} from "./graphics-studio/entity-visuals.js";
import { defaultGraphicsEditorConfig, normalizeGraphicsEditorConfig } from "./graphics-studio/config.js";
import {
  buildGraphicsSelectOptions,
  coerceGraphicsFieldValue,
  resolveGraphicsFieldValue,
  shouldRenderGraphicsField,
} from "./graphics-studio/form-schema.js";
import {
  applyShapePresetToLayer,
  createDefaultGlyphLayer,
  createDefaultShapeLayer,
  describeVisualLayerMeta,
  describeVisualLayerTitle,
  moveVisualLayer,
  normalizeShapeLayer,
  upgradeVisualLayerType,
} from "./graphics-studio/layers.js";
import {
  buildCustomTemplateId,
  isGraphicsTemplateLibraryPayload,
  normalizeGraphicsCustomTemplate,
  resolveGraphicsTemplateValue,
  serializeGraphicsTemplate,
  serializeGraphicsTemplateLibrary,
} from "./graphics-studio/templates.js";
import {
  buildGraphicsTemplateCategoryOptions,
  buildGraphicsTemplateModeOptions,
  buildGraphicsTemplateDefaultLabel,
  getAllGraphicsTemplates,
  getGraphicsEntityKind,
  getGraphicsTemplateCategory,
  getGraphicsTemplateDescription,
  getGraphicsTemplateLabel,
  getGraphicsTemplateSource,
  getGroupedGraphicsTemplates,
  getRecentGraphicsTemplates,
  isCustomGraphicsTemplate,
  isGraphicsTemplateRecommended,
  normalizeGraphicsTemplateFilterForAvailableCategories,
  recordRecentGraphicsTemplateId,
  recordRecentGraphicsTemplateIds,
  removeGraphicsTemplateById,
  resolveGraphicsTemplateImportId,
  upsertGraphicsTemplate,
  upsertGraphicsTemplates,
} from "./graphics-studio/template-library.js";
import {
  loadCustomGraphicsTemplatesFromStorage,
  loadEntityVisualCatalogState,
  loadGraphicsTemplateFilterStateFromStorage,
  loadRecentGraphicsTemplateIdsFromStorage,
  persistGraphicsTemplateFilterState as persistGraphicsTemplateFilterStateToStorage,
  persistJsonValue,
  persistRecentGraphicsTemplateIds as persistRecentGraphicsTemplateIdsToStorage,
} from "./graphics-studio/storage.js";
import {
  applyGraphicsSwatchToLayer,
  buildFillSwatches,
  buildTextureSwatches,
} from "./graphics-studio/swatches.js";
import { loadTextAsset } from "./utils/assets.js";
import { parseI18nCsv } from "./utils/csv.js";
import { cloneJson } from "./utils/json.js";
import {
  buildRuntimeToastModel,
  detectRuntimeCause,
  shouldAutoPause,
} from "./runtime-feedback.js";
import {
  buildRuntimeFlowChecklistState,
  buildRuntimeFlowListItems,
  buildRuntimeFlowSummaryModel,
  formatRuntimeFlowProgress,
  updateRuntimeFlow,
} from "./runtime-flow.js";
import {
  selectFailureTeachingMoment,
  selectSuccessTeachingMoment,
} from "./runtime-teaching.js";
import {
  buildPlaybackControlModel,
  getSpeedProfile,
  playbackScheduleDelay,
} from "./runtime-controls.js";
import {
  buildFacilityDisplayItems,
  buildRuntimeDiffDisplay,
  buildRuntimeDisplayModel,
  buildRuntimeLogItems,
  formatCargoManifestDisplay,
  formatFacilityDescription,
} from "./runtime-display.js";
import {
  buildAutocompleteDisplayModel,
  buildAutocompletePositionModel,
  createActionKeywordSuggestions,
  createAutocompleteSuggestions,
  dedupeSuggestions,
  matchesCompletion,
  predicateCallSnippet,
  predicateSnippetMeta,
} from "./editor-autocomplete.js";
import {
  collectLabelDefinitions,
  createLabelEntries,
  findLabelLine,
  lineSelectionRange,
  tokenAtOffset,
  tokenRangeAtOffset,
} from "./editor-text.js";
import {
  buildDiagnosticDisplayModel,
  buildScriptHighlightModel,
} from "./editor-highlight.js";
import {
  buildStageActionItems,
  buildStageCopyModel,
  buildStageFlow,
  buildStageSampleActionItems,
  buildStoryDialogueModel,
  getStageCompletionTasks as selectStageCompletionTasks,
  getStageDefinition as selectStageDefinition,
  getStageRecommendedPreset as selectStageRecommendedPreset,
  getStageRecommendedSpeed as selectStageRecommendedSpeed,
  getStageSamplePresets as selectStageSamplePresets,
  getStageSpeedIndex as selectStageSpeedIndex,
  getStageTaskDefinitions as selectStageTaskDefinitions,
  getStageTeachingMoments as selectStageTeachingMoments,
  getStageUi as selectStageUi,
  getStageVisibleFacilities,
  isStageUpgradeEnabled,
} from "./stages.js";

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
let labelDefinitions = new Map();
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
let updateControls = () => {};
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
  bootOverlay: query("boot-overlay"),
  bootKicker: query("boot-kicker"),
  bootTitle: query("boot-title"),
  bootStage: query("boot-stage"),
  bootProgress: query("boot-progress"),
  bootProgressBar: query("boot-progress-bar"),
};

let i18n = { en: {}, zh: {} };

function setBootProgress(progress, stageText = "", options = {}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const percent = Math.round(clamped * 100);
  if (elements.bootProgressBar) {
    elements.bootProgressBar.style.width = `${percent}%`;
  }
  if (elements.bootProgress) {
    elements.bootProgress.textContent = `${percent}%`;
  }
  if (options.useLocalizedCopy && elements.bootKicker && elements.bootTitle && elements.bootStage) {
    elements.bootKicker.textContent = t("boot.kicker");
    elements.bootTitle.textContent = t("boot.title");
    elements.bootStage.textContent = stageText || t("boot.stage.ready");
    return;
  }
  if (stageText && elements.bootStage) {
    elements.bootStage.textContent = stageText;
  }
}

function finishBootSequence() {
  document.body.dataset.booting = "false";
  document.body.setAttribute("aria-busy", "false");
  if (elements.bootOverlay) {
    elements.bootOverlay.hidden = true;
  }
}

async function loadI18n() {
  i18n = parseI18nCsv(await loadTextAsset(["/apps/web/i18n.csv", "./i18n.csv"]));
}

async function loadAppData() {
  appData = JSON.parse(await loadTextAsset(["/apps/web/app-data.json", "./app-data.json"]));
}

function loadCustomGraphicsTemplates() {
  customGraphicsTemplates = loadCustomGraphicsTemplatesFromStorage(localStorage, graphicsTemplatesKey, (error) => {
    console.warn("Failed to restore custom graphics templates.", error);
  });
}

function loadRecentGraphicsTemplates() {
  recentGraphicsTemplateIds = loadRecentGraphicsTemplateIdsFromStorage(localStorage, graphicsRecentTemplatesKey, (error) => {
    console.warn("Failed to restore recent graphics templates.", error);
  });
}

function loadGraphicsTemplateFilterState() {
  graphicsTemplateFilterState = loadGraphicsTemplateFilterStateFromStorage(localStorage, graphicsTemplateFilterKey, (error) => {
    console.warn("Failed to restore graphics template filters.", error);
  });
}

async function loadEntityVisualCatalog() {
  const loaded = JSON.parse(await loadTextAsset(["/apps/web/entity-visuals.json", "./entity-visuals.json"]));
  const restored = loadEntityVisualCatalogState(loaded, localStorage.getItem(entityVisualsKey), (error) => {
    console.warn("Failed to restore local entity visuals override.", error);
  });
  defaultEntityVisualCatalog = restored.defaultEntityVisualCatalog;
  entityVisualCatalog = restored.entityVisualCatalog;

  selectedVisualEntityKey = Object.keys(entityVisualCatalog.entities ?? {})[0] ?? "";
  ensureSelectedVisualLayer();
}

function getStageDefinition(stageId = currentStageId) {
  return selectStageDefinition(stageDefinitions, stageId);
}

function getStageTaskDefinitions(stage = getStageDefinition()) {
  return selectStageTaskDefinitions(stage, taskDefinitions);
}

function createStageGame(stageId = currentStageId) {
  const stage = getStageDefinition(stageId);
  return createGame(stage?.game ?? {});
}

function getStageUi(stage = getStageDefinition()) {
  return selectStageUi(stage);
}

function getStageRecommendedSpeed(stage = getStageDefinition()) {
  return selectStageRecommendedSpeed(stage, speeds);
}

function setStageRecommendedSpeed(stage = getStageDefinition()) {
  speedIndex = selectStageSpeedIndex(stage, speeds);
}

function stageUpgradeEnabled(module, stage = getStageDefinition()) {
  return isStageUpgradeEnabled(module, stage);
}

function stageVisibleFacilities(stage = getStageDefinition()) {
  return getStageVisibleFacilities(stage);
}

function getStageCompletionTasks(stage = getStageDefinition()) {
  return selectStageCompletionTasks(stage, taskDefinitions);
}

function getStageSamplePresets(stage = getStageDefinition()) {
  return selectStageSamplePresets(stage, scriptPresets);
}

function getStageRecommendedPreset(stage = getStageDefinition()) {
  return selectStageRecommendedPreset(stage, scriptPresets);
}

function getStageTeachingMoments(kind, stage = getStageDefinition()) {
  return selectStageTeachingMoments(stage, kind);
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
  flow = buildStageFlow(stage, taskDefinitions);
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

function resetStageSimulation(options = {}) {
  const stage = getStageDefinition(currentStageId);
  if (!stage) {
    return snapshot(game);
  }

  storyPages = stage.storyPages ?? appData.storyPages ?? [];
  seenTeachingMoments = new Set();
  flow = buildStageFlow(stage, taskDefinitions);
  game = createStageGame(stage.id);
  previousState = null;
  deployedSource = "";
  hideRuntimeToast();
  resetCameraIntro();

  if (options.resetStory) {
    storyIndex = 0;
    storyActive = true;
  } else {
    storyActive = false;
    if (elements.stage) {
      elements.stage.dataset.mode = "idle";
    }
    if (elements.storyDialogue) {
      elements.storyDialogue.hidden = true;
    }
  }

  updateEditorTools();
  hideAutocomplete();
  renderStageCopy();
  renderScriptGuidance();
  renderFlowList();
  renderStageActions();
  renderSampleActions();
  const state = snapshot(game);
  render(state, { animate: false });
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
    visual.layers.push(createDefaultShapeLayer(visual, graphicsLayerOptions()));
    selectedVisualLayerId = visual.layers.at(-1)?.id ?? "";
    persistEntityVisualCatalog();
  });

  elements.graphicsAddGlyphButton?.addEventListener("click", () => {
    const visual = getSelectedEntityVisual();
    if (!visual) {
      return;
    }
    visual.layers.push(createDefaultGlyphLayer(visual, graphicsLayerOptions()));
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
      upgradeVisualLayerType(target, nextValue, targetVisual, graphicsLayerOptions());
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
  persistJsonValue(localStorage, entityVisualsKey, entityVisualCatalog);
  entityVisualDataUrlCache.clear();
  ensureSelectedVisualLayer();
  renderGraphicsEditor();
  refreshWorldVisuals();
}

function persistCustomGraphicsTemplates() {
  persistJsonValue(localStorage, graphicsTemplatesKey, customGraphicsTemplates);
  renderGraphicsEditor();
}

function persistRecentGraphicsTemplates() {
  recentGraphicsTemplateIds = persistRecentGraphicsTemplateIdsToStorage(
    localStorage,
    graphicsRecentTemplatesKey,
    recentGraphicsTemplateIds,
  );
  renderGraphicsEditor();
}

function persistGraphicsTemplateFilterState() {
  graphicsTemplateFilterState = persistGraphicsTemplateFilterStateToStorage(
    localStorage,
    graphicsTemplateFilterKey,
    graphicsTemplateFilterState,
  );
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
  const templateGroups = getGroupedGraphicsTemplates(
    getGraphicsTemplates(),
    graphicsTemplateFilterState,
    getSelectedGraphicsEntityKind(),
    t,
  );
  if (templateGroups.length === 0) {
    elements.graphicsTemplates.append(createGraphicsTemplateEmptyState());
    return;
  }
  for (const templateGroup of templateGroups) {
    elements.graphicsTemplates.append(createGraphicsTemplateSection(templateGroup));
  }
}

function renderGraphicsTemplateFilters() {
  const templates = getGraphicsTemplates();
  const entityKind = getSelectedGraphicsEntityKind();
  graphicsTemplateFilterState = normalizeGraphicsTemplateFilterForAvailableCategories(
    templates,
    graphicsTemplateFilterState,
    entityKind,
  );
  renderGraphicsTemplateFilterRow(elements.graphicsTemplateModeFilters, buildGraphicsTemplateModeOptions(graphicsTemplateFilterState, t));
  renderGraphicsTemplateFilterRow(
    elements.graphicsTemplateCategoryFilters,
    buildGraphicsTemplateCategoryOptions(templates, graphicsTemplateFilterState, entityKind, t),
  );
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
  const recentTemplates = getRecentGraphicsTemplates(recentGraphicsTemplateIds, getGraphicsTemplates());
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
  button.dataset.recommended = String(isGraphicsTemplateRecommended(template, getSelectedGraphicsEntityKind()));
  const description = getGraphicsTemplateDescription(template, t);
  if (description) {
    button.title = description;
  }
  const preview = document.createElement("span");
  preview.className = "visual-template-preview";
  preview.style.backgroundImage = buildGraphicsTemplatePreview(template);
  const label = document.createElement("span");
  label.className = "visual-template-label";
  label.textContent = getGraphicsTemplateLabel(template, t);
  const meta = document.createElement("span");
  meta.className = "visual-template-meta";
  const metaParts = [];
  if (isGraphicsTemplateRecommended(template, getSelectedGraphicsEntityKind())) {
    metaParts.push(t("graphics.templateRecommended"));
  }
  const category = getGraphicsTemplateCategory(template, t);
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

function buildGraphicsTemplatePreview(template) {
  if (!template?.visual) {
    return "none";
  }
  const previewUrl = buildEntityVisualDataUrl(`template:${template.id}`, template.visual);
  return previewUrl ? `url("${previewUrl}")` : "none";
}

function getGraphicsTemplates() {
  return getAllGraphicsTemplates(customGraphicsTemplates, defaultGraphicsTemplates);
}

function getSelectedGraphicsEntityKind(entityKey = selectedVisualEntityKey) {
  return getGraphicsEntityKind(graphicsEditorConfig.entityKinds, entityKey);
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
    title.textContent = describeVisualLayerTitle(layer, t);
    const meta = document.createElement("span");
    meta.className = "visual-layer-meta";
    meta.textContent = describeVisualLayerMeta(layer, t);
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
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  renderGraphicsSwatchStrip(elements.graphicsFillSwatches, buildFillSwatches(layer, graphicsEditorConfig.fillSwatches, t));
  renderGraphicsSwatchStrip(
    elements.graphicsTextureSwatches,
    buildTextureSwatches(layer, graphicsEditorConfig.textureSwatches, t),
  );
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

function appendGraphicsFieldFromSchema(scope, source, fieldConfig) {
  const label = t(fieldConfig.labelKey ?? fieldConfig.field);
  const value = resolveGraphicsFieldValue(source, fieldConfig);
  if (fieldConfig.type === "select") {
    appendGraphicsSelectField({
      scope,
      field: fieldConfig.field,
      label,
      value,
      options: buildGraphicsSelectOptions(graphicsEditorConfig[fieldConfig.optionsKey], t),
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

function moveSelectedVisualLayer(delta) {
  const visual = getSelectedEntityVisual();
  if (!moveVisualLayer(visual?.layers, selectedVisualLayerId, delta)) {
    return;
  }
  persistEntityVisualCatalog();
}

function graphicsLayerOptions() {
  return {
    entityKey: selectedVisualEntityKey,
    defaultShapeLayer: graphicsEditorConfig.defaultShapeLayer,
    defaultGlyphLayer: graphicsEditorConfig.defaultGlyphLayer,
  };
}

function buildEntityVisualDataUrl(entityKey, visual = getEntityVisual(entityKey)) {
  return buildEntityVisualDataUrlFromVisual(entityKey, visual, entityVisualDataUrlCache);
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
  const template = getGraphicsTemplates().find((item) => item.id === templateId);
  if (!template || !elements.graphicsEntityIo) {
    return;
  }
  elements.graphicsEntityIo.value = JSON.stringify(serializeGraphicsTemplate(template, graphicsTemplateSerializationOptions()), null, 2);
  elements.graphicsEntityIo.focus();
  elements.graphicsEntityIo.select();
  renderGraphicsEditor();
  showToast({ title: t("graphics.templateExported"), body: getGraphicsTemplateLabel(template, t) }, "success");
}

function exportGraphicsTemplateLibrary() {
  if (!elements.graphicsEntityIo) {
    return;
  }
  const payload = serializeGraphicsTemplateLibrary(customGraphicsTemplates, graphicsTemplateSerializationOptions());
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
  const template = getGraphicsTemplates().find((item) => item.id === templateId);
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
  showToast({ title: t("graphics.templateApplied"), body: getGraphicsTemplateLabel(template, t) }, "success");
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
      entityKinds: getSelectedGraphicsEntityKind(entityKey) ? [getSelectedGraphicsEntityKind(entityKey)] : [],
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
  recentGraphicsTemplateIds = recordRecentGraphicsTemplateId(recentGraphicsTemplateIds, templateId);
  persistRecentGraphicsTemplates();
}

function recordRecentGraphicsTemplates(templateIds) {
  if (!Array.isArray(templateIds) || templateIds.length === 0) {
    return;
  }
  recentGraphicsTemplateIds = recordRecentGraphicsTemplateIds(recentGraphicsTemplateIds, templateIds);
  persistRecentGraphicsTemplates();
}

function graphicsTemplateSerializationOptions() {
  return {
    getLabel: (template) => getGraphicsTemplateLabel(template, t),
    getDescription: (template) => getGraphicsTemplateDescription(template, t),
  };
}

function upsertCustomGraphicsTemplate(template) {
  customGraphicsTemplates = upsertGraphicsTemplate(customGraphicsTemplates, template);
  persistCustomGraphicsTemplates();
  recordRecentGraphicsTemplate(template.id);
}

function upsertCustomGraphicsTemplates(templates) {
  if (!Array.isArray(templates) || templates.length === 0) {
    return;
  }
  customGraphicsTemplates = upsertGraphicsTemplates(customGraphicsTemplates, templates);
  persistCustomGraphicsTemplates();
  recordRecentGraphicsTemplates(templates.map((template) => template.id));
}

function resolveImportedGraphicsTemplateId(template) {
  return resolveGraphicsTemplateImportId(template, {
    defaultTemplates: defaultGraphicsTemplates,
    selectedEntityKey: selectedVisualEntityKey,
    now: Date.now,
  });
}

function buildDefaultCustomTemplateLabel(entityKey) {
  return buildGraphicsTemplateDefaultLabel(getGraphicsEntityLabel(entityKey), customGraphicsTemplates, entityKey);
}

function removeCustomGraphicsTemplate(templateId) {
  if (!templateId) {
    return;
  }
  const result = removeGraphicsTemplateById(customGraphicsTemplates, recentGraphicsTemplateIds, templateId);
  if (!result.template) {
    return;
  }
  customGraphicsTemplates = result.templates;
  recentGraphicsTemplateIds = result.recentTemplateIds;
  persistCustomGraphicsTemplates();
  persistRecentGraphicsTemplates();
  showToast({ title: t("graphics.templateDeleted"), body: getGraphicsTemplateLabel(result.template, t) }, "success");
}

function applyShapePreset(presetId) {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  const preset = (graphicsEditorConfig.shapePresets ?? []).find((item) => item.id === presetId);
  if (!applyShapePresetToLayer(layer, preset, visual, { entityKey: selectedVisualEntityKey })) {
    return;
  }
  persistEntityVisualCatalog();
}

function applyGraphicsSwatch(kind, value) {
  const visual = getSelectedEntityVisual();
  const layer = visual?.layers.find((item) => item.id === selectedVisualLayerId);
  if (visual && applyGraphicsSwatchToLayer(layer, kind, value)) {
    persistEntityVisualCatalog();
  }
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
  if (!button || playbackMode !== "stopped") {
    return;
  }
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
  flow = buildStageFlow(loadedStage, taskDefinitions);
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
  resetStageSimulation();
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
  const controls = buildPlaybackControlModel({
    playbackMode,
    storyActive,
    speed: speeds[speedIndex],
    settingsOpen: elements.settingsPanel?.dataset.open === "true",
    devOpen: elements.devPanel?.dataset.open === "true",
    languageMode,
    stageEnabled: {
      memory: stageUpgradeEnabled("memory"),
      armor: stageUpgradeEnabled("armor"),
      weapon: stageUpgradeEnabled("weapon"),
    },
  });
  elements.play.textContent = t(controls.playLabelKey);
  elements.step.textContent = t(controls.stepLabelKey);
  elements.reset.textContent = t(controls.resetLabelKey);
  elements.play.disabled = controls.playDisabled;
  elements.step.disabled = controls.stepDisabled;
  elements.speed.disabled = controls.speedDisabled;
  elements.speed.textContent = controls.speedLabel;
  elements.play.title = t("action.play");
  elements.step.title = t(controls.stepLabelKey);
  elements.reset.title = t(controls.resetLabelKey);
  elements.speed.title = t("action.speed", { speed: controls.speedLabel });
  elements.play.dataset.active = String(controls.playActive);
  elements.speed.dataset.active = String(controls.speedActive);
  if (elements.settingsToggle) {
    elements.settingsToggle.textContent = t("settings.title");
    elements.settingsToggle.dataset.active = String(controls.settingsActive);
  }
  if (elements.devlogToggle) {
    elements.devlogToggle.textContent = t(controls.devlogLabelKey);
    elements.devlogToggle.dataset.active = String(controls.devlogActive);
  }
  if (elements.localizationButton) {
    elements.localizationButton.textContent = t("action.localizationMode", {
      mode: t(controls.languageModeKey),
    });
  }
  if (elements.upgrade) {
    elements.upgrade.dataset.stageEnabled = String(controls.upgrades.memory.stageEnabled);
    elements.upgrade.disabled = controls.upgrades.memory.disabled;
  }
  if (elements.armorUpgrade) {
    elements.armorUpgrade.dataset.stageEnabled = String(controls.upgrades.armor.stageEnabled);
    elements.armorUpgrade.disabled = controls.upgrades.armor.disabled;
  }
  if (elements.weaponUpgrade) {
    elements.weaponUpgrade.dataset.stageEnabled = String(controls.upgrades.weapon.stageEnabled);
    elements.weaponUpgrade.disabled = controls.upgrades.weapon.disabled;
  }
  if (elements.editor) {
    elements.editor.readOnly = controls.editorLocked;
    elements.editor.dataset.locked = String(controls.editorLocked);
    elements.editor.setAttribute("aria-readonly", String(controls.editorLocked));
  }
  renderStageActions();
  renderSampleActions();
};

setBootProgress(0.08, "Preparing simulation shell...");
await loadI18n();
setBootProgress(0.24, t("boot.stage.localization"), { useLocalizedCopy: true });
await loadAppData();
setBootProgress(0.48, t("boot.stage.data"), { useLocalizedCopy: true });
loadCustomGraphicsTemplates();
loadRecentGraphicsTemplates();
loadGraphicsTemplateFilterState();
await loadEntityVisualCatalog();
setBootProgress(0.72, t("boot.stage.visuals"), { useLocalizedCopy: true });
initializeAppData();
applyLanguage();
updateSidebarToggles();
updateEditorTools();
renderGraphicsEditor();
applyCanvasTransform();
renderStoryDialogue();
render(snapshot(game), { animate: false });
setBootProgress(1, t("boot.stage.ready"), { useLocalizedCopy: true });
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    finishBootSequence();
  });
});

function render(state, options = {}) {
  const beforeState = previousState;
  const flowBefore = { ...flow };
  const diff = beforeState ? diffSnapshots(beforeState, state) : [];
  previousState = state;
  syncFlowState(beforeState, state);
  const display = buildRuntimeDisplayModel(state);

  elements.tick.textContent = display.tick;
  elements.instructionUsage.textContent = display.instructionUsage;
  elements.vmState.textContent = t(display.vmStateKey);
  elements.capacityLabel.textContent = t(display.capacityLabelKey, display.capacityLabelValues);
  elements.robotPosition.textContent = display.robotPosition;
  elements.scrap.textContent = display.resources.scrap;
  elements.cells.textContent = display.resources.cells;
  elements.chips.textContent = display.resources.chips;
  elements.memoryShards.textContent = display.resources.memoryShards;
  elements.cargoCount.textContent = display.cargoCount;
  elements.cargoManifest.textContent = formatCargoManifestDisplay(display.cargoManifestItems, t);
  renderFacilities(state.facilities);
  elements.armor.textContent = display.moduleStats.armor;
  elements.weapon.textContent = display.moduleStats.weapon;
  elements.hp.textContent = display.moduleStats.hp;
  elements.batteryValue.textContent = display.batteryValue;
  elements.armorPercent.textContent = display.armorPercentText;
  elements.energyPercent.textContent = display.energyPercentText;
  elements.armorMeter.style.width = display.armorMeterWidth;
  elements.energyMeter.style.width = display.energyMeterWidth;

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
  elements.flowProgress.textContent = formatRuntimeFlowProgress(flow);

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
  }, playbackScheduleDelay(profile));
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
  const toastModel = buildRuntimeToastModel(state, getStageDefinition());
  const stageHint = toastModel.stageHintKey ? t(toastModel.stageHintKey) : "";
  return {
    title: t(toastModel.titleKey),
    body: stageHint ? `${t(toastModel.bodyKey)} // ${stageHint}` : t(toastModel.bodyKey),
  };
}

function maybeShowSuccessTeachingMoment(flowBefore) {
  const stage = getStageDefinition();
  const selected = selectSuccessTeachingMoment(
    stage,
    getStageTeachingMoments("success", stage),
    flowBefore,
    flow,
    seenTeachingMoments,
  );
  if (selected) {
    seenTeachingMoments.add(selected.key);
    showToast({ title: t(selected.moment.titleKey), body: t(selected.moment.bodyKey) }, "success");
  }
}

function consumeFailureTeachingMoment(cause) {
  const stage = getStageDefinition();
  const selected = selectFailureTeachingMoment(
    stage,
    getStageTeachingMoments("failure", stage),
    cause,
    seenTeachingMoments,
  );
  if (selected) {
    seenTeachingMoments.add(selected.key);
    return { title: t(selected.moment.titleKey), body: t(selected.moment.bodyKey) };
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
  const story = buildStoryDialogueModel(storyActive, storyPages, storyIndex);
  if (!story.visible) {
    elements.stage.dataset.mode = story.stageMode;
    elements.storyDialogue.hidden = true;
    renderStoryPageDots(story.pageDots);
    applyCanvasTransform();
    return;
  }
  elements.stage.dataset.mode = story.stageMode;
  elements.storyDialogue.hidden = false;
  elements.storySpeaker.textContent = t(story.speakerKey);
  elements.storyText.textContent = t(story.textKey);
  renderStoryPageDots(story.pageDots);
  elements.storyPrompt.textContent = t(story.promptKey);
  applyCanvasTransform();
}

function renderStoryPageDots(pageDots = buildStoryDialogueModel(storyActive, storyPages, storyIndex).pageDots) {
  elements.storyPages.replaceChildren();
  for (const pageDot of pageDots) {
    const dot = document.createElement("span");
    dot.className = "story-page-dot";
    dot.dataset.active = String(pageDot.active);
    elements.storyPages.append(dot);
  }
}

function stopPlayback(resetMode = true) {
  playbackMode = "stopped";
  clearPlaybackTimer();
  hideRuntimeToast();
  if (resetMode) {
    resetStageSimulation();
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
  return getSpeedProfile(speeds, speedProfiles, speedIndex);
}

function resetFlow() {
  for (const key of Object.keys(flow)) {
    flow[key] = false;
  }
}

function renderFlowList() {
  elements.flowChecklist.replaceChildren();
  for (const task of buildRuntimeFlowListItems(getStageTaskDefinitions(), flow)) {
    const item = document.createElement("li");
    item.dataset.flow = task.id;
    item.dataset.done = String(task.done);
    item.dataset.active = String(task.active);
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
  const summary = buildRuntimeFlowSummaryModel(getStageCompletionTasks(), flow);
  if (summary.state === "none") {
    elements.flowSummary.textContent = t(summary.textKey);
    return;
  }
  elements.flowSummary.textContent = t(summary.textKey, { label: t(summary.labelKey) });
}

function renderStageCopy() {
  const copy = buildStageCopyModel(getStageDefinition());
  if (elements.locationKind) {
    elements.locationKind.textContent = t(copy.locationKindKey);
  }
  if (elements.locationName) {
    elements.locationName.textContent = t(copy.locationNameKey);
  }
  if (elements.locationDescription) {
    elements.locationDescription.textContent = t(copy.locationDescriptionKey);
  }
  if (elements.resourceGuidance) {
    elements.resourceGuidance.textContent = copy.resourceGuidanceKey ? t(copy.resourceGuidanceKey) : "";
  }
}

function renderScriptGuidance() {
  if (!elements.scriptGuidance) {
    return;
  }
  const copy = buildStageCopyModel(getStageDefinition());
  elements.scriptGuidance.textContent = copy.scriptGuidanceKey ? t(copy.scriptGuidanceKey) : "";
}

function renderStageActions() {
  if (!elements.stageActions) {
    return;
  }
  elements.stageActions.replaceChildren();
  for (const stageAction of buildStageActionItems(stageDefinitions, currentStageId, playbackMode)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.stage = stageAction.id;
    button.dataset.active = String(stageAction.active);
    button.disabled = stageAction.disabled;
    button.textContent = t(stageAction.labelKey);
    elements.stageActions.append(button);
  }
}

function renderSampleActions() {
  if (!elements.sampleActions) {
    return;
  }
  elements.sampleActions.replaceChildren();
  for (const presetAction of buildStageSampleActionItems(getStageDefinition(), scriptPresets, currentPresetId, playbackMode)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = presetAction.id;
    button.dataset.active = String(presetAction.active);
    button.disabled = presetAction.disabled;
    button.textContent = t(presetAction.labelKey);
    button.addEventListener("click", () => loadScriptPreset(presetAction.id));
    elements.sampleActions.append(button);
  }
}

function loadScriptPreset(presetId) {
  if (playbackMode !== "stopped") {
    return;
  }
  const preset = scriptPresets.find((item) => item.id === presetId);
  if (!preset) {
    return;
  }
  elements.editor.value = (preset.lines ?? []).join("\n");
  currentPresetId = preset.id;
  deployedSource = "";
  updateEditorTools();
  renderSampleActions();
  hideAutocomplete();
}

function syncFlowState(beforeState, state) {
  flow = updateRuntimeFlow(flow, beforeState, state);
}

function updateEditorTools(errors = null) {
  currentPresetId = scriptPresets.find((preset) => (preset.lines ?? []).join("\n") === elements.editor.value)?.id ?? null;
  const program = errors ? null : compileTapeScript(elements.editor.value, { instructionCapacity: game.instructionCapacity });
  const activeErrors = errors ?? program.errors;
  labelDefinitions = collectLabelDefinitions(elements.editor.value);
  renderScriptHighlight(activeErrors);
  renderDiagnostics(activeErrors);
  renderSampleActions();
  syncEditorScroll();
}

function renderScriptHighlight(errors) {
  const highlight = buildScriptHighlightModel(elements.editor.value, errors, {
    actions: scriptActions,
    queries: scriptQueries,
    branches: scriptBranches,
    values: scriptValues,
    labelDefinitions,
    labelTitle: (line) => t("completion.hint.labelDefined", { line }),
  });
  elements.lineNumbers.textContent = highlight.lineNumbers;
  elements.highlight.innerHTML = highlight.html;
}

function renderDiagnostics(errors) {
  const diagnostics = buildDiagnosticDisplayModel(errors);
  elements.diagnostics.replaceChildren();
  elements.editor.dataset.invalid = String(diagnostics.invalid);
  if (elements.diagnosticCount) {
    elements.diagnosticCount.textContent = t(diagnostics.countKey, { count: diagnostics.count });
  }
  if (!diagnostics.invalid) {
    return;
  }
  for (const diagnostic of diagnostics.items) {
    const item = document.createElement("li");
    item.dataset.line = String(diagnostic.line);
    item.dataset.severity = diagnostic.severity;
    const topline = document.createElement("div");
    topline.className = "diagnostic-topline";
    const severityNode = document.createElement("span");
    severityNode.className = "diagnostic-severity";
    severityNode.textContent = t(diagnostic.severityKey);
    const locationNode = document.createElement("span");
    locationNode.className = "diagnostic-location";
    locationNode.textContent = t(diagnostic.locationKey, diagnostic.locationValues);
    topline.append(severityNode, locationNode);
    const messageNode = document.createElement("span");
    messageNode.className = "diagnostic-message";
    messageNode.textContent = diagnostic.message;
    item.append(topline, messageNode);
    if (diagnostic.interactive) {
      item.tabIndex = 0;
      item.addEventListener("click", () => jumpToLine(diagnostic.line));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          jumpToLine(diagnostic.line);
        }
      });
    }
    elements.diagnostics.append(item);
  }
}

function syncEditorScroll() {
  elements.highlight.scrollTop = elements.editor.scrollTop;
  elements.highlight.scrollLeft = elements.editor.scrollLeft;
  elements.lineNumbers.scrollTop = elements.editor.scrollTop;
  updateAutocompletePosition();
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
  const autocompleteDisplay = buildAutocompleteDisplayModel(activeSuggestions, activeSuggestionIndex, t);
  for (const suggestion of autocompleteDisplay.items) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "autocomplete-item";
    item.dataset.index = String(suggestion.index);
    item.dataset.active = String(suggestion.active);
    const label = document.createElement("span");
    label.textContent = suggestion.label;
    const hint = document.createElement("small");
    hint.textContent = suggestion.hint;
    item.append(label, hint);
    elements.autocomplete.append(item);
  }
  const footer = document.createElement("div");
  footer.className = "autocomplete-footer";
  footer.textContent = autocompleteDisplay.footerText;
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
    const suggestions = currentLabelEntries()
      .filter((label) => matchesCompletion(label, prefix))
      .slice(0, 8)
      .map(({ label, line }) => ({
        value: `@${label}`,
        label: `@${label}`,
        kindKey: "completion.kind.label",
        hintText: t("completion.hint.labelDefined", { line }),
      }));
    if (suggestions.length > 0) {
      return suggestions;
    }
    if (prefix) {
      return [{
        value: context.prefix.startsWith("@") ? context.prefix : `@${prefix}`,
        label: context.prefix.startsWith("@") ? context.prefix : `@${prefix}`,
        kindKey: "completion.kind.label",
        hintText: t("completion.hint.labelMissing"),
      }];
    }
    return [];
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

function actionKeywordSuggestions() {
  return createActionKeywordSuggestions(TAPE_SCRIPT_EDITOR_MODEL.actions);
}

function currentLabelEntries() {
  return createLabelEntries(labelDefinitions);
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
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const position = buildAutocompletePositionModel(context, {
    lineHeight,
    fontSize,
    paddingLeft,
    paddingTop,
    scrollLeft: elements.editor.scrollLeft,
    scrollTop: elements.editor.scrollTop,
    clientWidth: elements.editor.clientWidth,
  });
  elements.autocomplete.style.left = `${position.left}px`;
  elements.autocomplete.style.top = `${position.top}px`;
}

function jumpToLabel(label) {
  const line = findLabelLine(elements.editor.value, label);
  if (line > 0) {
    jumpToLine(line);
  }
}

function jumpToLine(lineNumber) {
  const selection = lineSelectionRange(elements.editor.value, lineNumber);
  elements.editor.focus();
  elements.editor.setSelectionRange(selection.start, selection.end);
  const lineHeight = Number.parseFloat(getComputedStyle(elements.editor).lineHeight) || 20;
  elements.editor.scrollTop = Math.max(0, (selection.line - 2) * lineHeight);
  syncEditorScroll();
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
  for (const message of buildRuntimeLogItems(logs)) {
    const item = document.createElement("li");
    item.textContent = message;
    elements.consoleLog.append(item);
  }
}

function renderDiff(diff) {
  const diffDisplay = buildRuntimeDiffDisplay(diff);
  elements.diffCount.textContent = t("diff.count", {
    count: diffDisplay.count,
    label: t(diffDisplay.countLabelKey),
  });
  elements.diffList.replaceChildren();

  if (diffDisplay.empty) {
    const item = document.createElement("li");
    item.textContent = t(diffDisplay.emptyKey);
    elements.diffList.append(item);
    return;
  }

  for (const change of diffDisplay.items) {
    const item = document.createElement("li");
    item.textContent = change.text;
    elements.diffList.append(item);
  }
}

function renderFacilities(facilities) {
  if (!elements.facilityList) {
    return;
  }
  elements.facilityList.replaceChildren();
  for (const facilityItem of buildFacilityDisplayItems(facilities, stageVisibleFacilities())) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = t(facilityItem.labelKey);
    const desc = document.createElement("dd");
    desc.textContent = formatFacilityDescription(facilityItem, t);
    row.append(term, desc);
    elements.facilityList.append(row);
  }
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

function renderFlow() {
  renderFlowSummary();
  const items = [...elements.flowChecklist.querySelectorAll("[data-flow]")];
  const itemState = new Map(
    buildRuntimeFlowChecklistState(items.map((item) => item.dataset.flow), flow)
      .map((state) => [state.id, state]),
  );
  for (const item of items) {
    const state = itemState.get(item.dataset.flow);
    item.dataset.done = String(Boolean(state?.done));
    item.dataset.active = String(Boolean(state?.active));
  }
}

function query(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}
