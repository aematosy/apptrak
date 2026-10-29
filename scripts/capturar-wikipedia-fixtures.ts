/**
 * PASO 2: Capturar fixtures Wikipedia para calibración H1
 * Script interactivo con verificación SHA-256 y detección de duplicados
 */

import { remote } from "webdriverio";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
import { calcularHuella } from "../src/huella/tokens.js";
import { normalizarPageSource } from "../src/normalizador/index.js";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const pregunta = (msg: string): Promise<string> =>
  new Promise((resolve) => rl.question(msg, resolve));

let driver: ReturnType<typeof remote> | null = null;
let sessionId = "";
let currentPackage = "";
let currentActivity = "";

// Registro de capturas en esta sesión
interface CapturaRegistro {
  nombre: string;
  sha256: string;
  bytes: number;
  nodos: number;
  timestamp: number;
}

const capturasRegistro: CapturaRegistro[] = [];

const conectar = async () => {
  console.log("🔗 Conectando a Appium...");
  try {
    driver = await remote({
      host: "localhost",
      port: 4723,
      path: "/",
      capabilities: {
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": "emulator-5554",
        "appium:appPackage": "org.wikipedia",
        "appium:appActivity": "org.wikipedia.main.MainActivity",
        "appium:ensureFreshStart": false,
        "appium:newCommandTimeout": 1800,
        "appium:connectHardwareKeyboard": false,
      },
    });
    console.log("✅ Conectado a Appium");

    // Esperar a que la sesión se estabilice
    await driver.pause(2000);
    console.log("✅ Sesión estabilizada\n");

    // Obtener sessionId y datos de la sesión
    try {
      const sessionData = (driver as any).sessionId;
      sessionId = sessionData || "unknown";
      currentPackage = "org.wikipedia";
      currentActivity = "org.wikipedia.main.MainActivity";
    } catch (e) {
      sessionId = "unknown";
      currentPackage = "org.wikipedia";
      currentActivity = "org.wikipedia.main.MainActivity";
    }

    console.log(`📱 Session: ${sessionId.substring(0, 12)}...`);
    console.log(`📦 Package: ${currentPackage}\n`);
  } catch (e) {
    console.error("❌ Error conectando:", (e as Error).message);
    process.exit(1);
  }
};

const calcularSHA256 = (data: string): string => {
  return createHash("sha256").update(data).digest("hex");
};

const esperar = async (ms: number) => {
  if (!driver) return;
  await driver.pause(ms);
};

const estabilizarPantalla = async (): Promise<string> => {
  if (!driver) return "";

  console.log("   Esperando estabilización de UI...");
  let xmlAnterior = "";
  let xmlActual = "";
  let intentos = 0;
  const maxIntentos = 3;

  for (let i = 0; i < maxIntentos; i++) {
    try {
      xmlActual = await driver.getPageSource();

      if (xmlAnterior && xmlAnterior === xmlActual) {
        console.log(`   ✓ UI estable (intento ${i + 1})`);
        return xmlActual;
      }

      xmlAnterior = xmlActual;
      if (i < maxIntentos - 1) {
        await driver.pause(500);
      }
    } catch (e) {
      console.error(`   ⚠ Error en intento ${i + 1}:`, (e as Error).message);
      if (i === maxIntentos - 1) throw e;
      await driver.pause(500);
    }
  }

  return xmlActual;
};

