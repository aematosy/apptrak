/**
 * OPCIÓN 5: PASO 4 - Matriz Jaccard
 * Ejecuta análisis de similitud.
 */

import { spawnSync } from "node:child_process";
import { PATHS, getFixturesCount, getFixturesDir } from "../utils/paths.js";

export async function cmdJaccard() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║     PASO 4 - MATRIZ JACCARD          ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    console.log("❌ No hay proyecto activo.");
    console.log("   Configura o carga un proyecto antes de ejecutar Jaccard.\n");
    return;
  }

  const count = getFixturesCount();

  if (count < 2) {
    console.log(`❌ No hay suficientes fixtures (${count} encontrados, mínimo 2 requerido)\n`);
    return;
  }

  console.log(`Fixtures disponibles: ${count}`);
  console.log(`Directorio: ${fixturesDir}`);
  console.log("Calculando matriz Jaccard, similitud y variantes...\n");

  const result = spawnSync("tsx", [PATHS.jaccardScript], {
    stdio: "inherit",
    shell: true,
    timeout: 60000,
  });

  if (result.status !== 0) {
    console.log("\n⚠️ Análisis completó con errores\n");
  } else {
    console.log("\n✅ Análisis completado\n");
  }
}
