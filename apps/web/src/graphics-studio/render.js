import {
  buildEntityVisualDataUrl,
  buildGraphicsEntityIoModel,
  buildGraphicsEntityListItems,
  buildGraphicsEntityPreviewModel,
} from "./entity-visuals.js";
import { buildGraphicsFormControlState, buildGraphicsFormModel } from "./form-schema.js";
import { buildShapePresetListModel, buildVisualLayerListItems, buildVisualLayerToolbarModel } from "./layers.js";
import { buildGraphicsSwatchStripModel, buildFillSwatches, buildTextureSwatches } from "./swatches.js";
import { buildGraphicsTemplateActionState } from "./templates.js";
import {
  buildGraphicsRecentTemplateStripModel,
  buildGraphicsTemplateCardModel,
  buildGraphicsTemplateCategoryOptions,
  buildGraphicsTemplateFilterRowModel,
  buildGraphicsTemplateLibraryModel,
  buildGraphicsTemplateModeOptions,
  getGraphicsEntityKind,
  getGroupedGraphicsTemplates,
  getRecentGraphicsTemplates,
  normalizeGraphicsTemplateFilterForAvailableCategories,
} from "./template-library.js";
import { buildGraphicsEditorShellControlModel } from "../ui-shell.js";

export function renderGraphicsStudio({
  elements,
  catalog,
  selectedEntityKey = "",
  selectedLayerId = "",
  editorConfig = {},
  templates = [],
  recentTemplateIds = [],
  templateFilterState = {},
  customTemplates = [],
  dataUrlCache = null,
  translate = (key) => key,
  copyResetPending = false,
} = {}) {
  if (!elements?.graphicsEntityList || !elements.graphicsPreview || !elements.graphicsExport) {
    return { templateFilterState };
  }

  const visual = getGraphicsRenderVisual(catalog, selectedEntityKey);
  const entityKind = getGraphicsEntityKind(editorConfig.entityKinds, selectedEntityKey);

  renderGraphicsEntityList(elements, catalog, selectedEntityKey, translate);
  renderGraphicsLayerList(elements, visual, selectedLayerId, translate);
  renderGraphicsForm(elements, visual, selectedLayerId, editorConfig, translate);
  renderGraphicsRecentTemplates(elements, recentTemplateIds, templates, selectedEntityKey, entityKind, translate, dataUrlCache);
  const normalizedTemplateFilterState = renderGraphicsTemplateFilters(
    elements,
    templates,
    templateFilterState,
    selectedEntityKey,
    entityKind,
    translate,
  );
  renderGraphicsTemplates(elements, templates, normalizedTemplateFilterState, selectedEntityKey, entityKind, translate, dataUrlCache);
  renderGraphicsPresets(elements, visual, selectedLayerId, editorConfig, translate);
  renderGraphicsSwatches(elements, visual, selectedLayerId, editorConfig, translate);

  const entityIoModel = renderGraphicsEditorEntitySurface(
    elements,
    catalog,
    selectedEntityKey,
    visual,
    translate,
    dataUrlCache,
  );
  renderGraphicsTemplateActionControls(elements, selectedEntityKey, customTemplates);
  const layerToolbar = buildVisualLayerToolbarModel(visual?.layers, selectedLayerId);
  renderGraphicsLayerToolbarControls(elements, layerToolbar);
  renderGraphicsEditorShellControls(elements, entityIoModel, translate, copyResetPending);
  renderGraphicsFormControlStates(elements, layerToolbar);

  return { templateFilterState: normalizedTemplateFilterState };
}

function renderGraphicsTemplateActionControls(elements, selectedEntityKey, customTemplates) {
  const templateActions = buildGraphicsTemplateActionState({
    selectedEntityKey,
    ioValue: elements.graphicsEntityIo?.value,
    customTemplates,
  });
  if (elements.graphicsSaveTemplateButton) {
    elements.graphicsSaveTemplateButton.disabled = templateActions.saveDisabled;
  }
  if (elements.graphicsImportTemplateButton) {
    elements.graphicsImportTemplateButton.disabled = templateActions.importDisabled;
  }
  if (elements.graphicsExportLibraryButton) {
    elements.graphicsExportLibraryButton.disabled = templateActions.exportLibraryDisabled;
  }
}

