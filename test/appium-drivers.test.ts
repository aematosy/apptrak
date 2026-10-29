import { describe, expect, it } from "vitest";
import {
  buscarDriverInstalado,
  parseInstalledAppiumDrivers,
} from "../src/cli/utils/appium-drivers.js";

describe("Appium installed drivers parser", () => {
  it("detecta UiAutomator2 instalado", () => {
    const output = "- uiautomator2@7.6.0 [installed (npm)]";

    const drivers = parseInstalledAppiumDrivers(output);

    expect(drivers).toEqual([
      {
        name: "uiautomator2",
        version: "7.6.0",
        installed: true,
      },
    ]);
  });

  it("detecta múltiples drivers", () => {
    const output = `
✔ Listing installed drivers
- uiautomator2@7.6.0 [installed (npm)]
- xcuitest@11.11.2 [installed (npm)]
`;

    const drivers = parseInstalledAppiumDrivers(output);

    expect(drivers).toHaveLength(2);

    expect(buscarDriverInstalado(drivers, "UiAutomator2")?.version).toBe("7.6.0");

    expect(buscarDriverInstalado(drivers, "XCUITest")?.version).toBe("11.11.2");
  });

  it("tolera ANSI", () => {
    const output = "\u001b[32m- uiautomator2@7.6.0 [installed (npm)]\u001b[0m";

    const drivers = parseInstalledAppiumDrivers(output);

    expect(drivers[0]?.name).toBe("uiautomator2");

    expect(drivers[0]?.version).toBe("7.6.0");
  });

  it("reporta UiAutomator2 ausente", () => {
    const output = "- xcuitest@11.11.2 [installed (npm)]";

    const drivers = parseInstalledAppiumDrivers(output);

    expect(buscarDriverInstalado(drivers, "UiAutomator2")).toBeUndefined();
  });
});
