import type { ArbolNormalizado, NodoNormalizado } from "../../normalizador/tipos.js";
import { pareceTextoVolatil } from "./dynamic-value.js";
import { getAncestors, getChildren, getDescendants, getSiblings } from "./relations.js";
import { crearCandidato } from "./scoring.js";
import type { LocatorCandidate } from "./types.js";

function xpathLiteral(value: string): string {
  if (!value.includes("'")) {
    return `'${value}'`;
  }

  if (!value.includes('"')) {
    return `"${value}"`;
  }

  const parts = value.split("'");

  return `concat(${parts.map((part) => `'${part}'`).join(`, "'", `)})`;
}

function anchorXpath(nodo: NodoNormalizado): string | null {
  if (nodo.idEstable) {
    const literal = xpathLiteral(nodo.idEstable);

    return `//*[@resource-id=${literal} or @name=${literal}]`;
  }

  if (nodo.descripcion) {
    const literal = xpathLiteral(nodo.descripcion);

    return `//*[@content-desc=${literal} or @label=${literal} or @name=${literal}]`;
  }

  if (nodo.texto) {
    const literal = xpathLiteral(nodo.texto);

    return `//*[@text=${literal} or @label=${literal} or @value=${literal}]`;
  }

  return null;
}

function classPredicate(nodo: NodoNormalizado): string {
  const literal = xpathLiteral(nodo.clase);

  const parts = [`(@class=${literal} or @type=${literal})`];

  if (nodo.clickable) {
    parts.push(`@clickable='true'`);
  }

  if (nodo.scrollable) {
    parts.push(`@scrollable='true'`);
  }

  if (nodo.esCampoTexto) {
    parts.push(`(@focusable='true' or @enabled='true')`);
  }

  return `*[${parts.join(" and ")}]`;
}

function sameSignature(candidate: NodoNormalizado, target: NodoNormalizado): boolean {
  if (candidate.clase !== target.clase) {
    return false;
  }

  if (target.clickable && !candidate.clickable) {
    return false;
  }

  if (target.scrollable && !candidate.scrollable) {
    return false;
  }

  if (target.esCampoTexto && !candidate.esCampoTexto) {
    return false;
  }

  return true;
}

function isAnchorUnique(anchor: NodoNormalizado, arbol: ArbolNormalizado): boolean {
  if (anchor.idEstable) {
    return arbol.nodos.filter((node) => node.idEstable === anchor.idEstable).length === 1;
  }

  if (anchor.descripcion) {
    return arbol.nodos.filter((node) => node.descripcion === anchor.descripcion).length === 1;
  }

  if (anchor.texto) {
    return arbol.nodos.filter((node) => node.texto === anchor.texto).length === 1;
  }

  return false;
}

function usableAnchor(nodo: NodoNormalizado, arbol: ArbolNormalizado): string | null {
  if (!isAnchorUnique(nodo, arbol)) {
    return null;
  }

  if (!nodo.idEstable && !nodo.descripcion && nodo.texto && pareceTextoVolatil(nodo.texto)) {
    return null;
  }

  return anchorXpath(nodo);
}

export function locatorsPorParent(
  target: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  const result: LocatorCandidate[] = [];

  for (const child of getChildren(target, arbol)) {
    if (!child.idEstable) {
      continue;
    }

    const idEsUnico =
      arbol.nodos.filter((candidate) => candidate.idEstable === child.idEstable).length === 1;

    if (!idEsUnico) {
      continue;
    }

    const idLiteral = xpathLiteral(child.idEstable);

    const atributo = child.clase.startsWith("XCUIElementType") ? "name" : "resource-id";

    let parentPredicate = "";

    if (target.clickable) {
      parentPredicate = "[@clickable='true']";
    } else if (target.scrollable) {
      parentPredicate = "[@scrollable='true']";
    }

    const xpath = `//${child.clase}[@${atributo}=${idLiteral}]/..${parentPredicate}`;

    result.push(
      crearCandidato({
        valor: xpath,
        tipo: "xpath",
        estrategia: "parent",
        unico: true,
        dinamico: false,
        score: 92,
        motivo: "padre inmediato localizado mediante hijo con ID estable y único",
      }),
    );
  }

  return result;
}

