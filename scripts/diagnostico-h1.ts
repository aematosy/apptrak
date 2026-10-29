/**
 * Diagnóstico exhaustivo de H1: ¿Por qué todos los fixtures tienen la misma huella?
 */

import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { normalizarPageSource } from "../src/normalizador/index.js";
import { calcularHuella, generarTokens } from "../src/huella/tokens.js";

const fixturesDir = "test/fixtures/arboles/wikipedia-redo";
const fixtures = [
  "wikipedia-01-onboarding",
  "wikipedia-04-home",
  "wikipedia-05-search",
  "wikipedia-08-results",
  "wikipedia-09-article",
  "wikipedia-11-settings",
];

interface Diagnostico {
  nombre: string;
  totalNodos: number;
  conIdEstable: number;
  conDescripcion: number;
  conTexto: number;
  interactivos: number;
  clasesDistintas: number;
  clasesLista: Map<string, number>;
  tokensCount: number;
  tokens: string[];
  huella: string;
  xmlHash: string;
  nodosDescartados: {
    sinId: number;
    sinDesc: number;
    sinTexto: number;
    sinInteraccion: number;
  };
  nodosTokensPorClaseAlone: number;
}

const diagnosticos: Diagnostico[] = [];

console.log("🔍 DIAGNÓSTICO H1: Analizando 6 fixtures principales\n");
console.log("=".repeat(100) + "\n");

for (const nombre of fixtures) {
  const xmlPath = `${fixturesDir}/${nombre}.xml`;
  
  try {
    const xml = readFileSync(xmlPath, "utf-8");
    const xmlHash = createHash("sha256").update(xml).digest("hex").substring(0, 16);
    
    const arbol = normalizarPageSource(xml, { platform: "android" });
    const huella = calcularHuella(arbol);
    const tokens = generarTokens(arbol);

    // A. Análisis de nodos
    const totalNodos = arbol.nodos.length;
    const conIdEstable = arbol.nodos.filter((n) => n.idEstable).length;
    const conDescripcion = arbol.nodos.filter((n) => n.descripcion).length;
    const conTexto = arbol.nodos.filter((n) => n.texto && n.texto.length > 0).length;
    const interactivos = arbol.nodos.filter(
      (n) => n.visible && n.habilitado && (n.clickable || n.scrollable)
    ).length;

    // F. Clases distintas
    const clasesSet = new Set(arbol.nodos.map((n) => n.clase));
    const clasesDistintas = clasesSet.size;
    const clasesLista = new Map<string, number>();
    arbol.nodos.forEach((n) => {
      clasesLista.set(n.clase, (clasesLista.get(n.clase) ?? 0) + 1);
    });

    // G. Tokens
    const tokensOrdenados = tokens
      .map((t) => `${t.clase}|${t.identificador}${t.esLista ? " [LISTA]" : ""}`)
      .sort();

    // Nodos descartados
    const nodosDescartados = {
      sinId: arbol.nodos.filter((n) => !n.idEstable).length,
      sinDesc: arbol.nodos.filter((n) => !n.descripcion).length,
      sinTexto: arbol.nodos.filter((n) => !n.texto || n.texto.length === 0).length,
      sinInteraccion: arbol.nodos.filter(
        (n) => !n.clickable && !n.scrollable
      ).length,
    };

    // Nodos que generaron tokens por clase alone
    let nodosTokensPorClase = 0;
    for (const nodo of arbol.nodos) {
      if (!nodo.idEstable && !nodo.descripcion && !nodo.texto) {
        nodosTokensPorClase++;
      }
    }

    diagnosticos.push({
      nombre,
      totalNodos,
      conIdEstable,
      conDescripcion,
      conTexto,
      interactivos,
      clasesDistintas,
      clasesLista,
      tokensCount: tokens.length,
      tokens: tokensOrdenados,
      huella: huella.hash,
      xmlHash,
      nodosDescartados,
      nodosTokensPorClaseAlone: nodosTokensPorClase,
    });

    console.log(`📊 ${nombre.padEnd(30)}`);
    console.log(`   Total nodos: ${totalNodos}`);
    console.log(
      `   Con idEstable: ${conIdEstable} (${((conIdEstable / totalNodos) * 100).toFixed(1)}%)`
    );
    console.log(
      `   Con descripción: ${conDescripcion} (${((conDescripcion / totalNodos) * 100).toFixed(1)}%)`
    );
    console.log(
      `   Con texto: ${conTexto} (${((conTexto / totalNodos) * 100).toFixed(1)}%)`
    );
    console.log(
      `   Interactivos: ${interactivos} (${((interactivos / totalNodos) * 100).toFixed(1)}%)`
    );
    console.log(`   Clases distintas: ${clasesDistintas}`);
    console.log(`   Tokens generados: ${tokens.length}`);
    console.log(`   Huella: ${huella.hash}`);
    console.log(`   XML SHA256: ${xmlHash}`);
    console.log(`   Nodos sin id/desc/texto: ${nodosTokensPorClase}`);
    console.log();
  } catch (e) {
    console.error(`❌ Error en ${nombre}:`, (e as Error).message);
  }
}

console.log("=".repeat(100));
console.log("\n📋 COMPARATIVAS DE TOKENS\n");

const pares = [
  ["wikipedia-01-onboarding", "wikipedia-04-home"],
  ["wikipedia-04-home", "wikipedia-05-search"],
  ["wikipedia-05-search", "wikipedia-08-results"],
  ["wikipedia-08-results", "wikipedia-09-article"],
  ["wikipedia-09-article", "wikipedia-11-settings"],
];

