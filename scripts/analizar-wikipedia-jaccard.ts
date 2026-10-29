/**
 * Analizar fixtures Wikipedia: matriz Jaccard y pares
 */

import { readdirSync, readFileSync } from "node:fs";
import { calcularHuella, generarTokens } from "../src/huella/tokens.js";
import { normalizarPageSource } from "../src/normalizador/index.js";
import { jaccard } from "../src/huella/jaccard.js";

const fixturesDir = "test/fixtures/arboles/wikipedia-redo";

// Leer todos los XMLs
const archivos = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".xml"))
  .sort();

console.log(`📊 Analizando ${archivos.length} fixtures Wikipedia\n`);

interface Fixture {
  nombre: string;
  path: string;
  huella: string;
  tokens: number;
}

const fixtures: Fixture[] = [];
const huellas: Map<string, string> = new Map();

// Procesar cada fixture
for (const archivo of archivos) {
  const nombre = archivo.replace(".xml", "");
  const xml = readFileSync(`${fixturesDir}/${archivo}`, "utf-8");
  const arbol = normalizarPageSource(xml, { platform: "android" });
  const huella = calcularHuella(arbol);
  const tokens = huella.tokens.length;

  fixtures.push({
    nombre,
    path: archivo,
    huella: huella.hash,
    tokens,
  });

  huellas.set(nombre, huella.hash);

  console.log(
    `✓ ${nombre.padEnd(35)} | Tokens: ${tokens.toString().padStart(3)} | Huella: ${huella.hash}`
  );
}

console.log(`\n${"=".repeat(80)}`);
console.log("MATRIZ JACCARD DE SIMILITUD");
console.log(`${"=".repeat(80)}\n`);

// Calcular matriz Jaccard
const n = fixtures.length;
const matriz: number[][] = Array(n)
  .fill(null)
  .map(() => Array(n).fill(0));

for (let i = 0; i < n; i++) {
  for (let j = i; j < n; j++) {
    if (i === j) {
      matriz[i][j] = 1.0;
    } else {
      const xmlI = readFileSync(
        `${fixturesDir}/${fixtures[i].path}`,
        "utf-8"
      );
      const xmlJ = readFileSync(
        `${fixturesDir}/${fixtures[j].path}`,
        "utf-8"
      );
      const arbolI = normalizarPageSource(xmlI, { platform: "android" });
      const arbolJ = normalizarPageSource(xmlJ, { platform: "android" });

      const sim = jaccard(
        calcularHuella(arbolI).tokens,
        calcularHuella(arbolJ).tokens
      );
      matriz[i][j] = sim;
      matriz[j][i] = sim;
    }
  }
}

// Imprimir matriz
const header = fixtures.map((f) => f.nombre.substring(0, 15).padEnd(15)).join(" ");
console.log("        " + header);

for (let i = 0; i < n; i++) {
  const row = fixtures[i].nombre.substring(0, 15).padEnd(15);
  const valores = matriz[i].map((v) => v.toFixed(2).padStart(4)).join("  ");
  console.log(row + " " + valores);
}

console.log(`\n${"=".repeat(80)}`);
console.log("CLASIFICACIÓN DE PARES (umbral 0.85)");
console.log(`${"=".repeat(80)}\n`);

interface Par {
  i: string;
  j: string;
  similitud: number;
  clasificacion: "MISMA_PANTALLA" | "VARIANTE" | "PANTALLA_DISTINTA";
}

const pares: Par[] = [];

for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    const sim = matriz[i][j];
    let clasificacion: "MISMA_PANTALLA" | "VARIANTE" | "PANTALLA_DISTINTA";

    if (sim >= 0.85) {
      clasificacion = "MISMA_PANTALLA";
    } else if (sim >= 0.5) {
      clasificacion = "VARIANTE";
    } else {
      clasificacion = "PANTALLA_DISTINTA";
    }

    pares.push({
      i: fixtures[i].nombre,
      j: fixtures[j].nombre,
      similitud: sim,
      clasificacion,
    });
  }
}

const misma = pares.filter((p) => p.clasificacion === "MISMA_PANTALLA");
const variante = pares.filter((p) => p.clasificacion === "VARIANTE");
const distinta = pares.filter(
  (p) => p.clasificacion === "PANTALLA_DISTINTA"
);

console.log(`🟢 MISMA_PANTALLA (>= 0.85): ${misma.length}`);
misma.forEach((p) => {
  console.log(`   ${p.i.padEnd(35)} <-> ${p.j.padEnd(35)} = ${p.similitud.toFixed(3)}`);
});

console.log(`\n🟡 VARIANTE (0.5 - 0.84): ${variante.length}`);
variante.forEach((p) => {
  console.log(`   ${p.i.padEnd(35)} <-> ${p.j.padEnd(35)} = ${p.similitud.toFixed(3)}`);
});

console.log(`\n🔴 PANTALLA_DISTINTA (< 0.5): ${distinta.length}`);
distinta.forEach((p) => {
  console.log(`   ${p.i.padEnd(35)} <-> ${p.j.padEnd(35)} = ${p.similitud.toFixed(3)}`);
});

console.log(`\n${"=".repeat(80)}`);
console.log("RESUMEN");
console.log(`${"=".repeat(80)}`);
console.log(`Total fixtures: ${n}`);
console.log(`Total pares: ${pares.length}`);
console.log(`MISMA_PANTALLA: ${misma.length} (${((misma.length / pares.length) * 100).toFixed(1)}%)`);
console.log(`VARIANTE: ${variante.length} (${((variante.length / pares.length) * 100).toFixed(1)}%)`);
console.log(
  `PANTALLA_DISTINTA: ${distinta.length} (${((distinta.length / pares.length) * 100).toFixed(1)}%)`
);
