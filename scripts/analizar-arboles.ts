#!/usr/bin/env tsx
/**
 * Analiza los XMLs capturados y genera un reporte de cobertura
 */

import { readdirSync, readFileSync } from "node:fs";

const arboles = readdirSync("test/fixtures/arboles").filter((f) =>
  f.endsWith(".xml")
);

if (arboles.length === 0) {
  console.log("No hay XMLs capturados en test/fixtures/arboles/");
  process.exit(0);
}

console.log(`\n=== REPORTE DE CAPTURAS (${arboles.length} archivos) ===\n`);

interface Estadisticas {
  archivo: string;
  bytes: number;
  resourceIds: number;
  contentDescs: number;
  textos: number;
  clickables: number;
  elementosTotales: number;
  actividad: string;
}

const stats: Estadisticas[] = [];

arboles.forEach((archivo) => {
  const xml = readFileSync(`test/fixtures/arboles/${archivo}`, "utf-8");

  const resourceIds = (xml.match(/resource-id="[^"]*"/g) ?? []).length;
  const contentDescs = (xml.match(/content-desc="[^"]*"/g) ?? []).length;
  const textos = (xml.match(/text="[^"]{1,}"/g) ?? []).filter(
    (t) => !t.includes('text=""')
  ).length;
  const clickables = (xml.match(/clickable="true"/g) ?? []).length;
  const elementosTotales = (xml.match(/<[a-z]/gi) ?? []).length;

  // Extraer la actividad (si aparece en comentarios o buscar patrón)
  const actMatch = xml.match(/\.(\w+Activity)/);
  const actividad = actMatch ? actMatch[1] : "?";

  stats.push({
    archivo,
    bytes: xml.length,
    resourceIds,
    contentDescs,
    textos,
    clickables,
    elementosTotales,
    actividad,
  });
});

// Tabla
console.log(
  "Archivo".padEnd(30) +
    " IDs Resource-IDs Content-Descs Textos Clickables"
);
console.log("-".repeat(100));
stats.forEach((s) => {
  console.log(
    s.archivo.padEnd(30) +
      " " +
      s.resourceIds.toString().padStart(3) +
      " " +
      s.contentDescs.toString().padStart(12) +
      " " +
      s.textos.toString().padStart(6) +
      " " +
      s.clickables.toString().padStart(10)
  );
});

// Resumen
const totalResourceIds = stats.reduce((sum, s) => sum + s.resourceIds, 0);
const totalContentDescs = stats.reduce((sum, s) => sum + s.contentDescs, 0);
const promResourceIds = (totalResourceIds / stats.length).toFixed(1);
const promContentDescs = (totalContentDescs / stats.length).toFixed(1);

console.log("-".repeat(100));
console.log(
  "TOTAL".padEnd(30) +
    " " +
    totalResourceIds.toString().padStart(3) +
    " " +
    totalContentDescs.toString().padStart(12) +
    " " +
    "(promedio: IDs=" +
    promResourceIds +
    ", Descs=" +
    promContentDescs +
    ")\n"
);

console.log("📊 ANÁLISIS:");
if (totalResourceIds > stats.length * 2) {
  console.log(
    "  ✓ Buena cobertura de resource-ids (promedio: " + promResourceIds + ")"
  );
} else {
  console.log(
    "  ⚠ Poca cobertura de resource-ids (promedio: " +
      promResourceIds +
      ")"
  );
  console.log(
    "    → Wikipedia usa Compose sin testTags. Usar content-desc y textos."
  );
}

console.log("\n✅ Listo para PASO 3 (Normalizador)");
