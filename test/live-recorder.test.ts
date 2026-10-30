import { describe, expect, it } from "vitest";
import { detectUiChange, screenChanged } from "../src/flow/live/diff.js";
import { resolveTapElement } from "../src/flow/live/interaction-resolver.js";
import type { LiveSnapshot } from "../src/flow/live/types.js";

function snapshot(fingerprint: string, texts: string[]): LiveSnapshot {
  return {
    capturedAt: Date.now(),

    screen: {
      fingerprint,
    },

    visibleTexts: texts,

    elements: [],

    focusedElement: undefined,
  };
}

describe("LIVE Recorder", () => {
  it("detecta textos nuevos", () => {
    const before = snapshot("login", ["Login"]);

    const after = snapshot("login", ["Login", "Contraseña incorrecta"]);

    const change = detectUiChange(before, after);

    expect(change.addedTexts).toContain("Contraseña incorrecta");
  });

  it("detecta cambio de pantalla", () => {
    const before = snapshot("login", []);

    const after = snapshot("home", []);

    expect(screenChanged(before, after)).toBe(true);
  });

  it("resuelve el elemento clickable del tap", () => {
    const current: LiveSnapshot = {
      capturedAt: Date.now(),

      screen: {
        fingerprint: "home",
      },

      visibleTexts: [],

      elements: [
        {
          nodeIndex: 1,
          title: "Container",
          bounds: {
            x1: 0,
            y1: 0,
            x2: 1000,
            y2: 1000,
          },
          clickable: true,
          editable: false,
          enabled: true,
          visible: true,
          sensitive: false,
          depth: 1,
        },
        {
          nodeIndex: 2,
          title: "Login",
          locator: {
            type: "id",
            value: "LoginButtonID",
            quality: "estable",
            unique: true,
          },
          bounds: {
            x1: 300,
            y1: 600,
            x2: 700,
            y2: 750,
          },
          clickable: true,
          editable: false,
          enabled: true,
          visible: true,
          sensitive: false,
          depth: 8,
        },
      ],
    };

    const result = resolveTapElement(
      {
        type: "tap",
        platform: "android",
        timestamp: Date.now(),
        pointer: {
          x: 500,
          y: 700,
        },
      },
      current,
    );

    expect(result?.title).toBe("Login");

    expect(result?.locator?.value).toBe("LoginButtonID");
  });
});

describe("LiveRecorder core", () => {
  it("genera timeline y candidate assertions", async () => {
    const snapshots: LiveSnapshot[] = [
      snapshot("login", ["Login", "Password"]),
      snapshot("login", ["Login", "Password", "Contraseña incorrecta"]),
    ];

    let index = 0;

    const provider = {
      async capture(): Promise<LiveSnapshot> {
        const current = snapshots[Math.min(index, snapshots.length - 1)];

        index++;

        if (!current) {
          throw new Error("Snapshot no disponible");
        }

        return current;
      },
    };

    const { LiveRecorder } = await import("../src/flow/live/live-recorder.js");

    const recorder = new LiveRecorder({
      snapshotProvider: provider,
      stabilizationMs: 0,
    });

    await recorder.start();

    const entry = await recorder.processInteraction({
      type: "tap",
      platform: "android",
      timestamp: Date.now(),
    });

    expect(
      entry.assertions.some(
        (assertion) =>
          assertion.type === "text-visible" && assertion.value === "Contraseña incorrecta",
      ),
    ).toBe(true);

    expect(recorder.getTimeline()).toHaveLength(1);
  });

  it("detecta transición de pantalla como assertion candidate", async () => {
    const snapshots: LiveSnapshot[] = [snapshot("login", ["Login"]), snapshot("home", ["Inicio"])];

    let index = 0;

    const provider = {
      async capture(): Promise<LiveSnapshot> {
        const current = snapshots[Math.min(index, snapshots.length - 1)];

        index++;

        if (!current) {
          throw new Error("Snapshot no disponible");
        }

        return current;
      },
    };

    const { LiveRecorder } = await import("../src/flow/live/live-recorder.js");

    const recorder = new LiveRecorder({
      snapshotProvider: provider,
      stabilizationMs: 0,
    });

    await recorder.start();

    const entry = await recorder.processInteraction({
      type: "tap",
      platform: "ios",
      timestamp: Date.now(),
    });

    expect(
      entry.assertions.some(
        (assertion) => assertion.type === "screen" && assertion.value === "home",
      ),
    ).toBe(true);
  });
});
