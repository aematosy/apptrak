import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createInterface, emitKeypressEvents } from "node:readline";
import { remote } from "webdriverio";
import { calcularLocatorsArbol, estadisticasCalidad } from "../src/calidad/index.js";
import { submenuInfo, submenuOption, submenuSection, submenuTitle } from "../src/cli/ui/submenu.js";
import { FlowSession } from "../src/flow/session.js";
import { calcularHuella } from "../src/huella/tokens.js";
import { normalizarPageSource } from "../src/normalizador/index.js";

const projectName = process.env.APPTRAK_PROJECT_NAME?.trim() || "Proyecto Apptrak";

const platform = process.env.APPTRAK_PLATFORM?.trim() || "android";

const deviceName = process.env.APPTRAK_DEVICE?.trim();

const appPackage = process.env.APPTRAK_PACKAGE?.trim();

const automationName = process.env.APPTRAK_AUTOMATION_NAME?.trim() || "UiAutomator2";

const appiumUrl = process.env.APPTRAK_APPIUM_URL?.trim() || "http://localhost:4723";

const fixturesDir = process.env.APPTRAK_FIXTURES_DIR?.trim();

const fixtureTarget = Number(process.env.APPTRAK_FIXTURE_TARGET ?? "12");

if (platform !== "android") {
  throw new Error(`PASO 2 E0 todavía soporta Android. Plataforma recibida: ${platform}`);
}

if (!deviceName) {
  throw new Error("Falta APPTRAK_DEVICE");
}

if (!appPackage) {
  throw new Error("Falta APPTRAK_PACKAGE");
}

if (!fixturesDir) {
  throw new Error("Falta APPTRAK_FIXTURES_DIR");
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

let escapeRequested = false;

if (process.stdin.isTTY) {
  emitKeypressEvents(process.stdin);

  process.stdin.on("keypress", (_value, key) => {
    if (key.name === "escape") {
      escapeRequested = true;
    }
  });
}

function consumeEscape(): boolean {
  if (!escapeRequested) {
    return false;
  }

  escapeRequested = false;
  return true;
}

async function preguntarOpcion(mensaje: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return pregunta(mensaje);
  }

  return new Promise((resolve) => {
    let completed = false;

    const onKeypress = (_value: string, key: { name?: string }): void => {
      if (key.name === "escape" && !completed) {
        completed = true;
        process.stdin.off("keypress", onKeypress);

        resolve("__ESC__");
      }
    };

    process.stdin.on("keypress", onKeypress);

    pregunta(mensaje).then((value) => {
      if (completed) {
        return;
      }

      completed = true;

      process.stdin.off("keypress", onKeypress);

      resolve(value);
    });
  });
}

const pregunta = (mensaje: string): Promise<string> =>
  new Promise((resolve) => rl.question(mensaje, resolve));

interface CapturaRegistro {
  nombre: string;
  sha256: string;
  bytes: number;
  nodos: number;
  timestamp: number;
}

const capturasRegistro: CapturaRegistro[] = [];

let driver: Awaited<ReturnType<typeof remote>> | null = null;

let sessionId = "";
let currentPackage = appPackage;

