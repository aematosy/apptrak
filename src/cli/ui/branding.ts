/**
 * Branding y versión centralizada.
 * La versión se inyecta durante el build.
 */

declare const __APPTRAK_VERSION__: string;

export const BRANDING = {
  name: "APPTRAK",
  version: __APPTRAK_VERSION__,
  tagline: "Mobile App Exploration Toolkit",
} as const;
