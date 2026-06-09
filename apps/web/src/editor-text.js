export function tokenRangeAtOffset(text, offset) {
  const source = String(text ?? "");
  const safeOffset = clampOffset(offset, source.length);
  const before = source.slice(0, safeOffset);
  const left = before.search(/[@A-Za-z0-9_]*$/);
  const start = left < 0 ? safeOffset : left;
  const right = source.slice(safeOffset).match(/^[@A-Za-z0-9_]*/)?.[0].length ?? 0;
  return {
    start,
    end: safeOffset + right,
    token: source.slice(start, safeOffset + right),
  };
}

export function tokenAtOffset(text, offset) {
  const range = tokenRangeAtOffset(text, offset);
  return /^@[A-Za-z][A-Za-z0-9_]*$/.test(range.token) ? range.token : "";
}

export function collectLabelDefinitions(source) {
  const definitions = new Map();
  String(source ?? "").split("\n").forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(/^@([A-Za-z][A-Za-z0-9_]*)$/);
    if (match && !definitions.has(match[1])) {
      definitions.set(match[1], index + 1);
    }
  });
  return definitions;
}

export function createLabelEntries(definitions = new Map()) {
  return [...definitions.entries()]
    .map(([label, line]) => ({ label, line }))
    .sort((left, right) => left.line - right.line || left.label.localeCompare(right.label));
}

export function createLabelNames(definitions = new Map()) {
  return createLabelEntries(definitions).map((entry) => entry.label);
}

export function findLabelLine(source, label) {
  return collectLabelDefinitions(source).get(String(label ?? "")) ?? 0;
}

export function lineSelectionRange(source, lineNumber) {
  const lines = String(source ?? "").split("\n");
  const numericLine = Number.isFinite(Number(lineNumber)) ? Math.trunc(Number(lineNumber)) : 1;
  const line = Math.min(Math.max(numericLine, 1), lines.length);
  const start = lines.slice(0, line - 1).reduce((total, currentLine) => total + currentLine.length + 1, 0);
  const end = start + lines[line - 1].length;
  return { line, start, end };
}

function clampOffset(offset, length) {
  const numericOffset = Number.isFinite(offset) ? offset : 0;
  return Math.max(0, Math.min(numericOffset, length));
}
