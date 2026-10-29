/**
 * Test rápido: Verificar conexión Appium y getPageSource
 */

import { remote } from "webdriverio";

const test = async () => {
  console.log("🔗 Conectando a Appium...");
  let driver;
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
        "appium:newCommandTimeout": 300,
        "appium:connectHardwareKeyboard": false,
      },
    });
    console.log("✅ Conectado");

    console.log("✓ Esperando estabilización...");
    await driver.pause(2000);
    console.log("✅ Sesión estabilizada");

    console.log("📸 Obteniendo page source...");
    const xml = await driver.getPageSource();
    console.log(`✅ getPageSource OK (${xml.length} bytes)`);
    console.log(`   Primeras líneas:\n${xml.substring(0, 200)}...`);

    console.log("✅ Todo funcionando");
    await driver.deleteSession();
  } catch (e) {
    console.error("❌ Error:", (e as Error).message);
    process.exit(1);
  }
};

test();
