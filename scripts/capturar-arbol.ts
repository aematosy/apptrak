import { mkdirSync, writeFileSync } from "node:fs";
import { remote } from "webdriverio";

const nombre = process.argv[2] ?? "captura";
const udid = process.env.ANDROID_UDID;

const driver = await remote({
  hostname: "localhost",
  port: 4723,
  path: "/",
  logLevel: "warn",
  capabilities: {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": udid ?? "emulator-5554",
    ...(udid ? { "appium:udid": udid } : {}),
    "appium:autoLaunch": false,
    "appium:newCommandTimeout": 600,
  },
});

try {
  const xml = await driver.getPageSource();
  mkdirSync("test/fixtures/arboles", { recursive: true });
  const ruta = `test/fixtures/arboles/${nombre}.xml`;
  writeFileSync(ruta, xml);

  // Análisis rápido
  const resourceIds = (xml.match(/resource-id="[^"]*"/g) ?? []).length;
  const contentDescs = (xml.match(/content-desc="[^"]*"/g) ?? []).length;
  const textos = (
    xml.match(/text="[^"]{1,}"/g) ?? []
  ).filter((t) => !t.includes('text=""')).length;
  const clickables = (xml.match(/clickable="true"/g) ?? []).length;

  console.log(
    `\n✓ ${nombre} (${xml.length} bytes)\n` +
      `  resource-ids: ${resourceIds}\n` +
      `  content-descs: ${contentDescs}\n` +
      `  textos: ${textos}\n` +
      `  elementos clickables: ${clickables}\n`
  );
} finally {
  await driver.deleteSession();
}
