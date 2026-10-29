import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type ExplorationConfig, ExplorationConfigSchema } from "../../config/schemas.js";

export const DEFAULT_CONFIG_PATH = "exploracion.json";

export interface LoadedProject {
  config: ExplorationConfig;
  path: string;
}

export function loadProjectConfig(filePath = DEFAULT_CONFIG_PATH): LoadedProject {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`No existe el archivo: ${filePath}`);
  }

  let raw: unknown;

  try {
    raw = JSON.parse(readFileSync(absolutePath, "utf-8"));
  } catch (error) {
    throw new Error(
      `JSON inválido en ${filePath}: ${
        error instanceof Error ? error.message : "error desconocido"
      }`,
    );
  }

  const result = ExplorationConfigSchema.safeParse(raw);

  if (!result.success) {
    const detalles = result.error.issues
      .map((issue) => {
        const path = issue.path.join(".") || "root";
        return `${path}: ${issue.message}`;
      })
      .join("\n  - ");

    throw new Error(`Configuración inválida en ${filePath}:\n  - ${detalles}`);
  }

  return {
    config: result.data,
    path: absolutePath,
  };
}

export function saveProjectConfig(
  config: ExplorationConfig,
  filePath = DEFAULT_CONFIG_PATH,
): string {
  const validated = ExplorationConfigSchema.parse(config);
  const absolutePath = resolve(filePath);

  writeFileSync(absolutePath, `${JSON.stringify(validated, null, 2)}\n`, "utf-8");

  return absolutePath;
}

export function hasDefaultProjectConfig(): boolean {
  return existsSync(resolve(DEFAULT_CONFIG_PATH));
}
