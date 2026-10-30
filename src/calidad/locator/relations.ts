import type { ArbolNormalizado, NodoNormalizado } from "../../normalizador/tipos.js";

export function getNodeMap(arbol: ArbolNormalizado): Map<number, NodoNormalizado> {
  return new Map(arbol.nodos.map((node) => [node.indice, node]));
}

export function getParent(nodo: NodoNormalizado, arbol: ArbolNormalizado): NodoNormalizado | null {
  if (nodo.padre === null || nodo.padre === undefined) {
    return null;
  }

  return getNodeMap(arbol).get(nodo.padre) ?? null;
}

export function getChildren(nodo: NodoNormalizado, arbol: ArbolNormalizado): NodoNormalizado[] {
  return arbol.nodos.filter((candidate) => candidate.padre === nodo.indice);
}

export function getAncestors(nodo: NodoNormalizado, arbol: ArbolNormalizado): NodoNormalizado[] {
  const byIndex = getNodeMap(arbol);

  const result: NodoNormalizado[] = [];
  const visited = new Set<number>();

  let parentIndex = nodo.padre;

  while (parentIndex !== null && parentIndex !== undefined) {
    if (visited.has(parentIndex)) {
      break;
    }

    visited.add(parentIndex);

    const parent = byIndex.get(parentIndex);

    if (!parent) {
      break;
    }

    result.push(parent);
    parentIndex = parent.padre;
  }

  return result;
}

export function isDescendantOf(
  candidate: NodoNormalizado,
  ancestor: NodoNormalizado,
  arbol: ArbolNormalizado,
): boolean {
  return getAncestors(candidate, arbol).some((node) => node.indice === ancestor.indice);
}

export function getDescendants(nodo: NodoNormalizado, arbol: ArbolNormalizado): NodoNormalizado[] {
  return arbol.nodos.filter(
    (candidate) => candidate.indice !== nodo.indice && isDescendantOf(candidate, nodo, arbol),
  );
}

export function getSiblings(nodo: NodoNormalizado, arbol: ArbolNormalizado): NodoNormalizado[] {
  return arbol.nodos
    .filter((candidate) => candidate.padre === nodo.padre && candidate.indice !== nodo.indice)
    .sort((a, b) => a.indice - b.indice);
}
