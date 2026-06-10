import { buildGraphicsColorPreview, buildGraphicsTexturePreview, normalizeColorValue } from "./entity-visuals.js";

export function buildFillSwatches(layer, swatches, translate = (key) => key) {
  if (!layer) {
    return [];
  }
  const field = layer.type === "glyph" ? "glyphColor" : "fill";
  const fallback = field === "glyphColor" ? "#f0d8bb" : "#f28d35";
  const currentValue = normalizeColorValue(layer[field], fallback).toLowerCase();
  return (Array.isArray(swatches) ? swatches : []).map((swatch) => {
    const value = normalizeColorValue(swatch.value, fallback);
    return {
      kind: "fill",
      value,
      selected: value.toLowerCase() === currentValue,
      disabled: Boolean(layer.locked),
      title: `${translate("graphics.fillSwatches")} // ${swatch.id ?? swatch.value}`,
      preview: buildGraphicsColorPreview(value),
    };
  });
}

export function buildTextureSwatches(layer, swatches, translate = (key) => key) {
  if (!layer || layer.type !== "shape" || (layer.textureType ?? "none") === "none") {
    return [];
  }
  const currentValue = normalizeColorValue(layer.textureColor, "#33261c").toLowerCase();
  return (Array.isArray(swatches) ? swatches : []).map((swatch) => {
    const value = normalizeColorValue(swatch.value, "#33261c");
    return {
      kind: "texture",
      value,
      selected: value.toLowerCase() === currentValue,
      disabled: Boolean(layer.locked),
      title: `${translate("graphics.textureSwatches")} // ${swatch.id ?? swatch.value}`,
      preview: buildGraphicsTexturePreview(value, layer.textureType),
    };
  });
}

export function buildGraphicsSwatchStripModel(swatches = []) {
  const items = Array.isArray(swatches) ? swatches : [];
  return {
    hidden: items.length === 0,
    items,
  };
}

export function applyGraphicsSwatchToLayer(layer, kind, value) {
  if (!layer || layer.locked) {
    return false;
  }
  if (kind === "fill") {
    if (layer.type === "glyph") {
      layer.glyphColor = value;
    } else {
      layer.fill = value;
    }
    return true;
  }
  if (kind === "texture" && layer.type === "shape" && (layer.textureType ?? "none") !== "none") {
    layer.textureColor = value;
    return true;
  }
  return false;
}
