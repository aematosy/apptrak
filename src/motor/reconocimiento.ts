/**
 * Reconocimiento de pantallas: comparación de huellas
 */

import type { Pantalla, ResultadoAccion } from "./tipos.js";
import type { ArbolNormalizado } from "../normalizador/tipos.js";
import { calcularHuella } from "../huella/index.js";
import { compararHuellas } from "../huella/index.js";

/**
 * Reconoce si un árbol actual es una pantalla conocida o nueva
 */
export function reconocerPantalla(
  arbolActual: ArbolNormalizado,
  pantallasEncontradas: Map<string, Pantalla>,
  umbralJaccard: number = 0.85
): {
  pantalla: Pantalla | null;
  resultado: ResultadoAccion;
  huella: any;
} {
  const huellaActual = calcularHuella(arbolActual);
  const textosVisibles = arbolActual.nodos
    .filter((n) => n.texto && n.visible)
    .map((n) => n.texto!)
    .filter((t) => t.length > 0 && t.length < 120); // SDD: max 120 chars

  // Buscar pantalla conocida
  for (const [id, pantalla] of pantallasEncontradas.entries()) {
    const comparacion = compararHuellas(pantalla.huella, huellaActual, umbralJaccard);

    if (comparacion.esIgual) {
      if (comparacion.esVariante) {
        return {
          pantalla,
          resultado: "variante",
          huella: huellaActual,
        };
      }
      return {
        pantalla,
        resultado: "conocida",
        huella: huellaActual,
      };
    }
  }

  // No encontrada: es nueva
  const nuevaPantalla: Pantalla = {
    id: huellaActual.hash,
    huella: huellaActual,
    arbol: arbolActual,
    textosVisibles,
    visitas: 1,
    primera: new Date().toISOString(),
    ultima: new Date().toISOString(),
  };

  return {
    pantalla: nuevaPantalla,
    resultado: "nueva",
    huella: huellaActual,
  };
}

/**
 * Fusiona un árbol en una pantalla conocida (actualizar contexto)
 */
export function fusionarEnPantalla(
  pantalla: Pantalla,
  arbolNuevo: ArbolNormalizado
): void {
  pantalla.visitas++;
  pantalla.ultima = new Date().toISOString();

  // Actualizar textos visibles (unión)
  const textosNuevos = arbolNuevo.nodos
    .filter((n) => n.texto && n.visible)
    .map((n) => n.texto!)
    .filter((t) => t.length > 0 && t.length < 120);

  const textosSet = new Set(pantalla.textosVisibles);
  textosNuevos.forEach((t) => textosSet.add(t));
  pantalla.textosVisibles = Array.from(textosSet);
}

/**
 * Clasifica el resultado de una acción
 */
export function clasificarResultado(
  antesId: string,
  ahoraPantalla: Pantalla | null,
  ahoraResultado: ResultadoAccion,
  maxMinutosExcedido?: boolean,
  bloqueante?: boolean
): ResultadoAccion {
  // Prioridad: error > bloqueada > salio > nueva > variante > conocida > sin-cambio
  if (bloqueante) return "bloqueada";
  if (maxMinutosExcedido) return "error";
  if (!ahoraPantalla) return "salio-de-app";
  return ahoraResultado;
}
