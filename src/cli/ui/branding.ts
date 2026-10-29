/**
 * Branding y versión centralizada
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Leer versión desde package.json en tiempo de ejecución
function getVersion(): string {
  try {
    const packagePath = resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version || "unknown";
  } catch {
    return "dev";
  }
}

export const BRANDING = {
  name: "APPTRAK",
  version: getVersion(),
  tagline: "Mobile App Exploration Toolkit",
} as const;
