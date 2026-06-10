import {
  buildCustomTemplateId,
  normalizeGraphicsCustomTemplate,
  normalizeGraphicsTemplateFilterState,
  resolveGraphicsTemplateValue,
} from "./templates.js";

export function getAllGraphicsTemplates(customTemplates = [], defaultTemplates = []) {
  return [
    ...customTemplates.map((template) => ({ ...template, source: "custom" })),
    ...defaultTemplates.map((template) => ({ ...template, source: "builtin" })),
  ];
}

export function getGraphicsTemplateSource(template) {
  return template?.source === "custom" ? "custom" : "builtin";
}

export function isCustomGraphicsTemplate(template) {
  return getGraphicsTemplateSource(template) === "custom";
}

export function getGraphicsEntityKind(entityKinds, entityKey = "") {
  return entityKinds?.[entityKey] ?? "";
}

export function getGraphicsTemplateLabel(template, translate = (key) => key) {
  if (typeof template?.label === "string" && template.label.trim()) {
    return template.label.trim();
  }
  return translate(template?.labelKey ?? "");
}

export function getGraphicsTemplateDescription(template, translate = (key) => key) {
  if (typeof template?.description === "string" && template.description.trim()) {
    return template.description.trim();
  }
  if (template?.descriptionKey) {
    return translate(template.descriptionKey);
  }
  return "";
}

export function getGraphicsTemplateCategory(template, translate = (key) => key) {
  if (typeof template?.categoryLabel === "string" && template.categoryLabel.trim()) {
    return template.categoryLabel.trim();
  }
  if (template?.categoryKey) {
    return translate(template.categoryKey);
  }
  return "";
}

export function getGraphicsTemplateGroupId(template) {
  const categoryKey = template?.categoryKey ?? "";
  if (categoryKey.startsWith("graphics.templateCategory.")) {
    return categoryKey.replace("graphics.templateCategory.", "");
  }
  return "other";
}

export function getGraphicsTemplateGroupLabel(groupId, translate = (key) => key) {
  if (groupId === "recommended") {
    return translate("graphics.templateGroup.recommended");
  }
  const key = `graphics.templateCategory.${groupId}`;
  const translated = translate(key);
  return translated === key ? translate("graphics.templateGroup.other") : translated;
}

export function getGraphicsTemplateGroupOrder() {
  return ["custom", "actor", "pickup", "field", "structure", "anchor", "other"];
}

export function isGraphicsTemplateRecommended(template, entityKind) {
  const supportedKinds = template?.entityKinds ?? [];
  return Boolean(entityKind && Array.isArray(supportedKinds) && supportedKinds.includes(entityKind));
}

export function getRecentGraphicsTemplates(recentTemplateIds, templates) {
  const templatesById = new Map((Array.isArray(templates) ? templates : []).map((template) => [template.id, template]));
  return (Array.isArray(recentTemplateIds) ? recentTemplateIds : [])
    .map((templateId) => templatesById.get(templateId))
    .filter(Boolean);
}

export function recordRecentGraphicsTemplateId(recentTemplateIds, templateId) {
  const currentIds = Array.isArray(recentTemplateIds) ? recentTemplateIds : [];
  if (!templateId) {
    return [...currentIds];
  }
  return [templateId, ...currentIds.filter((item) => item !== templateId)];
}

export function recordRecentGraphicsTemplateIds(recentTemplateIds, templateIds) {
  const currentIds = Array.isArray(recentTemplateIds) ? recentTemplateIds : [];
  if (!Array.isArray(templateIds) || templateIds.length === 0) {
    return [...currentIds];
  }
  const uniqueIds = [...new Set(templateIds.filter(Boolean))];
  return [...uniqueIds, ...currentIds.filter((item) => !uniqueIds.includes(item))];
}

export function upsertGraphicsTemplate(templates, template) {
  const currentTemplates = Array.isArray(templates) ? templates : [];
  if (!template?.id) {
    return [...currentTemplates];
  }
  return [template, ...currentTemplates.filter((item) => item.id !== template.id)];
}

export function upsertGraphicsTemplates(templates, nextTemplates) {
  const currentTemplates = Array.isArray(templates) ? templates : [];
  if (!Array.isArray(nextTemplates) || nextTemplates.length === 0) {
    return [...currentTemplates];
  }
  const importedIds = new Set(nextTemplates.map((template) => template.id).filter(Boolean));
  return [...nextTemplates, ...currentTemplates.filter((item) => !importedIds.has(item.id))];
}

