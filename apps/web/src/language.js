export function normalizeLanguageMode(mode) {
  return mode === "auto" || mode === "en" || mode === "zh" ? mode : "auto";
}

export function nextLanguageMode(mode) {
  return mode === "auto" ? "en" : mode === "en" ? "zh" : "auto";
}

export function resolveLanguage(mode, languages = []) {
  const normalizedMode = normalizeLanguageMode(mode);
  if (normalizedMode === "en" || normalizedMode === "zh") {
    return normalizedMode;
  }
  const preferredLanguages = Array.isArray(languages) ? languages : [languages];
  return preferredLanguages.some((item) => String(item ?? "").toLowerCase().startsWith("zh")) ? "zh" : "en";
}
