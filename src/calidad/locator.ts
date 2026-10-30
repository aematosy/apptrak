/**
 * Fachada legacy de calidad de locators.
 *
 * Mantiene compatibilidad con la API existente:
 * - calcularLocators
 * - calcularLocatorsArbol
 * - estadisticasCalidad
 *
 * Internamente delega al Locator Engine v2.
 */

import type { ArbolNormalizado, NodoNormalizado } from "../normalizador/tipos.js";
import { calcularLocatorV2, calcularLocatorsArbolV2 } from "./locator/engine.js";
import type { LocatorCandidate } from "./locator/types.js";

export type CalidadLocator = "estable" | "media" | "ancla" | "fragil";

export interface Locator {
  valor: string;
  tipo: "id" | "xpath" | "texto" | "clase" | "indice" | "accessibility-id";
  calidad: CalidadLocator;
  unico: boolean;
  confianza: number;

  estrategia?: string;
  score?: number;
  dinamico?: boolean;
  motivo?: string;
}

export interface LocalizadorElemento {
  titulo?: string;
  principal: Locator;
  alternativas: Locator[];
  descripcion: string;
}

function adaptarLocator(candidate: LocatorCandidate): Locator {
  return {
    valor: candidate.valor,
    tipo: candidate.tipo,
    calidad: candidate.calidad,
    unico: candidate.unico,
    confianza: candidate.confianza,
    estrategia: candidate.estrategia,
    score: candidate.score,
    dinamico: candidate.dinamico,
    motivo: candidate.motivo,
  };
}

export function calcularLocators(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocalizadorElemento {
  const resultado = calcularLocatorV2(nodo, arbol);

  return {
    titulo: resultado.titulo,
    principal: adaptarLocator(resultado.principal),
    alternativas: resultado.alternativas.map(adaptarLocator),
    descripcion: resultado.descripcion,
  };
}

export function calcularLocatorsArbol(arbol: ArbolNormalizado): Map<number, LocalizadorElemento> {
  const v2 = calcularLocatorsArbolV2(arbol);

  const result = new Map<number, LocalizadorElemento>();

  for (const [index, locator] of v2) {
    result.set(index, {
      titulo: locator.titulo,
      principal: adaptarLocator(locator.principal),
      alternativas: locator.alternativas.map(adaptarLocator),
      descripcion: locator.descripcion,
    });
  }

  return result;
}

export interface EstadisticasCalidad {
  totalNodos: number;
  conLocatorEstable: number;
  conLocatorMedia: number;
  conLocatorAncla: number;
  conLocatorFragil: number;
  porcentajeEstable: number;
  porcentajeEstableOMedia: number;
}

export function estadisticasCalidad(
  locators: Map<number, LocalizadorElemento>,
): EstadisticasCalidad {
  const totalNodos = locators.size;

  let estable = 0;
  let media = 0;
  let ancla = 0;
  let fragil = 0;

  for (const locator of locators.values()) {
    switch (locator.principal.calidad) {
      case "estable":
        estable++;
        break;

      case "media":
        media++;
        break;

      case "ancla":
        ancla++;
        break;

      case "fragil":
        fragil++;
        break;
    }
  }

  if (totalNodos === 0) {
    return {
      totalNodos: 0,
      conLocatorEstable: 0,
      conLocatorMedia: 0,
      conLocatorAncla: 0,
      conLocatorFragil: 0,
      porcentajeEstable: 0,
      porcentajeEstableOMedia: 0,
    };
  }

  return {
    totalNodos,
    conLocatorEstable: estable,
    conLocatorMedia: media,
    conLocatorAncla: ancla,
    conLocatorFragil: fragil,
    porcentajeEstable: (estable / totalNodos) * 100,
    porcentajeEstableOMedia: ((estable + media) / totalNodos) * 100,
  };
}
