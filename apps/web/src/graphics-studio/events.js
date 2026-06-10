import { buildGraphicsEntityListClickActionModel } from "./entity-visuals.js";
import { buildGraphicsFormFieldEditActionModel } from "./form-schema.js";
import { buildShapePresetClickActionModel, buildVisualLayerClickActionModel } from "./layers.js";
import {
  buildGraphicsTemplateClickActionModel,
  buildGraphicsTemplateFilterClickActionModel,
  buildGraphicsTemplateNameSubmitActionModel,
} from "./template-library.js";
import { buildGraphicsTemplateActionState } from "./templates.js";
import { buildGraphicsSwatchClickActionModel } from "./swatches.js";

export function bindGraphicsStudioEvents(elements, handlers = {}) {
  if (!elements?.graphicsEntityList) {
    return;
  }

  elements.graphicsEntityList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-entity-key]");
    handlers.onEntityAction?.(
      buildGraphicsEntityListClickActionModel({
        entityKey: button?.dataset.entityKey ?? "",
      }),
    );
  });

  elements.graphicsLayerList?.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-layer-action][data-layer-id]");
    const layerButton = actionButton ? null : event.target.closest("[data-layer-id]");
    handlers.onLayerAction?.(
      buildVisualLayerClickActionModel({
        layerAction: actionButton?.dataset.layerAction ?? "",
        layerId: actionButton?.dataset.layerId ?? "",
        rowLayerId: layerButton?.dataset.layerId ?? "",
      }),
    );
  });

  elements.graphicsAddShapeButton?.addEventListener("click", () => {
    handlers.onAddLayer?.("shape");
  });

  elements.graphicsAddGlyphButton?.addEventListener("click", () => {
    handlers.onAddLayer?.("glyph");
  });

  elements.graphicsDuplicateLayerButton?.addEventListener("click", () => {
    handlers.onDuplicateLayer?.();
  });

  elements.graphicsMoveLayerUpButton?.addEventListener("click", () => {
    handlers.onMoveLayer?.(-1);
  });

  elements.graphicsMoveLayerDownButton?.addEventListener("click", () => {
    handlers.onMoveLayer?.(1);
  });

  elements.graphicsStudioButton?.addEventListener("click", () => {
    handlers.onToggleStudio?.();
  });

  elements.graphicsExportEntityButton?.addEventListener("click", () => {
    handlers.onExportEntity?.();
  });

  elements.graphicsImportEntityButton?.addEventListener("click", () => {
    handlers.onImportEntity?.(elements.graphicsEntityIo?.value ?? "");
  });

  elements.graphicsDeleteLayerButton?.addEventListener("click", () => {
    handlers.onDeleteLayer?.();
  });

  elements.graphicsResetButton?.addEventListener("click", () => {
    handlers.onReset?.();
  });

  elements.graphicsCopyButton?.addEventListener("click", () => {
    handlers.onCopy?.();
  });

  const handleFormEdit = (event) => {
    const input = event.target.closest("[data-field]");
    handlers.onFormFieldEdit?.(
      buildGraphicsFormFieldEditActionModel({
        scope: input?.dataset.scope ?? "layer",
        field: input?.dataset.field ?? "",
        valueType: input?.dataset.valueType ?? "string",
        rawValue: input?.value ?? "",
      }),
    );
  };

  elements.graphicsForm?.addEventListener("input", handleFormEdit);
  elements.graphicsForm?.addEventListener("change", handleFormEdit);

  elements.graphicsPresets?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    handlers.onShapePresetAction?.(
      buildShapePresetClickActionModel({
        presetId: button?.dataset.preset ?? "",
      }),
    );
  });

  const handleTemplateAction = (event) => {
    const actionButton = event.target.closest("[data-template-action][data-template-id]");
    const templateButton = actionButton ? null : event.target.closest("[data-template]");
    handlers.onTemplateAction?.(
      buildGraphicsTemplateClickActionModel({
        templateAction: actionButton?.dataset.templateAction ?? "",
        templateId: actionButton?.dataset.templateId ?? "",
        cardTemplateId: templateButton?.dataset.template ?? "",
      }),
    );
  };

  elements.graphicsTemplates?.addEventListener("click", handleTemplateAction);
  elements.graphicsRecentTemplates?.addEventListener("click", handleTemplateAction);

  const handleTemplateFilter = (event) => {
    const button = event.target.closest("[data-filter-kind][data-filter-value]");
    handlers.onTemplateFilterAction?.(
      buildGraphicsTemplateFilterClickActionModel({
        filterKind: button?.dataset.filterKind ?? "",
        filterValue: button?.dataset.filterValue ?? "all",
      }),
    );
  };

  elements.graphicsTemplateModeFilters?.addEventListener("click", handleTemplateFilter);
  elements.graphicsTemplateCategoryFilters?.addEventListener("click", handleTemplateFilter);

  elements.graphicsSaveTemplateButton?.addEventListener("click", () => {
    handlers.onSaveTemplate?.();
  });

  elements.graphicsImportTemplateButton?.addEventListener("click", () => {
    handlers.onImportTemplate?.(elements.graphicsEntityIo?.value ?? "");
  });

  elements.graphicsExportLibraryButton?.addEventListener("click", () => {
    handlers.onExportTemplateLibrary?.();
  });

  elements.graphicsEntityIo?.addEventListener("input", () => {
    if (elements.graphicsImportTemplateButton) {
      elements.graphicsImportTemplateButton.disabled = buildGraphicsTemplateActionState({
        ioValue: elements.graphicsEntityIo?.value,
      }).importDisabled;
    }
  });

  elements.graphicsTemplateName?.addEventListener("keydown", (event) => {
    const keyAction = buildGraphicsTemplateNameSubmitActionModel({ key: event.key });
    if (!keyAction.handled) {
      return;
    }
    event.preventDefault();
    handlers.onTemplateNameSubmit?.();
  });

  const handleSwatchAction = (event) => {
    const button = event.target.closest("[data-swatch-kind]");
    handlers.onSwatchAction?.(
      buildGraphicsSwatchClickActionModel({
        swatchKind: button?.dataset.swatchKind ?? "",
        swatchValue: button?.dataset.swatchValue ?? "",
      }),
    );
  };

  elements.graphicsFillSwatches?.addEventListener("click", handleSwatchAction);
  elements.graphicsTextureSwatches?.addEventListener("click", handleSwatchAction);
}
