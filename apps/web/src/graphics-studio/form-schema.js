import { normalizeColorValue } from "./entity-visuals.js";

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
