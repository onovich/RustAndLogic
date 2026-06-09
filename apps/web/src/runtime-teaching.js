import { buildTeachingMomentKey } from "./stages.js";

export function selectSuccessTeachingMoment(stage, moments, flowBefore = {}, flowAfter = {}, seenKeys = new Set()) {
  if (!stage?.id) {
    return null;
  }
  for (const moment of moments ?? []) {
    const key = buildTeachingMomentKey(stage.id, "success", moment.id);
    if (seenKeys.has(key)) {
      continue;
    }
    if (!flowBefore[moment.taskId] && flowAfter[moment.taskId]) {
      return { key, moment };
    }
  }
  return null;
}

export function selectFailureTeachingMoment(stage, moments, cause, seenKeys = new Set()) {
  if (!stage?.id) {
    return null;
  }
  for (const moment of moments ?? []) {
    const key = buildTeachingMomentKey(stage.id, "failure", moment.id);
    if (seenKeys.has(key) || moment.cause !== cause) {
      continue;
    }
    return { key, moment };
  }
  return null;
}

export function formatTeachingMomentDisplay(moment = {}, translate = identityTranslate) {
  return {
    title: moment.titleKey ? translate(moment.titleKey) : "",
    body: moment.bodyKey ? translate(moment.bodyKey) : "",
  };
}

function identityTranslate(key) {
  return key;
}
