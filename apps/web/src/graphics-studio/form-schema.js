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

export function buildGraphicsSelectOptions(options, translate = (key) => key) {
  return (Array.isArray(options) ? options : [])
    .filter((option) => option && typeof option.value === "string")
    .map((option) => ({
      value: option.value,
      label: option.labelKey ? translate(option.labelKey) : option.label ?? option.value,
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