function renderGraphicsLayerToolbarControls(elements, layerToolbar) {
  if (elements.graphicsDuplicateLayerButton) {
    elements.graphicsDuplicateLayerButton.disabled = layerToolbar.duplicateDisabled;
  }
  if (elements.graphicsMoveLayerUpButton) {
    elements.graphicsMoveLayerUpButton.disabled = layerToolbar.moveUpDisabled;
  }
  if (elements.graphicsMoveLayerDownButton) {
    elements.graphicsMoveLayerDownButton.disabled = layerToolbar.moveDownDisabled;
  }
  if (elements.graphicsDeleteLayerButton) {
    elements.graphicsDeleteLayerButton.disabled = layerToolbar.deleteDisabled;
  }
}

function renderGraphicsEditorShellControls(elements, entityIoModel, translate, copyResetPending) {
  const shellControls = buildGraphicsEditorShellControlModel({
    studioOpen: elements.devPanel?.dataset.studio,
    copyResetPending,
  });
  if (elements.graphicsCopyButton && shellControls.copyLabelKey) {
    elements.graphicsCopyButton.textContent = translate(shellControls.copyLabelKey);
  }
  if (elements.graphicsStudioButton) {
    elements.graphicsStudioButton.textContent = translate(shellControls.studioButton.labelKey);
    elements.graphicsStudioButton.dataset.active = shellControls.studioButton.active;
  }
  if (elements.graphicsExportEntityButton) {
    elements.graphicsExportEntityButton.textContent = entityIoModel.exportEntityLabel;
  }
  if (elements.graphicsImportEntityButton) {
    elements.graphicsImportEntityButton.textContent = entityIoModel.importEntityLabel;
  }
}

function renderGraphicsFormControlStates(elements, layerToolbar) {
  if (!elements.graphicsForm) {
    return;
  }
  const controls = [...elements.graphicsForm.querySelectorAll("input, select")];
  const controlState = buildGraphicsFormControlState(
    layerToolbar.selectedLocked,
    controls.map((input) => input.dataset.scope),
  );
  for (const state of controlState) {
    controls[state.index].disabled = state.disabled;
  }
}

function renderGraphicsEditorEntitySurface(elements, catalog, selectedEntityKey, visual, translate, dataUrlCache) {
  const previewModel = buildGraphicsEntityPreviewModel(selectedEntityKey, visual, translate, dataUrlCache);
  elements.graphicsPreview.style.backgroundImage = previewModel.backgroundImage;
  elements.graphicsPreview.setAttribute("aria-label", previewModel.ariaLabel);
  if (elements.graphicsEntityName) {
    elements.graphicsEntityName.textContent = previewModel.label;
  }
  const entityIoModel = buildGraphicsEntityIoModel({
    catalog,
    ioValue: elements.graphicsEntityIo?.value,
    translate,
  });
  if (elements.graphicsEntityIo && entityIoModel.placeholder) {
    elements.graphicsEntityIo.placeholder = entityIoModel.placeholder;
  }
  elements.graphicsExport.value = entityIoModel.exportValue;
  return entityIoModel;
}

function renderGraphicsEntityList(elements, catalog, selectedEntityKey, translate) {
  if (!elements.graphicsEntityList) {
    return;
  }
  elements.graphicsEntityList.replaceChildren();
  const entityItems = buildGraphicsEntityListItems(catalog, selectedEntityKey, translate);
  for (const entityItem of entityItems) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.entityKey = entityItem.entityKey;
    button.dataset.active = String(entityItem.active);
    button.textContent = entityItem.label;
    elements.graphicsEntityList.append(button);
  }
}

function renderGraphicsTemplates(elements, templates, templateFilterState, selectedEntityKey, entityKind, translate, dataUrlCache) {
  if (!elements.graphicsTemplates) {
    return;
  }
  elements.graphicsTemplates.replaceChildren();
  const group = elements.graphicsTemplates.closest(".visual-preset-group");
  const hasSelectedEntity = Boolean(selectedEntityKey);
  const templateGroups = hasSelectedEntity ? getGroupedGraphicsTemplates(templates, templateFilterState, entityKind, translate) : [];
  const templateLibrary = buildGraphicsTemplateLibraryModel(templateGroups, hasSelectedEntity);
  elements.graphicsTemplates.hidden = templateLibrary.hidden;
  if (group) {
    group.hidden = templateLibrary.hidden;
  }
  if (templateLibrary.hidden) {
    return;
  }
  if (templateLibrary.empty) {
    elements.graphicsTemplates.append(createGraphicsTemplateEmptyState(translate));
    return;
  }
  for (const templateGroup of templateLibrary.groups) {
    elements.graphicsTemplates.append(createGraphicsTemplateSection(templateGroup, entityKind, translate, dataUrlCache));
  }
}

