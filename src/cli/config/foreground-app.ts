import { execFileSync } from "node:child_process";

function runAdb(deviceName: string, args: string[]): string {
  return execFileSync("adb", ["-s", deviceName, ...args], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function extractPackage(output: string): string | null {
  const patterns = [
    /mCurrentFocus=.*? ([A-Za-z0-9._]+)\/[A-Za-z0-9.$_]+/,
    /mFocusedApp=.*? ([A-Za-z0-9._]+)\/[A-Za-z0-9.$_]+/,
    /topResumedActivity=.*? ([A-Za-z0-9._]+)\/[A-Za-z0-9.$_]+/,
    /ResumedActivity:.*? ([A-Za-z0-9._]+)\/[A-Za-z0-9.$_]+/,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    const packageName = match?.[1];

    if (packageName) {
      return packageName;
    }
  }

  return null;
}

export function getForegroundAndroidPackage(deviceName: string): string | null {
  const commands: string[][] = [
    ["shell", "dumpsys", "window", "windows"],
    ["shell", "dumpsys", "activity", "activities"],
  ];

  for (const args of commands) {
    try {
      const output = runAdb(deviceName, args);
      const packageName = extractPackage(output);

      if (packageName) {
        return packageName;
      }
    } catch {
      // Intentar siguiente estrategia.
    }
  }

  return null;
}
