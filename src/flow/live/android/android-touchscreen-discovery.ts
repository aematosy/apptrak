import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface AndroidAxisRange {
  min: number;
  max: number;
}

export interface AndroidTouchscreenInfo {
  path: string;
  name: string;

  x: AndroidAxisRange;
  y: AndroidAxisRange;
}

interface ParsedDevice {
  path: string;
  name: string;

  direct: boolean;

  x?: AndroidAxisRange;
  y?: AndroidAxisRange;
}

function parseAxisRange(line: string): AndroidAxisRange | undefined {
  const minMatch = line.match(/\bmin\s+(-?\d+)/i);

  const maxMatch = line.match(/\bmax\s+(-?\d+)/i);

  if (!minMatch || !maxMatch) {
    return undefined;
  }

  const min = Number(minMatch[1]);
  const max = Number(maxMatch[1]);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return undefined;
  }

  return {
    min,
    max,
  };
}

export function parseGeteventDevices(output: string): AndroidTouchscreenInfo[] {
  const devices: ParsedDevice[] = [];

  let current: ParsedDevice | undefined;

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();

    const deviceMatch = line.match(/^add device\s+\d+:\s*(\/dev\/input\/\S+)/i);

    if (deviceMatch) {
      current = {
        path: deviceMatch[1] ?? "",
        name: "",
        direct: false,
      };

      devices.push(current);

      continue;
    }

    if (!current) {
      continue;
    }

    const nameMatch = line.match(/^name:\s*"([^"]+)"/i);

    if (nameMatch) {
      current.name = nameMatch[1] ?? "";

      continue;
    }

    if (/\bABS_MT_POSITION_X\b/i.test(line)) {
      const range = parseAxisRange(line);

      if (range) {
        current.x = range;
      }

      continue;
    }

    if (/\bABS_MT_POSITION_Y\b/i.test(line)) {
      const range = parseAxisRange(line);

      if (range) {
        current.y = range;
      }

      continue;
    }

    if (/\bINPUT_PROP_DIRECT\b/i.test(line)) {
      current.direct = true;
    }
  }

  const touchscreens: AndroidTouchscreenInfo[] = [];

  for (const device of devices) {
    if (!device.direct || !device.x || !device.y) {
      continue;
    }

    touchscreens.push({
      path: device.path,
      name: device.name,
      x: device.x,
      y: device.y,
    });
  }

  return touchscreens;
}

export async function discoverAndroidTouchscreen(serial: string): Promise<AndroidTouchscreenInfo> {
  const { stdout } = await execFileAsync("adb", ["-s", serial, "shell", "getevent", "-lp"], {
    maxBuffer: 10 * 1024 * 1024,
  });

  const devices = parseGeteventDevices(stdout);

  if (devices.length === 0) {
    throw new Error("No se encontró un touchscreen Android compatible");
  }

  const sorted = [...devices].sort((a, b) => {
    const widthA = a.x.max - a.x.min;

    const heightA = a.y.max - a.y.min;

    const widthB = b.x.max - b.x.min;

    const heightB = b.y.max - b.y.min;

    const areaA = widthA * heightA;

    const areaB = widthB * heightB;

    return areaB - areaA;
  });

  const touchscreen = sorted[0];

  if (!touchscreen) {
    throw new Error("No se pudo determinar el touchscreen principal");
  }

  return touchscreen;
}
