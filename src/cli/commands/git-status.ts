/**
 * OPCIÓN 7: Estado Git
 * Muestra información del repositorio
 */

import { execSync } from "node:child_process";

export async function cmdGitStatus() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║         ESTADO GIT                   ║");
  console.log("╚═══════════════════════════════════════╝\n");

  try {
    const rama = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
    console.log(`Rama: ${rama}`);

    const status = execSync("git status --short", { encoding: "utf-8" });
    const limpio = status.trim().length === 0;
    console.log(`Estado: ${limpio ? "✅ Limpio" : "🟡 Cambios sin stagear"}\n`);

    if (!limpio) {
      console.log("Cambios:\n");
      console.log(status);
    }

    const diff = execSync("git diff --stat", { encoding: "utf-8" });
    if (diff.trim()) {
      console.log("\nEstadísticas (git diff --stat):\n");
      console.log(diff);
    }

    console.log("ℹ️  Usa git directamente para commit/push.\n");
  } catch {
    console.log("❌ No se pudo obtener estado de Git\n");
  }
}
