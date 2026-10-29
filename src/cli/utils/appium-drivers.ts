import { spawnSync } from "node:child_process";

export interface InstalledAppiumDriver {
  name: string;
  version: string;
  installed: boolean;
}

const ANSI_PATTERN =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape codes
  /\u001B(?:[@-_][0-?]*[ -/]*[@-~]|\[[0-?]*[ -/]*[@-~])/g;

export function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, "");
}

export function parseInstalledAppiumDrivers(rawOutput: string): InstalledAppiumDriver[] {
  const clean = stripAnsi(rawOutput);

  const drivers: InstalledAppiumDriver[] = [];

  for (const rawLine of clean.split(/\r?\n/)) {
    const line = rawLine.trim();

    // Ej:
    // - uiautomator2@7.6.0 [installed (npm)]
    // - xcuitest@11.11.2 [installed (npm)]
    const match = line.match(/^-\s*([a-zA-Z0-9_-]+)@([0-9A-Za-z.+_-]+)\s+\[installed\b/i);

    if (!match) continue;

    const name = match[1];
    const version = match[2];

    if (!name || !version) {
      continue;
    }

    drivers.push({
      name: name.toLowerCase(),
      version,
      installed: true,
    });
  }

  return drivers;
}

export function obtenerDriversAppiumInstalados(): {
  ok: boolean;
  drivers: InstalledAppiumDriver[];
  error?: string;
} {
  const result = spawnSync("appium", ["driver", "list", "--installed"], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    return {
      ok: false,
      drivers: [],
      error: result.error.message,
    };
  }

  const raw = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const drivers = parseInstalledAppiumDrivers(raw);

  return {
    ok: result.status === 0,
    drivers,
    error: result.status === 0 ? undefined : stripAnsi(result.stderr ?? result.stdout ?? "").trim(),
  };
}

export function buscarDriverInstalado(
  drivers: InstalledAppiumDriver[],
  automationName: string,
): InstalledAppiumDriver | undefined {
  const normalizado = automationName.toLowerCase();

  const aliases: Record<string, string> = {
    uiautomator2: "uiautomator2",
    xcuitest: "xcuitest",
  };

  const esperado = aliases[normalizado] ?? normalizado;

  return drivers.find((driver) => driver.name.toLowerCase() === esperado);
}
