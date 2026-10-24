/**
 * PASO 4: Similitud Jaccard
 * SDD 6.3: Jaccard >= 0.85 = misma pantalla (o variante si hay nodos nuevos)
 *
 * Jaccard(A, B) = |A ∩ B| / |A ∪ B|
 */

import type { Token } from "./tokens.js";
import type { Huella } from "./tokens.js";

/**
 * Compara dos tokens para igualdad
 */
function tokensIguales(t1: Token, t2: Token): boolean {
  return t1.clase === t2.clase && t1.identificador === t2.identificador;
}

/**
 * Calcula similitud Jaccard entre dos conjuntos de tokens
 */
export function jaccard(tokens1: Token[], tokens2: Token[]): number {
  if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  // Crear conjuntos de identificadores únicos para evitar duplicados
  const set1 = new Set<string>();
  for (const t of tokens1) {
    set1.add(`${t.clase}|${t.identificador}`);
  }

  const set2 = new Set<string>();
  for (const t of tokens2) {
    set2.add(`${t.clase}|${t.identificador}`);
  }

  // Intersección
  let interseccion = 0;
  for (const item of set1) {
    if (set2.has(item)) {
      interseccion++;
    }
  }

  // Unión
  const union = new Set([...set1, ...set2]);

  return interseccion / union.size;
}

/**
 * Compara dos huellas: determina si son misma pantalla, variante o distinta
 */
export interface ResultadoComparacion {
  esIgual: boolean; // Jaccard >= umbral
  esVariante: boolean; // Igual pero con nodos nuevos
  jaccard: number;
  diferencia: "nodos_nuevos" | "nodos_faltantes" | "cambios" | null;
}

export function compararHuellas(
  huella1: Huella,
  huella2: Huella,
  umbral: number = 0.85
): ResultadoComparacion {
  const jaccardScore = jaccard(huella1.tokens, huella2.tokens);
  const esIgual = jaccardScore >= umbral;

  let diferencia: "nodos_nuevos" | "nodos_faltantes" | "cambios" | null = null;
  let esVariante = false;

  if (esIgual) {
    // Misma pantalla: verificar si hay nodos nuevos (variante)
    if (huella2.nodosTotales > huella1.nodosTotales) {
      diferencia = "nodos_nuevos";
      esVariante = true;
    } else if (huella2.nodosTotales < huella1.nodosTotales) {
      diferencia = "nodos_faltantes";
      esVariante = true;
    }
  } else {
    // Pantalla distinta: determinar tipo de cambio
    if (huella2.nodosTotales > huella1.nodosTotales) {
      diferencia = "nodos_nuevos";
    } else if (huella2.nodosTotales < huella1.nodosTotales) {
      diferencia = "nodos_faltantes";
    } else {
      diferencia = "cambios";
    }
  }

  return {
    esIgual,
    esVariante,
    jaccard: jaccardScore,
    diferencia,
  };
}
