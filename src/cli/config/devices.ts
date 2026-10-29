import { execFileSync } from "node:child_process";

export function getConnectedAndroidDevices(): string[] {
  try {
    const output = execFileSync("adb", ["devices"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return output
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => /\sdevice$/.test(line))
      .map((line) => line.split(/\s+/)[0])
      .filter((device): device is string => Boolean(device));
  } catch {
    return [];
  }
}
