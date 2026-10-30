import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface AndroidDisplayInfo {
  width: number;
  height: number;
}

export function parseWmSize(output: string): AndroidDisplayInfo {
  const override = output.match(/Override size:\s*(\d+)x(\d+)/);

  const physical = output.match(/Physical size:\s*(\d+)x(\d+)/);

  const match = override ?? physical;

  if (!match) {
    throw new Error(`No se pudo interpretar wm size: ${output.trim()}`);
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

export async function getAndroidDisplayInfo(serial: string): Promise<AndroidDisplayInfo> {
  const { stdout } = await execFileAsync("adb", ["-s", serial, "shell", "wm", "size"]);

  return parseWmSize(stdout);
}
