import { calcularLocatorsArbol } from "../../calidad/index.js";
import { calcularHuella } from "../../huella/tokens.js";
import { normalizarPageSource } from "../../normalizador/index.js";
import type { NodoNormalizado } from "../../normalizador/tipos.js";
import type { FlowLocator } from "../types.js";
import type { SnapshotProvider } from "./snapshot-provider.js";
import type { LiveElement, LiveSnapshot } from "./types.js";

export interface PageSourceProvider {
  getPageSource(): Promise<string>;
}

function toFlowLocator(
  locator: ReturnType<typeof calcularLocatorsArbol> extends Map<number, infer T> ? T : never,
): FlowLocator | undefined {
  const principal = locator?.principal;

  if (!principal) {
    return undefined;
  }

  return {
    type: principal.tipo,
    value: principal.valor,
    quality: principal.calidad,
    unique: principal.unico,
    strategy: principal.estrategia,
  };
}

function visibleText(nodo: NodoNormalizado): string | null {
  if (!nodo.visible) {
    return null;
  }

  const text = nodo.texto?.trim() || nodo.descripcion?.trim();

  return text || null;
}

export class AppiumSnapshotProvider implements SnapshotProvider {
  constructor(private readonly source: PageSourceProvider) {}

  async capture(): Promise<LiveSnapshot> {
    const xml = await this.source.getPageSource();

    const arbol = normalizarPageSource(xml);

    const huella = calcularHuella(arbol);

    const locators = calcularLocatorsArbol(arbol);

    const elements: LiveElement[] = [];

    let focusedElement: LiveElement | undefined;

    for (const nodo of arbol.nodos) {
      const locator = locators.get(nodo.indice);

      const liveElement: LiveElement = {
        nodeIndex: nodo.indice,

        title:
          locator?.titulo ||
          locator?.descripcion ||
          nodo.idEstable ||
          nodo.descripcion ||
          nodo.texto ||
          nodo.clase,

        locator: locator ? toFlowLocator(locator) : undefined,

        bounds: nodo.bounds,

        clickable: nodo.clickable,
        editable: nodo.esCampoTexto,
        enabled: nodo.habilitado,
        visible: nodo.visible,
        sensitive: nodo.sensible,

        depth: nodo.profundidad,
      };

      elements.push(liveElement);

      if (nodo.enfocado && nodo.visible) {
        focusedElement = liveElement;
      }
    }

    const visibleTexts = arbol.nodos
      .map(visibleText)
      .filter((value): value is string => value !== null);

    return {
      capturedAt: Date.now(),

      screen: {
        fingerprint: huella.hash,
      },

      elements,

      visibleTexts,

      focusedElement,
    };
  }
}
