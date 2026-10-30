import type { DetectedUiChange, LiveSnapshot } from "./types.js";

function normalizedSet(values: string[]): Set<string> {
  return new Set(values.map((value) => value.trim()).filter(Boolean));
}

export function detectUiChange(before: LiveSnapshot, after: LiveSnapshot): DetectedUiChange {
  const beforeTexts = normalizedSet(before.visibleTexts);

  const afterTexts = normalizedSet(after.visibleTexts);

  const addedTexts = [...afterTexts].filter((value) => !beforeTexts.has(value));

  const removedTexts = [...beforeTexts].filter((value) => !afterTexts.has(value));

  return {
    type: "ui-change",

    addedTexts,
    removedTexts,

    fromScreen: before.screen,

    toScreen: after.screen,
  };
}

export function screenChanged(before: LiveSnapshot, after: LiveSnapshot): boolean {
  return before.screen.fingerprint !== after.screen.fingerprint;
}
