import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { calcularLocatorsArbol, estadisticasCalidad } from "../src/calidad/index.js";
import { calcularHuella } from "../src/huella/tokens.js";
import { normalizarPageSource } from "../src/normalizador/index.js";

const fixturesDir = process.env.APPTRAK_FIXTURES_DIR?.trim();

const platform = process.env.APPTRAK_PLATFORM?.trim() || "android";

const projectName = process.env.APPTRAK_PROJECT_NAME?.trim() || "Proyecto Apptrak";

const appPackage = process.env.APPTRAK_PACKAGE?.trim();

const deviceName = process.env.APPTRAK_DEVICE?.trim();

if (!fixturesDir) {
  throw new Error("Falta APPTRAK_FIXTURES_DIR");
}

const xmlFiles = readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".xml"))
  .sort();

let rebuilt = 0;

for (const xmlFile of xmlFiles) {
  const screen = basename(xmlFile, ".xml");

  const xmlPath = `${fixturesDir}/${xmlFile}`;

  const metadataPath = `${fixturesDir}/${screen}.json`;

  const catalogPath = `${fixturesDir}/${screen}.catalog.json`;

  const xml = readFileSync(xmlPath, "utf-8");

  const arbol = normalizarPageSource(xml, {
    platform: platform === "ios" ? "ios" : "android",
  });

  const huella = calcularHuella(arbol);

  const locatorsMap = calcularLocatorsArbol(arbol);

  const elementos = arbol.nodos
    .map((nodo, indice) => ({
      indice,
      nodo,
      locator: locatorsMap.get(indice) ?? null,
    }))
    .filter(({ nodo }) => {
      const esEditable = nodo.habilitado && nodo.clase.endsWith("EditText");

      return nodo.clickable || nodo.scrollable || nodo.checkable || esEditable;
    });

  const locatorsInteractivos = new Map(
    elementos
      .map(({ indice }) => {
        const locator = locatorsMap.get(indice);

        return locator ? ([indice, locator] as const) : null;
      })
      .filter(
        (entry): entry is readonly [number, NonNullable<ReturnType<typeof locatorsMap.get>>] =>
          entry !== null,
      ),
  );

  const calidad = estadisticasCalidad(locatorsInteractivos);

  const visibles = arbol.nodos.filter((nodo) => nodo.visible).length;

  let metadata: Record<string, unknown> | undefined;

  if (existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(readFileSync(metadataPath, "utf-8")) as Record<string, unknown>;
    } catch {
      metadata = undefined;
    }
  }

  const catalogo = {
    schemaVersion: 1,

    project: metadata?.project ?? projectName,

    screen,

    timestamp: metadata?.timestamp ?? new Date().toISOString(),

    platform,

    deviceName: metadata?.deviceName ?? deviceName,

    package: metadata?.app ?? appPackage,

    activity: metadata?.activity ?? "unknown",

    fingerprint: {
      hash: huella.hash,
    },

    quality: calidad,

    summary: {
      totalNodes: arbol.nodos.length,

      visibleNodes: visibles,

      interactiveNodes: elementos.length,

      catalogElements: elementos.length,
    },

    elements: elementos,
  };

  writeFileSync(catalogPath, JSON.stringify(catalogo, null, 2));

  rebuilt++;

  console.log(`✅ ${screen}: ${elementos.length} elementos interactivos`);
}

console.log(`\n✅ ${rebuilt} catálogos reconstruidos`);
