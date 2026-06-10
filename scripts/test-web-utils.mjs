import assert from "node:assert/strict";
import {
  defaultGraphicsEditorConfig,
  normalizeGraphicsEditorConfig,
} from "../apps/web/src/graphics-studio/config.js";
import {
  applyImportedEntityVisualToSelection,
  applyGraphicsEntitySelection,
  buildEntityVisualDataUrl,
  buildGraphicsEntityListItems,
  buildGraphicsEntityIoModel,
  buildGraphicsEntityPreviewModel,
  buildGraphicsEntityVisualExportModel,
  buildGraphicsColorPreview,
  buildGraphicsTexturePreview,
  getGraphicsEntityDisplayLabel,
  normalizeColorValue,
  normalizeImportedEntityVisual,
  parseImportedEntityVisual,
  resetGraphicsEntityVisualCatalog,
  renderEntityVisualSvg,
} from "../apps/web/src/graphics-studio/entity-visuals.js";
import {
  applyGraphicsFormFieldEdit,
  buildGraphicsFieldModel,
  buildGraphicsFieldSchemaModels,
  buildGraphicsFormModel,
  buildGraphicsFormControlState,
  buildGraphicsSelectOptions,
  coerceGraphicsFieldValue,
  resolveGraphicsFieldValue,
  shouldDisableGraphicsFieldControl,
  shouldRenderGraphicsField,
} from "../apps/web/src/graphics-studio/form-schema.js";
import {
  addDefaultSelectedVisualLayer,
  addDefaultVisualLayer,
  applyShapePresetToLayer,
  applyShapePresetToSelectedLayer,
  buildShapePresetListModel,
  buildVisualLayerActionState,
  buildVisualLayerListItems,
  buildVisualLayerToolbarModel,
  createDefaultGlyphLayer,
  createDefaultShapeLayer,
  describeVisualLayerMeta,
  describeVisualLayerTitle,
  duplicateSelectedVisualLayer,
  duplicateVisualLayer,
  moveSelectedVisualLayer,
  moveVisualLayer,
  normalizeShapeLayer,
  removeVisualLayer,
  removeSelectedVisualLayer,
  resolveSelectedVisualLayerId,
  selectVisualLayer,
  toggleSelectedVisualLayerLocked,
  toggleSelectedVisualLayerVisible,
  toggleVisualLayerLocked,
  toggleVisualLayerVisible,
  upgradeVisualLayerType,
} from "../apps/web/src/graphics-studio/layers.js";
import {
  buildGraphicsTemplateActionState,
  buildGraphicsTemplateExportModel,
  buildGraphicsTemplateLibraryExportModel,
  buildCustomTemplateId,
  isGraphicsTemplateLibraryPayload,
  normalizeGraphicsCustomTemplate,
  normalizeGraphicsCustomTemplates,
  normalizeGraphicsTemplateFilterState,
  normalizeRecentGraphicsTemplateIds,
  resolveGraphicsTemplateObject,
  serializeGraphicsTemplate,
  serializeGraphicsTemplateLibrary,
} from "../apps/web/src/graphics-studio/templates.js";
import {
  defaultGraphicsTemplateFilterState,
  loadCustomGraphicsTemplatesFromStorage,
  loadEntityVisualCatalogState,
  loadGraphicsTemplateFilterStateFromStorage,
  loadRecentGraphicsTemplateIdsFromStorage,
  mergeEntityVisualCatalogs,
  persistGraphicsTemplateFilterState,
  persistJsonValue,
  persistRecentGraphicsTemplateIds,
} from "../apps/web/src/graphics-studio/storage.js";
import {
  applyGraphicsSwatchToLayer,
  applyGraphicsSwatchToSelectedLayer,
  buildFillSwatches,
  buildGraphicsSwatchStripModel,
  buildTextureSwatches,
} from "../apps/web/src/graphics-studio/swatches.js";
import {
  nextLanguageMode,
  normalizeLanguageMode,
  resolveLanguage,
} from "../apps/web/src/language.js";
import {
  buildDrawerToggleState,
  buildGraphicsEditorShellControlModel,
  buildGraphicsStudioButtonModel,
  buildGraphicsStudioOpenState,
  buildSidebarToggleDisplay,
  toggleCollapsedState,
} from "../apps/web/src/ui-shell.js";
import {
  applyGraphicsTemplateFilterSelection,
  applyGraphicsTemplateToEntityVisual,
  applyGraphicsTemplateToSelectedEntity,
  buildGraphicsRecentTemplateStripModel,
  buildGraphicsTemplateCardActions,
  buildGraphicsTemplateCardModel,
  buildGraphicsTemplateCategoryOptions,
  buildGraphicsTemplateDefaultLabel,
  buildGraphicsTemplateFilterRowModel,
  buildGraphicsTemplateLibraryModel,
  buildGraphicsTemplateModeOptions,
  createGraphicsTemplateFromEntityVisual,
  getAllGraphicsTemplates,
  getGraphicsEntityKind,
  getGraphicsTemplateCategory,
  getGraphicsTemplateDescription,
  getGraphicsTemplateGroupId,
  getGraphicsTemplateGroupLabel,
  getGraphicsTemplateLabel,
  getGraphicsTemplateSource,
  getGroupedGraphicsTemplates,
  getRecentGraphicsTemplates,
  getSortedGraphicsTemplates,
  importGraphicsTemplatePayload,
  isCustomGraphicsTemplate,
  isGraphicsTemplateRecommended,
  normalizeGraphicsTemplateFilterForAvailableCategories,
  normalizeGraphicsTemplateImport,
  normalizeGraphicsTemplateLibraryImport,
  recordRecentGraphicsTemplateId,
  recordRecentGraphicsTemplateIds,
  removeGraphicsTemplateById,
  resolveGraphicsTemplateImportId,
  saveGraphicsTemplateFromSelectedEntity,
  upsertGraphicsTemplate,
  upsertGraphicsTemplates,
} from "../apps/web/src/graphics-studio/template-library.js";
import {
  buildStageActionItems,
  buildStageCopyModel,
  buildStageFlow,
  buildStageSampleActionItems,
  buildStoryDialogueModel,
  formatStageCopyDisplay,
  formatStoryDialogueDisplay,
  buildTeachingMomentKey,
  getStageCompletionTasks,
  getStageDefinition,
  getStageRecommendedPreset,
  getStageRecommendedSpeed,
  getStageSamplePresets,
  getStageSpeedIndex,
  getStageTaskDefinitions,
  getStageTeachingMoments,
  getStageUi,
  getStageVisibleFacilities,
  isStageUpgradeEnabled,
} from "../apps/web/src/stages.js";
import {
  buildRuntimeToastModel,
  detectRuntimeCause,
  formatRuntimeToastDisplay,
  shouldAutoPause,
} from "../apps/web/src/runtime-feedback.js";
import {
  buildRuntimeFlowChecklistState,
  buildRuntimeFlowListItems,
  buildRuntimeFlowSummaryModel,
  formatRuntimeFlowProgress,
  formatRuntimeFlowSummary,
  isRobotHome,
  runtimeFlowProgress,
  selectRuntimeFlowSummary,
  storedInventoryTotal,
  updateRuntimeFlow,
} from "../apps/web/src/runtime-flow.js";
import {
  formatTeachingMomentDisplay,
  selectFailureTeachingMoment,
  selectSuccessTeachingMoment,
} from "../apps/web/src/runtime-teaching.js";
import {
  buildPlaybackControlModel,
  formatPlaybackControlText,
  getSpeedProfile,
  playbackScheduleDelay,
} from "../apps/web/src/runtime-controls.js";
import {
  buildCargoManifestDisplayItems,
  buildFacilityDisplayItems,
  buildRuntimeDiffDisplay,
  buildRuntimeDisplayModel,
  buildRuntimeLogItems,
  buildCompileStatusDisplay,
  calculateArmorPercent,
  calculateEnergyPercent,
  formatCargoManifestDisplay,
  formatFacilityDescription,
  formatInstructionUsage,
  formatRuntimeDiffCount,
  formatRuntimeDiffEmpty,
  formatPercentText,
  formatRuntimeDiffItem,
  formatRuntimeValue,
  formatSaveStatusDisplay,
  selectVmStateLabelKey,
  summarizeCargoManifest,
} from "../apps/web/src/runtime-display.js";
import {
  buildAutocompleteDisplayModel,
  buildAutocompletePositionModel,
  actionInsertSnippet,
  actionSnippetMeta,
  createActionKeywordSuggestions,
  createAutocompleteSuggestions,
  dedupeSuggestions,
  matchesCompletion,
  predicateCallSnippet,
  predicateSnippetMeta,
  splitCompletionSegments,
} from "../apps/web/src/editor-autocomplete.js";
import {
  collectLabelDefinitions,
  createLabelEntries,
  createLabelNames,
  findLabelLine,
  lineSelectionRange,
  tokenAtOffset,
  tokenRangeAtOffset,
} from "../apps/web/src/editor-text.js";
import {
  buildDiagnosticDisplayModel,
  buildScriptHighlightModel,
  classifyDiagnosticSeverity,
  highlightEditorLine,
  renderHighlightedLabelToken,
} from "../apps/web/src/editor-highlight.js";
import { parseCsv, parseI18nCsv } from "../apps/web/src/utils/csv.js";
import { cloneJson } from "../apps/web/src/utils/json.js";

testCsvParsing();
testI18nParsing();
testJsonClone();
testLanguageHelpers();
testUiShellHelpers();
testStageHelpers();
testRuntimeFeedbackHelpers();
testRuntimeFlowHelpers();
testRuntimeTeachingHelpers();
testRuntimeControlHelpers();
testRuntimeDisplayHelpers();
testEditorAutocompleteHelpers();
testEditorTextHelpers();
testEditorHighlightHelpers();
testGraphicsConfigHelpers();
testEntityVisualRendering();
testEntityVisualDataUrlCache();
testGraphicsEntityListHelpers();
testGraphicsPreviews();
testGraphicsTemplateHelpers();
testGraphicsStorageHelpers();
testGraphicsFormSchemaHelpers();
testGraphicsLayerHelpers();
testGraphicsSwatchHelpers();
testGraphicsTemplateLibraryHelpers();

console.log("Web utility tests passed.");

function testCsvParsing() {
  const rows = parseCsv('key,en,zh\r\ngreeting,"Hello, world","你好"\r\nquote,"a ""quoted"" value","引号"');
  assert.deepEqual(rows, [
    ["key", "en", "zh"],
    ["greeting", "Hello, world", "你好"],
    ["quote", 'a "quoted" value', "引号"],
  ]);
}

function testI18nParsing() {
  const dictionary = parseI18nCsv("key,en,zh\nui.start,Start,开始\nui.empty,,");
  assert.equal(dictionary.en["ui.start"], "Start");
  assert.equal(dictionary.zh["ui.start"], "开始");
  assert.equal(dictionary.en["ui.empty"], "");
  assert.equal(dictionary.zh["ui.empty"], "");
}

function testJsonClone() {
  const source = { nested: { value: 1 }, list: ["a"] };
  const clone = cloneJson(source);
  clone.nested.value = 2;
  clone.list.push("b");
  assert.equal(source.nested.value, 1);
  assert.deepEqual(source.list, ["a"]);
}

function testLanguageHelpers() {
  assert.equal(normalizeLanguageMode("auto"), "auto");
  assert.equal(normalizeLanguageMode("en"), "en");
  assert.equal(normalizeLanguageMode("zh"), "zh");
  assert.equal(normalizeLanguageMode("fr"), "auto");
  assert.equal(normalizeLanguageMode(null), "auto");
  assert.equal(nextLanguageMode("auto"), "en");
  assert.equal(nextLanguageMode("en"), "zh");
  assert.equal(nextLanguageMode("zh"), "auto");
  assert.equal(nextLanguageMode("unknown"), "auto");
  assert.equal(resolveLanguage("en", ["zh-CN"]), "en");
  assert.equal(resolveLanguage("zh", ["en-US"]), "zh");
  assert.equal(resolveLanguage("auto", ["en-US", "zh-CN"]), "zh");
  assert.equal(resolveLanguage("auto", ["ja-JP", "en-US"]), "en");
  assert.equal(resolveLanguage("auto", "zh-Hans-CN"), "zh");
  assert.equal(resolveLanguage("invalid", []), "en");
}

function testUiShellHelpers() {
  assert.deepEqual(buildSidebarToggleDisplay({ objectivesCollapsed: "false", rightCollapsed: "false" }), {
    objectivesLabel: "\u25c0",
    rightLabel: "\u25b6",
  });
  assert.deepEqual(buildSidebarToggleDisplay({ objectivesCollapsed: "true", rightCollapsed: "true" }), {
    objectivesLabel: "\u25b6",
    rightLabel: "\u25c0",
  });
  assert.deepEqual(buildSidebarToggleDisplay({ objectivesCollapsed: true, rightCollapsed: true }), {
    objectivesLabel: "\u25b6",
    rightLabel: "\u25c0",
  });
  assert.equal(toggleCollapsedState("true"), "false");
  assert.equal(toggleCollapsedState("false"), "true");
  assert.equal(toggleCollapsedState(undefined), "true");
  assert.deepEqual(buildDrawerToggleState("settings", { settingsOpen: "false", devOpen: "true" }), {
    settingsOpen: "true",
    devOpen: "false",
    closeStudio: true,
  });
  assert.deepEqual(buildDrawerToggleState("settings", { settingsOpen: "true", devOpen: "false" }), {
    settingsOpen: "false",
    devOpen: "false",
    closeStudio: true,
  });
  assert.deepEqual(buildDrawerToggleState("dev", { settingsOpen: "true", devOpen: "false" }), {
    settingsOpen: "false",
    devOpen: "true",
    closeStudio: false,
  });
  assert.deepEqual(buildDrawerToggleState("dev", { settingsOpen: "false", devOpen: "true" }), {
    settingsOpen: "false",
    devOpen: "false",
    closeStudio: true,
  });
  assert.deepEqual(buildGraphicsStudioOpenState(true), {
    devOpen: "true",
    studioOpen: "true",
    bodyGraphicsStudio: "true",
  });
  assert.deepEqual(buildGraphicsStudioOpenState(false), {
    devOpen: "true",
    studioOpen: "false",
    bodyGraphicsStudio: "false",
  });
  assert.deepEqual(buildGraphicsStudioButtonModel("true"), {
    labelKey: "graphics.closeStudio",
    active: "true",
  });
  assert.deepEqual(buildGraphicsStudioButtonModel("false"), {
    labelKey: "graphics.openStudio",
    active: "false",
  });
  assert.deepEqual(buildGraphicsEditorShellControlModel({ studioOpen: "true", copyResetPending: false }), {
    copyLabelKey: "graphics.copy",
    studioButton: {
      labelKey: "graphics.closeStudio",
      active: "true",
    },
  });
  assert.deepEqual(buildGraphicsEditorShellControlModel({ studioOpen: "false", copyResetPending: true }), {
    copyLabelKey: "",
    studioButton: {
      labelKey: "graphics.openStudio",
      active: "false",
    },
  });
}

