import { mapRawTouchToScreen } from "./android-coordinate-mapper.js";
import type { AndroidDisplayInfo } from "./android-display-info.js";
import type { AndroidTouchGesture } from "./android-touch-parser.js";
import type { AndroidTouchscreenInfo } from "./android-touchscreen-discovery.js";

export type AndroidGestureType = "tap" | "scroll";

export interface ClassifiedAndroidGesture {
  type: AndroidGestureType;

  start: {
    x: number;
    y: number;
  };

  end: {
    x: number;
    y: number;
  };

  durationMs: number;
}

export function classifyAndroidGesture(
  gesture: AndroidTouchGesture,
  touchscreen: AndroidTouchscreenInfo,
  display: AndroidDisplayInfo,
): ClassifiedAndroidGesture {
  const start = mapRawTouchToScreen(gesture.start.x, gesture.start.y, touchscreen, display);

  const end = mapRawTouchToScreen(gesture.end.x, gesture.end.y, touchscreen, display);

  const distance = Math.hypot(end.x - start.x, end.y - start.y);

  const referenceSize = Math.min(display.width, display.height);

  /*
   * El umbral escala con el dispositivo.
   * No usamos una cantidad fija de píxeles.
   */
  const movementThreshold = referenceSize * 0.02;

  return {
    type: distance <= movementThreshold ? "tap" : "scroll",

    start,
    end,

    durationMs: Math.max(0, gesture.endedAt - gesture.startedAt),
  };
}
