import type { ProjectConfig } from "./current-project.js";

interface PresetDefinition {
  name: string;
  create: (deviceName: string) => ProjectConfig;
}

const presets: Record<string, PresetDefinition> = {
  wikipedia: {
    name: "Wikipedia Android",
    create: (deviceName: string) => ({
      app: {
        id: "org.wikipedia",
        name: "Wikipedia Android",
        platform: "android",
        version: "2.8.0",
      },
      appium: {
        url: "http://localhost:4723",
        automationName: "UiAutomator2",
        deviceName,
      },
      precondition: {
        type: "ya-iniciada",
      },
      data: {
        file: "datos.json",
      },
      limits: {
        maxScreens: 12,
        maxActions: 100,
        maxMinutes: 60,
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
        dir: "exploraciones/wikipedia",
      },
      reference: {
        fixtureTarget: 12,
        fixturesDir: "test/fixtures/arboles/wikipedia-redo",
      },
    }),
  },
};

export function getPreset(
  key: string,
  deviceName: string,
): { name: string; config: ProjectConfig } | null {
  const preset = presets[key];

  if (!preset) {
    return null;
  }

  return {
    name: preset.name,
    config: preset.create(deviceName),
  };
}

export function listPresets(): Array<{ key: string; name: string }> {
  return Object.entries(presets).map(([key, preset]) => ({
    key,
    name: preset.name,
  }));
}
