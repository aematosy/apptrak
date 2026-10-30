export interface AndroidRawTouchPoint {
  x: number;
  y: number;
}

export interface AndroidTouchGesture {
  startedAt: number;
  endedAt: number;

  start: AndroidRawTouchPoint;
  end: AndroidRawTouchPoint;

  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface AndroidTouchParserOptions {
  touchscreenPath: string;
  now?: () => number;
}

const EVENT_ABS = "0003";
const EVENT_KEY = "0001";

const ABS_MT_POSITION_X = "0035";
const ABS_MT_POSITION_Y = "0036";
const ABS_MT_TRACKING_ID = "0039";

const BTN_TOUCH = "014a";

function hexToSignedInt32(value: string): number {
  const unsigned = Number.parseInt(value, 16) >>> 0;

  return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned;
}

export class AndroidTouchParser {
  private readonly touchscreenPath: string;
  private readonly now: () => number;

  private active = false;
  private startedAt = 0;

  private currentX?: number;
  private currentY?: number;

  private startX?: number;
  private startY?: number;

  private minX?: number;
  private maxX?: number;
  private minY?: number;
  private maxY?: number;

  constructor(options: AndroidTouchParserOptions) {
    this.touchscreenPath = options.touchscreenPath;

    this.now = options.now ?? (() => Date.now());
  }

  push(line: string): AndroidTouchGesture | null {
    const trimmed = line.trim();

    const prefixed = trimmed.match(
      /^(\/dev\/input\/\S+):\s+([0-9a-fA-F]{4})\s+([0-9a-fA-F]{4})\s+([0-9a-fA-F]{8})$/,
    );

    const direct = trimmed.match(/^([0-9a-fA-F]{4})\s+([0-9a-fA-F]{4})\s+([0-9a-fA-F]{8})$/);

    if (!prefixed && !direct) {
      return null;
    }

    if (prefixed && prefixed[1] !== this.touchscreenPath) {
      return null;
    }

    const type = (prefixed?.[2] ?? direct?.[1] ?? "").toLowerCase();

    const code = (prefixed?.[3] ?? direct?.[2] ?? "").toLowerCase();

    const rawValue = (prefixed?.[4] ?? direct?.[3] ?? "").toLowerCase();

    const value = hexToSignedInt32(rawValue);

    if (type === EVENT_ABS && code === ABS_MT_TRACKING_ID) {
      if (value >= 0) {
        this.beginGesture();
        return null;
      }

      return this.finishGesture();
    }

    if (type === EVENT_KEY && code === BTN_TOUCH) {
      if (value === 1) {
        if (!this.active) {
          this.beginGesture();
        }

        return null;
      }

      if (value === 0 && this.active) {
        return this.finishGesture();
      }

      return null;
    }

    if (type === EVENT_ABS && code === ABS_MT_POSITION_X) {
      this.currentX = value;
      this.updateBounds();
      return null;
    }

    if (type === EVENT_ABS && code === ABS_MT_POSITION_Y) {
      this.currentY = value;
      this.updateBounds();
      return null;
    }

    return null;
  }

  private beginGesture(): void {
    this.active = true;
    this.startedAt = this.now();

    this.currentX = undefined;
    this.currentY = undefined;

    this.startX = undefined;
    this.startY = undefined;

    this.minX = undefined;
    this.maxX = undefined;
    this.minY = undefined;
    this.maxY = undefined;
  }

  private updateBounds(): void {
    if (!this.active || this.currentX === undefined || this.currentY === undefined) {
      return;
    }

    if (this.startX === undefined || this.startY === undefined) {
      this.startX = this.currentX;
      this.startY = this.currentY;
    }

    this.minX = this.minX === undefined ? this.currentX : Math.min(this.minX, this.currentX);

    this.maxX = this.maxX === undefined ? this.currentX : Math.max(this.maxX, this.currentX);

    this.minY = this.minY === undefined ? this.currentY : Math.min(this.minY, this.currentY);

    this.maxY = this.maxY === undefined ? this.currentY : Math.max(this.maxY, this.currentY);
  }

  private finishGesture(): AndroidTouchGesture | null {
    if (!this.active) {
      return null;
    }

    this.active = false;

    if (
      this.startX === undefined ||
      this.startY === undefined ||
      this.currentX === undefined ||
      this.currentY === undefined ||
      this.minX === undefined ||
      this.maxX === undefined ||
      this.minY === undefined ||
      this.maxY === undefined
    ) {
      return null;
    }

    return {
      startedAt: this.startedAt,
      endedAt: this.now(),

      start: {
        x: this.startX,
        y: this.startY,
      },

      end: {
        x: this.currentX,
        y: this.currentY,
      },

      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
    };
  }
}
