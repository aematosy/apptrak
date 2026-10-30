import { describe, expect, it } from "vitest";
import { mapRawTouchToScreen } from "../src/flow/live/android/android-coordinate-mapper.js";
import { parseWmSize } from "../src/flow/live/android/android-display-info.js";
import { parseGeteventDevices } from "../src/flow/live/android/android-touchscreen-discovery.js";

describe("Android LIVE input", () => {
  it("descubre touchscreen sin depender de eventN", () => {
    const output = `
add device 1: /dev/input/event8
  name:     "buttons"
  events:
    KEY (0001): KEY_POWER
  input props:
    <none>

add device 2: /dev/input/event42
  name:     "generic_touch"
  events:
    ABS (0003): ABS_MT_POSITION_X : value 0, min 100, max 8100, fuzz 0, flat 0, resolution 0
                ABS_MT_POSITION_Y : value 0, min 200, max 16200, fuzz 0, flat 0, resolution 0
  input props:
    INPUT_PROP_DIRECT
`;

    const result = parseGeteventDevices(output);

    expect(result).toHaveLength(1);

    expect(result[0]?.path).toBe("/dev/input/event42");

    expect(result[0]?.x).toEqual({
      min: 100,
      max: 8100,
    });

    expect(result[0]?.y).toEqual({
      min: 200,
      max: 16200,
    });
  });

  it("prefiere override size cuando existe", () => {
    const result = parseWmSize(`
Physical size: 1440x3200
Override size: 1080x2400
`);

    expect(result).toEqual({
      width: 1080,
      height: 2400,
    });
  });

  it("convierte rango raw a coordenadas de pantalla", () => {
    const point = mapRawTouchToScreen(
      2048,
      2048,
      {
        path: "/dev/input/event99",
        name: "touchscreen",
        x: {
          min: 0,
          max: 4095,
        },
        y: {
          min: 0,
          max: 4095,
        },
      },
      {
        width: 1080,
        height: 2400,
      },
    );

    expect(point.x).toBeCloseTo(540, -1);

    expect(point.y).toBeCloseTo(1200, -1);
  });
});

import { classifyAndroidGesture } from "../src/flow/live/android/android-gesture-classifier.js";
import { AndroidTouchParser } from "../src/flow/live/android/android-touch-parser.js";

describe("Android touch stream", () => {
  it("convierte una secuencia getevent en un gesto", () => {
    let time = 1000;

    const parser = new AndroidTouchParser({
      touchscreenPath: "/dev/input/event42",

      now: () => {
        time += 50;
        return time;
      },
    });

    const lines = [
      "/dev/input/event42: 0003 0039 00000111",
      "/dev/input/event42: 0003 0035 0000034e",
      "/dev/input/event42: 0003 0036 000006ef",
      "/dev/input/event42: 0003 0035 00000350",
      "/dev/input/event42: 0003 0036 000006ed",
      "/dev/input/event42: 0003 0039 ffffffff",
    ];

    let gesture = null;

    for (const line of lines) {
      const result = parser.push(line);

      if (result) {
        gesture = result;
      }
    }

    expect(gesture).not.toBeNull();

    expect(gesture?.start).toEqual({
      x: 0x34e,
      y: 0x6ef,
    });

    expect(gesture?.end).toEqual({
      x: 0x350,
      y: 0x6ed,
    });
  });

  it("clasifica movimiento pequeño como tap", () => {
    const result = classifyAndroidGesture(
      {
        startedAt: 1000,
        endedAt: 1100,

        start: {
          x: 500,
          y: 1000,
        },

        end: {
          x: 505,
          y: 1006,
        },

        minX: 500,
        maxX: 505,
        minY: 1000,
        maxY: 1006,
      },
      {
        path: "/dev/input/event42",
        name: "generic_touch",
        x: {
          min: 0,
          max: 4095,
        },
        y: {
          min: 0,
          max: 4095,
        },
      },
      {
        width: 1080,
        height: 2400,
      },
    );

    expect(result.type).toBe("tap");
  });

  it("clasifica desplazamiento grande como scroll", () => {
    const result = classifyAndroidGesture(
      {
        startedAt: 1000,
        endedAt: 1400,

        start: {
          x: 500,
          y: 1800,
        },

        end: {
          x: 520,
          y: 700,
        },

        minX: 500,
        maxX: 520,
        minY: 700,
        maxY: 1800,
      },
      {
        path: "/dev/input/event42",
        name: "generic_touch",
        x: {
          min: 0,
          max: 4095,
        },
        y: {
          min: 0,
          max: 4095,
        },
      },
      {
        width: 1080,
        height: 2400,
      },
    );

    expect(result.type).toBe("scroll");
  });
});

describe("Android direct getevent stream", () => {
  it("detecta un gesto cuando getevent no incluye device path", () => {
    const parser = new AndroidTouchParser({
      touchscreenPath: "/dev/input/event42",
    });

    const lines = [
      "0003 0039 00000143",
      "0001 014a 00000001",
      "0001 0145 00000001",
      "0003 0035 00000291",
      "0003 0036 000001dd",
      "0000 0000 00000000",
      "0003 0035 0000029b",
      "0003 0036 000001e3",
      "0000 0000 00000000",
      "0003 0039 ffffffff",
      "0001 014a 00000000",
      "0001 0145 00000000",
      "0000 0000 00000000",
    ];

    let gesture = null;

    for (const line of lines) {
      const result = parser.push(line);

      if (result) {
        gesture = result;
      }
    }

    expect(gesture).not.toBeNull();
    expect(gesture?.start).toEqual({
      x: 0x291,
      y: 0x1dd,
    });
    expect(gesture?.end).toEqual({
      x: 0x29b,
      y: 0x1e3,
    });
  });
});
