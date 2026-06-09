import assert from "node:assert/strict";
import {
  defaultGraphicsEditorConfig,
  normalizeGraphicsEditorConfig,
} from "../apps/web/src/graphics-studio/config.js";
import {
  buildEntityVisualDataUrl,
  buildGraphicsColorPreview,
  buildGraphicsTexturePreview,
  normalizeColorValue,
  renderEntityVisualSvg,
} from "../apps/web/src/graphics-studio/entity-visuals.js";
import {
  buildGraphicsSelectOptions,
  coerceGraphicsFieldValue,
  resolveGraphicsFieldValue,
  shouldRenderGraphicsField,
} from "../apps/web/src/graphics-studio/form-schema.js";
import {
  applyShapePresetToLayer,
  createDefaultGlyphLayer,
  createDefaultShapeLayer,
  describeVisualLayerMeta,
  describeVisualLayerTitle,
  moveVisualLayer,
  normalizeShapeLayer,
  upgradeVisualLayerType,
} from "../apps/web/src/graphics-studio/layers.js";
import {
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
  buildFillSwatches,
  buildTextureSwatches,
} from "../apps/web/src/graphics-studio/swatches.js";
import {
  buildGraphicsTemplateCategoryOptions,
  buildGraphicsTemplateDefaultLabel,
  buildGraphicsTemplateModeOptions,
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
  isCustomGraphicsTemplate,
  isGraphicsTemplateRecommended,
  normalizeGraphicsTemplateFilterForAvailableCategories,
  recordRecentGraphicsTemplateId,
  recordRecentGraphicsTemplateIds,
  removeGraphicsTemplateById,
  resolveGraphicsTemplateImportId,
  upsertGraphicsTemplate,
  upsertGraphicsTemplates,
} from "../apps/web/src/graphics-studio/template-library.js";
import { parseCsv, parseI18nCsv } from "../apps/web/src/utils/csv.js";
import { cloneJson } from "../apps/web/src/utils/json.js";

testCsvParsing();
testI18nParsing();
testJsonClone();
testGraphicsConfigHelpers();
testEntityVisualRendering();
testEntityVisualDataUrlCache();
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

function testGraphicsPreviews() {
  assert.equal(normalizeColorValue("#00ff88", "#f28d35"), "#00ff88");
  assert.equal(normalizeColorValue("orange", "#f28d35"), "#f28d35");
  assert.equal(buildGraphicsColorPreview("#f28d35"), "linear-gradient(180deg, #f28d35, #f28d35)");
  assert.match(buildGraphicsTexturePreview("#33261c", "stripes"), /repeating-linear-gradient/);
  assert.match(buildGraphicsTexturePreview("#33261c", "dither"), /radial-gradient/);
}

function testGraphicsTemplateHelpers() {
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

  const layers = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.equal(moveVisualLayer(layers, "b", -1), true);
  assert.deepEqual(layers.map((item) => item.id), ["b", "a", "c"]);
  assert.equal(moveVisualLayer(layers, "b", -1), false);

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
  assert.equal(
    resolveGraphicsTemplateImportId({ id: "frameBot", label: "Frame Bot" }, { defaultTemplates, selectedEntityKey: "robot", now: () => 46656 }),
    "custom-import-1000",
  );
  assert.equal(resolveGraphicsTemplateImportId({ label: "Imported Template" }, { selectedEntityKey: "robot", now: () => 1 }), "custom-robot-imported-template-1");
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
