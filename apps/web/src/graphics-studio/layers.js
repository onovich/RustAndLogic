import { resolveGraphicsTemplateObject } from "./templates.js";

export function createDefaultShapeLayer(visual, options = {}) {
  const { entityKey = "", defaultShapeLayer = {}, now = Date.now } = options;
  const canvasSize = Number(visual?.canvasSize ?? 24);
  const template = resolveGraphicsTemplateObject(defaultShapeLayer ?? {}, {
    canvasSize,
    entityKey,
  });
  return {
    id: `${entityKey}-shape-${resolveNow(now).toString(36)}`,
    type: "shape",
    ...template,
  };
}

export function createDefaultGlyphLayer(visual, options = {}) {
  const { entityKey = "", defaultGlyphLayer = {}, now = Date.now } = options;
  const canvasSize = Number(visual?.canvasSize ?? 24);
  const template = resolveGraphicsTemplateObject(defaultGlyphLayer ?? {}, {
    canvasSize,
    entityKey,
  });
  return {
    id: `${entityKey}-glyph-${resolveNow(now).toString(36)}`,
    type: "glyph",
    ...template,
  };
}

export function upgradeVisualLayerType(layer, nextType, visual, options = {}) {
  if (!layer) {
    return null;
  }
  const canvasSize = Number(visual?.canvasSize ?? 24);
  const id = layer.id;
  const x = layer.x ?? canvasSize / 2;
  const y = layer.y ?? canvasSize / 2;
  layer.type = nextType;
  if (nextType === "glyph") {
    Object.assign(layer, createDefaultGlyphLayer(visual, options), {
      id,
      type: "glyph",
      x,
      y,
    });
    return layer;
  }
  Object.assign(layer, createDefaultShapeLayer(visual, options), {
    id,
    type: "shape",
    x,
    y,
  });
  return layer;
}

export function normalizeShapeLayer(layer, visual) {
  if (!layer || layer.type !== "shape") {
    return layer;
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
  return layer;
}

export function describeVisualLayerTitle(layer, translate = (key) => key) {
  const layerType = translate(`graphics.option.layer.${layer?.type ?? "shape"}`);
  const detail =
    layer?.type === "glyph" ? layer.glyph ?? "" : translate(`graphics.option.shape.${layer?.shape ?? "rectangle"}`);
  return `${layerType} // ${detail}`;
}

export function describeVisualLayerMeta(layer, translate = (key) => key) {
  const flags = [
    layer?.visible === false ? translate("graphics.layerHidden") : translate("graphics.layerVisible"),
    layer?.locked ? translate("graphics.layerLocked") : translate("graphics.layerUnlocked"),
  ];
  return `${layer?.id ?? ""} // ${flags.join(" / ")}`;
}

export function moveVisualLayer(layers, selectedLayerId, delta) {
  if (!Array.isArray(layers) || !selectedLayerId) {
    return false;
  }
  const index = layers.findIndex((layer) => layer.id === selectedLayerId);
  if (index < 0) {
    return false;
  }
  const nextIndex = clamp(index + delta, 0, layers.length - 1);
  if (nextIndex === index) {
    return false;
  }
  const [layer] = layers.splice(index, 1);
  layers.splice(nextIndex, 0, layer);
  return true;
}

export function buildVisualLayerActionState(layers = [], selectedLayerId = "") {
  const entries = Array.isArray(layers) ? layers : [];
  const selectedIndex = selectedLayerId ? entries.findIndex((layer) => layer.id === selectedLayerId) : -1;
  return {
    duplicateDisabled: !selectedLayerId,
    moveUpDisabled: selectedIndex <= 0,
    moveDownDisabled: selectedIndex < 0 || selectedIndex >= entries.length - 1,
    deleteDisabled: !selectedLayerId,
  };
}

export function buildVisualLayerListItems(layers = [], selectedLayerId = "", translate = (key) => key) {
  return (Array.isArray(layers) ? layers : []).map((layer) => ({
    id: layer.id,
    hidden: String(layer.visible === false),
    locked: String(Boolean(layer.locked)),
    active: String(layer.id === selectedLayerId),
    title: describeVisualLayerTitle(layer, translate),
    meta: describeVisualLayerMeta(layer, translate),
    visibility: {
      active: String(layer.visible !== false),
      label: translate(layer.visible === false ? "graphics.layerHidden" : "graphics.layerVisible"),
    },
    lock: {
      active: String(Boolean(layer.locked)),
      label: translate(layer.locked ? "graphics.layerLocked" : "graphics.layerUnlocked"),
    },
  }));
}

export function applyShapePresetToLayer(layer, preset, visual, options = {}) {
  if (!visual || !layer || layer.type !== "shape" || layer.locked || !preset) {
    return false;
  }
  const { entityKey = "" } = options;
  const canvasSize = Number(visual.canvasSize ?? 24);
  Object.assign(
    layer,
    resolveGraphicsTemplateObject(preset.patch ?? {}, {
      canvasSize,
      entityKey,
    }),
  );
  normalizeShapeLayer(layer, visual);
  return true;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveNow(now) {
  return typeof now === "function" ? now() : Number(now ?? Date.now());
}
