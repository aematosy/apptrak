import type { Interface } from "node:readline/promises";
import { ExplorationConfigSchema } from "../../config/schemas.js";
import { currentProject } from "../config/current-project.js";
import { getConnectedAndroidDevices } from "../config/devices.js";
import { getPreset, listPresets } from "../config/presets.js";
import { DEFAULT_CONFIG_PATH, loadProjectConfig, saveProjectConfig } from "../config/storage.js";
import { runProjectWizard } from "../config/wizard.js";

async function confirm(readline: Interface, label: string, defaultYes = true): Promise<boolean> {
  const suffix = defaultYes ? " [S/n] " : " [s/N] ";
  const value = (await readline.question(`${label}${suffix}`)).trim().toLowerCase();

  if (!value) return defaultYes;

  return value === "s" || value === "si" || value === "sí" || value === "y" || value === "yes";
}

async function selectDeviceForPreset(readline: Interface): Promise<string> {
  const devices = getConnectedAndroidDevices();

  if (devices.length === 0) {
    return (
      await readline.question("\nNo hay dispositivos detectados. Ingresa device name/serial › ")
    ).trim();
  }

  console.log("\nDispositivos detectados:\n");

  for (const [index, device] of devices.entries()) {
    console.log(`  ${index + 1}. ${device}`);
  }

  while (true) {
    const raw = await readline.question("\nSelecciona dispositivo › ");
    const index = Number.parseInt(raw.trim(), 10) - 1;
    const device = devices[index];

    if (device) {
      return device;
    }

    console.log("❌ Opción inválida.");
  }
}

function mostrarConfigActual(): void {
  const config = currentProject.getConfig();
  const info = currentProject.getDashboardInfo();

  if (!config || !info) {
    console.log("\n❌ No hay proyecto activo.\n");
    return;
  }

  console.log("\n📋 CONFIGURACIÓN ACTUAL\n");
  console.log(`Proyecto:       ${info.proyecto}`);
  console.log(`Fuente:         ${info.source}`);
  console.log(`Plataforma:     ${info.plataforma}`);
  console.log(`Dispositivo:    ${info.dispositivo}`);
  console.log(`Package:        ${info.package}`);
  console.log(`Automation:     ${info.automation}`);
  console.log(`Appium:         ${info.appium}`);
  console.log(`Fixtures target:${info.fixtureTarget}`);
  console.log(`Fixtures dir:   ${info.fixtureDirectory}`);
  console.log(`Data:           ${config.data.file}`);
  console.log(`Máx pantallas:  ${config.limits.maxScreens ?? "-"}`);
  console.log(`Máx acciones:   ${config.limits.maxActions ?? "-"}`);
  console.log(`Máx minutos:    ${config.limits.maxMinutes}`);
  console.log(`Threshold H1:   ${config.fingerprint.umbral}`);
  console.log();
}

async function persistIfRequested(readline: Interface): Promise<void> {
  const config = currentProject.getConfig();

  if (!config) return;

  const shouldSave = await confirm(readline, `¿Guardar como ${DEFAULT_CONFIG_PATH}?`, true);

  if (!shouldSave) {
    return;
  }

  const savedPath = saveProjectConfig(config, DEFAULT_CONFIG_PATH);

  console.log(`\n✅ Configuración guardada en ${savedPath}\n`);
}

async function usarPreset(readline: Interface): Promise<void> {
  const availablePresets = listPresets();

  console.log("\nPresets disponibles:\n");

  for (const [index, preset] of availablePresets.entries()) {
    console.log(`  ${index + 1}. ${preset.name}`);
  }

  const raw = await readline.question("\nElige preset › ");
  const index = Number.parseInt(raw.trim(), 10) - 1;
  const selected = availablePresets[index];

  if (!selected) {
    console.log("\n❌ Opción inválida.\n");
    return;
  }

  const deviceName = await selectDeviceForPreset(readline);

  if (!deviceName) {
    console.log("\n❌ Debes seleccionar un dispositivo.\n");
    return;
  }

  const preset = getPreset(selected.key, deviceName);

  if (!preset) {
    console.log("\n❌ No se pudo cargar el preset.\n");
    return;
  }

  const validated = ExplorationConfigSchema.parse(preset.config);

  currentProject.setProject(validated, {
    name: preset.name,
    preset: selected.key,
    source: "preset",
  });

  console.log(`\n✅ Configuración cargada: ${preset.name}\n`);

  mostrarConfigActual();
  await persistIfRequested(readline);
}

async function cargarArchivo(readline: Interface): Promise<void> {
  const rawPath = (await readline.question(`Ruta del archivo [${DEFAULT_CONFIG_PATH}] › `)).trim();

  const requestedPath = rawPath || DEFAULT_CONFIG_PATH;

  const loaded = loadProjectConfig(requestedPath);

  const projectName = loaded.config.app.name ?? loaded.config.app.id;

  currentProject.setProject(loaded.config, {
    name: projectName,
    path: loaded.path,
    source: "file",
  });

  console.log(`\n✅ Configuración cargada desde ${loaded.path}\n`);
  mostrarConfigActual();

  if (requestedPath !== DEFAULT_CONFIG_PATH) {
    await persistIfRequested(readline);
  }
}

async function crearNueva(readline: Interface): Promise<void> {
  const config = await runProjectWizard(readline);

  currentProject.setProject(config, {
    name: config.app.name ?? config.app.id,
    source: "wizard",
  });

  console.log("\n✅ Configuración válida creada.\n");
  mostrarConfigActual();

  await persistIfRequested(readline);
}

async function mostrarMenuConfiguracion(readline: Interface): Promise<boolean> {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║       CONFIGURAR PROYECTO              ║");
  console.log("╚════════════════════════════════════════╝\n");

  console.log("1. Usar preset de ejemplo");
  console.log("2. Cargar exploracion.json existente");
  console.log("3. Crear configuración nueva");
  console.log("4. Ver configuración actual");
  console.log("0. Volver\n");

  const opcion = await readline.question("Elige opción › ");

  switch (opcion.trim()) {
    case "1":
      await usarPreset(readline);
      break;

    case "2":
      await cargarArchivo(readline);
      break;

    case "3":
      await crearNueva(readline);
      break;

    case "4":
      mostrarConfigActual();
      break;

    case "0":
      return false;

    default:
      console.log("\n⚠️ Opción no reconocida.\n");
  }

  await readline.question("Presiona ENTER para continuar...");

  return true;
}

export async function cmdConfigurar(readline: Interface): Promise<void> {
  while (true) {
    try {
      const continuar = await mostrarMenuConfiguracion(readline);

      if (!continuar) {
        return;
      }
    } catch (error) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : "desconocido");

      await readline.question("\nPresiona ENTER para continuar...");
    }
  }
}