function testStageHelpers() {
  const tasks = [
    { id: "boot", labelKey: "task.boot" },
    { id: "collect", labelKey: "task.collect" },
    { id: "return", labelKey: "task.return" },
  ];
  const presets = [
    { id: "safe", labelKey: "preset.safe", lines: ["Move()"] },
    { id: "fast", labelKey: "preset.fast", lines: ["Turn(Right)"] },
  ];
  const stages = [
    {
      id: "m1",
      labelKey: "stage.m1",
      location: {
        kindKey: "location.kind.m1",
        nameKey: "location.name.m1",
        descriptionKey: "location.description.m1",
      },
      presetId: "safe",
      taskIds: ["boot", "missing", "collect"],
      completionTaskIds: ["collect", "return"],
      resourceGuidanceKey: "stage.guidance.m1",
      scriptGuidanceKey: "script.guidance.m1",
      teachingMoments: { success: [{ id: "first" }], failure: [{ id: "stuck" }] },
      ui: {
        recommendedSpeed: 5,
        enabledUpgrades: ["memory", "armor"],
        visibleFacilities: ["charger"],
        samplePresetIds: ["fast", "missing"],
        recommendedPresetId: "fast",
      },
    },
    { id: "m2", labelKey: "stage.m2", taskIds: ["return"], ui: {} },
  ];

  assert.equal(getStageDefinition(stages, "m1").id, "m1");
  assert.equal(getStageDefinition(stages, "missing").id, "m1");
  assert.equal(getStageDefinition([], "missing"), null);
  assert.deepEqual(buildStageCopyModel(stages[0]), {
    locationKindKey: "location.kind.m1",
    locationNameKey: "location.name.m1",
    locationDescriptionKey: "location.description.m1",
    resourceGuidanceKey: "stage.guidance.m1",
    scriptGuidanceKey: "script.guidance.m1",
  });
  assert.deepEqual(buildStageCopyModel(null), {
    locationKindKey: "location.kind",
    locationNameKey: "world.title",
    locationDescriptionKey: "location.description",
    resourceGuidanceKey: "",
    scriptGuidanceKey: "",
  });
  const translateStageCopy = (key) =>
    ({
      "location.kind.m1": "Sector",
      "location.name.m1": "WASTE-X",
      "location.description.m1": "Recovery site",
      "stage.guidance.m1": "Recover nearby scrap.",
      "script.guidance.m1": "Use the wake script.",
    })[key] ?? key;
  assert.deepEqual(formatStageCopyDisplay(buildStageCopyModel(stages[0]), translateStageCopy), {
    locationKind: "Sector",
    locationName: "WASTE-X",
    locationDescription: "Recovery site",
    resourceGuidance: "Recover nearby scrap.",
    scriptGuidance: "Use the wake script.",
  });
  assert.deepEqual(formatStageCopyDisplay(buildStageCopyModel(null), translateStageCopy), {
    locationKind: "location.kind",
    locationName: "world.title",
    locationDescription: "location.description",
    resourceGuidance: "",
    scriptGuidance: "",
  });
  const storyPages = [
    { speakerKey: "story.speaker.1", textKey: "story.text.1" },
    { speakerKey: "story.speaker.2", textKey: "story.text.2" },
  ];
  assert.deepEqual(buildStoryDialogueModel(false, storyPages, 0), {
    visible: false,
    stageMode: "idle",
    speakerKey: "",
    textKey: "",
    promptKey: "",
    pageDots: [],
  });
  assert.deepEqual(buildStoryDialogueModel(true, storyPages, 0), {
    visible: true,
    stageMode: "story",
    speakerKey: "story.speaker.1",
    textKey: "story.text.1",
    promptKey: "story.prompt.continue",
    pageDots: [
      { index: 0, active: true },
      { index: 1, active: false },
    ],
  });
  assert.deepEqual(buildStoryDialogueModel(true, storyPages, 99), {
    visible: true,
    stageMode: "story",
    speakerKey: "story.speaker.2",
    textKey: "story.text.2",
    promptKey: "story.prompt.begin",
    pageDots: [
      { index: 0, active: false },
      { index: 1, active: true },
    ],
  });
  const translateStory = (key) =>
    ({
      "story.speaker.1": "Operator",
      "story.text.1": "Wake the unit.",
      "story.prompt.continue": "Continue",
    })[key] ?? key;
  assert.deepEqual(formatStoryDialogueDisplay(buildStoryDialogueModel(true, storyPages, 0), translateStory), {
    speaker: "Operator",
    text: "Wake the unit.",
    prompt: "Continue",
  });
  assert.deepEqual(formatStoryDialogueDisplay(buildStoryDialogueModel(false, storyPages, 0), translateStory), {
    speaker: "",
    text: "",
    prompt: "",
  });
  assert.deepEqual(getStageTaskDefinitions(stages[0], tasks).map((task) => task.id), ["boot", "collect"]);
  assert.deepEqual(buildStageFlow(stages[0], tasks), { boot: false, collect: false });
  assert.deepEqual(getStageUi(stages[0]), stages[0].ui);
  assert.deepEqual(getStageUi(null), {});
  assert.equal(getStageRecommendedSpeed(stages[0], [1, 5, 10]), 5);
  assert.equal(getStageRecommendedSpeed({ ui: { recommendedSpeed: 99 } }, [1, 5, 10]), 1);
  assert.equal(getStageSpeedIndex(stages[0], [1, 5, 10]), 1);
  assert.equal(getStageSpeedIndex({ ui: { recommendedSpeed: 99 } }, [1, 5, 10]), 0);
  assert.equal(isStageUpgradeEnabled("memory", stages[0]), true);
  assert.equal(isStageUpgradeEnabled("weapon", stages[0]), false);
  assert.deepEqual([...getStageVisibleFacilities(stages[0])], ["charger"]);
  assert.deepEqual([...getStageVisibleFacilities({ ui: {} })], ["charger", "repairBay", "fabricator"]);
  assert.deepEqual(getStageCompletionTasks(stages[0], tasks).map((task) => task.id), ["collect", "return"]);
  assert.deepEqual(getStageSamplePresets(stages[0], presets).map((preset) => preset.id), ["fast"]);
  assert.deepEqual(getStageSamplePresets({ ui: {} }, presets), presets);
  assert.equal(getStageRecommendedPreset(stages[0], presets).id, "fast");
  assert.equal(getStageRecommendedPreset({ presetId: "safe", ui: {} }, presets).id, "safe");
  assert.equal(getStageRecommendedPreset({ presetId: "missing", ui: {} }, presets), null);
  assert.deepEqual(buildStageActionItems(stages, "m2", "playing"), [
    { id: "m1", labelKey: "stage.m1", active: false, disabled: true },
    { id: "m2", labelKey: "stage.m2", active: true, disabled: true },
  ]);
  assert.deepEqual(buildStageSampleActionItems(stages[0], presets, "fast", "stopped"), [
    { id: "fast", labelKey: "preset.fast", active: true, disabled: false },
  ]);
  assert.deepEqual(buildStageSampleActionItems({ ui: {} }, presets, "safe", "paused"), [
    { id: "safe", labelKey: "preset.safe", active: true, disabled: true },
    { id: "fast", labelKey: "preset.fast", active: false, disabled: true },
  ]);
  assert.deepEqual(getStageTeachingMoments(stages[0], "success"), [{ id: "first" }]);
  assert.deepEqual(getStageTeachingMoments(stages[0], "unknown"), []);
  assert.equal(buildTeachingMomentKey("m1", "success", "first"), "m1:success:first");
}

function testRuntimeFeedbackHelpers() {
  const okProgram = { ok: true };
  assert.equal(detectRuntimeCause({ program: { ok: false }, logs: [] }), "compile");
  assert.equal(detectRuntimeCause({ program: okProgram, logs: ["Blocked by boundary"] }), "boundary");
  assert.equal(detectRuntimeCause({ program: okProgram, logs: ["Blocked by wall"] }), "wall");
  assert.equal(detectRuntimeCause({ program: okProgram, logs: ["Battery depleted"] }), "power");
  assert.equal(detectRuntimeCause({ program: okProgram, logs: ["Drop blocked"] }), "occupied");
  assert.equal(detectRuntimeCause({ program: okProgram, logs: ["No cargo to unload"] }), "empty");
  assert.equal(detectRuntimeCause({ program: okProgram, logs: ["Enemy strike"] }), "combat");
  assert.equal(detectRuntimeCause({ program: okProgram, hazards: [{}], logs: ["Hazard breach"] }), "hazard");
  assert.equal(detectRuntimeCause({ program: okProgram, vm: { state: "Fault" }, logs: [] }), "logic");
  assert.equal(detectRuntimeCause({ program: okProgram, vm: { state: "Running" }, logs: ["steady"] }), "generic");

  assert.deepEqual(buildRuntimeToastModel({ program: okProgram, logs: ["Battery depleted"] }, { runtimeHintKey: "runtime.stageHint.m2" }), {
    cause: "power",
    titleKey: "runtime.blockedPower",
    bodyKey: "runtime.recodePower",
    stageHintKey: "runtime.stageHint.m2",
  });
  const translateToast = (key) =>
    ({
      "runtime.blockedPower": "Power fault",
      "runtime.recodePower": "Recharge before continuing.",
      "runtime.stageHint.m2": "Watch the battery.",
    })[key] ?? key;
  assert.deepEqual(
    formatRuntimeToastDisplay(
      {
        titleKey: "runtime.blockedPower",
        bodyKey: "runtime.recodePower",
        stageHintKey: "runtime.stageHint.m2",
      },
      translateToast,
    ),
    { title: "Power fault", body: "Recharge before continuing. // Watch the battery." },
  );
  assert.deepEqual(
    formatRuntimeToastDisplay({ titleKey: "runtime.blockedPower", bodyKey: "runtime.recodePower", stageHintKey: "" }, translateToast),
    { title: "Power fault", body: "Recharge before continuing." },
  );
  assert.equal(shouldAutoPause({ tick: 1, vm: { pc: 2 } }, { program: okProgram, logs: ["steady"], tick: 1, vm: { pc: 2 } }), true);
  assert.equal(shouldAutoPause({ tick: 1, vm: { pc: 2 } }, { program: okProgram, logs: ["steady"], tick: 2, vm: { pc: 3 } }), false);
  assert.equal(shouldAutoPause({ tick: 1, vm: { pc: 2 } }, { program: okProgram, logs: ["Battery depleted"], tick: 2, vm: { pc: 3 } }), true);
}

function testRuntimeFlowHelpers() {
  const baseFlow = {
    deploy: false,
    collect: false,
    unload: false,
    craft: false,
    stockBalance: false,
    combat: false,
    repair: false,
    chip: false,
    recharge: false,
    save: true,
  };
  const before = {
    robot: { hp: 6, energy: 3, maxEnergy: 8 },
    resources: { memoryShards: 1, chips: 0 },
    enemies: [{ id: "e1" }, { id: "e2" }],
  };
  const state = {
    program: { ok: true },
    robot: { x: 1, y: 2, hp: 8, energy: 8, maxEnergy: 8, cargo: ["scrap"] },
    base: { x: 1, y: 2 },
    resources: { scrap: 1, cells: 0, chips: 1, memoryShards: 3 },
    enemies: [{ id: "e2" }],
  };

  assert.deepEqual(updateRuntimeFlow(baseFlow, before, state), {
    deploy: true,
    collect: true,
    unload: true,
    craft: true,
    stockBalance: true,
    combat: true,
    repair: true,
    chip: true,
    recharge: true,
    save: true,
  });
  assert.deepEqual(baseFlow, {
    deploy: false,
    collect: false,
    unload: false,
    craft: false,
    stockBalance: false,
    combat: false,
    repair: false,
    chip: false,
    recharge: false,
    save: true,
  });
  assert.deepEqual(updateRuntimeFlow({ craft: false }, null, { resources: { memoryShards: 2 } }), { craft: true });
  assert.deepEqual(updateRuntimeFlow({ combat: true }, before, { enemies: [] }), { combat: true });
  assert.deepEqual(runtimeFlowProgress({ deploy: true, collect: false, unload: true }), { completed: 2, total: 3 });
  assert.equal(formatRuntimeFlowProgress({ deploy: true, collect: false, unload: true }), "2/3");
  const completionTasks = [
    { id: "deploy", labelKey: "task.deploy" },
    { id: "collect", labelKey: "task.collect" },
  ];
  assert.deepEqual(selectRuntimeFlowSummary([], {}), { state: "none", task: null });
  assert.deepEqual(selectRuntimeFlowSummary(completionTasks, { deploy: true, collect: false }), {
    state: "pending",
    task: completionTasks[1],
  });
  assert.deepEqual(selectRuntimeFlowSummary(completionTasks, { deploy: true, collect: true }), {
    state: "complete",
    task: completionTasks[1],
  });
  assert.deepEqual(buildRuntimeFlowSummaryModel([], {}), {
    state: "none",
    textKey: "flow.summary.none",
    labelKey: "",
  });
  assert.deepEqual(buildRuntimeFlowSummaryModel(completionTasks, { deploy: true, collect: false }), {
    state: "pending",
    textKey: "flow.summary.pending",
    labelKey: "task.collect",
  });
  assert.deepEqual(buildRuntimeFlowSummaryModel(completionTasks, { deploy: true, collect: true }), {
    state: "complete",
    textKey: "flow.summary.complete",
    labelKey: "task.collect",
  });
  const translateSummary = (key, values = {}) => {
    const text = {
      "flow.summary.none": "No target",
      "flow.summary.pending": "Next: {label}",
      "flow.summary.complete": "Done: {label}",
      "task.collect": "Collect cargo",
    }[key] ?? key;
    return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
  };
  assert.equal(formatRuntimeFlowSummary({ state: "none", textKey: "flow.summary.none", labelKey: "" }, translateSummary), "No target");
  assert.equal(formatRuntimeFlowSummary({ state: "pending", textKey: "flow.summary.pending", labelKey: "task.collect" }, translateSummary), "Next: Collect cargo");
  assert.equal(formatRuntimeFlowSummary({ state: "complete", textKey: "flow.summary.complete", labelKey: "task.collect" }, translateSummary), "Done: Collect cargo");
  assert.deepEqual(buildRuntimeFlowChecklistState(["deploy", "collect", "unload"], { deploy: true, collect: false, unload: false }), [
    { id: "deploy", done: true, active: false },
    { id: "collect", done: false, active: true },
    { id: "unload", done: false, active: false },
  ]);
  assert.deepEqual(buildRuntimeFlowListItems([
    { id: "deploy", labelKey: "task.deploy" },
    { id: "collect", labelKey: "task.collect" },
    { id: "unload", labelKey: "task.unload" },
  ], { deploy: true, collect: false, unload: false }), [
    { id: "deploy", labelKey: "task.deploy", done: true, active: false },
    { id: "collect", labelKey: "task.collect", done: false, active: true },
    { id: "unload", labelKey: "task.unload", done: false, active: false },
  ]);
  assert.deepEqual(buildRuntimeFlowChecklistState(["deploy", "collect"], { deploy: true, collect: true }), [
    { id: "deploy", done: true, active: false },
    { id: "collect", done: true, active: false },
  ]);
  assert.equal(storedInventoryTotal({ scrap: 2, cells: 3, chips: 4 }), 9);
  assert.equal(isRobotHome({ robot: { x: 2, y: 1 }, base: { x: 2, y: 1 } }), true);
  assert.equal(isRobotHome({ robot: { x: 2, y: 1 }, base: { x: 1, y: 1 } }), false);
}

