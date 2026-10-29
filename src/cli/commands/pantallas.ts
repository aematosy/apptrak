import { getUniqueScreens, loadAppCatalog } from "../catalog/catalog-reader.js";

export async function cmdPantallas(): Promise<void> {
  const catalog = loadAppCatalog();
  const screens = getUniqueScreens(catalog);

  console.log(`
APPTRAK · PANTALLAS
────────────────────────────────────────────────────────────

Estados únicos: ${screens.length}
`);

  screens.forEach((screen, index) => {
    console.log(`${String(index + 1).padStart(3)}  ${screen.name ?? "sin-nombre"}`);
    console.log(`     fingerprint  ${screen.fingerprint ?? "-"}`);
    console.log(`     elementos    ${screen.elements.length}`);

    if (screen.activity) {
      console.log(`     activity     ${screen.activity}`);
    }

    console.log();
  });
}
