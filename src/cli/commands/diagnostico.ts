/**
 * OPCIÓN 4: PASO 4 - Diagnóstico H1
 * Ejecuta análisis sin Appium.
 */

import { spawnSync } from "node:child_process";
import { PATHS, getFixturesCount, getFixturesDir } from "../utils/paths.js";

export async function cmdDiagnostico() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║       PASO 4 - DIAGNÓSTICO H1        ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    console.log("❌ No hay proyecto activo.");
    console.log("   Configura o carga un proyecto antes de ejecutar H1.\n");
    return;
  }

  const count = getFixturesCount();

  if (count < 3) {
    console.log(`❌ No hay suficientes fixtures (${count} encontrados, mínimo 3 requerido)\n`);
    return;
  }

  console.log(`Fixtures disponibles: ${count}`);
  console.log(`Directorio: ${fixturesDir}`);
  console.log("Analizando tokenización, huellas y discriminación...\n");

  const result = spawnSync("tsx", [PATHS.diagnosticoScript], {
    stdio: "inherit",
    shell: true,
    timeout: 60000,
  });

  if (result.status !== 0) {
    console.log("\n⚠️ Diagnóstico completó con errores\n");
  } else {
    console.log("\n✅ Diagnóstico completado\n");
  }
}
