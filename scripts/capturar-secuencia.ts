#!/usr/bin/env tsx
/**
 * Script interactivo para capturar múltiples pantallas de Wikipedia
 * Uso: pnpm run capturar-secuencia
 *
 * Acciones recomendadas:
 * 1. "onboarding" - comenzar a explorar
 * 2. "home" - pantalla principal
 * 3. "search" - pantalla de búsqueda
 * 4. "articulo" - artículo específico
 * 5. "guardados" - artículos guardados
 * 6. "historial" - historial de visitas
 * 7. "ajustes" - configuración
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { remote } from "webdriverio";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const pregunta = (msg: string): Promise<string> =>
  new Promise((resolve) => rl.question(msg, resolve));

let driver: ReturnType<typeof remote> | null = null;

const conectar = async () => {
  if (driver) return;
  console.log("Conectando a Appium...");
  driver = await remote({
    hostname: "localhost",
    port: 4723,
    path: "/",
    logLevel: "warn",
    capabilities: {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": "emulator-5554",
      "appium:autoLaunch": false,
      "appium:newCommandTimeout": 600,
    },
  });
  console.log("✓ Conectado\n");
};

const capturar = async (nombre: string) => {
  if (!driver) {
    console.log("No hay conexión");
    return;
  }

  const xml = await driver.getPageSource();
  mkdirSync("test/fixtures/arboles", { recursive: true });
  const ruta = `test/fixtures/arboles/${nombre}.xml`;
  writeFileSync(ruta, xml);

  const resourceIds = (xml.match(/resource-id="[^"]*"/g) ?? []).length;
  const contentDescs = (xml.match(/content-desc="[^"]*"/g) ?? []).length;
  const textos = (xml.match(/text="[^"]{1,}"/g) ?? []).filter(
    (t) => !t.includes('text=""')
  ).length;
  const clickables = (xml.match(/clickable="true"/g) ?? []).length;

  console.log(
    `\n✓ Capturado: ${nombre}.xml (${xml.length} bytes)\n` +
      `  resource-ids: ${resourceIds} | content-descs: ${contentDescs}\n` +
      `  textos: ${textos} | clickables: ${clickables}\n`
  );
};

const tapPorTexto = async (texto: string) => {
  if (!driver) return;
  const elementos = await driver.$$(`android=new UiSelector().text("${texto}")`);
  if (elementos.length > 0) {
    await elementos[0].click();
    console.log(`  ✓ Tapped: ${texto}`);
    await driver.pause(1500); // Esperar a que cargue
  } else {
    console.log(`  ✗ Elemento no encontrado: ${texto}`);
  }
};

const tapPorIndex = async (index: number) => {
  if (!driver) return;
  const elementos = await driver.$$(`android=new UiSelector()`);
  if (elementos[index]) {
    await elementos[index].click();
    console.log(`  ✓ Tapped elemento ${index}`);
    await driver.pause(1500);
  }
};

const atras = async () => {
  if (!driver) return;
  await driver.back();
  console.log("  ✓ Back");
  await driver.pause(1000);
};

const mostrarMenu = () => {
  console.log("\n--- MENÚ ---");
  console.log("  capturar <nombre>   - Capturar pantalla actual");
  console.log("  tap <texto>         - Tap en elemento por texto");
  console.log("  atras               - Botón atrás");
  console.log("  estado              - Ver actividad actual");
  console.log("  listar              - Listar capturas");
  console.log("  salir               - Cerrar");
  console.log("-----------\n");
};

const main = async () => {
  await conectar();
  mostrarMenu();

  while (true) {
    const cmd = await pregunta("apptrak-fixtures> ");
    const [accion, ...args] = cmd.trim().split(" ");

    try {
      if (accion === "capturar") {
        await capturar(args[0] ?? "captura-" + Date.now());
      } else if (accion === "tap") {
        await tapPorTexto(args.join(" "));
      } else if (accion === "atras") {
        await atras();
      } else if (accion === "estado") {
        if (!driver) return;
        const activity = await driver.getCurrentActivity();
        console.log(`  Actividad: ${activity}\n`);
      } else if (accion === "listar") {
        const fs = await import("node:fs/promises");
        const files = await fs.readdir("test/fixtures/arboles");
        files
          .filter((f) => f.endsWith(".xml"))
          .forEach((f) => console.log(`    ${f}`));
        console.log();
      } else if (accion === "salir") {
        break;
      } else if (accion === "ayuda" || accion === "h") {
        mostrarMenu();
      } else {
        console.log('  ? Comando desconocido. Escribe "ayuda"\n');
      }
    } catch (e) {
      console.log(`  Error: ${(e as Error).message}\n`);
    }
  }

  if (driver) await driver.deleteSession();
  rl.close();
  console.log("Cerrado");
};

main().catch(console.error);
