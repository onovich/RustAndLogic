import { cloneJson } from "../utils/json.js";
import { resolveSelectedVisualLayerId } from "./layers.js";

export function normalizeColorValue(value, fallback) {
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value;
  }
  return fallback;
}

export function normalizeImportedEntityVisual(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.layers)) {
    throw new Error("Missing layers array.");
  }
  return cloneJson(value);
}

export function parseImportedEntityVisual(source) {
  return normalizeImportedEntityVisual(JSON.parse(source));
}

export function applyImportedEntityVisualToSelection(catalog, selectedEntityKey = "", selectedLayerId = "", source = "") {
  const entityKey = typeof selectedEntityKey === "string" ? selectedEntityKey : "";
  if (!entityKey || !catalog || typeof catalog !== "object") {
    return {
      changed: false,
      entityVisualCatalog: catalog,
      selectedEntityKey: entityKey,
      selectedLayerId,
      visual: null,
    };
  }

  const visual = parseImportedEntityVisual(source);
  const entityVisualCatalog = cloneJson(catalog);
  if (!entityVisualCatalog.entities || typeof entityVisualCatalog.entities !== "object") {
    entityVisualCatalog.entities = {};
  }
  entityVisualCatalog.entities[entityKey] = visual;
  return {
    changed: true,
    entityVisualCatalog,
    selectedEntityKey: entityKey,
    selectedLayerId: resolveSelectedVisualLayerId(visual, selectedLayerId),
    visual,
  };
}

export function buildGraphicsEntityVisualExportModel(visual) {
  return {
    disabled: !visual,
    value: visual ? JSON.stringify(visual, null, 2) : "",
  };
}

export function buildSelectedEntityVisualExportModel(catalog, selectedEntityKey = "") {
  const entityKey = typeof selectedEntityKey === "string" ? selectedEntityKey : "";
  const visual = catalog?.entities?.[entityKey] ?? null;
  return {
    ...buildGraphicsEntityVisualExportModel(visual),
    entityKey,
    visual,
  };
}

export function applyGraphicsEntitySelection(catalog, currentEntityKey = "", requestedEntityKey = "", selectedLayerId = "") {
  const entities = catalog?.entities ?? {};
  const entityKey = typeof requestedEntityKey === "string" && requestedEntityKey in entities ? requestedEntityKey : currentEntityKey;
  return {
    entityKey,
    selectedLayerId: resolveSelectedVisualLayerId(entities[entityKey], selectedLayerId),
  };
}

export function resetGraphicsEntityVisualCatalog(defaultCatalog, currentEntityKey = "", selectedLayerId = "") {
  const entityVisualCatalog = cloneJson(defaultCatalog);
  const visual = entityVisualCatalog.entities?.[currentEntityKey] ?? null;
  return {
    entityVisualCatalog,
    selectedEntityKey: currentEntityKey,
    selectedLayerId: resolveSelectedVisualLayerId(visual, selectedLayerId),
  };
}

export function buildEntityVisualDataUrl(entityKey, visual, cache = null) {
  if (!visual) {
    return "";
  }
  const cacheKey = `${entityKey}:${JSON.stringify(visual)}`;
  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const svg = renderEntityVisualSvg(visual);
  const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  cache?.set(cacheKey, dataUrl);
  return dataUrl;
}

export function renderEntityVisualSvg(visual) {
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

export function buildGraphicsColorPreview(color) {
  return `linear-gradient(180deg, ${color}, ${color})`;
}

export function buildGraphicsTexturePreview(color, textureType) {
  if (textureType === "stripes") {
    return `repeating-linear-gradient(135deg, ${color} 0 2px, transparent 2px 5px), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`;
  }
  return `radial-gradient(circle at 25% 25%, ${color} 0 1px, transparent 1px 100%), radial-gradient(circle at 75% 75%, ${color} 0 1px, transparent 1px 100%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`;
}

export function getGraphicsEntityDisplayLabel(entityKey, visual, translate = (key) => key) {
  const labelKey = `graphics.entity.${entityKey}`;
  const translated = translate(labelKey);
  if (translated !== labelKey) {
    return translated;
  }
  return visual?.label ?? entityKey;
}

export function buildGraphicsEntityListItems(catalog, selectedEntityKey = "", translate = (key) => key) {
  const entities = catalog?.entities ?? {};
  return Object.keys(entities).map((entityKey) => ({
    entityKey,
    active: entityKey === selectedEntityKey,
    label: getGraphicsEntityDisplayLabel(entityKey, entities[entityKey], translate),
  }));
}

export function buildGraphicsEntityPreviewModel(entityKey, visual, translate = (key) => key, cache = null) {
  const dataUrl = visual ? buildEntityVisualDataUrl(entityKey, visual, cache) : "";
  const label = getGraphicsEntityDisplayLabel(entityKey, visual, translate);
  return {
    backgroundImage: dataUrl ? `url("${dataUrl}")` : "none",
    label,
    ariaLabel: label,
  };
}

export function buildGraphicsEntityIoModel({ catalog, ioValue = "", translate = (key) => key } = {}) {
  const currentIoValue = typeof ioValue === "string" ? ioValue : "";
  return {
    exportValue: JSON.stringify(catalog, null, 2),
    placeholder: currentIoValue.trim() ? "" : translate("graphics.entityIoPlaceholder"),
    exportEntityLabel: translate("graphics.exportEntity"),
    importEntityLabel: translate("graphics.importEntity"),
  };
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
