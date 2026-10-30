import type { RawInteraction } from "./interaction-source.js";
import type { LiveDetectedEvent, LiveElement, LiveSnapshot } from "./types.js";

function containsPoint(element: LiveElement, x: number, y: number): boolean {
  const { bounds } = element;

  return x >= bounds.x1 && x <= bounds.x2 && y >= bounds.y1 && y <= bounds.y2;
}

function elementArea(element: LiveElement): number {
  return Math.max(
    0,
    (element.bounds.x2 - element.bounds.x1) * (element.bounds.y2 - element.bounds.y1),
  );
}

function locatorScore(element: LiveElement): number {
  const quality = element.locator?.quality;

  if (quality === "estable") {
    return 40;
  }

  if (quality === "media") {
    return 25;
  }

  if (quality === "ancla") {
    return 10;
  }

  return 0;
}

function semanticScore(element: LiveElement): number {
  let score = 0;

  if (element.visible) {
    score += 50;
  }

  if (element.enabled) {
    score += 30;
  }

  if (element.clickable) {
    score += 60;
  }

  score += locatorScore(element);

  score += Math.min(element.depth ?? 0, 25);

  const area = elementArea(element);

  if (area > 0) {
    score += Math.min(30, Math.round(1_000_000 / area));
  }

  return score;
}

export function resolveTapElement(
  interaction: RawInteraction,
  snapshot: LiveSnapshot,
): LiveElement | null {
  if (interaction.type !== "tap" || !interaction.pointer) {
    return null;
  }

  const { x, y } = interaction.pointer;

  const candidates = snapshot.elements
    .filter(
      (element) =>
        element.visible && element.enabled && element.clickable && containsPoint(element, x, y),
    )
    .sort((a, b) => semanticScore(b) - semanticScore(a));

  return candidates[0] ?? null;
}

function resolveScrollDirection(
  interaction: RawInteraction,
): "up" | "down" | "left" | "right" | null {
  if (!interaction.pointer || !interaction.pointerEnd) {
    return null;
  }

  const deltaX = interaction.pointerEnd.x - interaction.pointer.x;

  const deltaY = interaction.pointerEnd.y - interaction.pointer.y;

  if (Math.abs(deltaY) >= Math.abs(deltaX)) {
    return deltaY < 0 ? "up" : "down";
  }

  return deltaX < 0 ? "left" : "right";
}

export function resolveInteraction(
  interaction: RawInteraction,
  before: LiveSnapshot,
  after: LiveSnapshot,
): LiveDetectedEvent | null {
  if (interaction.type === "tap") {
    const element = resolveTapElement(interaction, before);

    if (!element) {
      return null;
    }

    return {
      type: "tap",
      element,
    };
  }

  if (interaction.type === "scroll") {
    const direction = resolveScrollDirection(interaction);

    if (!direction) {
      return null;
    }

    return {
      type: "scroll",
      direction,
    };
  }

  if (interaction.type === "back") {
    return {
      type: "back",
    };
  }

  if (interaction.type === "write") {
    const element = after.focusedElement ?? before.focusedElement;

    if (!element) {
      return null;
    }

    return {
      type: "write",
      element,
      value: interaction.value ?? "",
      sensitive: element.sensitive,
    };
  }

  return null;
}
