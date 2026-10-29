/**
 * Rutas centralizadas para Apptrak CLI.
 *
 * Las rutas dependientes de una app NO se hardcodean aquí.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { currentProject } from "../config/current-project.js";

export const PATHS = {
  root: process.cwd(),

  scriptsDir: "scripts",
  capturaScript: "scripts/capturar-fixtures.ts",
  diagnosticoScript: "scripts/diagnostico-h1.ts",
  jaccardScript: "scripts/analizar-wikipedia-jaccard.ts",

  packageJson: "package.json",
  explorationConfig: "exploracion.json",
  tsconfig: "tsconfig.json",

  distDir: "dist",
  cliJs: "dist/cli.js",
} as const;

export function getFixturesDir(): string | null {
  if (!currentProject.hasProject()) {
    return null;
  }

  return currentProject.getFixtureDirectory();
}

export function getFixturePath(nombre: string, ext: "xml" | "png" | "json"): string {
  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    throw new Error("No hay proyecto activo");
  }

  return join(fixturesDir, `${nombre}.${ext}`);
}

export function getFixturesCount(): number {
  const fixturesDir = getFixturesDir();

  if (!fixturesDir || !existsSync(fixturesDir)) {
    return 0;
  }

  try {
    return readdirSync(fixturesDir).filter((file) => file.endsWith(".xml")).length;
  } catch {
    return 0;
  }
}
