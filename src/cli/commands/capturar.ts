/**
 * OPCIÓN 2: PASO 2 - Capturar Fixtures
 * Orquesta el script de captura interactivo.
 */

import { spawnSync } from "node:child_process";
import { currentProject } from "../config/current-project.js";
import { PATHS, getFixturesCount, getFixturesDir } from "../utils/paths.js";

export async function cmdCapturar() {
  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    console.log("\n❌ No hay proyecto activo.");
    console.log("   Configura o carga un proyecto antes de capturar fixtures.\n");
    return;
  }

  const config = currentProject.getConfig();
  const meta = currentProject.getMeta();

  if (!config || !meta) {
    console.log("\n❌ No hay configuración activa.\n");
    return;
  }

  const completados = getFixturesCount();
  const targetFixtures = currentProject.getFixtureTarget();

  console.log("\n╔═══════════════════════════════════════════════════╗");
  console.log("║          PASO 2 - CAPTURAR FIXTURES              ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  console.log(`Estado actual: ${completados} / ${targetFixtures} fixtures`);
  console.log(`Directorio: ${fixturesDir}\n`);

  console.log("El script interactivo te guiará para capturar pantallas.");
  console.log("Presiona CTRL+C en cualquier momento para salir.\n");

  const result = spawnSync("tsx", [PATHS.capturaScript], {
    stdio: "inherit",
    shell: false,
    timeout: 3600000,
    env: {
      ...process.env,
      APPTRAK_PROJECT_NAME: meta.name,
      APPTRAK_PLATFORM: config.app.platform,
      APPTRAK_DEVICE: config.appium.deviceName,
      APPTRAK_PACKAGE: config.app.id,
      APPTRAK_AUTOMATION_NAME: config.appium.automationName,
      APPTRAK_APPIUM_URL: config.appium.url,
      APPTRAK_FIXTURES_DIR: fixturesDir,
      APPTRAK_FIXTURE_TARGET: String(targetFixtures),
    },
  });

  if (result.status === 0) {
    console.log("\n✅ Captura completada\n");
  } else {
    console.log("\n⚠️ Captura cancelada o con errores\n");
  }
}
