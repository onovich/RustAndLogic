import assert from "node:assert/strict";
import {
  buildEntityVisualDataUrl,
  buildGraphicsColorPreview,
  buildGraphicsTexturePreview,
  normalizeColorValue,
  renderEntityVisualSvg,
} from "../apps/web/src/graphics-studio/entity-visuals.js";
import { parseCsv, parseI18nCsv } from "../apps/web/src/utils/csv.js";
import { cloneJson } from "../apps/web/src/utils/json.js";

testCsvParsing();
testI18nParsing();
testJsonClone();
testEntityVisualRendering();
testEntityVisualDataUrlCache();
testGraphicsPreviews();

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