for (const [nombreA, nombreB] of pares) {
  const diagA = diagnosticos.find((d) => d.nombre === nombreA)!;
  const diagB = diagnosticos.find((d) => d.nombre === nombreB)!;

  const setA = new Set(diagA.tokens);
  const setB = new Set(diagB.tokens);

  const interseccion = Array.from(setA).filter((t) => setB.has(t));
  const exclusivosA = Array.from(setA).filter((t) => !setB.has(t));
  const exclusivosB = Array.from(setB).filter((t) => !setA.has(t));

  console.log(`🔄 ${nombreA.padEnd(30)} vs ${nombreB.padEnd(30)}`);
  console.log(`   Intersección: ${interseccion.length} tokens`);
  if (interseccion.length > 0) {
    interseccion.slice(0, 3).forEach((t) => console.log(`     - ${t}`));
    if (interseccion.length > 3) console.log(`     ... (+${interseccion.length - 3} más)`);
  }
  console.log(`   Exclusivos A: ${exclusivosA.length}`);
  if (exclusivosA.length > 0) {
    exclusivosA.slice(0, 2).forEach((t) => console.log(`     - ${t}`));
    if (exclusivosA.length > 2) console.log(`     ... (+${exclusivosA.length - 2} más)`);
  }
  console.log(`   Exclusivos B: ${exclusivosB.length}`);
  if (exclusivosB.length > 0) {
    exclusivosB.slice(0, 2).forEach((t) => console.log(`     - ${t}`));
    if (exclusivosB.length > 2) console.log(`     ... (+${exclusivosB.length - 2} más)`);
  }
  console.log();
}

console.log("=".repeat(100));
console.log("\n🔍 ANÁLISIS DE MULTIPLICIDAD Y COLLAPSO\n");

// Verificar si generarTokens usa Set y pierde multiplicidad
for (const diag of diagnosticos) {
  const xml = readFileSync(`${fixturesDir}/${diag.nombre}.xml`, "utf-8");
  const arbol = normalizarPageSource(xml, { platform: "android" });

  // Contar clases antes de tokenización
  const clasesAntesCount = new Map<string, number>();
  arbol.nodos.forEach((n) => {
    clasesAntesCount.set(n.clase, (clasesAntesCount.get(n.clase) ?? 0) + 1);
  });

  // Contar clases en tokens
  const clasesTokenCount = new Map<string, number>();
  diag.tokens.forEach((t) => {
    const clase = t.split("|")[0];
    clasesTokenCount.set(clase, (clasesTokenCount.get(clase) ?? 0) + 1);
  });

  console.log(`📦 ${diag.nombre.padEnd(30)}`);
  console.log(`   Clases únicas en nodos: ${clasesAntesCount.size}`);

  // Top 5 clases por frecuencia
  const top5 = Array.from(clasesAntesCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log(`   Top 5 clases por frecuencia:`);
  top5.forEach(([clase, count]) => {
    const tokenCount = clasesTokenCount.get(clase) ?? 0;
    const perdida = count - tokenCount;
    const perdidaPct = ((perdida / count) * 100).toFixed(1);
    console.log(
      `     ${clase.substring(0, 35).padEnd(35)}: ${count} nodos → ${tokenCount} tokens (pérdida: ${perdidaPct}%)`
    );
  });
  console.log();
}

console.log("=".repeat(100));
console.log("\n🎯 CONCLUSIÓN PRELIMINAR\n");

// Verificar si todos tienen la misma huella
const huellasUnicas = new Set(diagnosticos.map((d) => d.huella));
console.log(`Huellas únicas: ${huellasUnicas.size}/6`);
if (huellasUnicas.size === 1) {
  console.log("⚠️  PROBLEMA CRÍTICO: Todos los fixtures tienen la MISMA huella");
}

// Verificar si XMLs son diferentes
const xmlHashesUnicas = new Set(diagnosticos.map((d) => d.xmlHash));
console.log(`XMLs únicos (SHA256): ${xmlHashesUnicas.size}/6`);
if (xmlHashesUnicas.size < 6) {
  console.log("⚠️  Posible duplicación de fixtures");
  diagnosticos.forEach((d) => console.log(`   ${d.nombre}: ${d.xmlHash}`));
}

// Porcentaje promedio de nodos con id/desc/texto
const promedioIdEstable = (
  diagnosticos.reduce((sum, d) => sum + d.conIdEstable / d.totalNodos, 0) / diagnosticos.length
) * 100;
const promedioDescripcion = (
  diagnosticos.reduce((sum, d) => sum + d.conDescripcion / d.totalNodos, 0) / diagnosticos.length
) * 100;
const promedioTexto = (
  diagnosticos.reduce((sum, d) => sum + d.conTexto / d.totalNodos, 0) / diagnosticos.length
) * 100;

console.log(`\nPromedio nodos con idEstable: ${promedioIdEstable.toFixed(1)}%`);
console.log(`Promedio nodos con descripción: ${promedioDescripcion.toFixed(1)}%`);
console.log(`Promedio nodos con texto: ${promedioTexto.toFixed(1)}%`);

console.log(`\nPromedio nodos por clase alone: ${(
  diagnosticos.reduce((sum, d) => sum + d.nodosTokensPorClaseAlone, 0) / diagnosticos.length
).toFixed(1)}`);

// Verificar colapso de listas
console.log(`\nTokens colapsados [LISTA]:`);
diagnosticos.forEach((d) => {
  const listaTokens = d.tokens.filter((t) => t.includes("[LISTA]"));
  console.log(`   ${d.nombre}: ${listaTokens.length} tokens colapsados`);
});

