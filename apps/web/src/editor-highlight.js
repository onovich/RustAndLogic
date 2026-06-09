export function buildScriptHighlightModel(source, errors = [], options = {}) {
  const lines = String(source ?? "").split("\n");
  const errorLines = new Set(
    (Array.isArray(errors) ? errors : [])
      .filter((error) => error.line > 0)
      .map((error) => error.line),
  );
  return {
    lineNumbers: lines.map((_, index) => String(index + 1).padStart(2, "0")).join("\n"),
    html: lines
      .map((line, index) => {
        const className = errorLines.has(index + 1) ? "code-line has-error" : "code-line";
        return `<span class="${className}">${highlightEditorLine(line, options) || " "}</span>`;
      })
      .join(""),
  };
}

export function classifyDiagnosticSeverity(message) {
  return /unreachable|unused|redundant/i.test(String(message ?? "")) ? "warning" : "error";
}

export function buildDiagnosticDisplayModel(errors = []) {
  const diagnostics = Array.isArray(errors) ? errors : [];
  return {
    invalid: diagnostics.length > 0,
    count: diagnostics.length,
    countKey: diagnostics.length === 1 ? "diagnostic.issueCount.one" : "diagnostic.issueCount.other",
    items: diagnostics.map((error) => {
      const line = Number(error.line) || 0;
      const severity = classifyDiagnosticSeverity(error.message);
      return {
        line,
        severity,
        severityKey: severity === "warning" ? "diagnostic.severity.warning" : "diagnostic.severity.error",
        locationKey: line > 0 ? "diagnostic.line" : "diagnostic.general",
        locationValues: line > 0 ? { line } : {},
        message: error.message,
        interactive: line > 0,
      };
    }),
  };
}

export function highlightEditorLine(line, options = {}) {
  const source = String(line ?? "");
  const commentStart = source.indexOf("//");
  const code = commentStart >= 0 ? source.slice(0, commentStart) : source;
  const comment = commentStart >= 0 ? source.slice(commentStart) : "";
  const pieces = [];
  const pattern = /(@[A-Za-z][A-Za-z0-9_]*|[A-Za-z][A-Za-z0-9_]*|\s+|.)/g;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    const token = match[0];
    if (/^\s+$/.test(token)) {
      pieces.push(escapeHtml(token));
    } else if (token.startsWith("@")) {
      pieces.push(renderHighlightedLabelToken(token, code, options));
    } else if (hasSyntaxToken(options.actions, token)) {
      pieces.push(`<span class="tok-action">${escapeHtml(token)}</span>`);
    } else if (hasSyntaxToken(options.queries, token)) {
      pieces.push(`<span class="tok-query">${escapeHtml(token)}</span>`);
    } else if (hasSyntaxToken(options.branches, token)) {
      pieces.push(`<span class="tok-branch">${escapeHtml(token)}</span>`);
    } else if (hasSyntaxToken(options.values, token)) {
      pieces.push(`<span class="tok-value">${escapeHtml(token)}</span>`);
    } else if (/^[A-Za-z]/.test(token)) {
      pieces.push(`<span class="tok-unknown">${escapeHtml(token)}</span>`);
    } else {
      pieces.push(escapeHtml(token));
    }
  }
  if (comment) {
    pieces.push(`<span class="tok-comment">${escapeHtml(comment)}</span>`);
  }
  return pieces.join("");
}

export function renderHighlightedLabelToken(token, code, options = {}) {
  const labelName = String(token ?? "").slice(1);
  const source = String(code ?? "");
  if (source.trimStart().startsWith(token)) {
    return `<span class="tok-label tok-label-def">${escapeHtml(token)}</span>`;
  }
  if (options.labelDefinitions?.has(labelName)) {
    const line = options.labelDefinitions.get(labelName);
    const labelTitle = options.labelTitle ? options.labelTitle(line) : "";
    const title = labelTitle ? ` title="${escapeHtml(labelTitle)}"` : "";
    return `<span class="tok-label tok-label-ref"${title}>${escapeHtml(token)}</span>`;
  }
  return `<span class="tok-label tok-label-missing">${escapeHtml(token)}</span>`;
}

function hasSyntaxToken(tokens, token) {
  if (tokens?.has?.(token)) {
    return true;
  }
  return Array.isArray(tokens) && tokens.includes(token);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
