import { normalizeColorValue } from "./entity-visuals.js";
import { normalizeShapeLayer, upgradeVisualLayerType } from "./layers.js";

export function shouldRenderGraphicsField(fieldConfig, source) {
  const condition = fieldConfig.showWhen;
  if (!condition) {
    return true;
  }
  const currentValue = source?.[condition.field];
  if (Object.prototype.hasOwnProperty.call(condition, "equals")) {
    return currentValue === condition.equals;
  }
  if (Object.prototype.hasOwnProperty.call(condition, "notEquals")) {
    return currentValue !== condition.notEquals;
  }
  return true;
}

export function resolveGraphicsFieldValue(source, fieldConfig) {
  const rawValue = source?.[fieldConfig.field];
  if (fieldConfig.type === "color") {
    return normalizeColorValue(rawValue, fieldConfig.fallback ?? "#000000");
  }
  if (rawValue === undefined || rawValue === null) {
    return fieldConfig.defaultValue ?? "";
  }
  return rawValue;
}

export function buildGraphicsFieldModel(scope, source, fieldConfig, optionCatalog = {}, translate = (key) => key) {
  if (!fieldConfig || !fieldConfig.field || !shouldRenderGraphicsField(fieldConfig, source)) {
    return null;
  }
  const value = resolveGraphicsFieldValue(source, fieldConfig);
  const baseModel = {
    scope,
    field: fieldConfig.field,
    label: translate(fieldConfig.labelKey ?? fieldConfig.field),
    value,
  };
  if (fieldConfig.type === "select") {
    return {
      ...baseModel,
      kind: "select",
      options: buildGraphicsSelectOptions(optionCatalog[fieldConfig.optionsKey], translate),
    };
  }
  const type = fieldConfig.type ?? "text";
  return {
    ...baseModel,
    kind: "input",
    type,
    valueType: fieldConfig.valueType ?? (type === "number" ? "number" : "string"),
    min: fieldConfig.min,
    max: fieldConfig.max,
    step: fieldConfig.step,
  };
}

export function buildGraphicsFieldSchemaModels(scope, source, schema, optionCatalog = {}, translate = (key) => key) {
  return (Array.isArray(schema) ? schema : [])
    .map((fieldConfig) => buildGraphicsFieldModel(scope, source, fieldConfig, optionCatalog, translate))
    .filter(Boolean);
}

export function buildGraphicsFormModel(visual, selectedLayerId, editorConfig = {}, translate = (key) => key) {
  if (!visual) {
    return {
      fieldModels: [],
      missingLayerLabel: "",
    };
  }
  const fieldModels = buildGraphicsFieldSchemaModels("entity", visual, editorConfig.entityFields, editorConfig, translate);
  const layer = Array.isArray(visual.layers)
    ? visual.layers.find((item) => item.id === selectedLayerId) ?? null
    : null;
  if (!layer) {
    return {
      fieldModels,
      missingLayerLabel: translate("graphics.noLayer"),
    };
  }
  fieldModels.push(...buildGraphicsFieldSchemaModels("layer", layer, editorConfig.layerBaseFields, editorConfig, translate));
  fieldModels.push(
    ...buildGraphicsFieldSchemaModels(
      "layer",
      layer,
      layer.type === "glyph" ? editorConfig.glyphFields : editorConfig.shapeFields,
      editorConfig,
      translate,
    ),
  );
  return {
    fieldModels,
    missingLayerLabel: "",
  };
}

export function buildGraphicsSelectOptions(options, translate = (key) => key) {
  return (Array.isArray(options) ? options : [])
    .filter((option) => option && typeof option.value === "string")
    .map((option) => ({
      value: option.value,
      label: option.labelKey ? translate(option.labelKey) : option.label ?? option.value,
    }));
}

export function shouldDisableGraphicsFieldControl(layerLocked, scope = "layer") {
  return Boolean(layerLocked) && scope === "layer";
}

export function buildGraphicsFormControlState(layerLocked, scopes = []) {
  return (Array.isArray(scopes) ? scopes : []).map((scope, index) => ({
    index,
    disabled: shouldDisableGraphicsFieldControl(layerLocked, scope),
  }));
}

export function buildGraphicsFormFieldEditActionModel({
  scope = "layer",
  field = "",
  valueType = "string",
  rawValue = "",
} = {}) {
  const editField = String(field ?? "");
  return {
    handled: Boolean(editField),
    scope: String(scope ?? "layer") || "layer",
    field: editField,
    valueType: String(valueType ?? "string") || "string",
    rawValue,
  };
}

export function applyGraphicsFormFieldEdit(visual, selectedLayerId, edit = {}, options = {}) {
  const scope = edit.scope ?? "layer";
  const field = edit.field;
  if (!visual || !field) {
    return {
      changed: false,
      selectedLayerId,
    };
  }
  const target =
    scope === "entity"
      ? visual
      : Array.isArray(visual.layers)
        ? visual.layers.find((layer) => layer.id === selectedLayerId) ?? null
        : null;
  if (!target) {
    return {
      changed: false,
      selectedLayerId,
    };
  }
  const nextValue = coerceGraphicsFieldValue(edit.valueType ?? "string", edit.rawValue);
  if (field === "type" && scope === "layer") {
    upgradeVisualLayerType(target, nextValue, visual, options.layerOptions);
  } else {
    target[field] = nextValue;
  }
  let nextSelectedLayerId = selectedLayerId;
  if (field === "id" && scope === "layer") {
    nextSelectedLayerId = String(nextValue);
  }
  if ((field === "shape" || field === "type") && scope === "layer") {
    normalizeShapeLayer(target, visual);
  }
  return {
    changed: true,
    selectedLayerId: nextSelectedLayerId,
    value: nextValue,
  };
}

export function coerceGraphicsFieldValue(valueType, rawValue) {
  if (valueType === "number") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (valueType === "integer") {
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return rawValue;
}
