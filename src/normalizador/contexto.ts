/**
 * PASO 3: Cálculo de contexto
 * Basado en SDD 6.2: ancestros (max 3), descendientes (max 8)
 */

import type { ArbolNormalizado, NodoNormalizado, Contexto } from "./tipos.js";

/**
 * Obtiene los ancestros de un nodo (máximo 3, contando hacia atrás desde padre)
 */
export function obtenerAncestros(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
  max: number = 3
): NodoNormalizado[] {
  const ancestros: NodoNormalizado[] = [];
  let padrePadre = nodo.padre;

  while (padrePadre !== null && ancestros.length < max) {
    const ancestor = arbol.nodos.find((n) => n.indice === padrePadre);
    if (ancestor) {
      ancestros.push(ancestor);
      padrePadre = ancestor.padre;
    } else {
      break;
    }
  }

  return ancestros;
}

/**
 * Obtiene los descendientes directos de un nodo (máximo 8)
 * Nota: para ahorro de memoria, solo primer nivel de hijos
 */
export function obtenerDescendientes(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
  max: number = 8
): NodoNormalizado[] {
  return arbol.nodos
    .filter((n) => n.padre === nodo.indice)
    .slice(0, max);
}

/**
 * Obtiene los hermanos de un nodo (mismo padre)
 */
export function obtenerHermanos(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): NodoNormalizado[] {
  if (nodo.padre === null) return [];
  return arbol.nodos.filter((n) => n.padre === nodo.padre && n.indice !== nodo.indice);
}

/**
 * Busca una etiqueta cercana: un elemento con texto/descripción cerca del nodo
 * Prioridad: hermanos con texto, ancestros con descripción
 */
export function buscarEtiquetaCercana(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): { etiqueta: string; posicion: "arriba" | "abajo" | "izquierda" | "derecha" | null } | null {
  // Primero, hermanos con texto visible antes (posición Y menor)
  const hermanos = obtenerHermanos(nodo, arbol);

  // Hermanos arriba
  const hermanosArriba = hermanos
    .filter((h) => h.bounds.y2 <= nodo.bounds.y1 && (h.texto || h.descripcion))
    .sort((a, b) => b.bounds.y2 - a.bounds.y2); // más cercano primero

  if (hermanosArriba.length > 0) {
    const etiqueta = hermanosArriba[0].texto || hermanosArriba[0].descripcion;
    if (etiqueta) return { etiqueta, posicion: "arriba" };
  }

  // Hermanos abajo
  const hermanosAbajo = hermanos
    .filter((h) => h.bounds.y1 >= nodo.bounds.y2 && (h.texto || h.descripcion))
    .sort((a, b) => a.bounds.y1 - b.bounds.y1);

  if (hermanosAbajo.length > 0) {
    const etiqueta = hermanosAbajo[0].texto || hermanosAbajo[0].descripcion;
    if (etiqueta) return { etiqueta, posicion: "abajo" };
  }

  // Hermanos izquierda
  const hermanosIzq = hermanos
    .filter((h) => h.bounds.x2 <= nodo.bounds.x1 && (h.texto || h.descripcion))
    .sort((a, b) => b.bounds.x2 - a.bounds.x2);

  if (hermanosIzq.length > 0) {
    const etiqueta = hermanosIzq[0].texto || hermanosIzq[0].descripcion;
    if (etiqueta) return { etiqueta, posicion: "izquierda" };
  }

  // Hermanos derecha
  const hermanosDer = hermanos
    .filter((h) => h.bounds.x1 >= nodo.bounds.x2 && (h.texto || h.descripcion))
    .sort((a, b) => a.bounds.x1 - b.bounds.x1);

  if (hermanosDer.length > 0) {
    const etiqueta = hermanosDer[0].texto || hermanosDer[0].descripcion;
    if (etiqueta) return { etiqueta, posicion: "derecha" };
  }

  return null;
}

/**
 * Construye el contexto completo: ancestros, descendientes, hermanos
 */
export function construirContexto(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): Contexto {
  return {
    ancestros: obtenerAncestros(nodo, arbol),
    descendientes: obtenerDescendientes(nodo, arbol),
    hermanos: obtenerHermanos(nodo, arbol),
  };
}

/**
 * Enriquece todos los nodos del árbol con contexto
 */
export function enriquecerConContexto(arbol: ArbolNormalizado): void {
  for (const nodo of arbol.nodos) {
    // Ancestros
    nodo.ancestros = obtenerAncestros(nodo, arbol).map((a) => a.indice);

    // Descendientes
    nodo.descendientes = obtenerDescendientes(nodo, arbol).map((d) => d.indice);

    // Etiqueta cercana
    const etiquetaInfo = buscarEtiquetaCercana(nodo, arbol);
    if (etiquetaInfo) {
      nodo.etiquetaCercana = etiquetaInfo.etiqueta;
      nodo.etiquetaPosicion = etiquetaInfo.posicion;
    }
  }
}
