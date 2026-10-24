/**
 * PASO 5: Calidad de locators
 * Basado en SDD 10.3: Estrategias, verificación de unicidad, criterios de calidad
 *
 * Niveles de calidad (4): estable, media, ancla, frágil
 * Estrategia: preferencia en orden
 */

import type { NodoNormalizado, ArbolNormalizado } from "../normalizador/tipos.js";

export type CalidadLocator = "estable" | "media" | "ancla" | "fragil";

export interface Locator {
  valor: string; // id, xpath, clase, etc.
  tipo: "id" | "xpath" | "texto" | "clase" | "indice" | "accessibility-id";
  calidad: CalidadLocator;
  unico: boolean; // ¿es único en la pantalla?
  confianza: number; // 0.0-1.0
}

export interface LocalizadorElemento {
  principal: Locator; // mejor locator
  alternativas: Locator[]; // otros válidos, ordenados por calidad
  descripcion: string; // descripción del elemento (para debug)
}

/**
 * Estrategias de locators en orden de preferencia (SDD 10.3)
 * 1. resource-id exacto (estable)
 * 2. Accesibilidad ID (estable)
 * 3. XPath con estructura (media)
 * 4. Descripción/content-desc (ancla)
 * 5. Clase + índice (frágil)
 */

/**
 * Genera locator por resource-id: máxima prioridad si es único
 */
function generarLocatorId(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): Locator | null {
  if (!nodo.idEstable) return null;

  // Verificar unicidad en la pantalla
  const otrosConId = arbol.nodos.filter(
    (n) => n.idEstable === nodo.idEstable && n.indice !== nodo.indice
  );

  const unico = otrosConId.length === 0;
  const confianza = unico ? 1.0 : 0.5; // si hay duplicados, menos confianza

  return {
    valor: nodo.idEstable,
    tipo: "id",
    calidad: "estable",
    unico,
    confianza,
  };
}

/**
 * Genera locator por accessibility-id/content-desc
 */
function generarLocatorAccesibilidad(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): Locator | null {
  if (!nodo.descripcion) return null;

  const otrosConDesc = arbol.nodos.filter(
    (n) => n.descripcion === nodo.descripcion && n.indice !== nodo.indice
  );

  const unico = otrosConDesc.length === 0;
  const confianza = unico ? 0.95 : 0.6;

  return {
    valor: nodo.descripcion,
    tipo: "accessibility-id",
    calidad: unico ? "estable" : "media",
    unico,
    confianza,
  };
}

/**
 * Genera xpath basado en estructura (clase + posición en hermanos)
 */
function generarLocatorXPath(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): Locator {
  // XPath simple: //<clase>[posición]
  const hermanos = arbol.nodos.filter((n) => n.padre === nodo.padre);
  const posicionEnHermanos = hermanos.findIndex((h) => h.indice === nodo.indice) + 1;

  // Simplificar clase: solo el último componente
  const claseCorta = nodo.clase.split(".").pop() || nodo.clase;

  // XPath muy simplificado (en realidad sería más complejo)
  const xpath = `//${claseCorta}[${posicionEnHermanos}]`;

  // Verificar si es único
  const otrosConXpath = arbol.nodos.filter(
    (n) =>
      n.clase === nodo.clase &&
      arbol.nodos.filter((h) => h.padre === n.padre && h.clase === nodo.clase)
        .length === hermanos.length &&
      n.indice !== nodo.indice
  );

  const unico = otrosConXpath.length === 0;
  const confianza = unico ? 0.8 : 0.4; // xpath es más frágil

  return {
    valor: xpath,
    tipo: "xpath",
    calidad: unico ? "media" : "fragil",
    unico,
    confianza,
  };
}

/**
 * Genera locator por texto visible
 */
function generarLocatorTexto(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): Locator | null {
  if (!nodo.texto || nodo.texto.length === 0) return null;

  const otrosConTexto = arbol.nodos.filter(
    (n) => n.texto === nodo.texto && n.indice !== nodo.indice
  );

  const unico = otrosConTexto.length === 0;
  const confianza = unico ? 0.7 : 0.3; // texto es muy variable

  return {
    valor: nodo.texto,
    tipo: "texto",
    calidad: unico ? "ancla" : "fragil",
    unico,
    confianza,
  };
}

/**
 * Genera locator por clase + índice
 */
function generarLocatorClaseIndice(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): Locator {
  const claseCorta = nodo.clase.split(".").pop() || nodo.clase;
  const hermanos = arbol.nodos.filter((n) => n.padre === nodo.padre && n.clase === nodo.clase);
  const indice = hermanos.findIndex((h) => h.indice === nodo.indice) + 1;

  const valor = `${claseCorta}[${indice}]`;
  const unico = hermanos.length === 1;
  const confianza = unico ? 0.5 : 0.2; // muy frágil

  return {
    valor,
    tipo: "clase",
    calidad: "fragil",
    unico,
    confianza,
  };
}

/**
 * Calcula todos los locators de un nodo, ordenados por calidad
 */
export function calcularLocators(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): LocalizadorElemento {
  const locators: Locator[] = [];

  // 1. ID (estable)
  const locId = generarLocatorId(nodo, arbol);
  if (locId) locators.push(locId);

  // 2. Accesibilidad ID (estable)
  const locAcces = generarLocatorAccesibilidad(nodo, arbol);
  if (locAcces) locators.push(locAcces);

  // 3. XPath (media-frágil)
  const locXPath = generarLocatorXPath(nodo, arbol);
  locators.push(locXPath);

  // 4. Texto (ancla-frágil)
  const locTexto = generarLocatorTexto(nodo, arbol);
  if (locTexto) locators.push(locTexto);

  // 5. Clase + índice (frágil)
  const locClaseIndice = generarLocatorClaseIndice(nodo, arbol);
  locators.push(locClaseIndice);

  // Ordenar por calidad y confianza
  const ordenCalidad = { estable: 4, media: 3, ancla: 2, fragil: 1 };
  locators.sort((a, b) => {
    const cmpCalidad =
      (ordenCalidad[b.calidad] || 0) - (ordenCalidad[a.calidad] || 0);
    if (cmpCalidad !== 0) return cmpCalidad;
    return b.confianza - a.confianza;
  });

  const principal = locators[0] || locClaseIndice;
  const alternativas = locators.slice(1);

  const descripcion =
    nodo.descripcion || nodo.texto || `${nodo.clase} (índice ${nodo.indice})`;

  return {
    principal,
    alternativas,
    descripcion,
  };
}

/**
 * Calcula locators para todos los nodos de una pantalla
 */
export function calcularLocatorsArbol(
  arbol: ArbolNormalizado
): Map<number, LocalizadorElemento> {
  const result = new Map<number, LocalizadorElemento>();

  for (const nodo of arbol.nodos) {
    result.set(nodo.indice, calcularLocators(nodo, arbol));
  }

  return result;
}

/**
 * Estadísticas de calidad de una pantalla
 */
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
  locators: Map<number, LocalizadorElemento>
): EstadisticasCalidad {
  const totalNodos = locators.size;
  let estable = 0,
    media = 0,
    ancla = 0,
    fragil = 0;

  for (const loc of locators.values()) {
    switch (loc.principal.calidad) {
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
