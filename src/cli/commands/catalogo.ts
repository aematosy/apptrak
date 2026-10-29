import { getUniqueScreens, loadAppCatalog } from "../catalog/catalog-reader.js";

export async function cmdCatalogo(): Promise<void> {
  const catalog = loadAppCatalog();
  const screens = getUniqueScreens(catalog);
  const summary = catalog.summary;
  const locators = summary?.locators;

  console.log(`
APPTRAK · CATÁLOGO DE APLICACIÓN
────────────────────────────────────────────────────────────

Proyecto             ${catalog.project ?? "-"}
Package              ${catalog.app?.package ?? "-"}
Plataforma           ${catalog.app?.platform ?? "-"}

Pantallas capturadas ${summary?.screens ?? catalog.screens.length}
Estados únicos       ${summary?.uniqueStates ?? screens.length}
Elementos            ${summary?.elements ?? "-"}
Duplicados           ${summary?.duplicateStates ?? 0}

LOCATORS
────────────────────────────────────────────────────────────
Estables             ${locators?.stable ?? 0}
Medios               ${locators?.medium ?? 0}
Ancla                 ${locators?.anchor ?? 0}
Frágiles             ${locators?.fragile ?? 0}
Estable + media      ${summary?.stableOrMediumPercentage ?? 0}%
`);

  if (catalog.duplicateStates?.length) {
    console.log("ESTADOS EQUIVALENTES");
    console.log("────────────────────────────────────────────────────────────");

    for (const duplicate of catalog.duplicateStates) {
      console.log(`${duplicate.fingerprint}  ${duplicate.screens.join(", ")}`);
    }

    console.log();
  }
}
