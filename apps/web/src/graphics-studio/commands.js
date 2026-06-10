import {
  applyGraphicsEntitySelection,
  applyImportedEntityVisualToSelection,
  resetGraphicsEntityVisualCatalog,
} from "./entity-visuals.js";
import { applyGraphicsFormFieldEdit } from "./form-schema.js";
import {
  addDefaultSelectedVisualLayer,
  applyShapePresetToSelectedLayer,
  duplicateSelectedVisualLayer,
  moveSelectedVisualLayer,
  removeSelectedVisualLayer,
  selectVisualLayer,
  toggleSelectedVisualLayerLocked,
  toggleSelectedVisualLayerVisible,
} from "./layers.js";
import { applyGraphicsSwatchToSelectedLayer } from "./swatches.js";
import {
  applyGraphicsTemplateFilterSelection,
  applyGraphicsTemplateToSelectedEntity,
  importGraphicsTemplatePayload,
  removeGraphicsTemplateFromLibrary,
  saveGraphicsTemplateFromSelectedEntity,
} from "./template-library.js";

export function addGraphicsStudioLayer(state, layerType, layerOptions = {}) {
  return addDefaultSelectedVisualLayer(
    getSelectedGraphicsStudioVisual(state),
    layerType,
    state?.selectedLayerId,
    layerOptions,
  );
}

export function duplicateGraphicsStudioLayer(state) {
  return duplicateSelectedVisualLayer(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId);
}

export function deleteGraphicsStudioLayer(state) {
  return removeSelectedVisualLayer(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId);
}

export function moveGraphicsStudioLayer(state, delta) {
  return moveSelectedVisualLayer(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId, delta);
}

export function toggleGraphicsStudioLayerVisible(state, layerId) {
  return toggleSelectedVisualLayerVisible(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId, layerId);
}

export function toggleGraphicsStudioLayerLocked(state, layerId) {
  return toggleSelectedVisualLayerLocked(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId, layerId);
}

export function selectGraphicsStudioLayer(state, layerId) {
  return selectVisualLayer(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId, layerId);
}

export function applyGraphicsStudioFormEdit(state, editAction, layerOptions = {}) {
  return applyGraphicsFormFieldEdit(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId, editAction, {
    layerOptions,
  });
}

export function selectGraphicsStudioEntity(state, entityKey) {
  return applyGraphicsEntitySelection(state?.catalog, state?.selectedEntityKey, entityKey, state?.selectedLayerId);
}

export function resetGraphicsStudioCatalog(defaultCatalog, state) {
  return resetGraphicsEntityVisualCatalog(defaultCatalog, state?.selectedEntityKey, state?.selectedLayerId);
}

export function importGraphicsStudioEntityVisual(state, source) {
  return applyImportedEntityVisualToSelection(state?.catalog, state?.selectedEntityKey, state?.selectedLayerId, source);
}

export function applyGraphicsStudioTemplate(state, templateId, options = {}) {
  return applyGraphicsTemplateToSelectedEntity(
    state?.catalog,
    state?.selectedEntityKey,
    state?.selectedLayerId,
    state?.templates,
    templateId,
    {
      entityLabel: options.entityLabel,
      recentTemplateIds: state?.recentTemplateIds,
    },
  );
}

export function saveGraphicsStudioTemplate(state, options = {}) {
  return saveGraphicsTemplateFromSelectedEntity(state?.customTemplates, state?.recentTemplateIds, {
    entityKey: state?.selectedEntityKey,
    entityLabel: options.entityLabel,
    entityKind: options.entityKind,
    label: options.label,
    now: options.now,
    visual: getSelectedGraphicsStudioVisual(state),
  });
}

export function importGraphicsStudioTemplate(state, source, options = {}) {
  return importGraphicsTemplatePayload(state?.customTemplates, state?.recentTemplateIds, source, {
    defaultTemplates: state?.defaultTemplates,
    selectedEntityKey: state?.selectedEntityKey,
    now: options.now,
  });
}

export function deleteGraphicsStudioTemplate(state, templateId) {
  return removeGraphicsTemplateFromLibrary(state?.customTemplates, state?.recentTemplateIds, templateId);
}

export function applyGraphicsStudioTemplateFilter(filterState, action) {
  return applyGraphicsTemplateFilterSelection(filterState, action?.filterKind, action?.filterValue);
}

export function applyGraphicsStudioShapePreset(state, presetId, options = {}) {
  return applyShapePresetToSelectedLayer(
    getSelectedGraphicsStudioVisual(state),
    state?.selectedLayerId,
    options.presets,
    presetId,
    { entityKey: state?.selectedEntityKey },
  );
}

export function applyGraphicsStudioSwatch(state, kind, value) {
  return applyGraphicsSwatchToSelectedLayer(getSelectedGraphicsStudioVisual(state), state?.selectedLayerId, kind, value);
}

function getSelectedGraphicsStudioVisual(state) {
  return state?.catalog?.entities?.[state?.selectedEntityKey] ?? null;
}