function renderGraphicsTemplateFilters(elements, templates, templateFilterState, selectedEntityKey, entityKind, translate) {
  const normalizedTemplateFilterState = normalizeGraphicsTemplateFilterForAvailableCategories(
    templates,
    templateFilterState,
    entityKind,
  );
  renderGraphicsTemplateFilterRow(
    elements.graphicsTemplateModeFilters,
    buildGraphicsTemplateModeOptions(normalizedTemplateFilterState, translate),
    selectedEntityKey,
  );
  renderGraphicsTemplateFilterRow(
    elements.graphicsTemplateCategoryFilters,
    buildGraphicsTemplateCategoryOptions(templates, normalizedTemplateFilterState, entityKind, translate),
    selectedEntityKey,
  );
  return normalizedTemplateFilterState;
}

function renderGraphicsTemplateFilterRow(container, options, selectedEntityKey) {
  if (!container) {
    return;
  }
  container.replaceChildren();
  const filterRow = buildGraphicsTemplateFilterRowModel(options, Boolean(selectedEntityKey));
  container.hidden = filterRow.hidden;
  if (filterRow.hidden) {
    return;
  }
  for (const option of filterRow.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-template-filter-button";
    button.dataset.filterKind = option.kind;
    button.dataset.filterValue = option.value;
    button.dataset.active = String(option.active);
    button.textContent = option.label;
    container.append(button);
  }
}

function renderGraphicsRecentTemplates(elements, recentTemplateIds, templates, selectedEntityKey, entityKind, translate, dataUrlCache) {
  if (!elements.graphicsRecentTemplates) {
    return;
  }
  elements.graphicsRecentTemplates.replaceChildren();
  const group = elements.graphicsRecentTemplates.closest(".visual-preset-group");
  const hasSelectedEntity = Boolean(selectedEntityKey);
  const recentTemplates = hasSelectedEntity ? getRecentGraphicsTemplates(recentTemplateIds, templates) : [];
  const recentStrip = buildGraphicsRecentTemplateStripModel(recentTemplates, hasSelectedEntity);
  elements.graphicsRecentTemplates.hidden = recentStrip.hidden;
  if (group) {
    group.hidden = recentStrip.hidden;
  }
  if (recentStrip.hidden) {
    return;
  }
  for (const template of recentStrip.templates) {
    elements.graphicsRecentTemplates.append(createGraphicsTemplateCard(template, entityKind, translate, dataUrlCache));
  }
}

function createGraphicsTemplateCard(template, entityKind, translate, dataUrlCache) {
  const cardModel = buildGraphicsTemplateCardModel(template, entityKind, translate);
  const card = document.createElement("div");
  card.className = "visual-template-card";
  card.dataset.templateSource = cardModel.source;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "visual-template-button";
  button.dataset.template = cardModel.id;
  button.dataset.templateSource = cardModel.source;
  button.dataset.recommended = String(cardModel.recommended);
  if (cardModel.title) {
    button.title = cardModel.title;
  }
  const preview = document.createElement("span");
  preview.className = "visual-template-preview";
  preview.style.backgroundImage = buildGraphicsTemplatePreview(template, dataUrlCache);
  const label = document.createElement("span");
  label.className = "visual-template-label";
  label.textContent = cardModel.label;
  const meta = document.createElement("span");
  meta.className = "visual-template-meta";
  meta.textContent = cardModel.metaText;
  button.append(preview, label, meta);
  card.append(button);
  card.append(createGraphicsTemplateActionRow(cardModel.actions));
  return card;
}

