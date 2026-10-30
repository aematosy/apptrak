import type { AndroidDisplayInfo } from "./android-display-info.js";
import type { AndroidTouchscreenInfo } from "./android-touchscreen-discovery.js";

export interface ScreenPoint {
  x: number;
  y: number;
}

function normalizeAxis(value: number, min: number, max: number, screenSize: number): number {
  if (max <= min) {
    return 0;
  }

  const normalized = (value - min) / (max - min);

  const bounded = Math.max(0, Math.min(1, normalized));

  return Math.round(bounded * Math.max(0, screenSize - 1));
}

export function mapRawTouchToScreen(
  rawX: number,
  rawY: number,
  touchscreen: AndroidTouchscreenInfo,
  display: AndroidDisplayInfo,
): ScreenPoint {
  return {
    x: normalizeAxis(rawX, touchscreen.x.min, touchscreen.x.max, display.width),

    y: normalizeAxis(rawY, touchscreen.y.min, touchscreen.y.max, display.height),
  };
}
