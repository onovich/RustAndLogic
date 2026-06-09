export function buildPlaybackControlModel(options = {}) {
  const playbackMode = options.playbackMode ?? "stopped";
  const storyActive = Boolean(options.storyActive);
  const speed = options.speed ?? 1;
  const stageEnabled = options.stageEnabled ?? {};
  return {
    editorLocked: storyActive || playbackMode !== "stopped",
    playLabelKey: playbackMode === "playing" ? "action.pause" : playbackMode === "paused" ? "action.resume" : "action.play",
    stepLabelKey: "action.frame",
    resetLabelKey: "action.stop",
    playDisabled: storyActive,
    stepDisabled: storyActive,
    speedDisabled: storyActive,
    speedLabel: `${speed}X`,
    playActive: playbackMode === "playing",
    speedActive: playbackMode !== "stopped",
    settingsActive: Boolean(options.settingsOpen),
    devlogActive: Boolean(options.devOpen),
    devlogLabelKey: options.devOpen ? "action.devLogOpen" : "action.devLogClosed",
    languageModeKey: `language.mode.${options.languageMode ?? "auto"}`,
    upgrades: {
      memory: buildUpgradeControlModel(stageEnabled.memory, storyActive),
      armor: buildUpgradeControlModel(stageEnabled.armor, storyActive),
      weapon: buildUpgradeControlModel(stageEnabled.weapon, storyActive),
    },
  };
}

export function getSpeedProfile(speeds, profiles, speedIndex) {
  const speed = speeds[speedIndex];
  return profiles[speed];
}

export function playbackScheduleDelay(profile) {
  return Math.max(profile.interval, profile.duration + 20);
}

function buildUpgradeControlModel(stageEnabled, storyActive) {
  const enabled = Boolean(stageEnabled);
  return {
    stageEnabled: enabled,
    disabled: storyActive || !enabled,
  };
}