export function removeGraphicsTemplateById(templates, recentTemplateIds, templateId) {
  const currentTemplates = Array.isArray(templates) ? templates : [];
  const currentRecentIds = Array.isArray(recentTemplateIds) ? recentTemplateIds : [];
  const template = currentTemplates.find((item) => item.id === templateId) ?? null;
  if (!template) {
    return {
      template: null,
      templates: [...currentTemplates],
      recentTemplateIds: [...currentRecentIds],
    };
  }
  return {
    template,
    templates: currentTemplates.filter((item) => item.id !== templateId),
    recentTemplateIds: currentRecentIds.filter((item) => item !== templateId),
  };
}

export function createGraphicsTemplateFromEntityVisual(options = {}) {
  const entityKey = String(options.entityKey ?? "").trim();
  if (!entityKey || !options.visual) {
    return null;
  }
  const entityLabel = String(options.entityLabel ?? entityKey).trim() || entityKey;
  const label =
    typeof options.label === "string" && options.label.trim()
      ? options.label.trim()
      : buildGraphicsTemplateDefaultLabel(entityLabel, options.templates, entityKey);
  const entityKind = typeof options.entityKind === "string" && options.entityKind.trim() ? options.entityKind.trim() : "";
  const createdAt = resolveNow(options.now);
  return normalizeGraphicsCustomTemplate(
    {
      id: buildCustomTemplateId(entityKey, label, createdAt),
      label,
      description: entityLabel,
      categoryKey: "graphics.templateCategory.custom",
      entityKinds: entityKind ? [entityKind] : [],
      originEntityKey: entityKey,
      updatedAt: createdAt,
      visual: options.visual,
    },
    Number(options.templateOffset ?? 0),
  );
}

export function applyGraphicsTemplateToEntityVisual(template, options = {}) {
  const entityKey = String(options.entityKey ?? "").trim();
  if (!entityKey || !template?.visual) {
    return null;
  }
  const currentVisual = options.currentVisual;
  const nextCanvasSize = Number(template.visual.canvasSize ?? currentVisual?.canvasSize ?? 24);
  const resolvedVisual = resolveGraphicsTemplateValue(template.visual, {
    canvasSize: nextCanvasSize,
    entityKey,
  });
  return {
    label: currentVisual?.label ?? String(options.entityLabel ?? entityKey),
    canvasSize: Number(resolvedVisual.canvasSize ?? nextCanvasSize),
    layers: Array.isArray(resolvedVisual.layers) ? resolvedVisual.layers : [],
  };
}

export function resolveGraphicsTemplateImportId(template, options = {}) {
  const selectedEntityKey = options.selectedEntityKey ?? "template";
  const desiredId =
    typeof template?.id === "string" && template.id.trim()
      ? template.id.trim()
      : buildCustomTemplateId(
          template?.originEntityKey ?? selectedEntityKey ?? "template",
          template?.label ?? "imported",
          resolveNow(options.now),
        );
  const builtinConflict = (Array.isArray(options.defaultTemplates) ? options.defaultTemplates : []).some((item) => item.id === desiredId);
  if (builtinConflict) {
    return `custom-import-${resolveNow(options.now).toString(36)}`;
  }
  return desiredId;
}

export function normalizeGraphicsTemplateImport(template, options = {}) {
  if (template?.kind && template.kind !== "graphics-template") {
    throw new Error("Unsupported template payload.");
  }
  if (!template || typeof template !== "object" || !template.visual || !Array.isArray(template.visual.layers)) {
    throw new Error("Missing visual.layers in template payload.");
  }
  const normalizedTemplate = normalizeGraphicsCustomTemplate(
    {
      ...template,
      id: resolveGraphicsTemplateImportId(template, options),
      updatedAt: resolveNow(options.now),
    },
    Number(options.templateOffset ?? 0),
  );
  if (!normalizedTemplate) {
    throw new Error("Template payload could not be normalized.");
  }
  return normalizedTemplate;
}

export function normalizeGraphicsTemplateLibraryImport(payload, options = {}) {
  const templates = Array.isArray(payload?.templates) ? payload.templates : [];
  if (templates.length === 0) {
    throw new Error("Template library payload is empty.");
  }
  const templateOffset = Number(options.templateOffset ?? 0);
  const importedAt = resolveNow(options.now);
  const normalizedTemplates = templates
    .map((template, index) =>
      normalizeGraphicsCustomTemplate(
        {
          ...template,
          id: resolveGraphicsTemplateImportId(template, options),
          updatedAt: importedAt + index,
        },
        templateOffset + index,
      ),
    )
    .filter(Boolean);
  if (normalizedTemplates.length === 0) {
    throw new Error("Template library payload could not be normalized.");
  }
  return normalizedTemplates;
}