function testRuntimeTeachingHelpers() {
  const stage = { id: "m2" };
  const successMoments = [
    { id: "deploy", taskId: "deploy", titleKey: "success.deploy.title", bodyKey: "success.deploy.body" },
    { id: "collect", taskId: "collect", titleKey: "success.collect.title", bodyKey: "success.collect.body" },
  ];
  assert.deepEqual(
    selectSuccessTeachingMoment(stage, successMoments, { deploy: false, collect: false }, { deploy: true, collect: false }),
    { key: "m2:success:deploy", moment: successMoments[0] },
  );
  assert.equal(
    selectSuccessTeachingMoment(
      stage,
      successMoments,
      { deploy: false, collect: false },
      { deploy: true, collect: true },
      new Set(["m2:success:deploy"]),
    ).key,
    "m2:success:collect",
  );
  assert.equal(selectSuccessTeachingMoment(null, successMoments, {}, {}), null);

  const failureMoments = [
    { id: "wall", cause: "wall", titleKey: "failure.wall.title" },
    { id: "power", cause: "power", titleKey: "failure.power.title" },
  ];
  assert.deepEqual(selectFailureTeachingMoment(stage, failureMoments, "power"), {
    key: "m2:failure:power",
    moment: failureMoments[1],
  });
  assert.equal(selectFailureTeachingMoment(stage, failureMoments, "power", new Set(["m2:failure:power"])), null);
  const translateTeaching = (key) =>
    ({
      "success.deploy.title": "Script deployed",
      "success.deploy.body": "The first loop is alive.",
    })[key] ?? key;
  assert.deepEqual(formatTeachingMomentDisplay(successMoments[0], translateTeaching), {
    title: "Script deployed",
    body: "The first loop is alive.",
  });
  assert.deepEqual(formatTeachingMomentDisplay({}, translateTeaching), { title: "", body: "" });
}

function testRuntimeControlHelpers() {
  assert.deepEqual(buildPlaybackControlModel({
    playbackMode: "playing",
    storyActive: false,
    speed: 10,
    settingsOpen: true,
    devOpen: false,
    languageMode: "zh",
    stageEnabled: { memory: true, armor: false, weapon: true },
  }), {
    editorLocked: true,
    playLabelKey: "action.pause",
    stepLabelKey: "action.frame",
    resetLabelKey: "action.stop",
    playDisabled: false,
    stepDisabled: false,
    speedDisabled: false,
    speedLabel: "10X",
    playActive: true,
    speedActive: true,
    settingsActive: true,
    devlogActive: false,
    devlogLabelKey: "action.devLogClosed",
    languageModeKey: "language.mode.zh",
    upgrades: {
      memory: { stageEnabled: true, disabled: false },
      armor: { stageEnabled: false, disabled: true },
      weapon: { stageEnabled: true, disabled: false },
    },
  });
  assert.equal(buildPlaybackControlModel({ playbackMode: "paused", storyActive: true }).playLabelKey, "action.resume");
  assert.equal(buildPlaybackControlModel({ playbackMode: "stopped", storyActive: false }).editorLocked, false);
  const translateControls = (key, values = {}) => {
    const text = {
      "action.play": "Play",
      "action.pause": "Pause",
      "action.frame": "Step",
      "action.stop": "Stop",
      "action.speed": "Speed {speed}",
      "action.devLogOpen": "Dev log open",
      "action.localizationMode": "Language {mode}",
      "language.mode.zh": "Chinese",
      "settings.title": "Settings",
    }[key] ?? key;
    return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
  };
  assert.deepEqual(formatPlaybackControlText({
    playLabelKey: "action.pause",
    stepLabelKey: "action.frame",
    resetLabelKey: "action.stop",
    speedLabel: "10X",
    devlogLabelKey: "action.devLogOpen",
    languageModeKey: "language.mode.zh",
  }, translateControls), {
    playLabel: "Pause",
    stepLabel: "Step",
    resetLabel: "Stop",
    playTitle: "Play",
    stepTitle: "Step",
    resetTitle: "Stop",
    speedLabel: "10X",
    speedTitle: "Speed 10X",
    settingsLabel: "Settings",
    devlogLabel: "Dev log open",
    localizationLabel: "Language Chinese",
  });
  assert.deepEqual(getSpeedProfile([1, 5, 10], { 1: { interval: 720, duration: 420 }, 10: { interval: 90, duration: 70 } }, 2), {
    interval: 90,
    duration: 70,
  });
  assert.equal(playbackScheduleDelay({ interval: 90, duration: 130 }), 150);
  assert.equal(playbackScheduleDelay({ interval: 170, duration: 130 }), 170);
}

function testRuntimeDisplayHelpers() {
  assert.equal(formatInstructionUsage({ instructionUsed: 4 }, 12), "4/12");
  assert.equal(formatInstructionUsage(null, 12), "0/12");
  assert.equal(formatRuntimeValue(null), "-");
  assert.equal(formatRuntimeValue(undefined), "-");
  assert.equal(formatRuntimeValue(""), "-");
  assert.equal(formatRuntimeValue(0), "0");
  assert.deepEqual(buildRuntimeLogItems(["boot", "move"]), ["boot", "move"]);
  assert.deepEqual(buildRuntimeLogItems(null), []);
  assert.deepEqual(buildRuntimeDiffDisplay([]), {
    count: 0,
    countLabelKey: "diff.changes",
    empty: true,
    emptyKey: "diff.empty",
    items: [],
  });
  const translateDiff = (key, values = {}) => {
    const text = {
      "diff.count": "{count} {label}",
      "diff.change": "change",
      "diff.changes": "changes",
      "diff.empty": "No changes",
    }[key] ?? key;
    return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
  };
  assert.equal(formatRuntimeDiffCount(buildRuntimeDiffDisplay([]), translateDiff), "0 changes");
  assert.equal(formatRuntimeDiffEmpty(buildRuntimeDiffDisplay([]), translateDiff), "No changes");
  assert.deepEqual(buildRuntimeDiffDisplay([{ path: "robot.x", before: "", after: 2 }]), {
    count: 1,
    countLabelKey: "diff.change",
    empty: false,
    emptyKey: "diff.empty",
    items: [{ path: "robot.x", before: "-", after: "2", text: "robot.x: - -> 2" }],
  });
  assert.equal(formatRuntimeDiffCount(buildRuntimeDiffDisplay([{ path: "robot.x", before: "", after: 2 }]), translateDiff), "1 change");
  assert.equal(buildRuntimeDiffDisplay(Array.from({ length: 20 }, (_, index) => ({ path: `p${index}` }))).items.length, 18);
  assert.equal(formatRuntimeDiffItem({ path: "robot.hp", before: 8, after: null }), "robot.hp: 8 -> -");
  assert.deepEqual(summarizeCargoManifest(["scrap", "cell", "cell", "chip"]), {
    scrap: 1,
    battery: 2,
    chip: 1,
  });
  assert.deepEqual(buildCargoManifestDisplayItems({ scrap: 2, battery: 1 }), {
    empty: false,
    items: [
      { item: "scrap", count: 2 },
      { item: "battery", count: 1 },
    ],
  });
  assert.deepEqual(buildCargoManifestDisplayItems(new Map([["chip", 3]])), {
    empty: false,
    items: [{ item: "chip", count: 3 }],
  });
  assert.deepEqual(buildCargoManifestDisplayItems(null), { empty: true, items: [] });
  const translateManifest = (key) =>
    ({
      "resources.cargoEmpty": "Empty",
      "resources.item.scrap": "Scrap",
      "resources.item.battery": "Battery",
      "resources.item.chip": "Chip",
    })[key] ?? key;
  assert.equal(formatCargoManifestDisplay({ scrap: 2, battery: 1 }, translateManifest), "Scrap x2, Battery x1");
  assert.equal(formatCargoManifestDisplay(new Map([["chip", 3]]), translateManifest), "Chip x3");
  assert.equal(formatCargoManifestDisplay(null, translateManifest), "Empty");
  const translateSaveStatus = (key, values = {}) => {
    const text = {
      "save.empty": "No save yet",
      "save.saved": "Saved at tick {tick}",
      "save.missing": "No save slot",
    }[key] ?? key;
    return Object.entries(values).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, String(value)), text);
  };
  assert.equal(formatSaveStatusDisplay({ key: "save.saved", values: { tick: 9 } }, translateSaveStatus), "Saved at tick 9");
  assert.equal(formatSaveStatusDisplay({ key: "save.missing" }, translateSaveStatus), "No save slot");
  assert.equal(formatSaveStatusDisplay(null, translateSaveStatus), "No save yet");
  assert.equal(calculateArmorPercent({ hp: 5, armor: 1 }), 50);
  assert.equal(calculateArmorPercent({ hp: 20, armor: 1 }), 100);
  assert.equal(calculateEnergyPercent({ energy: 3, maxEnergy: 6 }), 50);
  assert.equal(calculateEnergyPercent({ energy: 1, maxEnergy: 0 }), 0);
  assert.equal(selectVmStateLabelKey(null), "state.idle");
  assert.equal(selectVmStateLabelKey("suspended"), "vm.suspended");
  assert.equal(formatPercentText(83), "83%");
  assert.deepEqual(buildCompileStatusDisplay(), { text: "", className: "", visible: false });
  assert.deepEqual(buildRuntimeDisplayModel({
    tick: 7,
    program: { instructionUsed: 5 },
    instructionCapacity: 12,
    cargoCapacity: 3,
    vm: { state: "suspended" },
    robot: { x: 2, y: 4, dir: "N", cargo: ["cell"], armor: 2, hp: 10, energy: 5, maxEnergy: 6 },
    resources: { scrap: 1, cells: 2, chips: 3, memoryShards: 4 },
  }), {
    tick: 7,
    instructionUsage: "5/12",
    compileStatus: { text: "", className: "", visible: false },
    vmStateKey: "vm.suspended",
    capacityLabelKey: "capacity",
    capacityLabelValues: { value: 12 },
    robotPosition: "R1 // 2,4 N",
    moduleStats: { armor: 2, weapon: 0, hp: 10 },
    cargoCount: "1/3",
    cargoManifestItems: { battery: 1 },
    batteryValue: "5/6",
    armorPercent: 83,
    armorPercentText: "83%",
    armorMeterWidth: "83%",
    energyPercent: 83,
    energyPercentText: "83%",
    energyMeterWidth: "83%",
    resources: { scrap: 1, cells: 2, chips: 3, memoryShards: 4 },
  });
  assert.deepEqual(
    buildFacilityDisplayItems(
      {
        charger: { status: "ready" },
        repairBay: { status: "offline" },
        fabricator: { status: "active", recipe: { scrap: 2, cells: 1 } },
      },
      new Set(["charger", "fabricator"]),
    ),
    [
      { key: "charger", labelKey: "facilities.charger", statusKey: "facilities.status.ready", recipe: null },
      {
        key: "fabricator",
        labelKey: "facilities.fabricator",
        statusKey: "facilities.status.active",
        recipe: { scrap: 2, cells: 1, memoryShards: 1 },
      },
    ],
  );
  assert.deepEqual(
    buildFacilityDisplayItems(
      { fabricator: { status: "ready", recipe: { scrap: 3, cells: 2, memoryShards: 4 } } },
      new Set(["repairBay", "fabricator"]),
    ),
    [
      {
        key: "fabricator",
        labelKey: "facilities.fabricator",
        statusKey: "facilities.status.ready",
        recipe: { scrap: 3, cells: 2, memoryShards: 4 },
      },
    ],
  );
  const translateFacility = (key) =>
    ({
      "facilities.status.ready": "Ready",
      "facilities.status.active": "Active",
      "resources.item.scrap": "Scrap",
      "resources.item.battery": "Battery",
      "resources.memoryShards": "Memory shards",
    })[key] ?? key;
  assert.equal(
    formatFacilityDescription({ statusKey: "facilities.status.ready", recipe: null }, translateFacility),
    "Ready",
  );
  assert.equal(
    formatFacilityDescription(
      { statusKey: "facilities.status.active", recipe: { scrap: 2, cells: 1, memoryShards: 3 } },
      translateFacility,
    ),
    "Active // 2 Scrap + 1 Battery -> 3 Memory shards",
  );
}