function createGraphicsTemplateActionRow(actionsModel) {
  const actions = document.createElement("div");
  actions.className = "visual-template-actions";
  for (const actionModel of actionsModel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-template-action";
    button.dataset.templateAction = actionModel.action;
    button.dataset.templateId = actionModel.templateId;
    button.textContent = actionModel.label;
    button.title = actionModel.title;
    actions.append(button);
  }
  return actions;
}

function createGraphicsTemplateSection(templateGroup, entityKind, translate, dataUrlCache) {
  const section = document.createElement("section");
  section.className = "visual-template-section";
  section.dataset.templateGroup = templateGroup.id;
  const heading = document.createElement("div");
  heading.className = "visual-template-section-heading";
  heading.textContent = templateGroup.label;
  const strip = document.createElement("div");
  strip.className = "visual-template-section-grid";
  for (const template of templateGroup.templates) {
    strip.append(createGraphicsTemplateCard(template, entityKind, translate, dataUrlCache));
  }
  section.append(heading, strip);
  return section;
}

function createGraphicsTemplateEmptyState(translate) {
  const empty = document.createElement("div");
  empty.className = "visual-template-empty";
  empty.textContent = translate("graphics.templateEmpty");
  return empty;
}

function buildGraphicsTemplatePreview(template, dataUrlCache) {
  if (!template?.visual) {
    return "none";
  }
  const previewUrl = buildEntityVisualDataUrl(`template:${template.id}`, template.visual, dataUrlCache);
  return previewUrl ? `url("${previewUrl}")` : "none";
}

function renderGraphicsLayerList(elements, visual, selectedLayerId, translate) {
  if (!elements.graphicsLayerList) {
    return;
  }
  elements.graphicsLayerList.replaceChildren();
  if (!visual) {
    return;
  }

  for (const layerItem of buildVisualLayerListItems(visual.layers, selectedLayerId, translate)) {
    const row = document.createElement("div");
    row.className = "visual-layer-item";
    row.dataset.hidden = layerItem.hidden;
    row.dataset.locked = layerItem.locked;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-layer-select";
    button.dataset.layerId = layerItem.id;
    button.dataset.active = layerItem.active;
    const title = document.createElement("span");
    title.className = "visual-layer-title";
    title.textContent = layerItem.title;
    const meta = document.createElement("span");
    meta.className = "visual-layer-meta";
    meta.textContent = layerItem.meta;
    button.append(title, meta);
    const controls = document.createElement("div");
    controls.className = "visual-layer-controls";
    const visibleButton = document.createElement("button");
    visibleButton.type = "button";
    visibleButton.dataset.layerAction = "visible";
    visibleButton.dataset.layerId = layerItem.id;
    visibleButton.dataset.active = layerItem.visibility.active;
    visibleButton.textContent = layerItem.visibility.label;
    const lockedButton = document.createElement("button");
    lockedButton.type = "button";
    lockedButton.dataset.layerAction = "locked";
    lockedButton.dataset.layerId = layerItem.id;
    lockedButton.dataset.active = layerItem.lock.active;
    lockedButton.textContent = layerItem.lock.label;
    controls.append(visibleButton, lockedButton);
    row.append(button, controls);
    elements.graphicsLayerList.append(row);
  }
}

function renderGraphicsPresets(elements, visual, selectedLayerId, editorConfig, translate) {
  if (!elements.graphicsPresets) {
    return;
  }
  elements.graphicsPresets.replaceChildren();
  const group = elements.graphicsPresets.closest(".visual-preset-group");
  const layer = visual?.layers.find((item) => item.id === selectedLayerId);
  const presetList = buildShapePresetListModel(layer, editorConfig.shapePresets, translate);
  elements.graphicsPresets.hidden = presetList.hidden;
  if (group) {
    group.hidden = presetList.hidden;
  }
  for (const preset of presetList.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = preset.id;
    button.textContent = preset.label;
    button.disabled = preset.disabled;
    elements.graphicsPresets.append(button);
  }
}

function renderGraphicsSwatches(elements, visual, selectedLayerId, editorConfig, translate) {
  const layer = visual?.layers.find((item) => item.id === selectedLayerId);
  renderGraphicsSwatchStrip(elements.graphicsFillSwatches, buildFillSwatches(layer, editorConfig.fillSwatches, translate));
  renderGraphicsSwatchStrip(
    elements.graphicsTextureSwatches,
    buildTextureSwatches(layer, editorConfig.textureSwatches, translate),
  );
}

