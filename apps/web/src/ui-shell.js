const arrowRight = "\u25b6";
const arrowLeft = "\u25c0";

export function buildSidebarToggleDisplay(state = {}) {
  return {
    objectivesLabel: isCollapsed(state.objectivesCollapsed) ? arrowRight : arrowLeft,
    rightLabel: isCollapsed(state.rightCollapsed) ? arrowLeft : arrowRight,
  };
}

export function toggleCollapsedState(value) {
  return isCollapsed(value) ? "false" : "true";
}

export function buildDrawerToggleState(kind, state = {}) {
  const isSettings = kind === "settings";
  const settingsOpen = isSettings && !isOpen(state.settingsOpen);
  const devOpen = !isSettings && !isOpen(state.devOpen);
  return {
    settingsOpen: String(settingsOpen),
    devOpen: String(devOpen),
    closeStudio: !devOpen,
  };
}

export function buildGraphicsStudioOpenState(isStudioOpen) {
  const studioOpen = Boolean(isStudioOpen);
  return {
    devOpen: "true",
    studioOpen: String(studioOpen),
    bodyGraphicsStudio: String(studioOpen),
  };
}

export function buildGraphicsStudioButtonModel(studioOpen) {
  const active = isOpen(studioOpen);
  return {
    labelKey: active ? "graphics.closeStudio" : "graphics.openStudio",
    active: String(active),
  };
}

function isCollapsed(value) {
  return value === true || value === "true";
}

function isOpen(value) {
  return value === true || value === "true";
}