const capturar = async (nombre: string) => {
  if (!driver) {
    console.log("❌ Sin sesión activa");
    return;
  }

  try {
    console.log(`\n📸 Capturando: ${nombre}`);
    const inicioTotal = Date.now();

    // Estabilizar pantalla
    const xml = await estabilizarPantalla();
    const inicioAnalisis = Date.now();

    // Calcular SHA-256
    const sha256 = calcularSHA256(xml);
    const sha256Corto = sha256.substring(0, 12);
    const xmlBytes = xml.length;

    // Verificar duplicados
    const capturaDuplicada = capturasRegistro.find((c) => c.sha256 === sha256);

    if (capturaDuplicada) {
      console.log(`\n⚠️  CAPTURA DUPLICADA`);
      console.log(`   Este pageSource es idéntico al fixture: ${capturaDuplicada.nombre}`);
      console.log(`   SHA-256: ${sha256Corto}...`);
      console.log(`   NO se guardará (no sobrescribir)\n`);
      return;
    }

    // Análisis
    const arbol = normalizarPageSource(xml, { platform: "android" });
    const huella = calcularHuella(arbol);
    const nodosVisibles = arbol.nodos.filter((n) => n.visible).length;
    const nodosInteractivos = arbol.nodos.filter(
      (n) => n.visible && n.habilitado && (n.clickable || n.scrollable)
    ).length;

    // Intentar obtener activity actual
    let activity = "";
    try {
      activity = await driver.getCurrentActivity();
    } catch (e) {
      activity = "unknown";
    }

    // Guardar
    mkdirSync("test/fixtures/arboles/wikipedia-redo", { recursive: true });
    writeFileSync(`test/fixtures/arboles/wikipedia-redo/${nombre}.xml`, xml);

    try {
      const png = await driver.takeScreenshot();
      writeFileSync(
        `test/fixtures/arboles/wikipedia-redo/${nombre}.png`,
        Buffer.from(png, "base64")
      );
    } catch (e) {
      console.log("   ⚠ No se pudo capturar screenshot");
    }

    const metadata = {
      nombre,
      timestamp: new Date().toISOString(),
      sessionId: sessionId.substring(0, 12),
      app: currentPackage,
      activity,
      sha256,
      xmlBytes,
      totales: arbol.nodos.length,
      visibles: nodosVisibles,
      interactivos: nodosInteractivos,
      huella: huella.hash,
      tiempoAnalisis: Date.now() - inicioAnalisis,
      tiempoTotal: Date.now() - inicioTotal,
    };

    writeFileSync(
      `test/fixtures/arboles/wikipedia-redo/${nombre}.json`,
      JSON.stringify(metadata, null, 2)
    );

    // Registrar captura
    capturasRegistro.push({
      nombre,
      sha256,
      bytes: xmlBytes,
      nodos: arbol.nodos.length,
      timestamp: Date.now(),
    });

    console.log(`\n✅ NUEVO ESTADO CAPTURADO`);
    console.log(`   Fixture: ${nombre}`);
    console.log(`   Session: ${sessionId.substring(0, 12)}...`);
    console.log(`   Package: ${currentPackage}`);
    console.log(`   Activity: ${activity}`);
    console.log(`   SHA-256: ${sha256Corto}...`);
    console.log(`   XML Bytes: ${xmlBytes}`);
    console.log(`   Nodos: ${arbol.nodos.length} (visibles: ${nodosVisibles}, interactivos: ${nodosInteractivos})`);
    console.log(`   Huella: ${huella.hash}`);
    console.log(`   Tiempo total: ${metadata.tiempoTotal}ms\n`);
  } catch (e) {
    console.error("❌ Error capturando:", (e as Error).message);
  }
};

const mostrarStatus = async () => {
  console.log(`\n📊 STATUS DE CAPTURA`);
  console.log(`   Session: ${sessionId.substring(0, 12)}...`);
  console.log(`   Package: ${currentPackage}`);
  console.log(`   Activity: ${currentActivity}`);

  try {
    if (driver) {
      const activity = await driver.getCurrentActivity();
      console.log(`   Activity actual: ${activity}`);
    }
  } catch (e) {
    // Ignorar error
  }

  console.log(`   Capturas únicas: ${capturasRegistro.length}`);
  if (capturasRegistro.length > 0) {
    const ultima = capturasRegistro[capturasRegistro.length - 1];
    console.log(`   Última captura: ${ultima.nombre}`);
    console.log(`   Último SHA: ${ultima.sha256.substring(0, 12)}...`);
    console.log(`   Nodos en última: ${ultima.nodos}`);
  }
  console.log();
};

const tapPorTexto = async (texto: string) => {
  if (!driver) return;
  try {
    const elementos = await driver.$$(
      `//android.widget.Button | //android.widget.TextView`
    );
    for (const el of elementos) {
      try {
        const elTexto = await el.getText();
        if (elTexto.includes(texto)) {
          await el.click();
          console.log(`✓ Tap en: ${texto}`);
          await driver.pause(800);
          return;
        }
      } catch (e) {
        // Ignorar error en elemento
      }
    }
    console.log(`⚠ No encontrado: ${texto}`);
  } catch (e) {
    console.error("❌ Error en tap:", (e as Error).message);
  }
};