export function locatorsPorAncestor(
  target: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  const result: LocatorCandidate[] = [];

  const descendants = getDescendants(target, arbol).slice(0, 40);

  for (const descendant of descendants) {
    const anchor = usableAnchor(descendant, arbol);

    if (!anchor) {
      continue;
    }

    const candidatos = getAncestors(descendant, arbol).filter((candidate) =>
      sameSignature(candidate, target),
    );

    const unico = candidatos.length === 1 && candidatos[0]?.indice === target.indice;

    result.push(
      crearCandidato({
        valor: `${anchor}/ancestor::${classPredicate(target)}`,
        tipo: "xpath",
        estrategia: "ancestor",
        unico,
        dinamico: false,
        score: unico ? 84 : 56,
        motivo: "ancestor relativo a descendiente con ancla única",
      }),
    );
  }

  return result;
}

export function locatorsPorDescendant(
  target: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  const result: LocatorCandidate[] = [];

  for (const ancestor of getAncestors(target, arbol).slice(0, 8)) {
    const anchor = usableAnchor(ancestor, arbol);

    if (!anchor) {
      continue;
    }

    const posibles = getDescendants(ancestor, arbol).filter((candidate) =>
      sameSignature(candidate, target),
    );

    const unico = posibles.length === 1 && posibles[0]?.indice === target.indice;

    result.push(
      crearCandidato({
        valor: `${anchor}/descendant::${classPredicate(target)}`,
        tipo: "xpath",
        estrategia: "descendant",
        unico,
        dinamico: false,
        score: unico ? 80 : 54,
        motivo: "descendant dentro de ancestro con ancla única",
      }),
    );
  }

  return result;
}

export function locatorsPorSibling(
  target: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  const result: LocatorCandidate[] = [];

  const siblings = getSiblings(target, arbol);

  for (const sibling of siblings) {
    const anchor = usableAnchor(sibling, arbol);

    if (!anchor) {
      continue;
    }

    const candidatosRelacionados = getSiblings(sibling, arbol).filter((candidate) => {
      if (!sameSignature(candidate, target)) {
        return false;
      }

      if (sibling.indice < target.indice) {
        return candidate.indice > sibling.indice;
      }

      return candidate.indice < sibling.indice;
    });

    const unico =
      candidatosRelacionados.length === 1 && candidatosRelacionados[0]?.indice === target.indice;

    if (sibling.indice < target.indice) {
      result.push(
        crearCandidato({
          valor: `${anchor}/following-sibling::${classPredicate(target)}`,
          tipo: "xpath",
          estrategia: "following-sibling",
          unico,
          dinamico: false,
          score: unico ? 77 : 45,
          motivo: unico
            ? "following-sibling relativo a ancla única"
            : "following-sibling con múltiples candidatos",
        }),
      );
    }

    if (sibling.indice > target.indice) {
      result.push(
        crearCandidato({
          valor: `${anchor}/preceding-sibling::${classPredicate(target)}`,
          tipo: "xpath",
          estrategia: "preceding-sibling",
          unico,
          dinamico: false,
          score: unico ? 77 : 45,
          motivo: unico
            ? "preceding-sibling relativo a ancla única"
            : "preceding-sibling con múltiples candidatos",
        }),
      );
    }
  }

  return result;
}

export function generarEstructurales(
  target: NodoNormalizado,
  arbol: ArbolNormalizado,
): LocatorCandidate[] {
  return [
    ...locatorsPorParent(target, arbol),
    ...locatorsPorAncestor(target, arbol),
    ...locatorsPorDescendant(target, arbol),
    ...locatorsPorSibling(target, arbol),
  ];
}
