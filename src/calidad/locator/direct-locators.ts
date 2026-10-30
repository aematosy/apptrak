import type { ArbolNormalizado, NodoNormalizado } from "../../normalizador/tipos.js";
import { pareceTextoVolatil, pareceValorDinamico } from "./dynamic-value.js";
import { getDescendants } from "./relations.js";
import { crearCandidato } from "./scoring.js";
import type { LocatorCandidate } from "./types.js";

function countBy(arbol: ArbolNormalizado, predicate: (nodo: NodoNormalizado) => boolean): number {
  return arbol.nodos.filter(predicate).length;
}

function tieneDescendienteConIdEstable(nodo: NodoNormalizado, arbol: ArbolNormalizado): boolean {
  return getDescendants(nodo, arbol).some((descendant) => {
    if (!descendant.idEstable) {
      return false;
    }

    return countBy(arbol, (candidate) => candidate.idEstable === descendant.idEstable) === 1;
  });
}

function descripcionReflejaDescendiente(nodo: NodoNormalizado, arbol: ArbolNormalizado): boolean {
  const descripcion = nodo.descripcion?.trim();

  if (!descripcion) {
    return false;
  }

  return getDescendants(nodo, arbol).some((descendant) => {
    const texto = descendant.texto?.trim();
    const descripcionHijo = descendant.descripcion?.trim();

    return texto === descripcion || descripcionHijo === descripcion;
  });
}

export function locatorPorId(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate | null {
  if (!nodo.idEstable) {
    return null;
  }

  const unico = countBy(arbol, (candidate) => candidate.idEstable === nodo.idEstable) === 1;

  const dinamico = pareceValorDinamico(nodo.idEstable);

  return crearCandidato({
    valor: nodo.idEstable,
    tipo: "id",
    estrategia: "direct-id",
    unico,
    dinamico,
    score: 100 - (unico ? 0 : 30) - (dinamico ? 25 : 0),
    motivo: dinamico
      ? "resource-id con patrón potencialmente dinámico"
      : unico
        ? "resource-id único"
        : "resource-id repetido",
  });
}

export function locatorPorAccessibility(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate | null {
  const descripcion = nodo.descripcion?.trim();

  if (!descripcion) {
    return null;
  }

  const unico = countBy(arbol, (candidate) => candidate.descripcion?.trim() === descripcion) === 1;

  const volatil = pareceTextoVolatil(descripcion);

  const reflejaDescendiente = descripcionReflejaDescendiente(nodo, arbol);

  const descendienteConId = tieneDescendienteConIdEstable(nodo, arbol);

  const derivadoDeContenido = reflejaDescendiente && descendienteConId;

  const dinamico = volatil || pareceValorDinamico(descripcion);

  return crearCandidato({
    valor: descripcion,
    tipo: "accessibility-id",
    estrategia: "direct-accessibility",
    unico,
    dinamico,
    score: 95 - (unico ? 0 : 25) - (dinamico ? 25 : 0) - (derivadoDeContenido ? 15 : 0),
    motivo: derivadoDeContenido
      ? "accessibility-id derivado de contenido visible; existe descendiente con ID estable"
      : dinamico
        ? "accessibility-id con contenido potencialmente variable"
        : unico
          ? "accessibility-id único"
          : "accessibility-id repetido",
  });
}

export function locatorPorTexto(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate | null {
  const texto = nodo.texto?.trim();

  if (!texto) {
    return null;
  }

  const unico = countBy(arbol, (candidate) => candidate.texto?.trim() === texto) === 1;

  const dinamico = pareceTextoVolatil(texto) || pareceValorDinamico(texto);

  return crearCandidato({
    valor: texto,
    tipo: "texto",
    estrategia: "direct-text",
    unico,
    dinamico,
    score: 78 - (unico ? 0 : 25) - (dinamico ? 25 : 0),
    motivo: dinamico ? "texto potencialmente variable" : unico ? "texto único" : "texto repetido",
  });
}

export function generarDirectos(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  return [
    locatorPorId(nodo, arbol),
    locatorPorAccessibility(nodo, arbol),
    locatorPorTexto(nodo, arbol),
  ].filter((item): item is LocatorCandidate => item !== null);
}
