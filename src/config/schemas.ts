import { z } from "zod";

/**
 * Esquema de configuración para una corrida (exploracion.json)
 * Basado en SDD 5.1 y decisiones E0
 */
export const ExplorationConfigSchema = z.object({
  app: z.object({
    id: z.string().min(1).describe("Package name (Android) o bundle id (iOS)"),
    name: z.string().min(1).optional().describe("Nombre amigable del proyecto/app"),
    version: z.string().optional(),
    platform: z.enum(["android", "ios"]).default("android"),
  }),

  appium: z.object({
    url: z.string().url().default("http://localhost:4723"),
    automationName: z.enum(["UiAutomator2", "XCUITest"]).default("UiAutomator2"),
    deviceName: z.string().describe("AVD name o device serial"),
  }),

  precondition: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("ya-iniciada"),
    }),
    z.object({
      type: z.literal("pasos"),
      steps: z
        .array(
          z.discriminatedUnion("action", [
            z.object({
              action: z.literal("tap"),
              using: z.enum(["id", "xpath", "text"]),
              value: z.string(),
            }),
            z.object({
              action: z.literal("write"),
              using: z.enum(["id", "xpath"]),
              value: z.string(),
              text: z.string(),
            }),
            z.object({
              action: z.literal("wait"),
              milliseconds: z.number().positive(),
            }),
          ]),
        )
        .min(1),
    }),
    z.object({
      type: z.literal("comando"),
      command: z.string().describe("Shell command to prepare environment"),
    }),
  ]),

  data: z.object({
    file: z.string().describe("Ruta a datos.json"),
  }),

  limits: z.object({
    maxScreens: z.number().positive().optional(),
    maxActions: z.number().positive().optional(),
    maxMinutes: z.number().positive().default(90),
  }),

  exclusions: z.object({
    byText: z.array(z.string()).optional(),
    byId: z.array(z.string()).optional(),
  }),

  fingerprint: z.object({
    umbral: z.number().min(0).max(1).default(0.85),
  }),

  checkpoint: z.object({
    file: z.string().default("estado.json"),
    intervalActions: z.number().positive().default(50),
  }),

  output: z.object({
    dir: z.string().default("exploraciones"),
  }),

  reference: z
    .object({
      fixtureTarget: z.number().int().positive().default(12),
      fixturesDir: z.string().min(1).optional(),
    })
    .optional(),
});

export type ExplorationConfig = z.infer<typeof ExplorationConfigSchema>;

/**
 * Esquema de datos de prueba (datos.json)
 * Basado en SDD 5.2
 */
export const TestDataSchema = z.object({
  credentials: z.record(z.string(), z.string().or(z.object({ env: z.string() }))).optional(),
  fields: z.array(
    z.object({
      id: z.string(),
      value: z.string(),
      screen: z.string().optional(),
      label: z.string().optional(),
      type: z.enum(["text", "email", "phone", "date", "password"]).optional(),
    }),
  ),
});

export type TestData = z.infer<typeof TestDataSchema>;
