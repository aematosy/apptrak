import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

interface Locator {
  tipo?: string;
  valor?: string;
  calidad?: string;
  unico?: boolean;
}

interface CatalogElement {
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
    principal?: Locator;
    alternativas?: Locator[];
  } | null;
}

interface ScreenCatalog {
  schemaVersion?: number;
  project?: string;
  screen?: string;
  timestamp?: string;
  platform?: string;
  deviceName?: string;
  package?: string;
  activity?: string;
  fingerprint?: {
    hash?: string;
  };
  summary?: {
    totalNodes?: number;
    visibleNodes?: number;
    interactiveNodes?: number;
    catalogElements?: number;
  };
  elements?: CatalogElement[];
}

const fixturesDir = process.env.APPTRAK_FIXTURES_DIR?.trim();

const projectName = process.env.APPTRAK_PROJECT_NAME?.trim() || "Proyecto Apptrak";

const appPackage = process.env.APPTRAK_PACKAGE?.trim();

const platform = process.env.APPTRAK_PLATFORM?.trim();

if (!fixturesDir) {
  throw new Error("Falta APPTRAK_FIXTURES_DIR");
}

const files = readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".catalog.json") && file !== "catalog.json")
  .sort();

const screens: ScreenCatalog[] = [];

for (const file of files) {
  try {
    const raw = readFileSync(`${fixturesDir}/${file}`, "utf-8");

    const catalog = JSON.parse(raw) as ScreenCatalog;

    screens.push(catalog);
  } catch (error) {
    console.warn(
      `⚠ No se pudo cargar ${file}:`,
      error instanceof Error ? error.message : "error desconocido",
    );
  }
}

const fingerprints = new Map<string, string[]>();

let totalElements = 0;
let stableLocators = 0;
let mediumLocators = 0;
let anchorLocators = 0;
let fragileLocators = 0;

for (const screen of screens) {
  const screenName = screen.screen || "unknown";

  const fingerprint = screen.fingerprint?.hash;

  if (fingerprint) {
    const names = fingerprints.get(fingerprint) ?? [];

    names.push(screenName);

    fingerprints.set(fingerprint, names);
  }

  for (const element of screen.elements ?? []) {
    totalElements++;

    const quality = element.locator?.principal?.calidad;

    if (quality === "estable") {
      stableLocators++;
    } else if (quality === "media") {
      mediumLocators++;
    } else if (quality === "ancla") {
      anchorLocators++;
    } else if (quality === "fragil") {
      fragileLocators++;
    }
  }
}

const duplicateStates = [...fingerprints.entries()]
  .filter(([, names]) => names.length > 1)
  .map(([fingerprint, names]) => ({
    fingerprint,
    screens: names,
  }));

const uniqueStates = fingerprints.size;

const globalCatalog = {
  schemaVersion: 1,

  generatedAt: new Date().toISOString(),

  project: projectName,

  app: {
    package: appPackage,
    platform,
  },

  summary: {
    screens: screens.length,

    uniqueStates,

    duplicateStates: duplicateStates.length,

    elements: totalElements,

    locators: {
      stable: stableLocators,
      medium: mediumLocators,
      anchor: anchorLocators,
      fragile: fragileLocators,
    },

    stableOrMediumPercentage:
      totalElements > 0
        ? Number((((stableLocators + mediumLocators) / totalElements) * 100).toFixed(2))
        : 0,
  },

  duplicateStates,

  screens: screens.map((screen) => ({
    name: screen.screen,

    fingerprint: screen.fingerprint?.hash,

    activity: screen.activity,

    summary: screen.summary,

    elements: screen.elements ?? [],
  })),
};

const output = `${fixturesDir}/catalog.json`;

writeFileSync(output, JSON.stringify(globalCatalog, null, 2));

console.log("\n✅ CATÁLOGO GLOBAL GENERADO");
console.log(`   Proyecto: ${projectName}`);
console.log(`   Pantallas: ${screens.length}`);
console.log(`   Estados únicos: ${uniqueStates}`);
console.log(`   Elementos: ${totalElements}`);
console.log(`   Locators estables: ${stableLocators}`);
console.log(`   Locators media: ${mediumLocators}`);
console.log(`   Locators frágiles: ${fragileLocators}`);
console.log(`   Salida: ${basename(output)}`);
