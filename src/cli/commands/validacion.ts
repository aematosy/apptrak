/**
 * OPCIÓN 6: Validación Técnica
 * Ejecuta tests, typecheck, build y lint
 */

import { spawnSync } from "node:child_process";
import { crearTabla } from "../utils/table.js";

interface Resultado {
  validación: string;
  estado: string;
  detalle: string;

  [key: string]: string;
}

function ejecutar(nombre: string, cmd: string, args: string[]): Resultado {
  console.log(`⏳ ${nombre}...`);

  const result = spawnSync(cmd, args, {
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf-8",
    shell: true,
    timeout: 120000,
  });

  if (result.status === 0) {
    return { validación: nombre, estado: "✅", detalle: "OK" };
  }

  const output = result.stdout || result.stderr || "";
  const firstError = output.split("\n").find((l) => l.includes("error")) || "Error";

  return { validación: nombre, estado: "❌", detalle: firstError.substring(0, 50) };
}

export async function cmdValidacion() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║     VALIDACIÓN TÉCNICA               ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const resultados: Resultado[] = [];

  console.log("Ejecutando validaciones...\n");

  resultados.push(ejecutar("Tests", "pnpm", ["test"]));
  resultados.push(ejecutar("Typecheck", "pnpm", ["typecheck"]));
  resultados.push(ejecutar("Build", "pnpm", ["run", "build"]));
  resultados.push(ejecutar("Lint", "pnpm", ["run", "lint"]));

  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║            RESUMEN                   ║");
  console.log("╚═══════════════════════════════════════╝\n");

  console.log(crearTabla(resultados, ["validación", "estado", "detalle"]));

  const todoOk = resultados.every((r) => r.estado === "✅");
  console.log(`\n${todoOk ? "✅ Todo correcto" : "⚠️  Hay problemas"}\n`);
}
