import type { ArbolNormalizado, NodoNormalizado } from "../../normalizador/tipos.js";
import { generarCandidatos } from "./candidates.js";
import { inferirTituloElemento } from "./naming.js";
import { crearCandidato } from "./scoring.js";
import type { LocalizadorElementoV2, LocatorCandidate } from "./types.js";

function fallbackPorClase(nodo: NodoNormalizado, arbol: ArbolNormalizado): LocatorCandidate {
  const iguales = arbol.nodos.filter((candidate) => candidate.clase === nodo.clase);

  const unico = iguales.length === 1;

  const claseCorta = nodo.clase.split(".").pop() || nodo.clase;

  return crearCandidato({
    valor: claseCorta,
    tipo: "clase",
    estrategia: "class-fallback",
    unico,
    dinamico: false,
    score: unico ? 55 : 20,
    motivo: unico ? "clase única en pantalla" : "fallback por clase sin índice",
  });
}

export function calcularLocatorV2(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocalizadorElementoV2 {
  const candidatos = generarCandidatos(nodo, arbol);

  const fallback = fallbackPorClase(nodo, arbol);

  const principal = candidatos[0] ?? fallback;

  const alternativas = candidatos.length > 0 ? candidatos.slice(1, 8) : [];

  const descripcion =
    nodo.descripcion || nodo.texto || nodo.idEstable || `${nodo.clase} (nodo ${nodo.indice})`;

  return {
    titulo: inferirTituloElemento(nodo, arbol),
    principal,
    alternativas,
    descripcion,
  };
}

export function calcularLocatorsArbolV2(
  arbol: ArbolNormalizado,
): Map<number, LocalizadorElementoV2> {
  const result = new Map<number, LocalizadorElementoV2>();

  for (const nodo of arbol.nodos) {
    result.set(nodo.indice, calcularLocatorV2(nodo, arbol));
  }

  return result;
}