function calcularSHA256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function conectar(): Promise<void> {
  console.log("\n🔗 Conectando a Appium...");
  console.log(`   Proyecto: ${projectName}`);
  console.log(`   Device:   ${deviceName}`);
  console.log(`   Package:  ${appPackage}`);
  console.log(`   Appium:   ${appiumUrl}\n`);

  const parsedUrl = new URL(appiumUrl);

  driver = await remote({
    logLevel: "silent",
    protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
    hostname: parsedUrl.hostname,
    port: Number(parsedUrl.port || (parsedUrl.protocol === "https:" ? "443" : "80")),
    path: parsedUrl.pathname === "/" ? "/" : parsedUrl.pathname,
    capabilities: {
      platformName: "Android",
      "appium:automationName": automationName,
      "appium:deviceName": deviceName,
      "appium:udid": deviceName,
      "appium:appPackage": appPackage,

      // La app ya está abierta por diseño del flujo E0.
      "appium:autoLaunch": false,
      "appium:noReset": true,
      "appium:dontStopAppOnReset": true,

      "appium:newCommandTimeout": 1800,
    },
  });

  sessionId = driver.sessionId || "unknown";

  try {
    const detectedPackage = await driver.getCurrentPackage();

    if (detectedPackage) {
      currentPackage = detectedPackage;
    }
  } catch {
    currentPackage = appPackage;
  }

  await driver.pause(1500);

  console.log("✅ Sesión Appium creada");
  console.log(`📱 Session: ${sessionId.substring(0, 12)}...`);
  console.log(`📦 Package actual: ${currentPackage}\n`);

  if (currentPackage !== appPackage) {
    console.log("⚠️ ADVERTENCIA: la app foreground no coincide con el package configurado.");
    console.log(`   Configurado: ${appPackage}`);
    console.log(`   Foreground:  ${currentPackage}\n`);
  }
}

async function estabilizarPantalla(): Promise<string> {
  if (!driver) {
    throw new Error("No existe sesión Appium");
  }

  console.log("   Esperando estabilización de UI...");

  let anterior = "";
  let actual = "";

  for (let intento = 0; intento < 3; intento++) {
    actual = await driver.getPageSource();

    if (anterior && anterior === actual) {
      console.log(`   ✓ UI estable (intento ${intento + 1})`);

      return actual;
    }

    anterior = actual;

    if (intento < 2) {
      await driver.pause(500);
    }
  }

  return actual;
}

function existeSha(sha256: string): CapturaRegistro | undefined {
  return capturasRegistro.find((captura) => captura.sha256 === sha256);
}

