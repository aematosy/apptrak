import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { type Interface, createInterface } from "node:readline";

import type {
  InteractionSource,
  RawInteraction,
  RawInteractionHandler,
} from "../interaction-source.js";
import { type AndroidDisplayInfo, getAndroidDisplayInfo } from "./android-display-info.js";
import { classifyAndroidGesture } from "./android-gesture-classifier.js";
import { AndroidTouchParser } from "./android-touch-parser.js";
import {
  type AndroidTouchscreenInfo,
  discoverAndroidTouchscreen,
} from "./android-touchscreen-discovery.js";

export interface AndroidInteractionSourceOptions {
  serial: string;
}

export class AndroidInteractionSource implements InteractionSource {
  readonly platform = "android" as const;

  private readonly serial: string;

  private running = false;

  private process: ChildProcessWithoutNullStreams | null = null;

  private reader: Interface | null = null;

  private touchscreen: AndroidTouchscreenInfo | null = null;

  private display: AndroidDisplayInfo | null = null;

  constructor(options: AndroidInteractionSourceOptions) {
    this.serial = options.serial;
  }

  async start(handler: RawInteractionHandler): Promise<void> {
    if (this.running) {
      return;
    }

    const touchscreen = await discoverAndroidTouchscreen(this.serial);

    const display = await getAndroidDisplayInfo(this.serial);

    this.touchscreen = touchscreen;

    this.display = display;

    const parser = new AndroidTouchParser({
      touchscreenPath: touchscreen.path,
    });

    const child = spawn("adb", ["-s", this.serial, "shell", "getevent", touchscreen.path], {
      stdio: "pipe",
    });

    this.process = child;

    const reader = createInterface({
      input: child.stdout,
      crlfDelay: Number.POSITIVE_INFINITY,
    });

    this.reader = reader;

    this.running = true;

    reader.on("line", (line) => {
      const gesture = parser.push(line);

      if (!gesture) {
        return;
      }

      const classified = classifyAndroidGesture(gesture, touchscreen, display);

      const interaction: RawInteraction = {
        type: classified.type,

        platform: "android",

        timestamp: gesture.endedAt,

        pointer: classified.start,

        pointerEnd: classified.end,
      };

      void Promise.resolve(handler(interaction)).catch((error) => {
        console.error("Error procesando interacción LIVE:", error);
      });
    });

    child.on("exit", () => {
      this.running = false;
      this.reader = null;
      this.process = null;
    });

    child.on("error", (error) => {
      this.running = false;

      console.error("Error en Android LIVE input:", error);
    });
  }

  async stop(): Promise<void> {
    this.running = false;

    this.reader?.close();
    this.reader = null;

    const child = this.process;

    this.process = null;

    if (child && !child.killed) {
      child.kill("SIGTERM");
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getTouchscreen(): AndroidTouchscreenInfo | null {
    return this.touchscreen;
  }

  getDisplay(): AndroidDisplayInfo | null {
    return this.display;
  }
}