function testEditorAutocompleteHelpers() {
  assert.equal(matchesCompletion("MoveToward", "mov"), true);
  assert.equal(matchesCompletion("MoveToward", "tow"), true);
  assert.equal(matchesCompletion("MoveToward", "@tow"), true);
  assert.equal(matchesCompletion(1234, "12"), true);
  assert.equal(matchesCompletion(null, "x"), false);
  assert.deepEqual(splitCompletionSegments("Move_Toward HomeBase"), ["Move", "Toward", "Home", "Base"]);

  assert.deepEqual(createAutocompleteSuggestions([{ value: 12 }, { value: "Move()", label: "Move", matchText: "Move" }]), [
    { value: "12", label: "12", matchText: "12" },
    { value: "Move()", label: "Move", matchText: "Move" },
  ]);
  assert.deepEqual(dedupeSuggestions([
    { value: "Move()", kindKey: "completion.kind.action" },
    { value: "Move()", kindKey: "completion.kind.action" },
    { value: "Move()", kindKey: "completion.kind.query" },
  ]), [
    { value: "Move()", kindKey: "completion.kind.action" },
    { value: "Move()", kindKey: "completion.kind.query" },
  ]);
  const translateAutocomplete = (key) =>
    ({
      "completion.kind.action": "Action",
      "completion.kind.label": "Label",
      "completion.hint.action": "action clause",
    })[key] ?? key;
  assert.deepEqual(
    buildAutocompleteDisplayModel(
      [
        { value: "Move()", label: "Move()", kindKey: "completion.kind.action", hintKey: "completion.hint.action" },
        { value: "@Loop", kindKey: "completion.kind.label", hintText: "defined at line 1" },
      ],
      1,
      translateAutocomplete,
    ),
    {
      items: [
        { index: 0, active: false, label: "Move()", hint: "Action / action clause" },
        { index: 1, active: true, label: "@Loop", hint: "Label / defined at line 1" },
      ],
      footerText: "[TAB] Accept   [ESC] Close",
    },
  );
  assert.deepEqual(
    buildAutocompletePositionModel(
      { column: 10, lineNumber: 3 },
      { lineHeight: 20, fontSize: 10, paddingLeft: 4, paddingTop: 6, scrollLeft: 2, scrollTop: 10, clientWidth: 260 },
    ),
    { left: 64, top: 60 },
  );
  assert.deepEqual(
    buildAutocompletePositionModel(
      { column: 100, lineNumber: 0 },
      { fontSize: 12, paddingLeft: 0, paddingTop: 0, clientWidth: 180 },
    ),
    { left: 8, top: 8 },
  );

  assert.equal(predicateCallSnippet("Has"), "Has()");
  assert.deepEqual(predicateSnippetMeta("Has"), {
    selectionStartOffset: 4,
    selectionEndOffset: 4,
    triggerAutocomplete: true,
    requiresQueryValue: true,
  });
  assert.deepEqual(predicateSnippetMeta("Any"), { completesQueryImmediately: true });
  assert.deepEqual(predicateSnippetMeta("Unknown"), {});

  assert.equal(actionInsertSnippet("MoveToward"), "MoveToward(Home)");
  assert.equal(actionInsertSnippet("Craft"), "Craft(Home)");
  assert.equal(actionInsertSnippet("Turn"), "Turn()");
  assert.deepEqual(actionSnippetMeta("Move"), {
    selectionStartOffset: 5,
    selectionEndOffset: 5,
    triggerAutocomplete: true,
  });
  assert.deepEqual(actionSnippetMeta("Wait"), {});
  assert.deepEqual(createActionKeywordSuggestions(["Move", "Craft"]), [
    {
      value: "Goto @",
      label: "Goto",
      kindKey: "completion.kind.branch",
      hintKey: "completion.goto.loop",
      selectionStartOffset: 6,
      selectionEndOffset: 6,
      triggerAutocomplete: true,
      matchText: "Goto",
    },
    {
      value: "Move()",
      label: "Move()",
      kindKey: "completion.kind.action",
      hintKey: "completion.hint.action",
      matchText: "Move",
      selectionStartOffset: 5,
      selectionEndOffset: 5,
      triggerAutocomplete: true,
    },
    {
      value: "Craft(Home)",
      label: "Craft(Home)",
      kindKey: "completion.kind.action",
      hintKey: "completion.hint.action",
      matchText: "Craft",
    },
  ]);
}

function testEditorTextHelpers() {
  assert.deepEqual(tokenRangeAtOffset("@Loop\nGoto @Loop", 12), {
    start: 11,
    end: 16,
    token: "@Loop",
  });
  assert.deepEqual(tokenRangeAtOffset("Move()", 999), {
    start: 6,
    end: 6,
    token: "",
  });
  assert.equal(tokenAtOffset("@Loop", 2), "@Loop");
  assert.equal(tokenAtOffset("Goto", 2), "");

  const labels = collectLabelDefinitions([
    "@Loop",
    "Move()",
    "@Back_1",
    "@Loop",
    "Goto @Back_1",
  ].join("\n"));
  assert.deepEqual([...labels.entries()], [["Loop", 1], ["Back_1", 3]]);
  assert.deepEqual(createLabelEntries(labels), [
    { label: "Loop", line: 1 },
    { label: "Back_1", line: 3 },
  ]);
  assert.deepEqual(createLabelNames(labels), ["Loop", "Back_1"]);
  assert.equal(findLabelLine("@Loop\nMove()\n@Back_1", "Back_1"), 3);
  assert.equal(findLabelLine("@Loop\nMove()", "Missing"), 0);
  assert.deepEqual(lineSelectionRange("@Loop\nMove()\nGoto @Loop", 2), {
    line: 2,
    start: 6,
    end: 12,
  });
  assert.deepEqual(lineSelectionRange("@Loop\nMove()", 99), {
    line: 2,
    start: 6,
    end: 12,
  });
}

function testEditorHighlightHelpers() {
  const syntax = {
    actions: new Set(["Move", "Goto"]),
    queries: new Set(["Check"]),
    branches: new Set(["If"]),
    values: new Set(["Home"]),
    labelDefinitions: new Map([["Loop", 1]]),
    labelTitle: (line) => `defined line ${line}`,
  };
  assert.equal(classifyDiagnosticSeverity("Unused label"), "warning");
  assert.equal(classifyDiagnosticSeverity("Unknown instruction"), "error");
  assert.deepEqual(buildDiagnosticDisplayModel([]), {
    invalid: false,
    count: 0,
    countKey: "diagnostic.issueCount.other",
    items: [],
  });
  assert.deepEqual(buildDiagnosticDisplayModel([
    { line: 2, message: "Unknown instruction" },
    { line: 0, message: "Unused label" },
  ]), {
    invalid: true,
    count: 2,
    countKey: "diagnostic.issueCount.other",
    items: [
      {
        line: 2,
        severity: "error",
        severityKey: "diagnostic.severity.error",
        locationKey: "diagnostic.line",
        locationValues: { line: 2 },
        message: "Unknown instruction",
        interactive: true,
      },
      {
        line: 0,
        severity: "warning",
        severityKey: "diagnostic.severity.warning",
        locationKey: "diagnostic.general",
        locationValues: {},
        message: "Unused label",
        interactive: false,
      },
    ],
  });
  assert.equal(
    highlightEditorLine("If Check(Home) Then Goto @Loop // <safe>", syntax),
    '<span class="tok-branch">If</span> <span class="tok-query">Check</span>(<span class="tok-value">Home</span>) <span class="tok-unknown">Then</span> <span class="tok-action">Goto</span> <span class="tok-label tok-label-ref" title="defined line 1">@Loop</span> <span class="tok-comment">// &lt;safe&gt;</span>',
  );
  assert.equal(
    renderHighlightedLabelToken("@Loop", "@Loop", syntax),
    '<span class="tok-label tok-label-def">@Loop</span>',
  );
  assert.equal(
    renderHighlightedLabelToken("@Missing", "Goto @Missing", syntax),
    '<span class="tok-label tok-label-missing">@Missing</span>',
  );
  assert.deepEqual(buildScriptHighlightModel("@Loop\nMove()", [{ line: 2 }], syntax), {
    lineNumbers: "01\n02",
    html: '<span class="code-line"><span class="tok-label tok-label-def">@Loop</span></span><span class="code-line has-error"><span class="tok-action">Move</span>()</span>',
  });
}

function testGraphicsConfigHelpers() {
  const fallback = defaultGraphicsEditorConfig();
  assert.equal(fallback.entityKinds.robot, "actor");
  assert.equal(fallback.entityTemplates.length, 4);
  assert.equal(fallback.fillSwatches.length, 6);

  const normalized = normalizeGraphicsEditorConfig({
    entityKinds: { signal: "pickup" },
    entityTemplates: [{ id: "signal", visual: { layers: [] } }],
    layerTypeOptions: [],
    shapeOptions: [{ value: "hex", label: "Hex" }],
    defaultShapeLayer: { fill: "#ffffff", x: { kind: "center" } },
    fillSwatches: [{ id: "white", value: "#ffffff" }],
  });
  assert.deepEqual(normalized.entityKinds, { signal: "pickup" });
  assert.equal(normalized.entityTemplates[0].id, "signal");
  assert.deepEqual(normalized.layerTypeOptions, fallback.layerTypeOptions);
  assert.deepEqual(normalized.shapeOptions, [{ value: "hex", label: "Hex" }]);
  assert.deepEqual(normalized.defaultShapeLayer, { fill: "#ffffff", x: { kind: "center" } });
  assert.deepEqual(normalized.fillSwatches, [{ id: "white", value: "#ffffff" }]);

  normalized.entityKinds.signal = "changed";
  normalized.defaultShapeLayer.x.kind = "mutated";
  assert.deepEqual(normalizeGraphicsEditorConfig({ entityKinds: { signal: "pickup" } }).entityKinds, { signal: "pickup" });
  const sourceConfig = { defaultShapeLayer: { x: { kind: "center" } } };
  const cloned = normalizeGraphicsEditorConfig(sourceConfig);
  cloned.defaultShapeLayer.x.kind = "mutated";
  assert.equal(sourceConfig.defaultShapeLayer.x.kind, "center");
}

function testEntityVisualRendering() {
  const svg = renderEntityVisualSvg({
    canvasSize: 24,
    layers: [
      {
        id: "body",
        type: "shape",
        shape: "rectangle",
        x: 12,
        y: 12,
        width: 18,
        height: 14,
        radius: 2,
        fill: "#f28d35",
        stroke: "#060302",
        strokeWidth: 1,
        textureType: "stripes",
        textureColor: "#33261c",
      },
      {
        id: "glyph",
        type: "glyph",
        glyph: '<R&"1">',
        x: 12,
        y: 12,
        fontSize: 8,
        glyphColor: "#f0d8bb",
      },
      {
        id: "hidden",
        type: "glyph",
        visible: false,
        glyph: "hidden",
      },
    ],
  });

  assert.match(svg, /^<svg /);
  assert.match(svg, /<defs><pattern id="texture-0"/);
  assert.match(svg, /<rect x="3" y="5" width="18" height="14"/);
  assert.match(svg, /&lt;R&amp;&quot;1&quot;&gt;/);
  assert.equal(svg.includes("hidden"), false);
}

function testEntityVisualDataUrlCache() {
  const cache = new Map();
  const visual = {
    canvasSize: 12,
    layers: [{ id: "dot", type: "shape", shape: "circle", x: 6, y: 6, width: 8, height: 8, fill: "#ff0000" }],
  };
  const first = buildEntityVisualDataUrl("dot", visual, cache);
  const second = buildEntityVisualDataUrl("dot", visual, cache);
  assert.equal(first, second);
  assert.equal(cache.size, 1);
  assert.ok(decodeURIComponent(first).includes("<ellipse"));
}

