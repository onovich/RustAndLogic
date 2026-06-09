import { cloneJson } from "../utils/json.js";

export function normalizeGraphicsCustomTemplates(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((template, index) => normalizeGraphicsCustomTemplate(template, index))
    .filter(Boolean);
}

export function normalizeGraphicsCustomTemplate(template, index) {
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

export function normalizeRecentGraphicsTemplateIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()))].slice(0, 6);
}

export function normalizeGraphicsTemplateFilterState(value) {
  return {
    mode: value?.mode === "fit" ? "fit" : "all",
    category: typeof value?.category === "string" && value.category.trim() ? value.category.trim() : "all",
  };
}

export function buildGraphicsTemplateActionState(state = {}) {
  const customTemplateCount = Array.isArray(state.customTemplates)
    ? state.customTemplates.length
    : Number(state.customTemplateCount ?? 0);
  return {
    saveDisabled: !String(state.selectedEntityKey ?? "").trim(),
    importDisabled: !String(state.ioValue ?? "").trim(),
    exportLibraryDisabled: customTemplateCount <= 0,
  };
}

export function serializeGraphicsTemplate(template, options = {}) {
  return {
    kind: "graphics-template",
    version: 1,
    id: template.id,
    label: resolveTemplateLabel(template, options),
    description: resolveTemplateDescription(template, options),
    categoryKey: template.categoryKey ?? "graphics.templateCategory.custom",
    categoryLabel: typeof template.categoryLabel === "string" ? template.categoryLabel : "",
    entityKinds: Array.isArray(template.entityKinds) ? [...template.entityKinds] : [],
    originEntityKey: template.originEntityKey ?? "",
    updatedAt: Number(template.updatedAt ?? resolveNow(options.now)),
    visual: cloneJson(template.visual),
  };
}

export function serializeGraphicsTemplateLibrary(templates, options = {}) {
  return {
    kind: "graphics-template-library",
    version: 1,
    exportedAt: resolveNow(options.now),
    templates: templates.map((template) => serializeGraphicsTemplate(template, options)),
  };
}

export function isGraphicsTemplateLibraryPayload(payload) {
  return (
    payload?.kind === "graphics-template-library" ||
    (Array.isArray(payload?.templates) && (!payload.kind || payload.kind === "graphics-template-library"))
  );
}

export function resolveGraphicsTemplateObject(patch, context) {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [key, resolveGraphicsTemplateValue(value, context)]),
  );
}

export function resolveGraphicsTemplateValue(value, context) {
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

export function buildCustomTemplateId(entityKey, label, now = Date.now()) {
  const slug = String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `custom-${entityKey}-${slug || "template"}-${Number(now).toString(36)}`;
}

function resolveTemplateLabel(template, options) {
  if (typeof options.label === "string") {
    return options.label;
  }
  if (typeof options.getLabel === "function") {
    return options.getLabel(template);
  }
  return typeof template?.label === "string" ? template.label : "";
}

function resolveTemplateDescription(template, options) {
  if (typeof options.description === "string") {
    return options.description;
  }
  if (typeof options.getDescription === "function") {
    return options.getDescription(template);
  }
  return typeof template?.description === "string" ? template.description : "";
}

function resolveNow(now) {
  return typeof now === "function" ? now() : Number(now ?? Date.now());
}
