import { cloneJson } from "../utils/json.js";

export function defaultGraphicsEditorConfig() {
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

export function normalizeGraphicsEditorConfig(config = {}) {
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

