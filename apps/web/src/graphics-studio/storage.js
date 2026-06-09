import { cloneJson } from "../utils/json.js";
import {
  normalizeGraphicsCustomTemplates,
  normalizeGraphicsTemplateFilterState,
  normalizeRecentGraphicsTemplateIds,
} from "./templates.js";

export function loadCustomGraphicsTemplatesFromStorage(storage, key, onError = null) {
  return loadJsonValue(storage, key, normalizeGraphicsCustomTemplates, [], onError);
}

export function loadRecentGraphicsTemplateIdsFromStorage(storage, key, onError = null) {
  return loadJsonValue(storage, key, normalizeRecentGraphicsTemplateIds, [], onError);
}

export function loadGraphicsTemplateFilterStateFromStorage(storage, key, onError = null) {
  return loadJsonValue(storage, key, normalizeGraphicsTemplateFilterState, defaultGraphicsTemplateFilterState(), onError);
}

export function loadEntityVisualCatalogState(defaultCatalog, storedOverride, onError = null) {
  const defaultEntityVisualCatalog = cloneJson(defaultCatalog);
  let entityVisualCatalog = cloneJson(defaultCatalog);
  if (storedOverride) {
    try {
      entityVisualCatalog = mergeEntityVisualCatalogs(defaultEntityVisualCatalog, JSON.parse(storedOverride));
    } catch (error) {
      onError?.(error);
    }
  }
  return { defaultEntityVisualCatalog, entityVisualCatalog };
}

export function mergeEntityVisualCatalogs(baseCatalog, overrideCatalog) {
  const merged = cloneJson(baseCatalog);
  if (!overrideCatalog?.entities) {
    return merged;
  }

  for (const [entityKey, overrideVisual] of Object.entries(overrideCatalog.entities)) {
    merged.entities[entityKey] = cloneJson(overrideVisual);
  }

  return merged;
}

export function persistJsonValue(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

export function persistRecentGraphicsTemplateIds(storage, key, value) {
  const normalized = normalizeRecentGraphicsTemplateIds(value);
  persistJsonValue(storage, key, normalized);
  return normalized;
}

export function persistGraphicsTemplateFilterState(storage, key, value) {
  const normalized = normalizeGraphicsTemplateFilterState(value);
  persistJsonValue(storage, key, normalized);
  return normalized;
}

export function defaultGraphicsTemplateFilterState() {
  return { mode: "all", category: "all" };
}

function loadJsonValue(storage, key, normalize, fallback, onError = null) {
  const stored = storage?.getItem(key);
  if (!stored) {
    return cloneJson(fallback);
  }
  try {
    return normalize(JSON.parse(stored));
  } catch (error) {
    onError?.(error);
    return cloneJson(fallback);
  }
}
