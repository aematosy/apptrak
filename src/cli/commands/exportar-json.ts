import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Interface } from "node:readline/promises";
import { getElementName, getUniqueScreens, loadAppCatalog } from "../catalog/catalog-reader.js";
import { currentProject } from "../config/current-project.js";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExportDirectory(): string {
  const config = currentProject.getConfig();
  const meta = currentProject.getMeta();

  if (!config) {
    throw new Error("No hay proyecto activo");
  }

  const projectName = meta?.name || config.app.name || config.app.id;

  const outputDir = config.output.dir;

  const destination = join(outputDir, slugify(projectName), "exports");

  mkdirSync(destination, {
    recursive: true,
  });

  return destination;
}

function escribirJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export async function cmdExportarJson(readline: Interface): Promise<void> {
  const catalog = loadAppCatalog();

  const screens = getUniqueScreens(catalog);

  const outputDir = getExportDirectory();

  console.log(`
APPTRAK · EXPORTAR JSON
────────────────────────────────────────────────────────────

  1  Catálogo completo
  2  Solo locators
  3  Una pantalla

  0  Volver
`);

  const option = (await readline.question("Selecciona una opción › ")).trim();

  if (option === "0") {
    return;
  }

  if (option === "1") {
    const path = join(outputDir, "apptrak-catalog.json");

    escribirJson(path, catalog);

    console.log(`\n✅ JSON exportado\n   ${path}\n`);

    return;
  }

  if (option === "2") {
    const data = {
      schemaVersion: 1,
      project: catalog.project,
      app: catalog.app,
      screens: screens.map((screen) => ({
        name: screen.name,
        fingerprint: screen.fingerprint,
        elements: screen.elements.map((element) => ({
          name: getElementName(element),
          class: element.nodo?.clase,
          locator: element.locator?.principal ?? null,
          alternatives: element.locator?.alternativas ?? [],
        })),
      })),
    };

    const path = join(outputDir, "apptrak-locators.json");

    escribirJson(path, data);

    console.log(`\n✅ Locators exportados\n   ${path}\n`);

    return;
  }

  if (option === "3") {
    console.log("\nPANTALLAS\n");

    screens.forEach((screen, index) => {
      console.log(`  ${index + 1}  ${screen.name ?? "sin-nombre"}`);
    });

    console.log("\n  0  Volver\n");

    const raw = await readline.question("Selecciona pantalla › ");

    if (raw.trim() === "0") {
      return;
    }

    const index = Number.parseInt(raw.trim(), 10) - 1;

    const screen = screens[index];

    if (!screen) {
      console.log("\n❌ Pantalla inválida.\n");
      return;
    }

    const name = slugify(screen.name ?? `screen-${index + 1}`);

    const path = join(outputDir, `apptrak-${name}.json`);

    escribirJson(path, screen);

    console.log(`\n✅ Pantalla exportada\n   ${path}\n`);

    return;
  }

  console.log("\n❌ Opción inválida.\n");
}
