/**
 * Menú principal persistente de Apptrak
 */

import { createInterface } from "node:readline/promises";
import { cmdCapturar } from "./commands/capturar.js";
import { cmdCatalogo } from "./commands/catalogo.js";
import { cmdConfigurar } from "./commands/configurar.js";
import { cmdDiagnostico } from "./commands/diagnostico.js";
import { cmdEstado } from "./commands/estado.js";
import { cmdExportarJson } from "./commands/exportar-json.js";
import { cmdGitStatus } from "./commands/git-status.js";
import { cmdJaccard } from "./commands/jaccard.js";
import { cmdLocators } from "./commands/locators.js";
import { cmdPantallas } from "./commands/pantallas.js";
import { cmdRoadmap } from "./commands/roadmap.js";
import { cmdValidacion } from "./commands/validacion.js";
import { cmdVerificar } from "./commands/verificar.js";
import { currentProject } from "./config/current-project.js";
import {
  DEFAULT_CONFIG_PATH,
  hasDefaultProjectConfig,
  loadProjectConfig,
} from "./config/storage.js";
import { renderMenu } from "./ui/layout.js";
import { PATHS, getFixturesCount } from "./utils/paths.js";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function mostrarMenu() {
  const fixtures = currentProject.hasProject() ? getFixturesCount() : 0;
  console.clear();
  console.log(
    renderMenu({
      status: "EN PROGRESO",
      h1Status: "Pendiente de calibración",
      h2Status: "Pendiente de medición real",
      fixtureCount: fixtures,
    }),
  );
}

async function autoLoadProject(): Promise<void> {
  if (!hasDefaultProjectConfig()) {
    return;
  }

  try {
    const loaded = loadProjectConfig(DEFAULT_CONFIG_PATH);

    currentProject.setProject(loaded.config, {
      name: loaded.config.app.name ?? loaded.config.app.id,
      path: loaded.path,
      source: "file",
    });
  } catch (error) {
    console.error(
      "\n⚠️ No se pudo cargar exploracion.json:",
      error instanceof Error ? error.message : "error desconocido",
    );

    currentProject.clear();
  }
}

async function ejecutarComando(command: () => Promise<unknown>): Promise<void> {
  try {
    await command();
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : "desconocido");
  }

  await readline.question("\nPresiona ENTER para volver al menú...");
}

async function main() {
  await autoLoadProject();

  while (true) {
    mostrarMenu();

    const opcion = await readline.question("Selecciona una opción › ");

    switch (opcion.trim()) {
      case "1":
        await ejecutarComando(() => cmdConfigurar(readline));
        break;

      case "2":
        await ejecutarComando(cmdVerificar);
        break;

      case "3":
        await ejecutarComando(cmdCapturar);
        break;

      case "4":
        await ejecutarComando(cmdEstado);
        break;

      case "5":
        await ejecutarComando(cmdCatalogo);
        break;

      case "6":
        await ejecutarComando(cmdPantallas);
        break;

      case "7":
        await ejecutarComando(() => cmdLocators(readline));
        break;

      case "8":
        await ejecutarComando(() => cmdExportarJson(readline));
        break;

      case "9":
        await ejecutarComando(cmdDiagnostico);
        break;

      case "10":
        await ejecutarComando(cmdJaccard);
        break;

      case "11":
        await ejecutarComando(cmdValidacion);
        break;

      case "12":
        await ejecutarComando(cmdGitStatus);
        break;

      case "13":
        await ejecutarComando(cmdRoadmap);
        break;

      case "0":
        console.log("\n👋 Hasta luego!\n");
        readline.close();
        return;

      default:
        console.log("\n⚠️ Opción no reconocida. Intenta nuevamente.\n");
        await readline.question("Presiona ENTER para continuar...");
    }
  }
}

main().catch(console.error);
