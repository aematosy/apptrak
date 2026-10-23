import { describe, it, expect } from "vitest";
import { ExplorationConfigSchema } from "../src/config/schemas.js";

describe("ExplorationConfigSchema", () => {
  it("valida configuración mínima", () => {
    const config = {
      app: {
        id: "org.wikipedia",
        platform: "android",
      },
      appium: {
        url: "http://localhost:4723",
        automationName: "UiAutomator2",
        deviceName: "Pixel_4_API_34",
      },
      precondition: {
        type: "ya-iniciada",
      },
      data: {
        file: "datos.json",
      },
      limits: {
        maxMinutes: 90,
      },
      exclusions: {},
      fingerprint: {
        umbral: 0.85,
      },
      checkpoint: {
        file: "estado.json",
        intervalActions: 50,
      },
      output: {
        dir: "exploraciones",
      },
    };

    const result = ExplorationConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("rechaza platform desconocida", () => {
    const config = {
      app: {
        id: "org.test",
        platform: "windows",
      },
      appium: {
        url: "http://localhost:4723",
        automationName: "UiAutomator2",
        deviceName: "test",
      },
      precondition: { type: "ya-iniciada" },
      data: { file: "datos.json" },
      limits: { maxMinutes: 90 },
      exclusions: {},
      fingerprint: { umbral: 0.85 },
      checkpoint: { file: "estado.json", intervalActions: 50 },
      output: { dir: "exploraciones" },
    };

    const result = ExplorationConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
