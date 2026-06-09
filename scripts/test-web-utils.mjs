import assert from "node:assert/strict";
import {
  buildEntityVisualDataUrl,
  buildGraphicsColorPreview,
  buildGraphicsTexturePreview,
  normalizeColorValue,
  renderEntityVisualSvg,
} from "../apps/web/src/graphics-studio/entity-visuals.js";
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
import { parseCsv, parseI18nCsv } from "../apps/web/src/utils/csv.js";
import { cloneJson } from "../apps/web/src/utils/json.js";

testCsvParsing();
testI18nParsing();
testJsonClone();
testEntityVisualRendering();
testEntityVisualDataUrlCache();
testGraphicsPreviews();
testGraphicsTemplateHelpers();

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