async function capturar(nombre: string): Promise<void> {
  if (!driver) {
    console.log("❌ Sin sesión activa");
    return;
  }

  const limpio = nombre.trim();

  if (!limpio) {
    console.log("❌ Debes indicar un nombre.");
    return;
  }

  const xmlExistente = `${fixturesDir}/${limpio}.xml`;
  const jsonExistente = `${fixturesDir}/${limpio}.json`;
  const catalogoExistente = `${fixturesDir}/${limpio}.catalog.json`;

  if (existsSync(xmlExistente) || existsSync(jsonExistente) || existsSync(catalogoExistente)) {
    console.log(`\n⚠️ El estado "${limpio}" ya existe.`);
    console.log("   Usa otro nombre para evitar sobrescribir evidencia.\n");
    return;
  }

  console.log(`\n📸 Capturando: ${limpio}`);

  const inicioTotal = Date.now();

  const xml = await estabilizarPantalla();

  const inicioAnalisis = Date.now();

  const sha256 = calcularSHA256(xml);

  const shaCorto = sha256.substring(0, 12);

  const duplicada = existeSha(sha256);

  if (duplicada) {
    console.log("\n⚠️ CAPTURA DUPLICADA");
    console.log(`   Igual a: ${duplicada.nombre}`);
    console.log(`   SHA-256: ${shaCorto}...`);
    console.log("   No se guardará.\n");
    return;
  }

  const arbol = normalizarPageSource(xml, {
    platform: "android",
  });

  const huella = calcularHuella(arbol);

  const locatorsMap = calcularLocatorsArbol(arbol);
  const calidadLocators = estadisticasCalidad(locatorsMap);

  const nodosVisibles = arbol.nodos.filter((nodo) => nodo.visible).length;

  const nodosInteractivos = arbol.nodos.filter(
    (nodo) => nodo.visible && nodo.habilitado && (nodo.clickable || nodo.scrollable),
  ).length;

  let activity = "unknown";

  try {
    activity = await driver.getCurrentActivity();
  } catch {
    // Metadata opcional.
  }

  try {
    const detectedPackage = await driver.getCurrentPackage();

    if (detectedPackage) {
      currentPackage = detectedPackage;
    }
  } catch {
    // Mantener package previo.
  }

  mkdirSync(fixturesDir, {
    recursive: true,
  });

  writeFileSync(`${fixturesDir}/${limpio}.xml`, xml);

  try {
    const png = await driver.takeScreenshot();

    writeFileSync(`${fixturesDir}/${limpio}.png`, Buffer.from(png, "base64"));
  } catch {
    console.log("   ⚠ No se pudo capturar screenshot");
  }

  const metadata = {
    nombre: limpio,
    project: projectName,
    timestamp: new Date().toISOString(),
    sessionId: sessionId.substring(0, 12),
    platform,
    deviceName,
    app: currentPackage,
    configuredPackage: appPackage,
    activity,
    sha256,
    xmlBytes: xml.length,
    totales: arbol.nodos.length,
    visibles: nodosVisibles,
    interactivos: nodosInteractivos,
    huella: huella.hash,
    tiempoAnalisis: Date.now() - inicioAnalisis,
    tiempoTotal: Date.now() - inicioTotal,
  };

  writeFileSync(`${fixturesDir}/${limpio}.json`, JSON.stringify(metadata, null, 2));

  const elementos = arbol.nodos
    .map((nodo, indice) => ({
      indice,
      nodo,
      locator: locatorsMap.get(indice) ?? null,
    }))
    .filter(({ nodo }) => {
      const esEditable = nodo.habilitado && nodo.clase.endsWith("EditText");

      return nodo.clickable || nodo.scrollable || nodo.checkable || esEditable;
    });

  const catalogo = {
    schemaVersion: 1,
    project: projectName,
    screen: limpio,
    timestamp: new Date().toISOString(),
    platform,
    deviceName,
    package: currentPackage,
    activity,
    fingerprint: {
      hash: huella.hash,
    },
    quality: calidadLocators,
    summary: {
      totalNodes: arbol.nodos.length,
      visibleNodes: nodosVisibles,
      interactiveNodes: nodosInteractivos,
      catalogElements: elementos.length,
    },
    elements: elementos,
  };

  writeFileSync(`${fixturesDir}/${limpio}.catalog.json`, JSON.stringify(catalogo, null, 2));

  capturasRegistro.push({
    nombre: limpio,
    sha256,
    bytes: xml.length,
    nodos: arbol.nodos.length,
    timestamp: Date.now(),
  });

  console.log("\n✅ NUEVO ESTADO CAPTURADO");
  console.log(`   Fixture: ${limpio}`);
  console.log(`   Package: ${currentPackage}`);
  console.log(`   Activity: ${activity}`);
  console.log(`   SHA-256: ${shaCorto}...`);
  console.log(`   Nodos: ${arbol.nodos.length}`);
  console.log(`   Visibles: ${nodosVisibles}`);
  console.log(`   Interactivos: ${nodosInteractivos}`);
  console.log(`   Huella: ${huella.hash}`);
  console.log(
    `   Locators estables: ${calidadLocators.conLocatorEstable}/${calidadLocators.totalNodos}`,
  );
  console.log(`   Calidad estable/media: ${calidadLocators.porcentajeEstableOMedia.toFixed(1)}%`);
  console.log(`   Catálogo: ${limpio}.catalog.json`);
  console.log(`   Directorio: ${fixturesDir}\n`);
}

async function mostrarStatus(): Promise<void> {
  console.log("\n📊 STATUS DE CAPTURA");
  console.log(`   Proyecto: ${projectName}`);
  console.log(`   Device: ${deviceName}`);
  console.log(`   Package configurado: ${appPackage}`);

  if (driver) {
    try {
      currentPackage = await driver.getCurrentPackage();
    } catch {
      // Mantener valor anterior.
    }
  }

  console.log(`   Package foreground: ${currentPackage}`);
  console.log(`   Directorio: ${fixturesDir}`);
  console.log(`   Capturas sesión: ${capturasRegistro.length}`);
  console.log(`   Objetivo referencia: ${fixtureTarget}`);

  if (capturasRegistro.length > 0) {
    const ultima = capturasRegistro.at(-1);

    if (ultima) {
      console.log(`   Última: ${ultima.nombre}`);
      console.log(`   SHA: ${ultima.sha256.substring(0, 12)}...`);
    }
  }

  console.log();
}

