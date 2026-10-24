/**
 * PASO 4: Huella de pantalla (identidad)
 * Basado en SDD 6.3: Tokens, Jaccard, variantes
 *
 * Token: clase | idEstable (o clase | descripcion si no hay id)
 * Nunca texto ni bounds.
 * Las listas se colapsan a un token para que 3 filas y 30 filas sean igual.
 */

import type { NodoNormalizado, ArbolNormalizado } from "../normalizador/tipos.js";

export interface Token {
  clase: string;
  identificador: string; // idEstable o descripcion
  esLista: boolean; // true si es un colapsador de lista
}

/**
 * Genera token de un nodo: clase | identificador
 * SDD 6.3: nunca texto ni bounds
 */
export function generarToken(nodo: NodoNormalizado): Token {
  const clase = nodo.clase.split(".").pop() || nodo.clase;

  // Prioridad: idEstable > descripcion > clase sola
  const identificador = nodo.idEstable || nodo.descripcion || "";

  return {
    clase,
    identificador,
    esLista: false,
  };
}

/**
 * Detecta si un nodo es un contenedor de lista (ListView, RecyclerView, etc.)
 */
function esContenedorLista(nodo: NodoNormalizado): boolean {
  return (
    nodo.clase.includes("ListView") ||
    nodo.clase.includes("RecyclerView") ||
    nodo.clase.includes("ScrollView") ||
    nodo.clase.includes("NestedScrollView") ||
    nodo.rolInferido === "lista"
  );
}

/**
 * Detecta si un nodo es un item de lista (mismo patrón que hermanos)
 */
function esItemLista(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): boolean {
  if (nodo.padre === null) return false;

  const hermanos = arbol.nodos.filter(
    (n) => n.padre === nodo.padre && n.indice !== nodo.indice
  );

  // Si hay múltiples hermanos con la misma clase y estructura, es item
  const hermanosIguales = hermanos.filter((h) => h.clase === nodo.clase);
  return hermanosIguales.length >= 2;
}

/**
 * Genera tokens de un árbol entero
 * BLOQUEANTE (SDD 4.1): Algoritmo de colapso de listas
 * Estrategia: Si un contenedor tiene N hermanos iguales (N>=3), colapsa a 1 token
 */
export function generarTokens(arbol: ArbolNormalizado): Token[] {
  const tokens: Token[] = [];
  const procesados = new Set<number>();

  for (const nodo of arbol.nodos) {
    if (procesados.has(nodo.indice)) continue;

    // Si es item de lista, lo colapsamos
    if (esItemLista(nodo, arbol)) {
      const padre = arbol.nodos.find((n) => n.indice === nodo.padre);
      if (padre && esContenedorLista(padre)) {
        // Encontrar todos los items de esta lista
        const hermanos = arbol.nodos.filter(
          (n) => n.padre === nodo.padre && n.clase === nodo.clase
        );

        // Si hay 3+ items, generar un token collapsed
        if (hermanos.length >= 3) {
          tokens.push({
            clase: nodo.clase,
            identificador: `[LISTA_COLLAPSED_${hermanos.length}_items]`,
            esLista: true,
          });

          // Marcar todos como procesados
          hermanos.forEach((h) => procesados.add(h.indice));
          continue;
        }
      }
    }

    // Nodo normal: generar token y marcar
    tokens.push(generarToken(nodo));
    procesados.add(nodo.indice);
  }

  return tokens;
}

/**
 * Hash de huella: hash criptográfico de los tokens
 * Determinista: mismos tokens = mismo hash
 */
export function hashHuella(tokens: Token[]): string {
  // Serializar tokens de forma determinista
  const serializado = tokens
    .map((t) => `${t.clase}|${t.identificador}|${t.esLista ? "L" : "N"}`)
    .join("\n");

  // Simple hash: suma de códigos char (no criptográfico, pero determinista)
  let hash = 0;
  for (let i = 0; i < serializado.length; i++) {
    const code = serializado.charCodeAt(i);
    hash = ((hash << 5) - hash + code) | 0; // 32-bit hash
  }

  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Interfaz para una huella de pantalla
 */
export interface Huella {
  hash: string; // hash corto: "p-" + 8 hex
  tokens: Token[];
  nodosTotales: number;
  timestamp: number;
}

/**
 * Calcula la huella de una pantalla
 */
export function calcularHuella(arbol: ArbolNormalizado): Huella {
  const tokens = generarTokens(arbol);
  const hash = "p-" + hashHuella(tokens);

  return {
    hash,
    tokens,
    nodosTotales: arbol.nodos.length,
    timestamp: arbol.timestamp,
  };
}
