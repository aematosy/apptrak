import type { ArbolNormalizado, NodoNormalizado } from "../../normalizador/tipos.js";
import { generarDirectos } from "./direct-locators.js";
import { ordenarCandidatos } from "./scoring.js";
import { generarEstructurales } from "./structural-locators.js";
import type { LocatorCandidate } from "./types.js";

function deduplicar(candidates: LocatorCandidate[]): LocatorCandidate[] {
  const map = new Map<string, LocatorCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.tipo}:${candidate.valor}`;

    const current = map.get(key);

    if (!current || candidate.score > current.score) {
      map.set(key, candidate);
    }
  }

  return [...map.values()];
}

export function generarCandidatos(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  const directos = generarDirectos(nodo, arbol);

  const estructurales = generarEstructurales(nodo, arbol);

  return ordenarCandidatos(deduplicar([...directos, ...estructurales]));
}