async function tapPorTexto(texto: string): Promise<void> {
  if (!driver) return;

  const target = texto.trim();

  if (!target) {
    console.log("❌ Debes indicar texto.");
    return;
  }

  try {
    const escaped = target.replace(/'/g, "\\'");

    const elemento = await driver.$(`//*[@text='${escaped}' or @content-desc='${escaped}']`);

    if (await elemento.isExisting()) {
      await elemento.click();
      console.log(`✓ Tap en: ${target}`);
      await driver.pause(800);
      return;
    }

    console.log(`⚠ No encontrado: ${target}`);
  } catch (error) {
    console.error("❌ Error en tap:", error instanceof Error ? error.message : "desconocido");
  }
}

async function escribirTexto(texto: string): Promise<void> {
  if (!driver) return;

  try {
    const inputs = await driver.$$("//android.widget.EditText");

    const input = inputs[0];

    if (!input) {
      console.log("⚠ No hay EditText visible");
      return;
    }

    await input.click();
    await input.setValue(texto);

    console.log(`✓ Texto ingresado: ${texto}`);

    await driver.pause(800);
  } catch (error) {
    console.error("❌ Error escribiendo:", error instanceof Error ? error.message : "desconocido");
  }
}

async function atras(): Promise<void> {
  if (!driver) return;

  try {
    await driver.back();
    console.log("✓ Atrás");
    await driver.pause(800);
  } catch (error) {
    console.error(
      "❌ Error volviendo atrás:",
      error instanceof Error ? error.message : "desconocido",
    );
  }
}

function mostrarFixturesExistentes(): void {
  try {
    const archivos = readdirSync(fixturesDir).filter((archivo) => archivo.endsWith(".xml"));

    if (archivos.length === 0) {
      return;
    }

    console.log("\n📂 Fixtures existentes:");

    for (const archivo of archivos) {
      console.log(`   - ${archivo}`);
    }

    console.log();
  } catch {
    // Directorio nuevo.
  }
}

function obtenerSiguienteNombreAutomatico(): string {
  let maximo = 0;

  try {
    const archivos = readdirSync(fixturesDir);

    for (const archivo of archivos) {
      const match = archivo.match(/^screen-(\d+)\.xml$/);

      const value = match?.[1];

      if (!value) {
        continue;
      }

      const numero = Number.parseInt(value, 10);

      maximo = Math.max(maximo, numero);
    }
  } catch {
    // Dataset nuevo.
  }

  return `screen-${String(maximo + 1).padStart(2, "0")}`;
}

async function confirmarSalida(): Promise<boolean> {
  console.log("\n⚠️ ¿Quieres terminar la sesión de captura?");
  console.log("   La sesión Appium se cerrará correctamente.");

  const respuesta = (await pregunta("\nSalir de captura? [s/N] › ")).trim().toLowerCase();

  return ["s", "si", "sí", "y", "yes"].includes(respuesta);
}

function mostrarMenu(): void {
  console.log(submenuTitle("CAPTURE SESSION"));

  console.log(submenuSection("SESSION"));
  console.log(submenuInfo("Proyecto", projectName));
  console.log(submenuInfo("Dispositivo", deviceName));
  console.log(submenuInfo("Package", appPackage));
  console.log(submenuInfo("Capturas", `${capturasRegistro.length} / ${fixtureTarget}`));
  console.log(submenuInfo("Salida", fixturesDir));

  console.log();
  console.log(submenuSection("CAPTURE"));
  console.log(submenuOption("1", "Capturar pantalla actual"));
  console.log(submenuOption("2", "Capturar con nombre"));
  console.log(submenuOption("3", "Ver estado de captura"));

  console.log();
  console.log(submenuSection("FLOW"));
  console.log(submenuOption("4", "Grabar flow"));
  console.log(submenuOption("5", "Ver flows grabados"));

  console.log();
  console.log(submenuSection("TOOLS"));
  console.log(submenuOption("6", "Navegación / acciones"));
  console.log(submenuOption("7", "Pausar"));

  console.log();
  console.log(submenuOption("0", "Terminar sesión"));
  console.log();
}

async function grabarFlow(): Promise<void> {
  if (!driver) {
    console.log("\n❌ No existe una sesión Appium activa.\n");
    return;
  }

  if (!deviceName) {
    console.log("\n❌ No se encontró el identificador del dispositivo.\n");
    return;
  }

  const nombre = (await pregunta("Nombre del flow › ")).trim();

  if (!nombre) {
    console.log("\n❌ El nombre no puede estar vacío.\n");
    return;
  }

  const livePlatform: LivePlatform = platform.toLowerCase() === "ios" ? "ios" : "android";

  const session = new FlowSession({
    name: nombre,
    project: projectName,
    appId: appPackage,
    platform,
  });

  const snapshotProvider = new AppiumSnapshotProvider(driver);

  const recorder = new LiveRecorder({
    snapshotProvider,
    stabilizationMs: 500,
  });

  const interactionSource = createInteractionSource({
    platform: livePlatform,
    deviceId: deviceName,
  });

  console.log(submenuTitle("LIVE RECORDER"));

  console.log(submenuSection("FLOW"));
  console.log(submenuInfo("Nombre", nombre));
  console.log(submenuInfo("Platform", livePlatform));
  console.log(submenuInfo("Device", deviceName));

  console.log();
  console.log(submenuSection("LIVE"));
  console.log("  Usa la aplicación normalmente en el dispositivo.");
  console.log("  Apptrak detectará las interacciones automáticamente.");
  console.log();

  await recorder.start();

  let processing: Promise<void> = Promise.resolve();

  await interactionSource.start((interaction) => {
    processing = processing
      .then(async () => {
        const entry = await recorder.processInteraction(interaction);

        const event = entry.event;

        if (!event) {
          return;
        }

        if (event.type === "tap") {
          const locator = event.element.locator;

          console.log(`  TAP      ${event.element.title}`);

          if (locator) {
            const quality = locator.quality ?? "sin calidad";

            const unique = locator.unique ? "unique" : "non-unique";

            console.log(`           ${locator.type} · ${quality} · ${unique}`);
          }

          session.addStep({
            type: "tap",
            element: event.element.title,
            locator,
          });
        }

        if (event.type === "scroll") {
          console.log(`  SCROLL   ${event.direction}`);

          session.addStep({
            type: "scroll",
            value: event.direction,
          });
        }

        if (event.type === "back") {
          console.log("  BACK");

          session.addStep({
            type: "back",
          });
        }

        if (event.type === "write") {
          const storedValue = event.sensitive ? "${sensitiveValue}" : event.value;

          console.log(`  WRITE    ${event.element.title}${event.sensitive ? " · sensitive" : ""}`);

          session.addStep({
            type: "write",
            element: event.element.title,
            locator: event.element.locator,
            value: storedValue,
            sensitive: event.sensitive,
          });
        }

        const beforeFingerprint = entry.before.screen.fingerprint;

        const afterFingerprint = entry.after.screen.fingerprint;

        if (beforeFingerprint && afterFingerprint && beforeFingerprint !== afterFingerprint) {
          console.log(`  SCREEN   ${beforeFingerprint} → ${afterFingerprint}`);
        }

        for (const assertion of entry.assertions) {
          if (assertion.type === "text-visible") {
            console.log(`  NEW UI   ${assertion.value}`);
          }
        }

        console.log();
      })
      .catch((error) => {
        console.error("\n❌ Error procesando interacción LIVE:", error);
      });

    return processing;
  });

  console.log(submenuInfo("Estado", "● RECORDING"));

  console.log();
  console.log("  Presiona ENTER en esta terminal para finalizar el flow.");
  console.log();

  await pregunta("");

  await interactionSource.stop();
  await processing;

  recorder.stop();
  session.finish();

  const outputDir = fixturesDir ? `${fixturesDir}/flows` : "flows";

  const savedPath = session.save(outputDir);

  console.log();
  console.log(`✓ Flow guardado: ${savedPath}`);
  console.log(`✓ Pasos registrados: ${session.getSteps().length}`);
  console.log();
}

async function menuNavegacion(): Promise<void> {
  while (true) {
    console.log(submenuTitle("NAVIGATION"));

    console.log(submenuSection("ACTIONS"));
    console.log(submenuOption("1", "Tap por texto"));
    console.log(submenuOption("2", "Escribir texto"));
    console.log(submenuOption("3", "Volver atrás"));

    console.log();
    console.log(submenuOption("0", "Volver"));
    console.log();

    const opcion = (await pregunta("Selecciona una opción › ")).trim();

    if (opcion === "0" || opcion.toLowerCase() === "esc") {
      return;
    }

    if (opcion === "1") {
      const texto = await pregunta("Texto del elemento › ");

      await tapPorTexto(texto);
      continue;
    }

    if (opcion === "2") {
      const texto = await pregunta("Texto a escribir › ");

      await escribirTexto(texto);
      continue;
    }

    if (opcion === "3") {
      await atras();
      continue;
    }

    console.log("\n❌ Opción inválida.\n");
  }
}

async function cerrarSesion(): Promise<void> {
  if (driver) {
    try {
      await driver.deleteSession();
      console.log("\n✅ Sesión Appium cerrada correctamente");
    } catch {
      console.log("\n⚠️ No se pudo cerrar limpiamente la sesión Appium");
    }
  }

  rl.close();
}

async function main(): Promise<void> {
  let closing = false;

  process.on("SIGINT", async () => {
    if (closing) {
      return;
    }

    console.log("\n\n⚠️ Solicitud de salida recibida.");

    const salir = await confirmarSalida();

    if (!salir) {
      console.log("\n↩️ Continuando captura.\n");
      return;
    }

    closing = true;
    await cerrarSesion();
    process.exitCode = 0;
  });

  await conectar();

  mostrarFixturesExistentes();

  while (!closing) {
    mostrarMenu();

    const opcion = (await pregunta("Selecciona una opción › ")).trim();

    if (opcion === "1") {
      const nombre = obtenerSiguienteNombreAutomatico();

      console.log(`\n📌 Nombre automático: ${nombre}`);

      await capturar(nombre);
      continue;
    }

    if (opcion === "2") {
      const nombre = (await pregunta("Nombre descriptivo del estado › ")).trim();

      if (!nombre) {
        console.log("\n❌ El nombre no puede estar vacío.\n");
        continue;
      }

      await capturar(nombre);
      continue;
    }

    if (opcion === "3") {
      await mostrarStatus();
      continue;
    }

    if (opcion === "4") {
      await grabarFlow();
      continue;
    }

    if (opcion === "5") {
      console.log("\n🚧 Visor de flows listo para integrar.\n");
      continue;
    }

    if (opcion === "6") {
      await menuNavegacion();
      continue;
    }

    if (opcion === "7") {
      const raw = (await pregunta("Pausa en milisegundos [1000] › ")).trim();

      const milliseconds = Number.parseInt(raw || "1000", 10) || 1000;

      await driver?.pause(milliseconds);

      console.log(`\n⏸ Pausa ${milliseconds}ms\n`);

      continue;
    }

    if (opcion === "0" || opcion.toLowerCase() === "esc") {
      const salir = await confirmarSalida();

      if (salir) {
        closing = true;
        break;
      }

      console.log("\n↩️ Continuando captura.\n");

      continue;
    }

    console.log("\n❌ Opción inválida.\n");
  }

  await cerrarSesion();
}

main().catch(async (error) => {
  console.error(
    "\n❌ Error fatal de captura:",
    error instanceof Error ? error.message : "desconocido",
  );

  await cerrarSesion();
  process.exitCode = 1;
});
