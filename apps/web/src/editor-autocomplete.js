export function matchesCompletion(value, prefix) {
  if (!prefix) {
    return true;
  }
  const text = String(value ?? "");
  const normalizedValue = text.toLowerCase();
  const normalizedPrefix = String(prefix ?? "").toLowerCase().replace(/^@/, "");
  if (normalizedValue.startsWith(normalizedPrefix)) {
    return true;
  }
  return splitCompletionSegments(text).some((segment) =>
    segment.toLowerCase().startsWith(normalizedPrefix),
  );
}

export function splitCompletionSegments(value) {
  return (String(value ?? "").match(/[A-Za-z][A-Za-z0-9_]*/g) ?? [])
    .flatMap((segment) => segment.split(/(?=[A-Z])|_/))
    .filter(Boolean);
}

export function createAutocompleteSuggestions(items) {
  return items.map((item) => {
    const value = String(item.value ?? "");
    const label = item.label === undefined ? value : String(item.label);
    return {
      ...item,
      value,
      label,
      matchText: String(item.matchText ?? label ?? value),
    };
  });
}

export function dedupeSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.value}::${item.kindKey}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildAutocompleteDisplayModel(suggestions = [], activeIndex = 0, translate = (key) => key) {
  const items = (Array.isArray(suggestions) ? suggestions : []).map((suggestion, index) => ({
    index,
    active: index === activeIndex,
    label: String(suggestion.label ?? suggestion.value ?? ""),
    hint: autocompleteHintText(suggestion, translate),
  }));
  return {
    items,
    footerText: "[TAB] Accept   [ESC] Close",
  };
}

export function buildAutocompletePositionModel(context = {}, editorMetrics = {}) {
  const lineHeight = Number.parseFloat(editorMetrics.lineHeight) || 20;
  const fontSize = Number.parseFloat(editorMetrics.fontSize) || 14;
  const columnWidth = fontSize * (editorMetrics.columnWidthRatio ?? 0.62);
  const paddingLeft = Number.parseFloat(editorMetrics.paddingLeft) || 0;
  const paddingTop = Number.parseFloat(editorMetrics.paddingTop) || 0;
  const scrollLeft = Number(editorMetrics.scrollLeft) || 0;
  const scrollTop = Number(editorMetrics.scrollTop) || 0;
  const clientWidth = Number(editorMetrics.clientWidth) || 0;
  const menuWidth = Number(editorMetrics.menuWidth) || 196;
  const margin = Number(editorMetrics.margin) || 8;
  const verticalOffset = Number(editorMetrics.verticalOffset) || 4;
  const rawLeft = paddingLeft + (Number(context.column) || 0) * columnWidth - scrollLeft;
  const rawTop = paddingTop + (Number(context.lineNumber) || 0) * lineHeight - scrollTop + verticalOffset;
  return {
    left: Math.max(margin, Math.min(rawLeft, clientWidth - menuWidth)),
    top: Math.max(margin, rawTop),
  };
}

export function predicateCallSnippet(predicate) {
  return `${predicate}()`;
}

export function predicateSnippetMeta(predicate) {
  if (["Has", "Is", "Below", "Above", "BelowCost"].includes(predicate)) {
    const inside = predicate.length + 1;
    return {
      selectionStartOffset: inside,
      selectionEndOffset: inside,
      triggerAutocomplete: true,
      requiresQueryValue: true,
    };
  }
  if (["Any", "IsFull", "IsEmpty"].includes(predicate)) {
    return {
      completesQueryImmediately: true,
    };
  }
  return {};
}

export function actionInsertSnippet(action) {
  if (action === "Move") {
    return "Move()";
  }
  if (action === "MoveToward") {
    return "MoveToward(Home)";
  }
  if (action === "Turn") {
    return "Turn()";
  }
  if (["PickUp", "Drop", "Fire", "Wait", "Repair"].includes(action)) {
    return `${action}()`;
  }
  if (action === "Unload" || action === "Craft") {
    return `${action}(Home)`;
  }
  return `${action}()`;
}

export function actionSnippetMeta(action) {
  if (action === "Move" || action === "Turn") {
    const inside = action.length + 1;
    return {
      selectionStartOffset: inside,
      selectionEndOffset: inside,
      triggerAutocomplete: true,
    };
  }
  return {};
}

export function createActionKeywordSuggestions(actions) {
  return createAutocompleteSuggestions([
    {
      value: "Goto @",
      label: "Goto",
      kindKey: "completion.kind.branch",
      hintKey: "completion.goto.loop",
      selectionStartOffset: 6,
      selectionEndOffset: 6,
      triggerAutocomplete: true,
    },
    ...actions.map((action) => ({
      value: actionInsertSnippet(action),
      label: actionInsertSnippet(action),
      kindKey: "completion.kind.action",
      hintKey: "completion.hint.action",
      matchText: action,
      ...actionSnippetMeta(action),
    })),
  ]);
}

function autocompleteHintText(suggestion, translate) {
  const kind = translate(suggestion.kindKey);
  const hint = suggestion.hintText ?? translate(suggestion.hintKey);
  return `${kind} / ${hint}`;
}
