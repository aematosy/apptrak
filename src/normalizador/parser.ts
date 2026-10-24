/**
 * PASO 3: Parser XML de Appium
 * Convierte page source XML (Android UiAutomator2 / iOS XCUITest) a árbol JSON
 */

import { XMLParser } from "fast-xml-parser";
import type { ArbolNormalizado, NodoNormalizado, Bounds } from "./tipos.js";
import { rolesAndroid } from "./tipos.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  // Los nodos anidados vienen como propiedades del contenedor
  // Ej: hierarchy.android.widget.FrameLayout
  // NO como hierarchy.node[]
  isArray: (name) => {
    // Cualquier etiqueta de clase Android o iOS puede venir como array si hay múltiples
    return name === "hierarchy" || name.includes(".");
  },
});

interface RawNode {
  "@_index"?: string;
  "@_package"?: string;
  "@_class"?: string;
  "@_text"?: string;
  "@_resource-id"?: string;
  "@_content-desc"?: string;
  "@_bounds"?: string;
  "@_enabled"?: string;
  "@_visible"?: string;
  "@_displayed"?: string;
  "@_clickable"?: string;
  "@_scrollable"?: string;
  "@_focused"?: string;
  "@_password"?: string;
  "@_input-type"?: string;
  [key: string]: unknown;
}

interface RawHierarchy {
  "@_width"?: string;
  "@_height"?: string;
  "@_rotation"?: string;
  [key: string]: unknown; // Puede tener múltiples clases de nodos
}

/**
 * Parsea bounds: "[x1,y1][x2,y2]" → { x1, y1, x2, y2 }
 */
export function parseBounds(boundsStr: string | undefined): Bounds {
  if (!boundsStr) return { x1: 0, y1: 0, x2: 0, y2: 0 };

  // Formato: "[0,0][1080,2400]"
  const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return { x1: 0, y1: 0, x2: 0, y2: 0 };

  const [, x1, y1, x2, y2] = match;
  return {
    x1: parseInt(x1),
    y1: parseInt(y1),
    x2: parseInt(x2),
    y2: parseInt(y2),
  };
}

/**
 * Parsea "true"/"false" strings a boolean
 */
function parseBool(val: string | undefined): boolean {
  return val === "true";
}

/**
 * Extrae atributos de un nodo XML crudo
 */
function extraerAtributos(rawNode: RawNode, platform: "android" | "ios") {
  const clase = (rawNode["@_class"] as string) || "";
  const idEstable = (rawNode["@_resource-id"] as string) || null;
  const descripcion = (rawNode["@_content-desc"] as string) || null;
  const texto = (rawNode["@_text"] as string) || null;
  const bounds = parseBounds(rawNode["@_bounds"] as string);
  const paquete = (rawNode["@_package"] as string) || null;

  const habilitado = parseBool(rawNode["@_enabled"] as string);
  // Android: displayed="true", iOS: visible="true"
  const visible =
    platform === "android"
      ? parseBool(rawNode["@_displayed"] as string)
      : parseBool(rawNode["@_visible"] as string);
  const clickable = parseBool(rawNode["@_clickable"] as string);
  const scrollable = parseBool(rawNode["@_scrollable"] as string);
  const enfocado = parseBool(rawNode["@_focused"] as string);
  const sensible = parseBool(rawNode["@_password"] as string);

  // Campo de texto: si es EditText o tiene input-type
  const esCampoTexto =
    clase.includes("EditText") ||
    clase.includes("TextField") ||
    (rawNode["@_input-type"] as string)?.length > 0;

  return {
    clase,
    idEstable,
    descripcion,
    texto,
    bounds,
    paquete,
    habilitado,
    visible,
    clickable,
    scrollable,
    enfocado,
    sensible,
    esCampoTexto,
  };
}

/**
 * Recorre el árbol XML y acumula nodos normalizados
 */
function recorrerArbol(
  rawNode: RawNode | RawNode[] | undefined,
  padre: number | null,
  indiceActual: { count: number },
  nodos: NodoNormalizado[],
  platform: "android" | "ios",
  profundidad: number
): void {
  if (!rawNode) return;

  // Normalizar a array
  const nodosLista = Array.isArray(rawNode) ? rawNode : [rawNode];

  for (const nodo of nodosLista) {
    if (!nodo) continue;

    // Excluir barras del sistema (Android)
    if (
      platform === "android" &&
      (nodo["@_package"] as string)?.includes("systemui")
    ) {
      continue;
    }

    const indice = indiceActual.count++;
    const atributos = extraerAtributos(nodo, platform);

    const rolInferido = rolesAndroid[atributos.clase] || null;

    const nodoNorm: NodoNormalizado = {
      indice,
      padre,
      clase: atributos.clase,
      idEstable: atributos.idEstable,
      descripcion: atributos.descripcion,
      texto: atributos.texto,
      bounds: atributos.bounds,
      habilitado: atributos.habilitado,
      visible: atributos.visible,
      clickable: atributos.clickable,
      scrollable: atributos.scrollable,
      enfocado: atributos.enfocado,
      esCampoTexto: atributos.esCampoTexto,
      sensible: atributos.sensible,
      paquete: atributos.paquete,
      platform,
      ancestros: [],
      descendientes: [],
      etiquetaCercana: null,
      etiquetaPosicion: null,
      profundidad,
      rolInferido,
    };

    nodos.push(nodoNorm);

    // Buscar hijos: pueden venir como propiedades del nodo
    // Ej: nodo["android.widget.FrameLayout"] si hay nodos anidados
    for (const [key, value] of Object.entries(nodo)) {
      if (key.startsWith("@_") || key === "#text") {
        continue; // skip attributes
      }
      // Si es una clase de Android/iOS, es un nodo hijo
      if (key.includes(".") || key === "node") {
        recorrerArbol(
          value as RawNode | RawNode[] | undefined,
          indice,
          indiceActual,
          nodos,
          platform,
          profundidad + 1
        );
      }
    }
  }
}

/**
 * Convierte XML de Appium a ArbolNormalizado
 */
export function parseXMLAppium(
  xmlString: string,
  platform: "android" | "ios" = "android"
): ArbolNormalizado {
  // Parsear XML
  const parsed = parser.parse(xmlString) as {
    hierarchy?: RawHierarchy | RawHierarchy[];
  };

  const hierarchy = Array.isArray(parsed.hierarchy)
    ? parsed.hierarchy[0]
    : parsed.hierarchy;

  if (!hierarchy) {
    return {
      nodos: [],
      width: 0,
      height: 0,
      rotacion: 0,
      timestamp: Date.now(),
      platform,
    };
  }

  const nodos: NodoNormalizado[] = [];
  const indiceActual = { count: 0 };

  // Buscar nodos iniciales en las propiedades de hierarchy
  // Pueden venir como hierarchy["android.widget.FrameLayout"]
  for (const [key, value] of Object.entries(hierarchy)) {
    if (key.startsWith("@_")) {
      continue; // skip attributes, procesadas después
    }
    // Si es una clase de Android/iOS, son nodos hijo de hierarchy
    if (key.includes(".") || key === "node") {
      recorrerArbol(
        value as RawNode | RawNode[] | undefined,
        null,
        indiceActual,
        nodos,
        platform,
        0
      );
    }
  }

  const width = parseInt(hierarchy["@_width"] as string) || 0;
  const height = parseInt(hierarchy["@_height"] as string) || 0;
  const rotacion = parseInt(hierarchy["@_rotation"] as string) || 0;

  return {
    nodos,
    width,
    height,
    rotacion,
    timestamp: Date.now(),
    platform,
  };
}