function testGraphicsEntityListHelpers() {
  const translate = (key) =>
    ({
      "graphics.entity.robot": "Robot",
      "graphics.entityIoPlaceholder": "Paste entity JSON",
      "graphics.exportEntity": "Export entity",
      "graphics.importEntity": "Import entity",
    })[key] ?? key;
  const catalog = {
    version: 1,
    entities: {
      robot: { label: "Fallback Robot", layers: [{ id: "body" }] },
      wall: { label: "Wall", layers: [{ id: "brick" }, { id: "mortar" }] },
    },
  };
  assert.equal(getGraphicsEntityDisplayLabel("robot", catalog.entities.robot, translate), "Robot");
  assert.equal(getGraphicsEntityDisplayLabel("wall", catalog.entities.wall, translate), "Wall");
  assert.equal(getGraphicsEntityDisplayLabel("missing", null, translate), "missing");
  assert.deepEqual(buildGraphicsEntityListItems(catalog, "wall", translate), [
    { entityKey: "robot", active: false, label: "Robot" },
    { entityKey: "wall", active: true, label: "Wall" },
  ]);
  assert.deepEqual(buildGraphicsEntityListItems(null, "robot", translate), []);
  assert.deepEqual(applyGraphicsEntitySelection(catalog, "robot", "wall", "mortar"), {
    entityKey: "wall",
    selectedLayerId: "mortar",
  });
  assert.deepEqual(applyGraphicsEntitySelection(catalog, "robot", "wall", "missing"), {
    entityKey: "wall",
    selectedLayerId: "brick",
  });
  assert.deepEqual(applyGraphicsEntitySelection(catalog, "robot", "missing", "body"), {
    entityKey: "robot",
    selectedLayerId: "body",
  });
  const resetState = resetGraphicsEntityVisualCatalog(catalog, "wall", "mortar");
  assert.equal(resetState.selectedEntityKey, "wall");
  assert.equal(resetState.selectedLayerId, "mortar");
  resetState.entityVisualCatalog.entities.wall.layers[1].id = "changed";
  assert.equal(catalog.entities.wall.layers[1].id, "mortar");
  assert.equal(resetGraphicsEntityVisualCatalog(catalog, "wall", "missing").selectedLayerId, "brick");
  const preview = buildGraphicsEntityPreviewModel(
    "wall",
    {
      label: "Wall",
      canvasSize: 12,
      layers: [{ id: "dot", type: "shape", shape: "circle", x: 6, y: 6, width: 8, height: 8 }],
    },
    translate,
  );
  assert.match(preview.backgroundImage, /^url\("data:image\/svg\+xml/);
  assert.equal(preview.label, "Wall");
  assert.equal(preview.ariaLabel, "Wall");
  assert.deepEqual(buildGraphicsEntityPreviewModel("missing", null, translate), {
    backgroundImage: "none",
    label: "missing",
    ariaLabel: "missing",
  });
  assert.deepEqual(buildGraphicsEntityVisualExportModel(null), { disabled: true, value: "" });
  assert.deepEqual(
    buildGraphicsEntityVisualExportModel({ label: "Robot", layers: [{ id: "body" }] }),
    {
      disabled: false,
      value: JSON.stringify({ label: "Robot", layers: [{ id: "body" }] }, null, 2),
    },
  );
  assert.deepEqual(buildGraphicsEntityIoModel({ catalog, ioValue: "", translate }), {
    exportValue: JSON.stringify(catalog, null, 2),
    placeholder: "Paste entity JSON",
    exportEntityLabel: "Export entity",
    importEntityLabel: "Import entity",
  });
  assert.equal(buildGraphicsEntityIoModel({ catalog, ioValue: "{}", translate }).placeholder, "");
  const importedSource = { label: "Imported Bot", layers: [{ id: "body", glyph: "R" }] };
  const normalizedImport = normalizeImportedEntityVisual(importedSource);
  normalizedImport.layers[0].glyph = "X";
  assert.equal(importedSource.layers[0].glyph, "R");
  assert.deepEqual(parseImportedEntityVisual(JSON.stringify(importedSource)), importedSource);
  const importedCatalogState = applyImportedEntityVisualToSelection(
    catalog,
    "robot",
    "missing",
    JSON.stringify({ label: "Imported Robot", layers: [{ id: "import-body" }, { id: "import-glyph" }] }),
  );
  assert.equal(importedCatalogState.changed, true);
  assert.equal(importedCatalogState.selectedEntityKey, "robot");
  assert.equal(importedCatalogState.selectedLayerId, "import-body");
  assert.deepEqual(importedCatalogState.visual, {
    label: "Imported Robot",
    layers: [{ id: "import-body" }, { id: "import-glyph" }],
  });
  assert.equal(importedCatalogState.entityVisualCatalog.entities.robot.label, "Imported Robot");
  assert.equal(catalog.entities.robot.label, "Fallback Robot");
  const skippedImportState = applyImportedEntityVisualToSelection(catalog, "", "body", JSON.stringify(importedSource));
  assert.equal(skippedImportState.changed, false);
  assert.equal(skippedImportState.entityVisualCatalog, catalog);
  assert.throws(() => applyImportedEntityVisualToSelection(catalog, "robot", "body", "{bad json"), SyntaxError);
  assert.throws(() => normalizeImportedEntityVisual({ label: "Missing Layers" }), /Missing layers array/);
  assert.throws(() => parseImportedEntityVisual("{bad json"), SyntaxError);
}

function testGraphicsPreviews() {
  assert.equal(normalizeColorValue("#00ff88", "#f28d35"), "#00ff88");
  assert.equal(normalizeColorValue("orange", "#f28d35"), "#f28d35");
  assert.equal(buildGraphicsColorPreview("#f28d35"), "linear-gradient(180deg, #f28d35, #f28d35)");
  assert.match(buildGraphicsTexturePreview("#33261c", "stripes"), /repeating-linear-gradient/);
  assert.match(buildGraphicsTexturePreview("#33261c", "dither"), /radial-gradient/);
}

function testGraphicsTemplateHelpers() {
  assert.deepEqual(buildGraphicsTemplateActionState({
    selectedEntityKey: "",
    ioValue: "",
    customTemplates: [],
  }), {
    saveDisabled: true,
    importDisabled: true,
    exportLibraryDisabled: true,
  });
  assert.deepEqual(buildGraphicsTemplateActionState({
    selectedEntityKey: "robot",
    ioValue: "  {\"kind\":\"graphics-template\"}  ",
    customTemplateCount: 2,
  }), {
    saveDisabled: false,
    importDisabled: false,
    exportLibraryDisabled: false,
  });
  const rawTemplate = {
    label: " Relay ",
    visual: { canvasSize: 24, layers: [{ id: "body", type: "shape" }] },
    entityKinds: ["robot", 7, "pickup"],
    updatedAt: "42",
  };
  const normalized = normalizeGraphicsCustomTemplate(rawTemplate, 0);
  assert.equal(normalized.label, "Relay");
  assert.deepEqual(normalized.entityKinds, ["robot", "pickup"]);
  assert.equal(normalized.updatedAt, 42);
  normalized.visual.layers[0].id = "changed";
  assert.equal(rawTemplate.visual.layers[0].id, "body");

  assert.equal(normalizeGraphicsCustomTemplates([null, rawTemplate]).length, 1);
  assert.deepEqual(normalizeRecentGraphicsTemplateIds([" a ", "b", "a", "", 7, "c", "d", "e", "f", "g"]), [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ]);
  assert.deepEqual(normalizeGraphicsTemplateFilterState({ mode: "fit", category: " pickup " }), {
    mode: "fit",
    category: "pickup",
  });

  assert.equal(buildCustomTemplateId("wall", "Signal Relay!", 123456), "custom-wall-signal-relay-2n9c");
  assert.deepEqual(
    resolveGraphicsTemplateObject(
      {
        x: { kind: "center", offset: 2 },
        glyph: { kind: "entityInitial" },
        width: { scale: 0.5, round: "integer", min: 8, max: 20 },
      },
      { canvasSize: 30, entityKey: "robot" },
    ),
    { x: 17, glyph: "R", width: 15 },
  );

  const serialized = serializeGraphicsTemplate(rawTemplate, {
    getLabel: () => "Localized Relay",
    getDescription: () => "Localized description",
    now: 1000,
  });
  assert.equal(serialized.kind, "graphics-template");
  assert.equal(serialized.label, "Localized Relay");
  assert.equal(serialized.description, "Localized description");
  assert.equal(serialized.updatedAt, 42);
  serialized.visual.layers[0].id = "serialized-change";
  assert.equal(rawTemplate.visual.layers[0].id, "body");

  const library = serializeGraphicsTemplateLibrary([rawTemplate], { now: 2000 });
  assert.equal(library.kind, "graphics-template-library");
  assert.equal(library.exportedAt, 2000);
  assert.equal(library.templates.length, 1);
  assert.deepEqual(buildGraphicsTemplateExportModel(null), { disabled: true, value: "" });
  const exportModel = buildGraphicsTemplateExportModel(rawTemplate, {
    getLabel: () => "Localized Relay",
    getDescription: () => "Localized description",
    now: 3000,
  });
  assert.equal(exportModel.disabled, false);
  assert.equal(JSON.parse(exportModel.value).label, "Localized Relay");
  assert.equal(exportModel.value.includes('\n  "kind"'), true);
  assert.deepEqual(buildGraphicsTemplateLibraryExportModel([], { now: 3000 }), {
    disabled: true,
    count: 0,
    value: JSON.stringify({ kind: "graphics-template-library", version: 1, exportedAt: 3000, templates: [] }, null, 2),
  });
  const libraryExportModel = buildGraphicsTemplateLibraryExportModel([rawTemplate], { now: 3000 });
  assert.equal(libraryExportModel.disabled, false);
  assert.equal(libraryExportModel.count, 1);
  assert.equal(JSON.parse(libraryExportModel.value).templates[0].label, " Relay ");
  assert.equal(isGraphicsTemplateLibraryPayload(library), true);
  assert.equal(isGraphicsTemplateLibraryPayload({ templates: [] }), true);
  assert.equal(isGraphicsTemplateLibraryPayload({ kind: "graphics-template", templates: [] }), false);
}

function testGraphicsStorageHelpers() {
  const storage = createMemoryStorage();
  const templatesKey = "templates";
  const recentKey = "recent";
  const filterKey = "filter";
  const catalogKey = "catalog";
  const rawTemplate = {
    label: "Local Bot",
    visual: { canvasSize: 24, layers: [{ id: "body", type: "shape" }] },
  };

  storage.setItem(templatesKey, JSON.stringify([rawTemplate, { broken: true }]));
  assert.equal(loadCustomGraphicsTemplatesFromStorage(storage, templatesKey).length, 1);
  storage.setItem(templatesKey, "{bad json");
  assert.deepEqual(loadCustomGraphicsTemplatesFromStorage(storage, templatesKey), []);

  storage.setItem(recentKey, JSON.stringify(["x", "x", " y "]));
  assert.deepEqual(loadRecentGraphicsTemplateIdsFromStorage(storage, recentKey), ["x", "y"]);
  const normalizedRecent = persistRecentGraphicsTemplateIds(storage, recentKey, ["a", "a", "b"]);
  assert.deepEqual(normalizedRecent, ["a", "b"]);
  assert.equal(storage.getItem(recentKey), '["a","b"]');

  assert.deepEqual(defaultGraphicsTemplateFilterState(), { mode: "all", category: "all" });
  storage.setItem(filterKey, JSON.stringify({ mode: "fit", category: "actor" }));
  assert.deepEqual(loadGraphicsTemplateFilterStateFromStorage(storage, filterKey), { mode: "fit", category: "actor" });
  const normalizedFilter = persistGraphicsTemplateFilterState(storage, filterKey, { mode: "bad", category: "" });
  assert.deepEqual(normalizedFilter, { mode: "all", category: "all" });

  const baseCatalog = {
    version: 1,
    entities: {
      robot: { label: "Robot", layers: [{ id: "base" }] },
      wall: { label: "Wall", layers: [] },
    },
  };
  const overrideCatalog = { entities: { robot: { label: "Custom Robot", layers: [{ id: "custom" }] } } };
  const merged = mergeEntityVisualCatalogs(baseCatalog, overrideCatalog);
  assert.equal(merged.entities.robot.label, "Custom Robot");
  assert.equal(merged.entities.wall.label, "Wall");
  merged.entities.robot.layers[0].id = "mutated";
  assert.equal(overrideCatalog.entities.robot.layers[0].id, "custom");

  storage.setItem(catalogKey, JSON.stringify(overrideCatalog));
  const restored = loadEntityVisualCatalogState(baseCatalog, storage.getItem(catalogKey));
  assert.equal(restored.entityVisualCatalog.entities.robot.label, "Custom Robot");
  restored.defaultEntityVisualCatalog.entities.robot.label = "changed";
  assert.equal(baseCatalog.entities.robot.label, "Robot");

  persistJsonValue(storage, "plain", { ok: true });
  assert.equal(storage.getItem("plain"), '{"ok":true}');
}

function testGraphicsFormSchemaHelpers() {
  assert.equal(shouldRenderGraphicsField({ field: "width" }, {}), true);
  assert.equal(
    shouldRenderGraphicsField(
      { field: "stripeWidth", showWhen: { field: "textureType", equals: "stripes" } },
      { textureType: "stripes" },
    ),
    true,
  );
  assert.equal(
    shouldRenderGraphicsField(
      { field: "stripeWidth", showWhen: { field: "textureType", equals: "stripes" } },
      { textureType: "dither" },
    ),
    false,
  );
  assert.equal(
    shouldRenderGraphicsField(
      { field: "textureVariant", showWhen: { field: "textureType", notEquals: "stripes" } },
      { textureType: "dither" },
    ),
    true,
  );
  assert.equal(resolveGraphicsFieldValue({ fill: "bad" }, { field: "fill", type: "color", fallback: "#f28d35" }), "#f28d35");
  assert.equal(resolveGraphicsFieldValue({}, { field: "width", defaultValue: 12 }), 12);
  assert.equal(shouldDisableGraphicsFieldControl(true, "layer"), true);
  assert.equal(shouldDisableGraphicsFieldControl(true, "entity"), false);
  assert.equal(shouldDisableGraphicsFieldControl(false, "layer"), false);
  assert.equal(shouldDisableGraphicsFieldControl(true, undefined), true);
  assert.deepEqual(buildGraphicsFormControlState(true, ["layer", "entity", undefined]), [
    { index: 0, disabled: true },
    { index: 1, disabled: false },
    { index: 2, disabled: true },
  ]);
  assert.deepEqual(buildGraphicsFormControlState(false, ["layer", "entity"]), [
    { index: 0, disabled: false },
    { index: 1, disabled: false },
  ]);
  assert.deepEqual(buildGraphicsFormControlState(true, null), []);
  assert.equal(
    buildGraphicsFieldModel(
      "layer",
      { textureType: "dither" },
      { field: "stripeWidth", showWhen: { field: "textureType", equals: "stripes" } },
    ),
    null,
  );
  assert.deepEqual(
    buildGraphicsFieldModel(
      "layer",
      { shape: "rectangle" },
      { field: "shape", type: "select", labelKey: "graphics.shape", optionsKey: "shapeOptions" },
      { shapeOptions: [{ value: "rectangle", labelKey: "graphics.shape.rectangle" }] },
      (key) => `t:${key}`,
    ),
    {
      kind: "select",
      scope: "layer",
      field: "shape",
      label: "t:graphics.shape",
      value: "rectangle",
      options: [{ value: "rectangle", label: "t:graphics.shape.rectangle" }],
    },
  );
  assert.deepEqual(
    buildGraphicsFieldSchemaModels(
      "layer",
      { textureType: "dither", shape: "rectangle" },
      [
        { field: "stripeWidth", showWhen: { field: "textureType", equals: "stripes" } },
        { field: "shape", type: "select", labelKey: "graphics.shape", optionsKey: "shapeOptions" },
      ],
      { shapeOptions: [{ value: "rectangle", labelKey: "graphics.shape.rectangle" }] },
      (key) => `t:${key}`,
    ),
    [
      {
        kind: "select",
        scope: "layer",
        field: "shape",
        label: "t:graphics.shape",
        value: "rectangle",
        options: [{ value: "rectangle", label: "t:graphics.shape.rectangle" }],
      },
    ],
  );
  const formConfig = {
    entityFields: [{ field: "canvasSize", type: "number", labelKey: "graphics.canvasSize" }],
    layerBaseFields: [{ field: "type", type: "select", labelKey: "graphics.layerType", optionsKey: "layerTypeOptions" }],
    glyphFields: [{ field: "glyph", labelKey: "graphics.glyph" }],
    shapeFields: [{ field: "shape", labelKey: "graphics.shape" }],
    layerTypeOptions: [
      { value: "shape", label: "Shape" },
      { value: "glyph", label: "Glyph" },
    ],
  };
  const formVisual = {
    canvasSize: 24,
    layers: [
      { id: "glyph-layer", type: "glyph", glyph: "R" },
      { id: "shape-layer", type: "shape", shape: "polygon" },
    ],
  };
  const summarizeFormModel = (model) => ({
    missingLayerLabel: model.missingLayerLabel,
    fields: model.fieldModels.map((fieldModel) => ({
      kind: fieldModel.kind,
      scope: fieldModel.scope,
      field: fieldModel.field,
      value: fieldModel.value,
      options: fieldModel.options,
    })),
  });
  assert.deepEqual(summarizeFormModel(buildGraphicsFormModel(null, "", formConfig, (key) => `t:${key}`)), {
    missingLayerLabel: "",
    fields: [],
  });
  assert.deepEqual(summarizeFormModel(buildGraphicsFormModel(formVisual, "missing", formConfig, (key) => `t:${key}`)), {
    missingLayerLabel: "t:graphics.noLayer",
    fields: [
      {
        kind: "input",
        scope: "entity",
        field: "canvasSize",
        value: 24,
        options: undefined,
      },
    ],
  });
  assert.deepEqual(summarizeFormModel(buildGraphicsFormModel(formVisual, "glyph-layer", formConfig, (key) => `t:${key}`)), {
    missingLayerLabel: "",
    fields: [
      {
        kind: "input",
        scope: "entity",
        field: "canvasSize",
        value: 24,
        options: undefined,
      },
      {
        kind: "select",
        scope: "layer",
        field: "type",
        value: "glyph",
        options: [
          { value: "shape", label: "Shape" },
          { value: "glyph", label: "Glyph" },
        ],
      },
      {
        kind: "input",
        scope: "layer",
        field: "glyph",
        value: "R",
        options: undefined,
      },
    ],
  });
  assert.deepEqual(
    summarizeFormModel(buildGraphicsFormModel(formVisual, "shape-layer", formConfig, (key) => `t:${key}`)).fields.map(
      (fieldModel) => fieldModel.field,
    ),
    ["canvasSize", "type", "shape"],
  );
  const editVisual = {
    canvasSize: 24,
    label: "Robot",
    layers: [{ id: "body", type: "shape", shape: "rectangle", x: 3, y: 4 }],
  };
  assert.deepEqual(
    applyGraphicsFormFieldEdit(editVisual, "body", {
      scope: "entity",
      field: "canvasSize",
      valueType: "integer",
      rawValue: "32.8",
    }),
    { changed: true, selectedLayerId: "body", value: 32 },
  );
  assert.equal(editVisual.canvasSize, 32);
  assert.deepEqual(
    applyGraphicsFormFieldEdit(editVisual, "missing", {
      scope: "layer",
      field: "fill",
      rawValue: "#00ff88",
    }),
    { changed: false, selectedLayerId: "missing" },
  );
  assert.deepEqual(
    applyGraphicsFormFieldEdit(editVisual, "body", {
      scope: "layer",
      field: "id",
      rawValue: "body-renamed",
    }),
    { changed: true, selectedLayerId: "body-renamed", value: "body-renamed" },
  );
  assert.equal(editVisual.layers[0].id, "body-renamed");
  assert.deepEqual(
    applyGraphicsFormFieldEdit(
      editVisual,
      "body-renamed",
      {
        scope: "layer",
        field: "type",
        rawValue: "glyph",
      },
      {
        layerOptions: {
          entityKey: "robot",
          defaultGlyphLayer: { glyph: { kind: "entityInitial" }, fontSize: { scale: 0.25, min: 6 } },
          now: () => 1,
        },
      },
    ),
    { changed: true, selectedLayerId: "body-renamed", value: "glyph" },
  );
  assert.equal(editVisual.layers[0].type, "glyph");
  assert.equal(editVisual.layers[0].glyph, "R");
  assert.equal(editVisual.layers[0].id, "body-renamed");
  assert.equal(editVisual.layers[0].x, 3);
  assert.equal(editVisual.layers[0].y, 4);
  editVisual.layers[0].type = "shape";
  assert.deepEqual(
    applyGraphicsFormFieldEdit(editVisual, "body-renamed", {
      scope: "layer",
      field: "shape",
      rawValue: "polygon",
    }),
    { changed: true, selectedLayerId: "body-renamed", value: "polygon" },
  );
  assert.equal(editVisual.layers[0].sides, 6);
  assert.deepEqual(
    buildGraphicsFieldModel(
      "layer",
      {},
      { field: "width", type: "number", defaultValue: 12, min: 1, max: 24, step: 1 },
      {},
      (key) => key,
    ),
    {
      kind: "input",
      scope: "layer",
      field: "width",
      label: "width",
      type: "number",
      value: 12,
      valueType: "number",
      min: 1,
      max: 24,
      step: 1,
    },
  );
  assert.deepEqual(
    buildGraphicsSelectOptions(
      [
        { value: "shape", labelKey: "graphics.layer.shape" },
        { value: "glyph", label: "Glyph" },
        { label: "bad" },
      ],
      (key) => `t:${key}`,
    ),
    [
      { value: "shape", label: "t:graphics.layer.shape" },
      { value: "glyph", label: "Glyph" },
    ],
  );
  assert.equal(coerceGraphicsFieldValue("number", "4.5"), 4.5);
  assert.equal(coerceGraphicsFieldValue("number", "bad"), 0);
  assert.equal(coerceGraphicsFieldValue("integer", "7.9"), 7);
  assert.equal(coerceGraphicsFieldValue("string", "7.9"), "7.9");
}

function testGraphicsLayerHelpers() {
  const visual = { canvasSize: 30, layers: [] };
  const defaultShapeLayer = {
    x: { kind: "center" },
    y: { kind: "center", offset: 1 },
    width: { scale: 0.5, round: "integer" },
    fill: "#f28d35",
  };
  const defaultGlyphLayer = {
    glyph: { kind: "entityInitial" },
    x: { kind: "center" },
    y: { kind: "center" },
    fontSize: { scale: 0.3, min: 7 },
  };

  assert.deepEqual(
    createDefaultShapeLayer(visual, {
      entityKey: "robot",
      defaultShapeLayer,
      now: () => 46656,
    }),
    {
      id: "robot-shape-1000",
      type: "shape",
      x: 15,
      y: 16,
      width: 15,
      fill: "#f28d35",
    },
  );
  assert.deepEqual(
    createDefaultGlyphLayer(visual, {
      entityKey: "scrap",
      defaultGlyphLayer,
      now: () => 46657,
    }),
    {
      id: "scrap-glyph-1001",
      type: "glyph",
      glyph: "S",
      x: 15,
      y: 15,
      fontSize: 9,
    },
  );

  const addVisual = { canvasSize: 30, layers: [] };
  assert.deepEqual(
    addDefaultVisualLayer(addVisual, "shape", {
      entityKey: "robot",
      defaultShapeLayer,
      now: () => 46659,
    }),
    {
      id: "robot-shape-1003",
      type: "shape",
      x: 15,
      y: 16,
      width: 15,
      fill: "#f28d35",
    },
  );
  assert.deepEqual(
    addDefaultVisualLayer(addVisual, "glyph", {
      entityKey: "robot",
      defaultGlyphLayer,
      now: () => 46660,
    }),
    {
      id: "robot-glyph-1004",
      type: "glyph",
      glyph: "R",
      x: 15,
      y: 15,
      fontSize: 9,
    },
  );
  assert.deepEqual(addVisual.layers.map((item) => item.id), ["robot-shape-1003", "robot-glyph-1004"]);
  assert.equal(addDefaultVisualLayer(addVisual, "unknown", { now: () => 1 }), null);
  assert.deepEqual(addVisual.layers.map((item) => item.id), ["robot-shape-1003", "robot-glyph-1004"]);
  assert.equal(addDefaultVisualLayer(null, "shape", { now: () => 1 }), null);
  const addSelectedVisual = { canvasSize: 30, layers: [{ id: "base" }] };
  const addSelectedState = addDefaultSelectedVisualLayer(addSelectedVisual, "shape", "base", {
    entityKey: "robot",
    defaultShapeLayer,
    now: () => 46661,
  });
  assert.equal(addSelectedState.changed, true);
  assert.equal(addSelectedState.selectedLayerId, "robot-shape-1005");
  assert.deepEqual(addSelectedState.layer, {
    id: "robot-shape-1005",
    type: "shape",
    x: 15,
    y: 16,
    width: 15,
    fill: "#f28d35",
  });
  assert.deepEqual(addSelectedVisual.layers.map((item) => item.id), ["base", "robot-shape-1005"]);
  assert.deepEqual(addDefaultSelectedVisualLayer(addSelectedVisual, "unknown", "base", { now: () => 1 }), {
    changed: false,
    selectedLayerId: "base",
    layer: null,
  });

  const layer = { id: "kept", type: "shape", shape: "rectangle", x: 3 };
  upgradeVisualLayerType(layer, "glyph", visual, {
    entityKey: "robot",
    defaultGlyphLayer,
    now: () => 1,
  });
  assert.equal(layer.id, "kept");
  assert.equal(layer.type, "glyph");
  assert.equal(layer.glyph, "R");
  assert.equal(layer.x, 3);
  assert.equal(layer.y, 15);

  const starLayer = { id: "star", type: "shape", shape: "star", width: 20, height: 10 };
  normalizeShapeLayer(starLayer, visual);
  assert.equal(starLayer.points, 5);
  assert.equal(starLayer.outerRadius, 10);
  assert.equal(starLayer.innerRadius, 5.5);
  assert.equal(starLayer.x, 15);
  assert.equal(starLayer.y, 15);

  const presetLayer = { id: "shape", type: "shape", shape: "rectangle" };
  assert.equal(
    applyShapePresetToLayer(
      presetLayer,
      { patch: { shape: "polygon", width: { scale: 0.4 }, y: { kind: "center", offset: -2 } } },
      visual,
      { entityKey: "robot" },
    ),
    true,
  );
  assert.equal(presetLayer.shape, "polygon");
  assert.equal(presetLayer.width, 12);
  assert.equal(presetLayer.y, 13);
  assert.equal(presetLayer.sides, 6);
  assert.equal(applyShapePresetToLayer({ type: "shape", locked: true }, { patch: { width: 1 } }, visual), false);
  const presetVisual = { canvasSize: 30, layers: [{ id: "shape", type: "shape", shape: "rectangle" }, { id: "glyph", type: "glyph" }] };
  const selectedPresetState = applyShapePresetToSelectedLayer(
    presetVisual,
    "shape",
    [{ id: "wide", patch: { shape: "polygon", width: { scale: 0.5 } } }],
    "wide",
    { entityKey: "robot" },
  );
  assert.equal(selectedPresetState.changed, true);
  assert.equal(selectedPresetState.selectedLayerId, "shape");
  assert.equal(presetVisual.layers[0].shape, "polygon");
  assert.equal(presetVisual.layers[0].width, 15);
  assert.equal(presetVisual.layers[0].sides, 6);
  assert.deepEqual(applyShapePresetToSelectedLayer(presetVisual, "glyph", [{ id: "wide", patch: { width: 1 } }], "wide"), {
    changed: false,
    selectedLayerId: "glyph",
    layer: presetVisual.layers[1],
  });
  assert.deepEqual(applyShapePresetToSelectedLayer(presetVisual, "shape", [], "missing"), {
    changed: false,
    selectedLayerId: "shape",
    layer: presetVisual.layers[0],
  });

  const layers = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(moveVisualLayer(layers, "b", -1), true);
  assert.deepEqual(layers.map((item) => item.id), ["b", "a", "c"]);
  assert.equal(moveVisualLayer(layers, "b", -1), false);
  const movableVisual = { layers: [{ id: "a" }, { id: "b" }, { id: "c" }] };
  assert.deepEqual(moveSelectedVisualLayer(movableVisual, "b", -1), { changed: true, selectedLayerId: "b" });
  assert.deepEqual(movableVisual.layers.map((item) => item.id), ["b", "a", "c"]);
  assert.deepEqual(moveSelectedVisualLayer(movableVisual, "b", -1), { changed: false, selectedLayerId: "b" });
  assert.deepEqual(moveSelectedVisualLayer(movableVisual, "missing", 1), { changed: false, selectedLayerId: "missing" });
  const duplicateLayers = [{ id: "body", style: { fill: "#f28d35" } }, { id: "glyph" }];
  const duplicateLayer = duplicateVisualLayer(duplicateLayers, "body", { now: () => 46658 });
  assert.deepEqual(duplicateLayers.map((item) => item.id), ["body", "body-copy-1002", "glyph"]);
  assert.deepEqual(duplicateLayer, { id: "body-copy-1002", style: { fill: "#f28d35" } });
  duplicateLayer.style.fill = "#00ff88";
  assert.equal(duplicateLayers[0].style.fill, "#f28d35");
  assert.equal(duplicateVisualLayer(duplicateLayers, "missing", { now: () => 1 }), null);
  const duplicateVisual = { layers: [{ id: "body", style: { fill: "#f28d35" } }, { id: "glyph" }] };
  const duplicateState = duplicateSelectedVisualLayer(duplicateVisual, "body", { now: () => 46658 });
  assert.equal(duplicateState.changed, true);
  assert.equal(duplicateState.selectedLayerId, "body-copy-1002");
  assert.deepEqual(duplicateState.layer, { id: "body-copy-1002", style: { fill: "#f28d35" } });
  assert.deepEqual(duplicateVisual.layers.map((item) => item.id), ["body", "body-copy-1002", "glyph"]);
  assert.deepEqual(duplicateSelectedVisualLayer(duplicateVisual, "missing", { now: () => 1 }), {
    changed: false,
    selectedLayerId: "missing",
    layer: null,
  });
  const removableLayers = [{ id: "body" }, { id: "accent" }, { id: "glyph" }];
  assert.equal(removeVisualLayer(removableLayers, "accent"), true);
  assert.deepEqual(removableLayers.map((item) => item.id), ["body", "glyph"]);
  assert.equal(removeVisualLayer(removableLayers, "missing"), false);
  assert.deepEqual(removableLayers.map((item) => item.id), ["body", "glyph"]);
  assert.equal(removeVisualLayer(null, "body"), false);
  const removableVisual = { layers: [{ id: "body" }, { id: "accent" }, { id: "glyph" }] };
  assert.deepEqual(removeSelectedVisualLayer(removableVisual, "accent"), { changed: true, selectedLayerId: "body" });
  assert.deepEqual(removableVisual.layers.map((item) => item.id), ["body", "glyph"]);
  assert.deepEqual(removeSelectedVisualLayer(removableVisual, "missing"), { changed: false, selectedLayerId: "missing" });
  const toggleLayers = [{ id: "body" }, { id: "glyph", visible: false, locked: true }];
  assert.equal(toggleVisualLayerVisible(toggleLayers, "body"), true);
  assert.equal(toggleLayers[0].visible, false);
  assert.equal(toggleVisualLayerVisible(toggleLayers, "glyph"), true);
  assert.equal(toggleLayers[1].visible, true);
  assert.equal(toggleVisualLayerVisible(toggleLayers, "missing"), false);
  assert.equal(toggleVisualLayerLocked(toggleLayers, "body"), true);
  assert.equal(toggleLayers[0].locked, true);
  assert.equal(toggleVisualLayerLocked(toggleLayers, "glyph"), true);
  assert.equal(toggleLayers[1].locked, false);
  assert.equal(toggleVisualLayerLocked(toggleLayers, "missing"), false);
  const toggleVisual = { layers: [{ id: "body" }, { id: "glyph", visible: false, locked: true }] };
  assert.deepEqual(toggleSelectedVisualLayerVisible(toggleVisual, "body", "glyph"), { changed: true, selectedLayerId: "body" });
  assert.equal(toggleVisual.layers[1].visible, true);
  assert.deepEqual(toggleSelectedVisualLayerLocked(toggleVisual, "body", "glyph"), { changed: true, selectedLayerId: "body" });
  assert.equal(toggleVisual.layers[1].locked, false);
  assert.deepEqual(toggleSelectedVisualLayerVisible(toggleVisual, "body", "missing"), { changed: false, selectedLayerId: "body" });
  assert.deepEqual(toggleSelectedVisualLayerLocked(toggleVisual, "body", "missing"), { changed: false, selectedLayerId: "body" });
  assert.equal(resolveSelectedVisualLayerId(null, "a"), "");
  assert.equal(resolveSelectedVisualLayerId({ layers }, "a"), "a");
  assert.equal(resolveSelectedVisualLayerId({ layers }, "missing"), "b");
  assert.equal(resolveSelectedVisualLayerId({ layers: [] }, "missing"), "");
  assert.equal(resolveSelectedVisualLayerId({}, "missing"), "");
  assert.deepEqual(selectVisualLayer({ layers }, "b", "a"), { changed: true, selectedLayerId: "a" });
  assert.deepEqual(selectVisualLayer({ layers }, "a", "a"), { changed: false, selectedLayerId: "a" });
  assert.deepEqual(selectVisualLayer({ layers }, "a", "missing"), { changed: false, selectedLayerId: "a" });
  assert.deepEqual(selectVisualLayer(null, "a", "b"), { changed: false, selectedLayerId: "a" });
  assert.deepEqual(buildVisualLayerActionState(layers, ""), {
    duplicateDisabled: true,
    moveUpDisabled: true,
    moveDownDisabled: true,
    deleteDisabled: true,
  });
  assert.deepEqual(buildVisualLayerActionState(layers, "b"), {
    duplicateDisabled: false,
    moveUpDisabled: true,
    moveDownDisabled: false,
    deleteDisabled: false,
  });
  assert.deepEqual(buildVisualLayerActionState(layers, "a"), {
    duplicateDisabled: false,
    moveUpDisabled: false,
    moveDownDisabled: false,
    deleteDisabled: false,
  });
  assert.deepEqual(buildVisualLayerActionState(layers, "c"), {
    duplicateDisabled: false,
    moveUpDisabled: false,
    moveDownDisabled: true,
    deleteDisabled: false,
  });
  assert.deepEqual(buildVisualLayerToolbarModel([{ id: "a" }, { id: "b", locked: true }], "b"), {
    duplicateDisabled: false,
    moveUpDisabled: false,
    moveDownDisabled: true,
    deleteDisabled: false,
    selectedLocked: true,
  });
  assert.deepEqual(buildVisualLayerToolbarModel([{ id: "a" }], ""), {
    duplicateDisabled: true,
    moveUpDisabled: true,
    moveDownDisabled: true,
    deleteDisabled: true,
    selectedLocked: false,
  });

  const translate = (key) =>
    ({
      "graphics.option.layer.shape": "Shape",
      "graphics.option.layer.glyph": "Glyph",
      "graphics.option.shape.rectangle": "Rectangle",
      "graphics.layerVisible": "Visible",
      "graphics.layerHidden": "Hidden",
      "graphics.layerLocked": "Locked",
      "graphics.layerUnlocked": "Editable",
    })[key] ?? key;
  assert.equal(describeVisualLayerTitle({ type: "shape", shape: "rectangle" }, translate), "Shape // Rectangle");
  assert.equal(describeVisualLayerTitle({ type: "glyph", glyph: "R" }, translate), "Glyph // R");
  assert.equal(describeVisualLayerMeta({ id: "body", locked: true, visible: false }, translate), "body // Hidden / Locked");
  assert.deepEqual(
    buildVisualLayerListItems(
      [
        { id: "body", type: "shape", shape: "rectangle", visible: false, locked: true },
        { id: "glyph", type: "glyph", glyph: "R" },
      ],
      "glyph",
      translate,
    ),
    [
      {
        id: "body",
        hidden: "true",
        locked: "true",
        active: "false",
        title: "Shape // Rectangle",
        meta: "body // Hidden / Locked",
        visibility: { active: "false", label: "Hidden" },
        lock: { active: "true", label: "Locked" },
      },
      {
        id: "glyph",
        hidden: "false",
        locked: "false",
        active: "true",
        title: "Glyph // R",
        meta: "glyph // Visible / Editable",
        visibility: { active: "true", label: "Visible" },
        lock: { active: "false", label: "Editable" },
      },
    ],
  );
  assert.deepEqual(buildShapePresetListModel({ type: "glyph" }, [{ id: "square", labelKey: "preset.square" }], translate), {
    hidden: true,
    items: [],
  });
  assert.deepEqual(
    buildShapePresetListModel(
      { type: "shape", locked: true },
      [
        { id: "square", labelKey: "preset.square" },
        { labelKey: "preset.invalid" },
      ],
      (key) => ({ "preset.square": "Square" })[key] ?? key,
    ),
    {
      hidden: false,
      items: [{ id: "square", label: "Square", disabled: true }],
    },
  );
}

function testGraphicsSwatchHelpers() {
  const translate = (key) =>
    ({
      "graphics.fillSwatches": "Fill swatches",
      "graphics.textureSwatches": "Texture swatches",
    })[key] ?? key;

  const fillSwatches = buildFillSwatches(
    { type: "shape", fill: "#f28d35" },
    [
      { id: "rust", value: "#f28d35" },
      { id: "mint", value: "#00ff88" },
    ],
    translate,
  );
  assert.equal(fillSwatches.length, 2);
  assert.equal(fillSwatches[0].kind, "fill");
  assert.equal(fillSwatches[0].selected, true);
  assert.equal(fillSwatches[0].title, "Fill swatches // rust");
  assert.equal(fillSwatches[0].preview, "linear-gradient(180deg, #f28d35, #f28d35)");
  assert.equal(fillSwatches[1].selected, false);

  const glyphSwatches = buildFillSwatches({ type: "glyph", glyphColor: "#f0d8bb", locked: true }, [{ value: "bad" }], translate);
  assert.equal(glyphSwatches[0].value, "#f0d8bb");
  assert.equal(glyphSwatches[0].selected, true);
  assert.equal(glyphSwatches[0].disabled, true);

  assert.deepEqual(buildTextureSwatches({ type: "shape", textureType: "none" }, [{ value: "#33261c" }], translate), []);
  const textureSwatches = buildTextureSwatches(
    { type: "shape", textureType: "stripes", textureColor: "#33261c" },
    [
      { id: "dark", value: "#33261c" },
      { id: "light", value: "#ffcc99" },
    ],
    translate,
  );
  assert.equal(textureSwatches[0].kind, "texture");
  assert.equal(textureSwatches[0].selected, true);
  assert.equal(textureSwatches[0].title, "Texture swatches // dark");
  assert.match(textureSwatches[0].preview, /repeating-linear-gradient/);
  assert.deepEqual(buildGraphicsSwatchStripModel([]), { hidden: true, items: [] });
  assert.deepEqual(buildGraphicsSwatchStripModel(null), { hidden: true, items: [] });
  assert.deepEqual(buildGraphicsSwatchStripModel(textureSwatches), { hidden: false, items: textureSwatches });

  const shapeLayer = { type: "shape", fill: "#000000", textureType: "dither", textureColor: "#111111" };
  assert.equal(applyGraphicsSwatchToLayer(shapeLayer, "fill", "#ffffff"), true);
  assert.equal(shapeLayer.fill, "#ffffff");
  assert.equal(applyGraphicsSwatchToLayer(shapeLayer, "texture", "#222222"), true);
  assert.equal(shapeLayer.textureColor, "#222222");

  const glyphLayer = { type: "glyph", glyphColor: "#000000" };
  assert.equal(applyGraphicsSwatchToLayer(glyphLayer, "fill", "#eeeeee"), true);
  assert.equal(glyphLayer.glyphColor, "#eeeeee");
  assert.equal(applyGraphicsSwatchToLayer({ type: "shape", locked: true }, "fill", "#ffffff"), false);
  assert.equal(applyGraphicsSwatchToLayer({ type: "shape", textureType: "none" }, "texture", "#ffffff"), false);

  const selectedSwatchVisual = {
    layers: [
      { id: "body", type: "shape", fill: "#000000" },
      { id: "glyph", type: "glyph", glyphColor: "#111111" },
    ],
  };
  const selectedSwatchState = applyGraphicsSwatchToSelectedLayer(selectedSwatchVisual, "glyph", "fill", "#eeeeee");
  assert.equal(selectedSwatchState.changed, true);
  assert.equal(selectedSwatchState.selectedLayerId, "glyph");
  assert.equal(selectedSwatchState.layer, selectedSwatchVisual.layers[1]);
  assert.equal(selectedSwatchVisual.layers[1].glyphColor, "#eeeeee");
  assert.deepEqual(applyGraphicsSwatchToSelectedLayer(selectedSwatchVisual, "missing", "fill", "#ffffff"), {
    changed: false,
    selectedLayerId: "missing",
    layer: null,
  });
}

function testGraphicsTemplateLibraryHelpers() {
  const translate = (key) =>
    ({
      "graphics.template.frameBot": "Frame Bot",
      "graphics.template.signalToken": "Signal Token",
      "graphics.templateDesc.frameBot": "Layered chassis",
      "graphics.templateCategory.actor": "Actor",
      "graphics.templateCategory.pickup": "Pickup",
      "graphics.templateCategory.custom": "Custom",
      "graphics.templateGroup.recommended": "Best match",
      "graphics.templateGroup.other": "Other",
      "graphics.templateFilter.all": "All",
      "graphics.templateFilter.fit": "Fits current",
      "graphics.templateFilter.categoryAll": "Any type",
      "graphics.templateRecommended": "Recommended",
      "graphics.exportTemplate": "Export",
      "graphics.deleteTemplate": "Delete",
    })[key] ?? key;
  const customTemplates = [
    {
      id: "custom-old",
      label: "Custom Old",
      categoryKey: "graphics.templateCategory.custom",
      entityKinds: ["actor"],
      updatedAt: 10,
      visual: { layers: [] },
    },
    {
      id: "custom-new",
      label: "Custom New",
      categoryKey: "graphics.templateCategory.custom",
      entityKinds: ["actor"],
      updatedAt: 20,
      visual: { layers: [] },
    },
  ];
  const defaultTemplates = [
    {
      id: "frameBot",
      labelKey: "graphics.template.frameBot",
      descriptionKey: "graphics.templateDesc.frameBot",
      categoryKey: "graphics.templateCategory.actor",
      entityKinds: ["actor"],
      visual: { layers: [] },
    },
    {
      id: "signalToken",
      labelKey: "graphics.template.signalToken",
      categoryKey: "graphics.templateCategory.pickup",
      entityKinds: ["pickup"],
      visual: { layers: [] },
    },
    {
      id: "mystery",
      label: "Mystery",
      categoryKey: "unknown.category",
      entityKinds: [],
      visual: { layers: [] },
    },
  ];

  const templates = getAllGraphicsTemplates(customTemplates, defaultTemplates);
  assert.equal(templates.length, 5);
  assert.equal(getGraphicsTemplateSource(templates[0]), "custom");
  assert.equal(getGraphicsTemplateSource(templates.at(-1)), "builtin");
  assert.equal(isCustomGraphicsTemplate(templates[0]), true);
  assert.equal(getGraphicsEntityKind({ robot: "actor" }, "robot"), "actor");
  assert.equal(getGraphicsTemplateLabel(defaultTemplates[0], translate), "Frame Bot");
  assert.equal(getGraphicsTemplateDescription(defaultTemplates[0], translate), "Layered chassis");
  assert.equal(getGraphicsTemplateCategory(defaultTemplates[0], translate), "Actor");
  assert.equal(getGraphicsTemplateGroupId(defaultTemplates[0]), "actor");
  assert.equal(getGraphicsTemplateGroupId(defaultTemplates[2]), "other");
  assert.equal(getGraphicsTemplateGroupLabel("missing", translate), "Other");
  assert.equal(isGraphicsTemplateRecommended(defaultTemplates[0], "actor"), true);
  assert.equal(isGraphicsTemplateRecommended(defaultTemplates[1], "actor"), false);

  assert.deepEqual(getRecentGraphicsTemplates(["signalToken", "missing", "custom-new"], templates).map((template) => template.id), [
    "signalToken",
    "custom-new",
  ]);
  assert.deepEqual(getSortedGraphicsTemplates(templates, "actor", translate).map((template) => template.id).slice(0, 3), [
    "custom-new",
    "custom-old",
    "frameBot",
  ]);
  const grouped = getGroupedGraphicsTemplates(templates, { mode: "all", category: "all" }, "actor", translate);
  assert.equal(grouped[0].id, "recommended");
  assert.deepEqual(grouped[0].templates.map((template) => template.id), ["custom-new", "custom-old", "frameBot"]);
  assert.equal(grouped.some((group) => group.id === "pickup"), true);

  const fitGroups = getGroupedGraphicsTemplates(templates, { mode: "fit", category: "all" }, "actor", translate);
  assert.equal(fitGroups.some((group) => group.id === "recommended"), false);
  assert.deepEqual(fitGroups.flatMap((group) => group.templates.map((template) => template.id)), [
    "custom-new",
    "custom-old",
    "frameBot",
  ]);
  assert.deepEqual(normalizeGraphicsTemplateFilterForAvailableCategories(templates, { mode: "fit", category: "pickup" }, "actor"), {
    mode: "fit",
    category: "all",
  });
  assert.deepEqual(buildGraphicsTemplateModeOptions({ mode: "fit" }, translate), [
    { kind: "mode", value: "all", label: "All", active: false },
    { kind: "mode", value: "fit", label: "Fits current", active: true },
  ]);
  assert.deepEqual(
    buildGraphicsTemplateCategoryOptions(templates, { mode: "all", category: "custom" }, "actor", translate).slice(0, 2),
    [
      { kind: "category", value: "all", label: "Any type", active: false },
      { kind: "category", value: "custom", label: "Custom", active: true },
    ],
  );
  const templateFilterOptions = buildGraphicsTemplateModeOptions({ mode: "all" }, translate);
  assert.deepEqual(buildGraphicsTemplateFilterRowModel(templateFilterOptions, true), {
    hidden: false,
    items: templateFilterOptions,
  });
  assert.deepEqual(applyGraphicsTemplateFilterSelection({ mode: "all", category: "pickup" }, "mode", "fit"), {
    handled: true,
    changed: true,
    filterState: { mode: "fit", category: "pickup" },
  });
  assert.deepEqual(applyGraphicsTemplateFilterSelection({ mode: "fit", category: "pickup" }, "mode", "fit"), {
    handled: true,
    changed: false,
    filterState: { mode: "fit", category: "pickup" },
  });
  assert.deepEqual(applyGraphicsTemplateFilterSelection({ mode: "fit", category: "pickup" }, "category", ""), {
    handled: true,
    changed: true,
    filterState: { mode: "fit", category: "all" },
  });
  assert.deepEqual(applyGraphicsTemplateFilterSelection({ mode: "bad", category: "" }, "unknown", "custom"), {
    handled: false,
    changed: false,
    filterState: { mode: "all", category: "all" },
  });
  assert.deepEqual(buildGraphicsTemplateFilterRowModel(templateFilterOptions, false), {
    hidden: true,
    items: templateFilterOptions,
  });
  assert.deepEqual(buildGraphicsTemplateFilterRowModel(null, true), {
    hidden: true,
    items: [],
  });
  assert.deepEqual(buildGraphicsTemplateCardModel(defaultTemplates[0], "actor", translate), {
    id: "frameBot",
    source: "builtin",
    recommended: true,
    title: "Layered chassis",
    label: "Frame Bot",
    metaText: "Recommended // Actor",
    actions: [{ action: "export", templateId: "frameBot", label: "Export", title: "Export" }],
  });
  assert.deepEqual(buildGraphicsTemplateCardActions(templates[0], translate), [
    { action: "export", templateId: "custom-old", label: "Export", title: "Export" },
    { action: "delete", templateId: "custom-old", label: "Delete", title: "Delete" },
  ]);
  assert.deepEqual(buildGraphicsTemplateCardModel(defaultTemplates[1], "actor", translate).metaText, "Pickup");
  assert.deepEqual(buildGraphicsTemplateLibraryModel(grouped, true), {
    hidden: false,
    empty: false,
    groups: grouped,
  });
  assert.deepEqual(buildGraphicsTemplateLibraryModel([], true), {
    hidden: false,
    empty: true,
    groups: [],
  });
  assert.deepEqual(buildGraphicsTemplateLibraryModel(grouped, false), {
    hidden: true,
    empty: false,
    groups: grouped,
  });
  const recentTemplateItems = getRecentGraphicsTemplates(["signalToken", "custom-new"], templates);
  assert.deepEqual(buildGraphicsRecentTemplateStripModel(recentTemplateItems, true), {
    hidden: false,
    templates: recentTemplateItems,
  });
  assert.deepEqual(buildGraphicsRecentTemplateStripModel([], true), {
    hidden: true,
    templates: [],
  });
  assert.deepEqual(buildGraphicsRecentTemplateStripModel(recentTemplateItems, false), {
    hidden: true,
    templates: recentTemplateItems,
  });

  assert.deepEqual(recordRecentGraphicsTemplateId(["a", "b", "a"], "b"), ["b", "a", "a"]);
  assert.deepEqual(recordRecentGraphicsTemplateId(["a"], ""), ["a"]);
  assert.deepEqual(recordRecentGraphicsTemplateIds(["a", "b", "c"], ["b", "d", "b", ""]), ["b", "d", "a", "c"]);
  assert.deepEqual(upsertGraphicsTemplate([{ id: "a", label: "Old" }], { id: "a", label: "New" }), [
    { id: "a", label: "New" },
  ]);
  assert.deepEqual(
    upsertGraphicsTemplates(
      [
        { id: "a", label: "Old A" },
        { id: "b", label: "Old B" },
      ],
      [
        { id: "b", label: "New B" },
        { id: "c", label: "New C" },
      ],
    ),
    [
      { id: "b", label: "New B" },
      { id: "c", label: "New C" },
      { id: "a", label: "Old A" },
    ],
  );
  assert.deepEqual(removeGraphicsTemplateById([{ id: "a" }, { id: "b" }], ["b", "a"], "b"), {
    template: { id: "b" },
    templates: [{ id: "a" }],
    recentTemplateIds: ["a"],
  });
  assert.deepEqual(removeGraphicsTemplateById([{ id: "a" }], ["a"], "missing"), {
    template: null,
    templates: [{ id: "a" }],
    recentTemplateIds: ["a"],
  });
  assert.deepEqual(
    applyGraphicsTemplateToEntityVisual(
      {
        visual: {
          layers: [
            {
              id: "mark",
              glyph: { kind: "entityInitial" },
              x: { kind: "center", offset: 2 },
              size: { scale: 0.5, round: "integer" },
            },
          ],
        },
      },
      {
        currentVisual: { label: "Runner", canvasSize: 32, layers: [] },
        entityKey: "robot",
        entityLabel: "Robot",
      },
    ),
    {
      label: "Runner",
      canvasSize: 32,
      layers: [{ id: "mark", glyph: "R", x: 18, size: 16 }],
    },
  );
  assert.deepEqual(
    applyGraphicsTemplateToEntityVisual(
      { visual: { canvasSize: 18, layers: "bad" } },
      { entityKey: "scrap", entityLabel: "Scrap Node" },
    ),
    {
      label: "Scrap Node",
      canvasSize: 18,
      layers: [],
    },
  );
  assert.equal(applyGraphicsTemplateToEntityVisual(null, { entityKey: "robot" }), null);
  assert.equal(applyGraphicsTemplateToEntityVisual({ visual: { layers: [] } }, { entityKey: "" }), null);
  const sourceTemplateCatalog = {
    entities: {
      robot: { label: "Runner", canvasSize: 32, layers: [{ id: "old-body" }] },
    },
  };
  const appliedTemplateState = applyGraphicsTemplateToSelectedEntity(
    sourceTemplateCatalog,
    "robot",
    "old-body",
    [
      {
        id: "frameBot",
        visual: { canvasSize: 18, layers: [{ id: "template-body" }, { id: "template-glyph" }] },
      },
    ],
    "frameBot",
    { entityLabel: "Robot" },
  );
  assert.equal(appliedTemplateState.changed, true);
  assert.equal(appliedTemplateState.selectedEntityKey, "robot");
  assert.equal(appliedTemplateState.selectedLayerId, "template-body");
  assert.equal(appliedTemplateState.template.id, "frameBot");
  assert.deepEqual(appliedTemplateState.visual, {
    label: "Runner",
    canvasSize: 18,
    layers: [{ id: "template-body" }, { id: "template-glyph" }],
  });
  assert.equal(appliedTemplateState.entityVisualCatalog.entities.robot.layers[0].id, "template-body");
  assert.equal(sourceTemplateCatalog.entities.robot.layers[0].id, "old-body");
  const templateCatalog = { entities: { robot: { label: "Runner", layers: [{ id: "old-body" }] } } };
  const missingTemplateState = applyGraphicsTemplateToSelectedEntity(templateCatalog, "robot", "old-body", [], "missing");
  assert.equal(missingTemplateState.changed, false);
  assert.equal(missingTemplateState.entityVisualCatalog, templateCatalog);
  assert.equal(templateCatalog.entities.robot.layers[0].id, "old-body");
  const customVisual = { canvasSize: 24, layers: [{ id: "body", glyph: "R" }] };
  const savedTemplate = createGraphicsTemplateFromEntityVisual({
    entityKey: "robot",
    entityLabel: "Runner Bot",
    entityKind: "actor",
    label: " Custom Frame ",
    visual: customVisual,
    templateOffset: 4,
    now: () => 123456,
  });
  customVisual.layers[0].glyph = "X";
  assert.deepEqual(
    {
      id: savedTemplate.id,
      label: savedTemplate.label,
      description: savedTemplate.description,
      categoryKey: savedTemplate.categoryKey,
      entityKinds: savedTemplate.entityKinds,
      originEntityKey: savedTemplate.originEntityKey,
      updatedAt: savedTemplate.updatedAt,
      visual: savedTemplate.visual,
    },
    {
      id: "custom-robot-custom-frame-2n9c",
      label: "Custom Frame",
      description: "Runner Bot",
      categoryKey: "graphics.templateCategory.custom",
      entityKinds: ["actor"],
      originEntityKey: "robot",
      updatedAt: 123456,
      visual: { canvasSize: 24, layers: [{ id: "body", glyph: "R" }] },
    },
  );
  assert.deepEqual(
    ((template) => ({
      id: template.id,
      label: template.label,
      entityKinds: template.entityKinds,
      updatedAt: template.updatedAt,
    }))(
      createGraphicsTemplateFromEntityVisual({
        entityKey: "robot",
        entityLabel: "Runner Bot",
        templates: [{ originEntityKey: "robot" }],
        visual: { layers: [{ id: "fallback" }] },
        now: () => 46656,
      }),
    ),
    {
      id: "custom-robot-runner-bot-02-1000",
      label: "Runner Bot // 02",
      entityKinds: [],
      updatedAt: 46656,
    },
  );
  assert.equal(createGraphicsTemplateFromEntityVisual({ entityKey: "", visual: { layers: [] } }), null);
  assert.equal(createGraphicsTemplateFromEntityVisual({ entityKey: "robot", visual: { layers: "bad" } }), null);
  const existingTemplates = [{ id: "old-template", originEntityKey: "robot" }];
  const existingRecentTemplates = ["old-template"];
  const savedTemplateState = saveGraphicsTemplateFromSelectedEntity(existingTemplates, existingRecentTemplates, {
    entityKey: "robot",
    entityLabel: "Runner Bot",
    entityKind: "actor",
    label: "Saved Frame",
    visual: { layers: [{ id: "saved-body" }] },
    now: () => 46656,
  });
  assert.equal(savedTemplateState.changed, true);
  assert.equal(savedTemplateState.template.id, "custom-robot-saved-frame-1000");
  assert.deepEqual(savedTemplateState.templates.map((template) => template.id), [
    "custom-robot-saved-frame-1000",
    "old-template",
  ]);
  assert.deepEqual(savedTemplateState.recentTemplateIds, ["custom-robot-saved-frame-1000", "old-template"]);
  assert.deepEqual(existingTemplates, [{ id: "old-template", originEntityKey: "robot" }]);
  assert.deepEqual(existingRecentTemplates, ["old-template"]);
  assert.deepEqual(saveGraphicsTemplateFromSelectedEntity(existingTemplates, existingRecentTemplates, { entityKey: "", visual: { layers: [] } }), {
    changed: false,
    template: null,
    templates: existingTemplates,
    recentTemplateIds: existingRecentTemplates,
  });
  const importedSingleState = importGraphicsTemplatePayload(
    existingTemplates,
    existingRecentTemplates,
    JSON.stringify({ label: "Imported Solo", visual: { layers: [{ id: "solo" }] } }),
    { selectedEntityKey: "robot", now: () => 3 },
  );
  assert.equal(importedSingleState.changed, true);
  assert.equal(importedSingleState.kind, "single");
  assert.equal(importedSingleState.template.id, "custom-robot-imported-solo-3");
  assert.deepEqual(importedSingleState.importedTemplates.map((template) => template.id), ["custom-robot-imported-solo-3"]);
  assert.deepEqual(importedSingleState.templates.map((template) => template.id), ["custom-robot-imported-solo-3", "old-template"]);
  assert.deepEqual(importedSingleState.recentTemplateIds, ["custom-robot-imported-solo-3", "old-template"]);
  assert.deepEqual(existingTemplates, [{ id: "old-template", originEntityKey: "robot" }]);
  assert.deepEqual(existingRecentTemplates, ["old-template"]);
  const importedLibraryState = importGraphicsTemplatePayload(
    existingTemplates,
    existingRecentTemplates,
    {
      kind: "graphics-template-library",
      templates: [
        { id: "frameBot", label: "Imported Frame", visual: { layers: [{ id: "frame" }] } },
        { label: "Imported Bundle", visual: { layers: [{ id: "bundle" }] } },
      ],
    },
    { defaultTemplates, selectedEntityKey: "robot", now: () => 46656 },
  );
  assert.equal(importedLibraryState.changed, true);
  assert.equal(importedLibraryState.kind, "library");
  assert.equal(importedLibraryState.count, 2);
  assert.deepEqual(importedLibraryState.importedTemplates.map((template) => template.id), [
    "custom-import-1000",
    "custom-robot-imported-bundle-1000",
  ]);
  assert.deepEqual(importedLibraryState.templates.map((template) => template.id), [
    "custom-import-1000",
    "custom-robot-imported-bundle-1000",
    "old-template",
  ]);
  assert.deepEqual(importedLibraryState.recentTemplateIds, [
    "custom-import-1000",
    "custom-robot-imported-bundle-1000",
    "old-template",
  ]);
  assert.throws(() => importGraphicsTemplatePayload([], [], "{bad json"), SyntaxError);
  assert.equal(
    resolveGraphicsTemplateImportId({ id: "frameBot", label: "Frame Bot" }, { defaultTemplates, selectedEntityKey: "robot", now: () => 46656 }),
    "custom-import-1000",
  );
  assert.equal(resolveGraphicsTemplateImportId({ label: "Imported Template" }, { selectedEntityKey: "robot", now: () => 1 }), "custom-robot-imported-template-1");
  assert.deepEqual(
    ((template) => ({
      id: template.id,
      label: template.label,
      updatedAt: template.updatedAt,
      layerIds: template.visual.layers.map((layer) => layer.id),
    }))(
      normalizeGraphicsTemplateImport(
        {
          kind: "graphics-template",
          id: "frameBot",
          label: "Imported Frame",
          visual: { layers: [{ id: "body" }] },
        },
        {
          defaultTemplates,
          selectedEntityKey: "robot",
          templateOffset: 2,
          now: () => 46656,
        },
      ),
    ),
    {
      id: "custom-import-1000",
      label: "Imported Frame",
      updatedAt: 46656,
      layerIds: ["body"],
    },
  );
  assert.deepEqual(
    ((template) => ({ id: template.id, label: template.label, updatedAt: template.updatedAt }))(
      normalizeGraphicsTemplateImport(
        {
          label: "Imported Solo",
          visual: { layers: [{ id: "solo" }] },
        },
        { selectedEntityKey: "robot", templateOffset: 4, now: () => 3 },
      ),
    ),
    { id: "custom-robot-imported-solo-3", label: "Imported Solo", updatedAt: 3 },
  );
  assert.throws(
    () => normalizeGraphicsTemplateImport({ kind: "not-a-template", visual: { layers: [] } }),
    /Unsupported template payload/,
  );
  assert.throws(() => normalizeGraphicsTemplateImport({ kind: "graphics-template" }), /Missing visual.layers/);
  assert.throws(
    () => normalizeGraphicsTemplateImport({ kind: "graphics-template", id: "bad", label: "Bad", visual: { layers: "bad" } }),
    /Missing visual.layers/,
  );
  assert.deepEqual(
    normalizeGraphicsTemplateLibraryImport(
      {
        templates: [
          { id: "frameBot", label: "Imported Frame", visual: { layers: [{ id: "body" }] } },
          { label: "Imported Token", visual: { layers: [{ id: "token" }] } },
        ],
      },
      {
        defaultTemplates,
        selectedEntityKey: "robot",
        templateOffset: 3,
        now: () => 46656,
      },
    ).map((template) => ({
      id: template.id,
      label: template.label,
      updatedAt: template.updatedAt,
      layerIds: template.visual.layers.map((layer) => layer.id),
    })),
    [
      {
        id: "custom-import-1000",
        label: "Imported Frame",
        updatedAt: 46656,
        layerIds: ["body"],
      },
      {
        id: "custom-robot-imported-token-1000",
        label: "Imported Token",
        updatedAt: 46657,
        layerIds: ["token"],
      },
    ],
  );
  assert.deepEqual(
    normalizeGraphicsTemplateLibraryImport(
      {
        templates: [{ visual: { layers: [{ id: "only" }] } }],
      },
      { selectedEntityKey: "robot", templateOffset: 4, now: () => 2 },
    ).map((template) => ({ id: template.id, label: template.label, updatedAt: template.updatedAt })),
    [{ id: "custom-robot-imported-2", label: "Template 05", updatedAt: 2 }],
  );
  assert.throws(() => normalizeGraphicsTemplateLibraryImport({ templates: [] }), /Template library payload is empty/);
  assert.throws(
    () => normalizeGraphicsTemplateLibraryImport({ templates: [{ id: "bad", label: "Bad" }] }),
    /Template library payload could not be normalized/,
  );
  assert.equal(buildGraphicsTemplateDefaultLabel("Robot", [{ originEntityKey: "robot" }, { originEntityKey: "scrap" }], "robot"), "Robot // 02");
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}