const escribirTexto = async (texto: string) => {
  if (!driver) return;
  try {
    const searchBox = await driver.$("//android.widget.EditText");
    if (await searchBox.isDisplayed()) {
      await searchBox.click();
      await searchBox.setValue(texto);
      console.log(`✓ Texto ingresado: ${texto}`);
      await driver.pause(800);
    } else {
      console.log("⚠ Search box no visible");
    }
  } catch (e) {
    console.error("❌ Error escribiendo:", (e as Error).message);
  }
};

const atras = async () => {
  if (!driver) return;
  try {
    await driver.back();
    console.log("✓ Atrás");
    await driver.pause(800);
  } catch (e) {
    console.error("❌ Error volviendo atrás:", (e as Error).message);
  }
};

const limpiarFixtures = async () => {
  const dir = "test/fixtures/arboles/wikipedia-redo";
  try {
    const archivos = readdirSync(dir);
    for (const archivo of archivos) {
      if (archivo.startsWith("wikipedia-")) {
        const path = `${dir}/${archivo}`;
        // No borrar, solo notificar
        console.log(`⚠ Fixture existente: ${archivo}`);
      }
    }
  } catch (e) {
    // Directorio no existe, ok
  }
};

const mostrarMenu = () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  CAPTURA WIKIPEDIA FIXTURES - PASO 2                          ║
║  Con verificación SHA-256 y detección de duplicados           ║
╠════════════════════════════════════════════════════════════════╣
║ Comandos:                                                      ║
║  c <nombre>    - Capturar pantalla actual                     ║
║  tap <texto>   - Tap en elemento                              ║
║  write <texto> - Escribir en search box                       ║
║  back          - Volver atrás                                 ║
║  status        - Mostrar estado de captura                    ║
║  pause <ms>    - Pausa (ej: pause 1000)                       ║
║  help          - Este menú                                    ║
║  exit          - Terminar                                     ║
╚════════════════════════════════════════════════════════════════╝
`);
};

const main = async () => {
  await conectar();
  await limpiarFixtures();
  mostrarMenu();

  console.log(`📋 Guía de capturas recomendadas (PASO 2 - Redo):`);
  console.log(`\n✅ Pantallas DISTINTAS a capturar:\n`);
  console.log(`  1. wikipedia-01-onboarding     — Pantalla inicial/onboarding`);
  console.log(`  2. wikipedia-02-home-tab       — Home/Explore principal`);
  console.log(`  3. wikipedia-03-home-scroll    — Home después de scroll`);
  console.log(`  4. wikipedia-04-search-empty   — Search box abierto, sin texto`);
  console.log(`  5. wikipedia-05-search-typed   — Con texto "Python" ingresado`);
  console.log(`  6. wikipedia-06-results        — Resultados de búsqueda`);
  console.log(`  7. wikipedia-07-article-top    — Artículo (top, sin scroll)`);
  console.log(`  8. wikipedia-08-article-mid    — Mismo artículo (scrolled mid)`);
  console.log(`  9. wikipedia-09-article-bottom — Mismo artículo (scrolled bottom)`);
  console.log(`  10. wikipedia-10-menu          — Menú lateral abierto`);
  console.log(`  11. wikipedia-11-settings      — Pantalla de configuración`);
  console.log(`  12. wikipedia-12-language      — Selección de idioma`);
  console.log(`\n💡 Después de cada captura verifica el SHA-256.`);
  console.log(`   Si ves "CAPTURA DUPLICADA", navega a OTRA pantalla realmente distinta.\n`);

  while (true) {
    const input = await pregunta(">> ");
    const [cmd, ...args] = input.trim().split(" ");

    if (cmd === "exit") break;
    if (cmd === "help") {
      mostrarMenu();
      continue;
    }
    if (cmd === "status") {
      await mostrarStatus();
      continue;
    }
    if (cmd === "c") {
      await capturar(args.join(" "));
      continue;
    }
    if (cmd === "tap") {
      await tapPorTexto(args.join(" "));
      continue;
    }
    if (cmd === "write") {
      await escribirTexto(args.join(" "));
      continue;
    }
    if (cmd === "back") {
      await atras();
      continue;
    }
    if (cmd === "pause") {
      const ms = parseInt(args[0]) || 1000;
      await driver?.pause(ms);
      console.log(`⏸ Pausa ${ms}ms`);
      continue;
    }
    console.log("❓ Comando no reconocido. Escribe 'help'");
  }

  if (driver) {
    await driver.deleteSession();
    console.log("\n✅ Sesión cerrada");
  }
  rl.close();
};

main().catch(console.error);

