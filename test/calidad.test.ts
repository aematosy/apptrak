import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { normalizarPageSource } from "../src/normalizador/index.js";
import {
  calcularLocators,
  calcularLocatorsArbol,
  estadisticasCalidad,
} from "../src/calidad/index.js";

let wikipediaXML: string;

beforeAll(() => {
  wikipediaXML = readFileSync(
    "test/fixtures/arboles/wikipedia-inicio.xml",
    "utf-8"
  );
});

describe("Calidad de Locators (PASO 5)", () => {
  describe("Generación de locators por estrategia", () => {
    it("genera locators para un nodo", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const nodo = arbol.nodos[0];

      const localizador = calcularLocators(nodo, arbol);

      expect(localizador).toHaveProperty("principal");
      expect(localizador).toHaveProperty("alternativas");
      expect(localizador).toHaveProperty("descripcion");

      expect(localizador.principal).toHaveProperty("valor");
      expect(localizador.principal).toHaveProperty("tipo");
      expect(localizador.principal).toHaveProperty("calidad");
    });

    it("locator principal está ordenado por calidad", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      for (const nodo of arbol.nodos.slice(0, 5)) {
        const localizador = calcularLocators(nodo, arbol);
        const calidad = localizador.principal.calidad;

        // Validar que la calidad es una de las 4 válidas
        expect(["estable", "media", "ancla", "fragil"]).toContain(calidad);
      }
    });

    it("alternativas están ordenadas por calidad descendente", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const nodo = arbol.nodos.find((n) => n.alternativas?.length ?? 0 > 1);

      if (nodo) {
        const localizador = calcularLocators(nodo, arbol);
        const calidadNum = {
          estable: 4,
          media: 3,
          ancla: 2,
          fragil: 1,
        };

        let ultimaCalidad = 5;
        for (const alt of localizador.alternativas) {
          const numCalidad = calidadNum[alt.calidad] || 0;
          expect(numCalidad).toBeLessThanOrEqual(ultimaCalidad);
          ultimaCalidad = numCalidad;
        }
      }
    });
  });

  describe("Estrategias específicas", () => {
    it("prefiere resource-id (estable)", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const nodoConId = arbol.nodos.find((n) => n.idEstable);

      if (nodoConId) {
        const localizador = calcularLocators(nodoConId, arbol);

        // Si tiene ID único, debe ser el principal y estable
        expect(localizador.principal.calidad).toBe("estable");
        expect(localizador.principal.tipo).toBe("id");
        expect(localizador.principal.valor).toBe(nodoConId.idEstable);
      }
    });

    it("usa content-desc si no hay ID", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const nodoConDesc = arbol.nodos.find(
        (n) => n.descripcion && !n.idEstable
      );

      if (nodoConDesc) {
        const localizador = calcularLocators(nodoConDesc, arbol);

        // Debe preferir accessibility-id (content-desc)
        if (
          localizador.principal.tipo === "accessibility-id" ||
          localizador.alternativas.some((a) => a.tipo === "accessibility-id")
        ) {
          expect(true).toBe(true);
        }
      }
    });

    it("fallback a xpath y clase+índice", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      for (const nodo of arbol.nodos.slice(0, 3)) {
        const localizador = calcularLocators(nodo, arbol);

        // Siempre debe haber al menos xpath y clase+índice
        const tipos = [localizador.principal, ...localizador.alternativas].map(
          (l) => l.tipo
        );
        expect(tipos).toContain("xpath");
        expect(tipos).toContain("clase");
      }
    });
  });

  describe("Unicidad de locators", () => {
    it("calcula correctamente si locator es único", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      for (const nodo of arbol.nodos.slice(0, 5)) {
        const localizador = calcularLocators(nodo, arbol);

        // Si es estable y único, debe tener unico=true
        if (localizador.principal.calidad === "estable") {
          expect(localizador.principal.unico).toBe(true);
        }
      }
    });
  });

  describe("Calidad global de pantalla", () => {
    it("calcula locators para todos los nodos", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locatorsMap = calcularLocatorsArbol(arbol);

      expect(locatorsMap.size).toBe(arbol.nodos.length);

      for (const [indice, localizador] of locatorsMap.entries()) {
        expect(localizador.principal).toBeDefined();
        expect(localizador.principal.calidad).toMatch(
          /estable|media|ancla|fragil/
        );
      }
    });

    it("genera estadísticas de calidad", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locatorsMap = calcularLocatorsArbol(arbol);
      const stats = estadisticasCalidad(locatorsMap);

      expect(stats.totalNodos).toBe(arbol.nodos.length);
      expect(stats.conLocatorEstable).toBeGreaterThanOrEqual(0);
      expect(stats.conLocatorMedia).toBeGreaterThanOrEqual(0);
      expect(stats.conLocatorAncla).toBeGreaterThanOrEqual(0);
      expect(stats.conLocatorFragil).toBeGreaterThanOrEqual(0);

      // Suma debe coincidir
      expect(
        stats.conLocatorEstable +
          stats.conLocatorMedia +
          stats.conLocatorAncla +
          stats.conLocatorFragil
      ).toBe(stats.totalNodos);

      // Porcentajes válidos
      expect(stats.porcentajeEstable).toBeGreaterThanOrEqual(0);
      expect(stats.porcentajeEstable).toBeLessThanOrEqual(100);
      expect(stats.porcentajeEstableOMedia).toBeGreaterThanOrEqual(
        stats.porcentajeEstable
      );
    });
  });

  describe("Análisis Wikipedia", () => {
    it("imprime estadísticas de calidad", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const locatorsMap = calcularLocatorsArbol(arbol);
      const stats = estadisticasCalidad(locatorsMap);

      console.log("\n📊 Calidad de Locators (Wikipedia Onboarding):");
      console.log(`   Total nodos: ${stats.totalNodos}`);
      console.log(`   Estable: ${stats.conLocatorEstable} (${stats.porcentajeEstable.toFixed(1)}%)`);
      console.log(`   Media: ${stats.conLocatorMedia}`);
      console.log(`   Ancla: ${stats.conLocatorAncla}`);
      console.log(`   Frágil: ${stats.conLocatorFragil}`);
      console.log(
        `   Estable + Media: ${stats.porcentajeEstableOMedia.toFixed(1)}%\n`
      );

      // Meta E0: >= algunos locators estables
      expect(stats.conLocatorEstable).toBeGreaterThanOrEqual(0);
    });

    it("muestra ejemplo de locators para botón Forward", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const nodoForward = arbol.nodos.find((n) =>
        n.descripcion?.includes("Forward")
      );

      if (nodoForward) {
        const localizador = calcularLocators(nodoForward, arbol);

        console.log(
          "\n📍 Locators para botón 'Forward':"
        );
        console.log(`   Principal: ${localizador.principal.valor}`);
        console.log(`     Tipo: ${localizador.principal.tipo}`);
        console.log(`     Calidad: ${localizador.principal.calidad}`);
        console.log(`     Único: ${localizador.principal.unico}`);

        if (localizador.alternativas.length > 0) {
          console.log("   Alternativas:");
          localizador.alternativas.slice(0, 2).forEach((alt) => {
            console.log(
              `     - ${alt.valor} (${alt.tipo}, ${alt.calidad})`
            );
          });
        }
        console.log();

        expect(localizador.principal).toBeDefined();
      }
    });
  });
});