export function buildGraphicsTemplateDefaultLabel(entityLabel, templates, entityKey) {
  const similarCount =
    (Array.isArray(templates) ? templates : []).filter((template) => template.originEntityKey === entityKey).length + 1;
  return `${entityLabel} // ${String(similarCount).padStart(2, "0")}`;
}

export function getGroupedGraphicsTemplates(templates, filterState, entityKind, translate = (key) => key) {
  const filteredTemplates = getFilteredGraphicsTemplates(templates, filterState, entityKind);
  const sortedTemplates = getSortedGraphicsTemplates(filteredTemplates, entityKind, translate);
  const normalizedFilter = normalizeGraphicsTemplateFilterForAvailableCategories(templates, filterState, entityKind);
  const showRecommendedGroup = normalizedFilter.mode !== "fit" && normalizedFilter.category === "all";
  const recommended = showRecommendedGroup
    ? sortedTemplates.filter((template) => isGraphicsTemplateRecommended(template, entityKind))
    : [];
  const remaining = showRecommendedGroup
    ? sortedTemplates.filter((template) => !isGraphicsTemplateRecommended(template, entityKind))
    : sortedTemplates;
  const groups = [];
  if (recommended.length > 0) {
    groups.push({
      id: "recommended",
      label: translate("graphics.templateGroup.recommended"),
      templates: recommended,
    });
  }

  const grouped = new Map();
  for (const template of remaining) {
    const groupId = getGraphicsTemplateGroupId(template);
    if (!grouped.has(groupId)) {
      grouped.set(groupId, []);
    }
    grouped.get(groupId).push(template);
  }

  for (const groupId of getGraphicsTemplateGroupOrder()) {
    const bucket = grouped.get(groupId);
    if (!bucket?.length) {
      continue;
    }
    groups.push({
      id: groupId,
      label: getGraphicsTemplateGroupLabel(groupId, translate),
      templates: bucket,
    });
  }

  for (const [groupId, bucket] of grouped.entries()) {
    if (!bucket?.length || groups.some((group) => group.id === groupId)) {
      continue;
    }
    groups.push({
      id: groupId,
      label: getGraphicsTemplateGroupLabel(groupId, translate),
      templates: bucket,
    });
  }

  return groups;
}

export function getSortedGraphicsTemplates(templates, entityKind, translate = (key) => key) {
  return [...(Array.isArray(templates) ? templates : [])].sort((left, right) => {
    const leftRecommended = isGraphicsTemplateRecommended(left, entityKind) ? 0 : 1;
    const rightRecommended = isGraphicsTemplateRecommended(right, entityKind) ? 0 : 1;
    if (leftRecommended !== rightRecommended) {
      return leftRecommended - rightRecommended;
    }
    const leftSource = getGraphicsTemplateSource(left) === "custom" ? 0 : 1;
    const rightSource = getGraphicsTemplateSource(right) === "custom" ? 0 : 1;
    if (leftSource !== rightSource) {
      return leftSource - rightSource;
    }
    if (leftSource === 0 && rightSource === 0) {
      const leftUpdated = Number(left.updatedAt ?? 0);
      const rightUpdated = Number(right.updatedAt ?? 0);
      if (leftUpdated !== rightUpdated) {
        return rightUpdated - leftUpdated;
      }
    }
    const leftCategory = getGraphicsTemplateCategory(left, translate).toUpperCase();
    const rightCategory = getGraphicsTemplateCategory(right, translate).toUpperCase();
    if (leftCategory !== rightCategory) {
      return leftCategory.localeCompare(rightCategory);
    }
    return getGraphicsTemplateLabel(left, translate).localeCompare(getGraphicsTemplateLabel(right, translate));
  });
}

export function getFilteredGraphicsTemplates(templates, filterState, entityKind) {
  const normalizedFilter = normalizeGraphicsTemplateFilterForAvailableCategories(templates, filterState, entityKind);
  let filteredTemplates = getTemplatesForFilterMode(templates, normalizedFilter, entityKind);
  if (normalizedFilter.category !== "all") {
    filteredTemplates = filteredTemplates.filter((template) => getGraphicsTemplateGroupId(template) === normalizedFilter.category);
  }
  return filteredTemplates;
}

export function getTemplatesForFilterMode(templates, filterState, entityKind) {
  const allTemplates = Array.isArray(templates) ? templates : [];
  if (filterState?.mode === "fit") {
    return allTemplates.filter((template) => isGraphicsTemplateRecommended(template, entityKind));
  }
  return allTemplates;
}

export function buildGraphicsTemplateModeOptions(filterState, translate = (key) => key) {
  return [
    {
      kind: "mode",
      value: "all",
      label: translate("graphics.templateFilter.all"),
      active: filterState?.mode !== "fit",
    },
    {
      kind: "mode",
      value: "fit",
      label: translate("graphics.templateFilter.fit"),
      active: filterState?.mode === "fit",
    },
  ];
}

