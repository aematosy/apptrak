/**
 * Verificación del entorno basada en el proyecto activo.
 */

import { execFileSync } from "node:child_process";
import { currentProject } from "../config/current-project.js";
import { buscarDriverInstalado, obtenerDriversAppiumInstalados } from "../utils/appium-drivers.js";
import { getFixturesCount, getFixturesDir } from "../utils/paths.js";
import { crearTabla, estado } from "../utils/table.js";

interface CheckResult {
  ok: boolean;
  value?: string;
}

function run(command: string, args: string[]): string {
  return execFileSync(command, args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function verificarNode(): CheckResult {
  return {
    ok: true,
    value: process.version,
  };
}

function verificarPnpm(): CheckResult {
  try {
    return {
      ok: true,
      value: run("pnpm", ["--version"]),
    };
  } catch {
    return { ok: false };
  }
}

function verificarAdb(): CheckResult {
  try {
    const firstLine = run("adb", ["--version"]).split(/\r?\n/)[0];

    return {
      ok: true,
      value: firstLine,
    };
  } catch {
    return { ok: false };
  }
}

function obtenerDispositivosAdb(): string[] {
  try {
    return run("adb", ["devices"])
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => /\sdevice$/.test(line))
      .map((line) => line.split(/\s+/)[0])
      .filter((device): device is string => Boolean(device));
  } catch {
    return [];
  }
}

function verificarDispositivo(deviceName?: string): CheckResult {
  const devices = obtenerDispositivosAdb();

  if (!deviceName) {
    return {
      ok: devices.length > 0,
      value: devices.length > 0 ? devices.join(", ") : undefined,
    };
  }

  const encontrado = devices.includes(deviceName);

  return {
    ok: encontrado,
    value: encontrado
      ? deviceName
      : `esperado: ${deviceName}; conectados: ${devices.join(", ") || "ninguno"}`,
  };
}

function verificarAppium(): CheckResult {
  try {
    return {
      ok: true,
      value: run("appium", ["--version"]),
    };
  } catch {
    return { ok: false };
  }
}

function verificarAutomationDriver(automationName?: string): CheckResult {
  if (!automationName) {
    return {
      ok: false,
      value: "sin proyecto activo",
    };
  }

  const result = obtenerDriversAppiumInstalados();

  if (!result.ok) {
    return {
      ok: false,
      value: result.error ?? "no se pudo consultar Appium",
    };
  }

  const driver = buscarDriverInstalado(result.drivers, automationName);

  return {
    ok: Boolean(driver),
    value: driver?.version,
  };
}

function verificarPackage(packageId?: string, deviceName?: string): CheckResult {
  if (!packageId) {
    return {
      ok: false,
      value: "sin proyecto activo",
    };
  }

  try {
    const args = deviceName
      ? ["-s", deviceName, "shell", "pm", "path", packageId]
      : ["shell", "pm", "path", packageId];

    const output = run("adb", args);

    return {
      ok: output.includes("package:"),
      value: packageId,
    };
  } catch {
    return {
      ok: false,
      value: packageId,
    };
  }
}

function verificarFixtures(): CheckResult {
  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    return {
      ok: false,
      value: "sin proyecto activo",
    };
  }

  const count = getFixturesCount();
  const target = currentProject.getFixtureTarget();

  return {
    ok: true,
    value: `${count} / ${target} · ${fixturesDir}`,
  };
}

export async function cmdVerificar() {
  console.log("\n📋 VERIFICANDO ENTORNO APPTRAK\n");

  const config = currentProject.getConfig();

  const node = verificarNode();
  const pnpm = verificarPnpm();
  const adb = verificarAdb();
  const dispositivo = verificarDispositivo(config?.appium.deviceName);
  const appium = verificarAppium();
  const driver = verificarAutomationDriver(config?.appium.automationName);
  const appPackage = verificarPackage(config?.app.id, config?.appium.deviceName);
  const fixtures = verificarFixtures();

  const filas = [
    {
      componente: "Node",
      estado: estado(node.ok),
      version: node.value ?? "-",
    },
    {
      componente: "pnpm",
      estado: estado(pnpm.ok),
      version: pnpm.value ?? "-",
    },
    {
      componente: "adb",
      estado: estado(adb.ok),
      version: adb.value ?? "-",
    },
    {
      componente: "Dispositivo",
      estado: estado(dispositivo.ok),
      version: dispositivo.value ?? "-",
    },
    {
      componente: "Appium",
      estado: estado(appium.ok),
      version: appium.value ?? "-",
    },
    {
      componente: config?.appium.automationName ?? "Automation driver",
      estado: estado(driver.ok),
      version: driver.value ?? "-",
    },
    {
      componente: "App package",
      estado: estado(appPackage.ok),
      version: appPackage.value ?? "-",
    },
    {
      componente: "Fixtures",
      estado: estado(fixtures.ok),
      version: fixtures.value ?? "-",
    },
  ];

  console.log(crearTabla(filas, ["componente", "estado", "version"]));

  const checks = {
    node,
    pnpm,
    adb,
    dispositivo,
    appium,
    driver,
    appPackage,
    fixtures,
  };

  const todoOk = Object.values(checks).every((check) => check.ok);

  if (todoOk) {
    console.log("\n✅ LISTO PARA CAPTURAR\n");
  } else {
    const faltantes = Object.entries(checks)
      .filter(([, check]) => !check.ok)
      .map(([name]) => name);

    console.log(`\n❌ NO LISTO\n   Faltantes: ${faltantes.join(", ")}\n`);
  }

  return {
    exito: todoOk,
    status: checks,
  };
}