function renderGraphicsSwatchStrip(container, swatches) {
  if (!container) {
    return;
  }
  container.replaceChildren();
  const group = container.closest(".visual-preset-group");
  const swatchStrip = buildGraphicsSwatchStripModel(swatches);
  if (swatchStrip.hidden) {
    container.hidden = swatchStrip.hidden;
    if (group) {
      group.hidden = swatchStrip.hidden;
    }
    return;
  }
  container.hidden = swatchStrip.hidden;
  if (group) {
    group.hidden = swatchStrip.hidden;
  }
  for (const swatch of swatchStrip.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "visual-swatch";
    button.dataset.swatchKind = swatch.kind;
    button.dataset.swatchValue = swatch.value;
    button.dataset.selected = String(Boolean(swatch.selected));
    button.disabled = Boolean(swatch.disabled);
    button.title = swatch.title;
    button.setAttribute("aria-label", swatch.title);
    button.style.setProperty("--swatch-color", swatch.value);
    if (swatch.preview) {
      button.style.setProperty("--swatch-preview", swatch.preview);
    } else {
      button.style.removeProperty("--swatch-preview");
    }
    container.append(button);
  }
}

function renderGraphicsForm(elements, visual, selectedLayerId, editorConfig, translate) {
  if (!elements.graphicsForm) {
    return;
  }
  elements.graphicsForm.replaceChildren();
  if (!visual) {
    return;
  }

  const formModel = buildGraphicsFormModel(visual, selectedLayerId, editorConfig, translate);
  for (const fieldModel of formModel.fieldModels) {
    appendGraphicsFieldFromModel(elements, fieldModel);
  }
  if (formModel.missingLayerLabel) {
    appendGraphicsFormPlaceholder(elements, formModel.missingLayerLabel);
  }
}

function appendGraphicsFieldFromModel(elements, fieldModel) {
  if (fieldModel.kind === "select") {
    appendGraphicsSelectField(elements, {
      scope: fieldModel.scope,
      field: fieldModel.field,
      label: fieldModel.label,
      value: fieldModel.value,
      options: fieldModel.options,
    });
    return;
  }
  appendGraphicsField(elements, {
    scope: fieldModel.scope,
    field: fieldModel.field,
    label: fieldModel.label,
    type: fieldModel.type,
    value: fieldModel.value,
    valueType: fieldModel.valueType,
    min: fieldModel.min,
    max: fieldModel.max,
    step: fieldModel.step,
  });
}

function appendGraphicsField(
  elements,
  { scope, field, label, type, value, valueType = type === "number" ? "number" : "string", min, max, step },
) {
  if (!elements.graphicsForm) {
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "visual-field";
  const labelNode = document.createElement("label");
  labelNode.textContent = label;
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  input.dataset.scope = scope;
  input.dataset.field = field;
  input.dataset.valueType = valueType;
  if (min !== undefined) {
    input.min = String(min);
  }
  if (max !== undefined) {
    input.max = String(max);
  }
  if (step !== undefined) {
    input.step = String(step);
  }
  wrapper.append(labelNode, input);
  elements.graphicsForm.append(wrapper);
}

function appendGraphicsFormPlaceholder(elements, label) {
  if (!elements.graphicsForm) {
    return;
  }
  const placeholder = document.createElement("div");
  placeholder.className = "visual-field";
  const labelNode = document.createElement("label");
  labelNode.textContent = label;
  placeholder.append(labelNode);
  elements.graphicsForm.append(placeholder);
}

function appendGraphicsSelectField(elements, { scope, field, label, value, options }) {
  if (!elements.graphicsForm) {
    return;
  }
  const wrapper = document.createElement("div");
  wrapper.className = "visual-field";
  const labelNode = document.createElement("label");
  labelNode.textContent = label;
  const select = document.createElement("select");
  select.dataset.scope = scope;
  select.dataset.field = field;
  select.dataset.valueType = "string";
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    node.selected = option.value === value;
    select.append(node);
  }
  wrapper.append(labelNode, select);
  elements.graphicsForm.append(wrapper);
}

function getGraphicsRenderVisual(catalog, entityKey) {
  return catalog?.entities?.[entityKey] ?? null;
}
