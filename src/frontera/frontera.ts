/**
 * PASO 6: Frontera de acciones
 * Basado en SDD 6.4: Orden de prueba, topes, tratamiento de listas
 *
 * Orden de preferencia (SDD 6.4):
 * 1. Campos de texto (tocar, escribir)
 * 2. Navegación principal (tabs, botones de sección)
 * 3. IDs estables
 * 4. Resto (clickables)
 */

import type { NodoNormalizado, ArbolNormalizado } from "../normalizador/tipos.js";
import type { LocalizadorElemento } from "../calidad/index.js";

export type AccionCandidata = "tap" | "write" | "scroll" | "back";

export interface Accion {
  indiceNodo: number;
  tipo: AccionCandidata;
  prioridad: number; // 0-1000, más alto = prioritario
  descripcion: string;
}

/**
 * Calcula prioridad de un nodo para exploración
 * Basado en SDD 6.4: orden de prueba
 */
function calcularPrioridad(
  nodo: NodoNormalizado,
  esNavegacionPrincipal: boolean,
  tieneLocatorEstable: boolean
): number {
  let prioridad = 100;

  // Nivel 1: Campos de texto (máxima prioridad)
  if (nodo.esCampoTexto) {
    prioridad += 1000;
  }

  // Nivel 2: Navegación principal (tabs, botones principales)
  if (esNavegacionPrincipal) {
    prioridad += 800;
  }

  // Nivel 3: IDs estables
  if (tieneLocatorEstable) {
    prioridad += 500;
  }

  // Nivel 4: Clickables genéricos
  if (nodo.clickable) {
    prioridad += 100;
  }

  // Desutilizar: sensibles, no visibles, no habilitados
  if (nodo.sensible) prioridad -= 500;
  if (!nodo.visible) prioridad -= 300;
  if (!nodo.habilitado) prioridad -= 300;

  return Math.max(0, prioridad);
}

/**
 * Detecta si un nodo es parte de la navegación principal
 * Heurística: botones en barra inferior, tabs, etc.
 */
function esNavegacionPrincipal(nodo: NodoNormalizado, arbol: ArbolNormalizado): boolean {
  // Heurística simple: si está cerca del borde inferior y es clickable
  const alturaPantalla = arbol.height;
  const distanciaAlBorde = Math.abs(alturaPantalla - nodo.bounds.y2);

  // Si está en últimos 15% de pantalla y es clickable
  if (distanciaAlBorde < alturaPantalla * 0.15 && nodo.clickable) {
    return true;
  }

  // También si tiene ID con "nav", "menu", "tab"
  if (nodo.idEstable?.match(/nav|menu|tab/i)) {
    return true;
  }

  return false;
}

/**
 * Genera frontera: lista de acciones candidatas en orden de prueba
 */
export function generarFrontera(
  arbol: ArbolNormalizado,
  locators: Map<number, LocalizadorElemento>,
  maxAcciones: number = 50
): Accion[] {
  const acciones: Accion[] = [];

  for (const nodo of arbol.nodos) {
    if (!nodo.visible || !nodo.habilitado) continue;

    // Excluir campos sensibles
    if (nodo.sensible) continue;

    // Excluir nodos muy pequeños (ruido)
    const ancho = nodo.bounds.x2 - nodo.bounds.x1;
    const alto = nodo.bounds.y2 - nodo.bounds.y1;
    if (ancho < 20 || alto < 20) continue;

    const localizador = locators.get(nodo.indice);
    const tieneLocatorEstable =
      localizador?.principal.calidad === "estable";
    const esNav = esNavegacionPrincipal(nodo, arbol);
    const prioridad = calcularPrioridad(nodo, esNav, tieneLocatorEstable);

    // Generar acción(es) según tipo
    if (nodo.esCampoTexto && (nodo.clickable || nodo.visible)) {
      // Campo de texto: primero tap para enfocar, luego write
      acciones.push({
        indiceNodo: nodo.indice,
        tipo: "tap",
        prioridad: prioridad + 10, // tap primero
        descripcion: `Tap en campo: ${nodo.descripcion || nodo.texto || nodo.clase}`,
      });
      acciones.push({
        indiceNodo: nodo.indice,
        tipo: "write",
        prioridad: prioridad,
        descripcion: `Escribir en: ${nodo.descripcion || nodo.clase}`,
      });
    } else if (nodo.clickable) {
      // Elemento clickable normal
      acciones.push({
        indiceNodo: nodo.indice,
        tipo: "tap",
        prioridad,
        descripcion: `Tap en: ${nodo.descripcion || nodo.texto || nodo.clase}`,
      });
    } else if (nodo.scrollable) {
      // Scrollable
      acciones.push({
        indiceNodo: nodo.indice,
        tipo: "scroll",
        prioridad: prioridad - 100, // baja prioridad
        descripcion: `Scroll: ${nodo.clase}`,
      });
    } else if (
      nodo.visible &&
      nodo.habilitado &&
      nodo.rolInferido === "botón"
    ) {
      // Botones inferidos por clase pero no marcados como clickable
      acciones.push({
        indiceNodo: nodo.indice,
        tipo: "tap",
        prioridad: prioridad - 50, // algo de penalización
        descripcion: `Tap (botón): ${nodo.descripcion || nodo.texto || nodo.clase}`,
      });
    }
  }

  // Ordenar por prioridad (descendente) y luego por descripción (determinista)
  acciones.sort((a, b) => {
    if (b.prioridad !== a.prioridad) {
      return b.prioridad - a.prioridad;
    }
    return a.descripcion.localeCompare(b.descripcion);
  });

  // Limitar
  return acciones.slice(0, maxAcciones);
}

/**
 * Estadísticas de frontera
 */
export interface EstadisticasFrontera {
  totalAcciones: number;
  taps: number;
  writes: number;
  scrolls: number;
  prioridadPromedio: number;
  prioridadMax: number;
}

export function estadisticasFrontera(acciones: Accion[]): EstadisticasFrontera {
  const taps = acciones.filter((a) => a.tipo === "tap").length;
  const writes = acciones.filter((a) => a.tipo === "write").length;
  const scrolls = acciones.filter((a) => a.tipo === "scroll").length;

  const prioridades = acciones.map((a) => a.prioridad);
  const prioridadPromedio =
    prioridades.length > 0
      ? prioridades.reduce((a, b) => a + b, 0) / prioridades.length
      : 0;
  const prioridadMax = Math.max(...prioridades, 0);

  return {
    totalAcciones: acciones.length,
    taps,
    writes,
    scrolls,
    prioridadPromedio,
    prioridadMax,
  };
}