export function buildGraphicsTemplateCategoryOptions(templates, filterState, entityKind, translate = (key) => key) {
  const normalizedFilter = normalizeGraphicsTemplateFilterForAvailableCategories(templates, filterState, entityKind);
  const categories = getAvailableGraphicsTemplateCategories(templates, normalizedFilter, entityKind);
  return [
    {
      kind: "category",
      value: "all",
      label: translate("graphics.templateFilter.categoryAll"),
      active: normalizedFilter.category === "all",
    },
    ...categories.map((category) => ({
      kind: "category",
      value: category,
      label: getGraphicsTemplateGroupLabel(category, translate),
      active: normalizedFilter.category === category,
    })),
  ];
}

export function buildGraphicsTemplateFilterRowModel(options, hasSelectedEntity = true) {
  const items = Array.isArray(options) ? options : [];
  return {
    hidden: !hasSelectedEntity || items.length === 0,
    items,
  };
}

export function applyGraphicsTemplateFilterSelection(filterState, filterKind, filterValue) {
  const current = normalizeGraphicsTemplateFilterState(filterState);
  if (filterKind === "mode") {
    const next = {
      ...current,
      mode: filterValue === "fit" ? "fit" : "all",
    };
    return {
      handled: true,
      changed: next.mode !== current.mode || next.category !== current.category,
      filterState: next,
    };
  }
  if (filterKind === "category") {
    const next = {
      ...current,
      category: filterValue || "all",
    };
    return {
      handled: true,
      changed: next.mode !== current.mode || next.category !== current.category,
      filterState: next,
    };
  }
  return {
    handled: false,
    changed: false,
    filterState: current,
  };
}

export function buildGraphicsTemplateCardModel(template, entityKind, translate = (key) => key) {
  const recommended = isGraphicsTemplateRecommended(template, entityKind);
  const category = getGraphicsTemplateCategory(template, translate);
  return {
    id: template?.id ?? "",
    source: getGraphicsTemplateSource(template),
    recommended,
    title: getGraphicsTemplateDescription(template, translate),
    label: getGraphicsTemplateLabel(template, translate),
    metaText: [recommended ? translate("graphics.templateRecommended") : "", category].filter(Boolean).join(" // "),
    actions: buildGraphicsTemplateCardActions(template, translate),
  };
}

export function buildGraphicsTemplateCardActions(template, translate = (key) => key) {
  const templateId = template?.id ?? "";
  const exportLabel = translate("graphics.exportTemplate");
  const actions = [
    {
      action: "export",
      templateId,
      label: exportLabel,
      title: exportLabel,
    },
  ];
  if (isCustomGraphicsTemplate(template)) {
    const deleteLabel = translate("graphics.deleteTemplate");
    actions.push({
      action: "delete",
      templateId,
      label: deleteLabel,
      title: deleteLabel,
    });
  }
  return actions;
}

export function buildGraphicsTemplateLibraryModel(templateGroups, hasSelectedEntity = true) {
  const groups = Array.isArray(templateGroups) ? templateGroups : [];
  return {
    hidden: !hasSelectedEntity,
    empty: Boolean(hasSelectedEntity && groups.length === 0),
    groups,
  };
}

export function buildGraphicsRecentTemplateStripModel(templates, hasSelectedEntity = true) {
  const items = Array.isArray(templates) ? templates : [];
  return {
    hidden: !hasSelectedEntity || items.length === 0,
    templates: items,
  };
}

export function normalizeGraphicsTemplateFilterForAvailableCategories(templates, filterState, entityKind) {
  const mode = filterState?.mode === "fit" ? "fit" : "all";
  const category = typeof filterState?.category === "string" && filterState.category.trim() ? filterState.category.trim() : "all";
  const categories = getAvailableGraphicsTemplateCategories(templates, { mode, category: "all" }, entityKind);
  return {
    mode,
    category: category !== "all" && !categories.includes(category) ? "all" : category,
  };
}

export function getAvailableGraphicsTemplateCategories(templates, filterState, entityKind) {
  const categories = new Set(getTemplatesForFilterMode(templates, filterState, entityKind).map((template) => getGraphicsTemplateGroupId(template)));
  const ordered = [];
  for (const groupId of getGraphicsTemplateGroupOrder()) {
    if (groupId !== "other" && categories.has(groupId)) {
      ordered.push(groupId);
      categories.delete(groupId);
    }
  }
  for (const groupId of categories) {
    ordered.push(groupId);
  }
  return ordered;
}

function resolveNow(now) {
  return typeof now === "function" ? now() : Number(now ?? Date.now());
}
