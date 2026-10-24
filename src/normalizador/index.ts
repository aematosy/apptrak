/**
 * PASO 3: Normalizador principal
 * Orquesta: parseo XML → extracción → contexto
 */

import type { ArbolNormalizado } from "./tipos.js";
import { parseXMLAppium } from "./parser.js";
import { enriquecerConContexto } from "./contexto.js";

export interface NormalizadorConfig {
  platform?: "android" | "ios";
}

/**
 * Convierte page source XML a árbol normalizado con contexto completo
 */
export function normalizarPageSource(
  xmlString: string,
  config: NormalizadorConfig = {}
): ArbolNormalizado {
  const platform = config.platform || "android";

  // 1. Parsear XML
  const arbol = parseXMLAppium(xmlString, platform);

  // 2. Enriquecer con contexto
  enriquecerConContexto(arbol);

  return arbol;
}

export * from "./tipos.js";
export * from "./parser.js";
export * from "./contexto.js";
