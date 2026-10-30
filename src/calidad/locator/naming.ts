import type { ArbolNormalizado, NodoNormalizado } from "../../normalizador/tipos.js";
import { pareceTextoVolatil } from "./dynamic-value.js";
import { getChildren } from "./relations.js";

const SUFIJOS_TECNICOS = new Set([
  "label",
  "button",
  "btn",
  "input",
  "field",
  "text",
  "textview",
  "view",
  "container",
  "component",
  "touchable",
  "element",
  "icon",
]);

export function humanizarIdentificador(value: string): string {
  const tokens = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[-_.:\s]+/)
    .filter(Boolean);

  while (
    tokens.length > 1 &&
    SUFIJOS_TECNICOS.has(tokens[tokens.length - 1]?.toLowerCase() ?? "")
  ) {
    tokens.pop();
  }

  if (tokens.length === 0) {
    return value;
  }

  const result = tokens.join(" ").toLowerCase();

  return result.charAt(0).toUpperCase() + result.slice(1);
}

function hijoConIdEstable(nodo: NodoNormalizado, arbol: ArbolNormalizado): NodoNormalizado | null {
  return getChildren(nodo, arbol).find((child) => child.idEstable) ?? null;
}

export function inferirTituloElemento(nodo: NodoNormalizado, arbol: ArbolNormalizado): string {
  if (nodo.idEstable) {
    return humanizarIdentificador(nodo.idEstable);
  }

  const hijoEstable = hijoConIdEstable(nodo, arbol);

  if (hijoEstable?.idEstable) {
    return humanizarIdentificador(hijoEstable.idEstable);
  }

  if (nodo.descripcion && !pareceTextoVolatil(nodo.descripcion)) {
    return nodo.descripcion;
  }

  if (nodo.texto && !pareceTextoVolatil(nodo.texto)) {
    return nodo.texto;
  }

  return humanizarIdentificador(nodo.clase.split(".").pop() ?? nodo.clase);
}
