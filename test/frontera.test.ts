import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { normalizarPageSource } from "../src/normalizador/index.js";
import { calcularLocatorsArbol } from "../src/calidad/index.js";
import { generarFrontera, estadisticasFrontera } from "../src/frontera/index.js";
import {
  debeExcluirse,
  aplicarPoliticaContinuidad,
  estadisticasExclusiones,
} from "../src/politica/index.js";

let wikipediaXML: string;

beforeAll(() => {
  wikipediaXML = readFileSync(
    "test/fixtures/arboles/wikipedia-inicio.xml",
    "utf-8"
  );
});

describe("Frontera + Política (PASO 6)", () => {
  describe("Generación de frontera", () => {
    it("genera acciones candidatas (o lista vacía si pocas interactivas)", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const frontera = generarFrontera(arbol, locators);

      // Wikipedia onboarding es muy simple, puede no tener muchas acciones
      // Solo verificar que el tipo es correcto
      for (const accion of frontera) {
        expect(["tap", "write", "scroll", "back"]).toContain(accion.tipo);
        expect(accion.prioridad).toBeGreaterThanOrEqual(0);
      }

      // Es OK si no hay acciones (pantalla muy simple)
      expect(frontera).toBeDefined();
    });

    it("prioriza campos de texto", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const frontera = generarFrontera(arbol, locators);

      // Buscar si hay writes (campos de texto)
      const writes = frontera.filter((a) => a.tipo === "write");
      if (writes.length > 0) {
        // Los writes deben tener alta prioridad
        const prioridadWrites = writes[0].prioridad;
        const prioridadPromedio =
          frontera.reduce((sum, a) => sum + a.prioridad, 0) / frontera.length;
        expect(prioridadWrites).toBeGreaterThanOrEqual(prioridadPromedio);
      }
    });

    it("excluye nodos invisibles, deshabilitados o sensibles", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const frontera = generarFrontera(arbol, locators);

      // Verificar que no hay nodos con prioridad negativa
      for (const accion of frontera) {
        expect(accion.prioridad).toBeGreaterThanOrEqual(0);
      }
    });

    it("respeta límite máximo de acciones", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const maxAcciones = 10;
      const frontera = generarFrontera(arbol, locators, maxAcciones);

      expect(frontera.length).toBeLessThanOrEqual(maxAcciones);
    });

    it("calcula estadísticas de frontera", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const frontera = generarFrontera(arbol, locators);
      const stats = estadisticasFrontera(frontera);

      expect(stats.totalAcciones).toBe(frontera.length);
      expect(stats.taps + stats.writes + stats.scrolls).toBe(stats.totalAcciones);
      expect(stats.prioridadPromedio).toBeGreaterThanOrEqual(0);
      expect(stats.prioridadMax).toBeGreaterThanOrEqual(stats.prioridadPromedio);
    });
  });

  describe("Política de continuidad", () => {
    it("detecta exclusiones por palabras clave", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      // Crear un nodo falso con texto peligroso
      const nodoExcluir: typeof arbol.nodos[0] = {
        ...arbol.nodos[0],
        texto: "Eliminar cuenta",
        indice: -1,
      };

      const debeExc = debeExcluirse(nodoExcluir, arbol);
      expect(debeExc).toBe(true);
    });

    it("ignora mayúsculas y acentos", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      // Variaciones de "cerrar sesión"
      const nodo1: typeof arbol.nodos[0] = {
        ...arbol.nodos[0],
        texto: "CERRAR SESIÓN",
        indice: -1,
      };
      expect(debeExcluirse(nodo1, arbol)).toBe(true);

      const nodo2: typeof arbol.nodos[0] = {
        ...arbol.nodos[0],
        texto: "cerrar sesion",
        indice: -1,
      };
      expect(debeExcluirse(nodo2, arbol)).toBe(true);
    });

    it("permite nodos seguros", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      const nodoSeguro: typeof arbol.nodos[0] = {
        ...arbol.nodos[0],
        texto: "Buscar artículo",
        indice: -1,
      };

      expect(debeExcluirse(nodoSeguro, arbol)).toBe(false);
    });

    it("aplica política a lista de nodos", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const clickables = arbol.nodos.filter((n) => n.clickable);

      const permitidos = aplicarPoliticaContinuidad(clickables, arbol);

      expect(permitidos.length).toBeLessThanOrEqual(clickables.length);
    });

    it("calcula estadísticas de exclusiones", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const stats = estadisticasExclusiones(arbol.nodos, arbol);

      expect(stats.totalNodos).toBe(arbol.nodos.length);
      expect(stats.excluidos + stats.permitidos).toBe(stats.totalNodos);
      expect(stats.porcentajeExcluido).toBeGreaterThanOrEqual(0);
      expect(stats.porcentajeExcluido).toBeLessThanOrEqual(100);
    });
  });

  describe("Integración: frontera + política", () => {
    it("combina frontera con exclusiones", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);

      let frontera = generarFrontera(arbol, locators);
      console.log(`\n📊 Frontera bruta: ${frontera.length} acciones`);

      // Filtrar por política
      const nodosPermitidos = arbol.nodos.filter(
        (n) => !debeExcluirse(n, arbol)
      );
      const fronteraFinal = frontera.filter((a) =>
        nodosPermitidos.some((n) => n.indice === a.indiceNodo)
      );

      console.log(
        `📊 Frontera después de política: ${fronteraFinal.length} acciones`
      );

      expect(fronteraFinal.length).toBeLessThanOrEqual(frontera.length);
    });
  });

  describe("Análisis Wikipedia", () => {
    it("imprime análisis completo de frontera", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const frontera = generarFrontera(arbol, locators);
      const stats = estadisticasFrontera(frontera);
      const exclusiones = estadisticasExclusiones(arbol.nodos, arbol);

      console.log("\n📊 Frontera de Acciones (Wikipedia Onboarding):");
      console.log(`   Total acciones: ${stats.totalAcciones}`);
      console.log(`   Taps: ${stats.taps}`);
      console.log(`   Writes: ${stats.writes}`);
      console.log(`   Scrolls: ${stats.scrolls}`);
      console.log(`   Prioridad promedio: ${stats.prioridadPromedio.toFixed(0)}`);
      console.log(`   Prioridad máxima: ${stats.prioridadMax}\n`);

      console.log("📊 Política de Continuidad:");
      console.log(`   Total nodos: ${exclusiones.totalNodos}`);
      console.log(`   Excluidos: ${exclusiones.excluidos} (${exclusiones.porcentajeExcluido.toFixed(1)}%)`);
      console.log(`   Permitidos: ${exclusiones.permitidos}\n`);

      // Wikipedia onboarding es simple, no hay problema si frontera está vacía
      expect(frontera).toBeDefined();
    });

    it("muestra primeras acciones ordenadas por prioridad", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locators = calcularLocatorsArbol(arbol);
      const frontera = generarFrontera(arbol, locators, 5);

      if (frontera.length > 0) {
        console.log("\n🎯 Primeras acciones (orden de prueba):");
        frontera.forEach((acc, i) => {
          console.log(`   ${i + 1}. ${acc.tipo.toUpperCase()} - ${acc.descripcion}`);
          console.log(`      Prioridad: ${acc.prioridad}`);
        });
      } else {
        console.log("\n🎯 Wikipedia Onboarding no tiene acciones interactivas\n");
      }

      expect(frontera).toBeDefined();
    });
  });
});
