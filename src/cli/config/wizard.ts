import type { Interface } from "node:readline/promises";
import { type ExplorationConfig, ExplorationConfigSchema } from "../../config/schemas.js";
import { getConnectedAndroidDevices } from "./devices.js";
import { getForegroundAndroidPackage } from "./foreground-app.js";

async function ask(readline: Interface, label: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const value = (await readline.question(`${label}${suffix}: `)).trim();

  return value || defaultValue || "";
}

async function askPositiveNumber(
  readline: Interface,
  label: string,
  defaultValue: number,
): Promise<number> {
  while (true) {
    const raw = await ask(readline, label, String(defaultValue));
    const value = Number(raw);

    if (Number.isInteger(value) && value > 0) {
      return value;
    }

    console.log("❌ Ingresa un número entero mayor que 0.");
  }
}

async function selectDevice(readline: Interface): Promise<string> {
  while (true) {
    const devices = getConnectedAndroidDevices();

    console.log("\nDispositivos detectados:\n");

    if (devices.length === 0) {
      console.log("  No se detectaron dispositivos Android.");
    } else {
      for (const [index, device] of devices.entries()) {
        console.log(`  ${index + 1}. ${device}`);
      }
    }

    const manualOption = devices.length + 1;
    const refreshOption = devices.length + 2;

    console.log(`  ${manualOption}. Introducir manualmente`);
    console.log(`  ${refreshOption}. Refrescar dispositivos`);

    const raw = await readline.question("\nSelecciona dispositivo › ");

    const index = Number.parseInt(raw.trim(), 10) - 1;

    if (index >= 0 && index < devices.length) {
      const selected = devices[index];

      if (selected) {
        return selected;
      }
    }

    if (index === devices.length) {
      const manual = await ask(readline, "Device name / serial");

      if (manual) {
        return manual;
      }

      console.log("❌ El dispositivo no puede estar vacío.");
      continue;
    }

    if (index === devices.length + 1) {
      console.log("\n🔄 Actualizando dispositivos...");
      continue;
    }

    console.log("❌ Opción inválida.");
  }
}

async function selectPlatform(readline: Interface): Promise<"android" | "ios"> {
  console.log("\nPlataforma:");
  console.log("  1. Android");
  console.log("  2. iOS");

  while (true) {
    const choice = (await readline.question("\nSelecciona plataforma › ")).trim();

    if (choice === "1") {
      return "android";
    }

    if (choice === "2") {
      return "ios";
    }

    console.log("❌ Opción inválida.");
  }
}

async function buildPrecondition(readline: Interface): Promise<ExplorationConfig["precondition"]> {
  console.log("\nPrecondición:");
  console.log("  1. Ya iniciada");
  console.log("  2. Comando");

  while (true) {
    const choice = (await readline.question("\nSelecciona precondición › ")).trim();

    if (choice === "1") {
      return {
        type: "ya-iniciada",
      };
    }

    if (choice === "2") {
      const command = await ask(readline, "Comando");

      if (!command) {
        console.log("❌ El comando no puede estar vacío.");
        continue;
      }

      return {
        type: "comando",
        command,
      };
    }

    console.log("❌ Selecciona 1 o 2.");
  }
}

async function selectAndroidApp(readline: Interface, deviceName: string): Promise<string> {
  while (true) {
    const detectedPackage = getForegroundAndroidPackage(deviceName);

    if (detectedPackage) {
      console.log(`\n📱 App detectada en foreground: ${detectedPackage}`);

      console.log("\n  1. Usar app detectada");
      console.log("  2. Introducir package manualmente");
      console.log("  3. Refrescar app foreground");

      const choice = (await readline.question("\nSelecciona opción › ")).trim();

      if (choice === "1") {
        return detectedPackage;
      }

      if (choice === "2") {
        const manualPackage = await ask(readline, "Package");

        if (manualPackage) {
          return manualPackage;
        }

        console.log("❌ El package no puede estar vacío.");
        continue;
      }

      if (choice === "3") {
        console.log("\n🔄 Actualizando app foreground...");
        continue;
      }

      console.log("❌ Opción inválida.");
      continue;
    }

    console.log("\n⚠️ No se pudo detectar automáticamente la app en foreground.");

    console.log("\n  1. Refrescar");
    console.log("  2. Introducir package manualmente");

    const choice = (await readline.question("\nSelecciona opción › ")).trim();

    if (choice === "1") {
      console.log("\n🔄 Actualizando app foreground...");
      continue;
    }

    if (choice === "2") {
      const manualPackage = await ask(readline, "Package");

      if (manualPackage) {
        return manualPackage;
      }

      console.log("❌ El package no puede estar vacío.");
      continue;
    }

    console.log("❌ Opción inválida.");
  }
}

export async function runProjectWizard(readline: Interface): Promise<ExplorationConfig> {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║       NUEVA CONFIGURACIÓN APPTRAK      ║");
  console.log("╚════════════════════════════════════════╝\n");

  const name = await ask(readline, "Nombre del proyecto");

  if (!name) {
    throw new Error("El nombre del proyecto es obligatorio");
  }

  const platform = await selectPlatform(readline);

  let deviceName: string;

  if (platform === "android") {
    deviceName = await selectDevice(readline);
  } else {
    deviceName = await ask(readline, "Device name");
  }

  if (!deviceName) {
    throw new Error("El dispositivo es obligatorio");
  }

  let appId: string;

  if (platform === "android") {
    appId = await selectAndroidApp(readline, deviceName);
  } else {
    appId = await ask(readline, "Bundle ID");
  }

  if (!appId) {
    throw new Error("El identificador de la app es obligatorio");
  }

  const appiumUrl = await ask(readline, "Appium URL", "http://localhost:4723");

  const automationName = platform === "android" ? "UiAutomator2" : "XCUITest";

  console.log(`Automation driver: ${automationName}`);

  const fixtureTarget = await askPositiveNumber(readline, "Objetivo de fixtures", 12);

  const maxScreens = await askPositiveNumber(readline, "Máximo de pantallas", 100);

  const maxActions = await askPositiveNumber(readline, "Máximo de acciones", 500);

  const maxMinutes = await askPositiveNumber(readline, "Máximo de minutos", 90);

  const precondition = await buildPrecondition(readline);

  const rawConfig = {
    app: {
      id: appId,
      name,
      platform,
    },
    appium: {
      url: appiumUrl,
      automationName,
      deviceName,
    },
    precondition,
    data: {
      file: "datos.json",
    },
    limits: {
      maxScreens,
      maxActions,
      maxMinutes,
    },
    exclusions: {},
    fingerprint: {
      umbral: 0.85,
    },
    checkpoint: {
      file: "estado.json",
      intervalActions: 50,
    },
    output: {
      dir: "exploraciones",
    },
    reference: {
      fixtureTarget,
    },
  };

  return ExplorationConfigSchema.parse(rawConfig);
}
