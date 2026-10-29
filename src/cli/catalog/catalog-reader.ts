import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getFixturesDir } from "../utils/paths.js";

export interface CatalogLocator {
  tipo?: string;
  valor?: string;
  calidad?: string;
  unico?: boolean;
}

export interface CatalogElement {
  indice?: number;
  nodo?: {
    clase?: string;
    texto?: string | null;
    idEstable?: string | null;
    descripcion?: string | null;
    clickable?: boolean;
    scrollable?: boolean;
    checkable?: boolean;
  };
  locator?: {
    principal?: CatalogLocator;
    alternativas?: CatalogLocator[];
  } | null;
}

export interface CatalogScreen {
  name?: string;
  fingerprint?: string;
  activity?: string;
  summary?: Record<string, unknown>;
  elements: CatalogElement[];
}

export interface AppCatalog {
  schemaVersion?: number;
  generatedAt?: string;
  project?: string;
  app?: {
    package?: string;
    platform?: string;
  };
  summary?: {
    screens?: number;
    uniqueStates?: number;
    duplicateStates?: number;
    elements?: number;
    stableOrMediumPercentage?: number;
    locators?: {
      stable?: number;
      medium?: number;
      anchor?: number;
      fragile?: number;
    };
  };
  duplicateStates?: Array<{
    fingerprint: string;
    screens: string[];
  }>;
  screens: CatalogScreen[];
}

export function getCatalogPath(): string {
  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    throw new Error("No hay proyecto activo");
  }

  return join(fixturesDir, "catalog.json");
}

export function loadAppCatalog(): AppCatalog {
  const path = getCatalogPath();

  if (!existsSync(path)) {
    throw new Error("No existe catalog.json. Captura pantallas y genera el catálogo primero.");
  }

  return JSON.parse(readFileSync(path, "utf-8")) as AppCatalog;
}

function esNombreAutomatico(name?: string): boolean {
  return /^screen-\d+$/i.test(name ?? "");
}

export function getUniqueScreens(catalog: AppCatalog): CatalogScreen[] {
  const byFingerprint = new Map<string, CatalogScreen>();

  for (const screen of catalog.screens) {
    const key = screen.fingerprint ?? `name:${screen.name ?? "unknown"}`;

    const current = byFingerprint.get(key);

    if (!current) {
      byFingerprint.set(key, screen);
      continue;
    }

    if (esNombreAutomatico(current.name) && !esNombreAutomatico(screen.name)) {
      byFingerprint.set(key, screen);
    }
  }

  return [...byFingerprint.values()];
}

export function getElementName(element: CatalogElement): string {
  const node = element.nodo;
  const principal = element.locator?.principal;

  return (
    node?.descripcion?.trim() ||
    node?.texto?.trim() ||
    node?.idEstable?.trim() ||
    principal?.valor?.trim() ||
    `Elemento ${element.indice ?? "?"}`
  );
}
