/**
 * Branding y versión centralizada.
 * Release: versión inyectada durante el build.
 * Desarrollo: versión leída desde package.json.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

declare const __APPTRAK_VERSION__: string | undefined;

function getDevelopmentVersion(): string {
  try {
    const packagePath = resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function getVersion(): string {
  if (typeof __APPTRAK_VERSION__ !== "undefined") {
    return __APPTRAK_VERSION__;
  }

  return getDevelopmentVersion();
}

export const BRANDING = {
  name: "APPTRAK",
  version: getVersion(),
  tagline: "Mobile App Exploration Toolkit",
} as const;
