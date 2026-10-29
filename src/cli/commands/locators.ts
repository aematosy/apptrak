import type { Interface } from "node:readline/promises";
import { getElementName, getUniqueScreens, loadAppCatalog } from "../catalog/catalog-reader.js";

export async function cmdLocators(readline: Interface): Promise<void> {
  const catalog = loadAppCatalog();
  const screens = getUniqueScreens(catalog);

  while (true) {
    console.log(`
APPTRAK · LOCATORS
────────────────────────────────────────────────────────────
`);

    screens.forEach((screen, index) => {
      console.log(
        `  ${index + 1}  ${screen.name ?? "sin-nombre"}  ·  ${screen.elements.length} elementos`,
      );
    });

    console.log("\n  0  Volver\n");

    const raw = await readline.question("Selecciona una pantalla › ");

    if (raw.trim() === "0") {
      return;
    }

    const screenIndex = Number.parseInt(raw.trim(), 10) - 1;

    const screen = screens[screenIndex];

    if (!screen) {
      console.log("\n❌ Pantalla inválida.\n");
      continue;
    }

    while (true) {
      console.log(`
${screen.name?.toUpperCase() ?? "PANTALLA"} · LOCATORS
────────────────────────────────────────────────────────────

Fingerprint  ${screen.fingerprint ?? "-"}
Elementos    ${screen.elements.length}
`);

      screen.elements.forEach((element, index) => {
        const principal = element.locator?.principal;

        console.log(`${String(index + 1).padStart(3)}  ${getElementName(element)}`);

        console.log(`     ${principal?.tipo ?? "-"}: ${principal?.valor ?? "-"}`);

        console.log(
          `     calidad: ${principal?.calidad ?? "-"} · único: ${principal?.unico ? "sí" : "no"}`,
        );
      });

      console.log("\n  0  Volver a pantallas\n");

      const elementRaw = await readline.question("Selecciona un elemento › ");

      if (elementRaw.trim() === "0") {
        break;
      }

      const elementIndex = Number.parseInt(elementRaw.trim(), 10) - 1;

      const element = screen.elements[elementIndex];

      if (!element) {
        console.log("\n❌ Elemento inválido.\n");
        continue;
      }

      const node = element.nodo ?? {};
      const locator = element.locator;

      console.log(`
ELEMENTO
────────────────────────────────────────────────────────────
Nombre       ${getElementName(element)}
Clase        ${node.clase ?? "-"}
Texto        ${node.texto ?? "-"}
ID           ${node.idEstable ?? "-"}
Descripción  ${node.descripcion ?? "-"}

LOCATOR PRINCIPAL
────────────────────────────────────────────────────────────
Tipo         ${locator?.principal?.tipo ?? "-"}
Valor        ${locator?.principal?.valor ?? "-"}
Calidad      ${locator?.principal?.calidad ?? "-"}
Único        ${locator?.principal?.unico ? "sí" : "no"}

ALTERNATIVAS
────────────────────────────────────────────────────────────
`);

      const alternativas = locator?.alternativas ?? [];

      if (alternativas.length === 0) {
        console.log("Sin alternativas.\n");
      } else {
        alternativas.forEach((alternative, index) => {
          console.log(`${index + 1}. ${alternative.tipo ?? "-"}: ${alternative.valor ?? "-"}`);
          console.log(
            `   calidad: ${alternative.calidad ?? "-"} · único: ${alternative.unico ? "sí" : "no"}`,
          );
        });

        console.log();
      }

      await readline.question("Presiona ENTER para continuar...");
    }
  }
}
