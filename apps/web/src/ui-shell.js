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

function isCollapsed(value) {
  return value === true || value === "true";
}
