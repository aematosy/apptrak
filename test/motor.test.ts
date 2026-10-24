import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { normalizarPageSource } from "../src/normalizador/index.js";
import {
  estadoACheckpoint,
  checkpointAEstado,
  calcularEstadisticas,
} from "../src/motor/tipos.js";
import {
  reconocerPantalla,
  fusionarEnPantalla,
  clasificarResultado,
} from "../src/motor/reconocimiento.js";

let wikipediaXML: string;

beforeAll(() => {
  wikipediaXML = readFileSync(
    "test/fixtures/arboles/wikipedia-inicio.xml",
    "utf-8"
  );
});

describe("Motor E0 (PASO 7)", () => {
  describe("Reconocimiento de pantallas", () => {
    it("reconoce pantalla nueva", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const pantallasEncontradas = new Map();

      const { pantalla, resultado } = reconocerPantalla(arbol, pantallasEncontradas);

      expect(resultado).toBe("nueva");
      expect(pantalla).toBeDefined();
      expect(pantalla!.id).toMatch(/^p-[a-f0-9]{8}$/i);
      expect(pantalla!.visitas).toBe(1);
      expect(pantalla!.textosVisibles.length).toBeGreaterThanOrEqual(0);
    });

    it("reconoce pantalla conocida", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const pantallasEncontradas = new Map();

      // Primera ejecución: nueva
      const { pantalla: pantalla1 } = reconocerPantalla(arbol, pantallasEncontradas);
      expect(pantalla1).toBeDefined();

      // Agregar al mapa
      pantallasEncontradas.set(pantalla1!.id, pantalla1!);

      // Segunda ejecución: debería ser conocida
      const { pantalla: pantalla2, resultado } = reconocerPantalla(arbol, pantallasEncontradas);

      expect(resultado).toBe("conocida");
      expect(pantalla2!.id).toBe(pantalla1!.id);
    });

    it("fusiona pantalla conocida", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const pantallasEncontradas = new Map();

      const { pantalla: pantalla1 } = reconocerPantalla(arbol, pantallasEncontradas);
      expect(pantalla1!.visitas).toBe(1);

      // Fusionar
      fusionarEnPantalla(pantalla1!, arbol);

      expect(pantalla1!.visitas).toBe(2);
      expect(pantalla1!.ultima).toBeDefined();
    });
  });

  describe("Clasificación de resultados", () => {
    it("clasifica resultado de acción", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const { pantalla } = reconocerPantalla(arbol, new Map());

      const resultado = clasificarResultado("p-abc", pantalla!, "nueva");

      expect(resultado).toBe("nueva");
    });

    it("prioriza bloqueada", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const { pantalla } = reconocerPantalla(arbol, new Map());

      const resultado = clasificarResultado("p-abc", pantalla!, "nueva", false, true);

      expect(resultado).toBe("bloqueada");
    });

    it("prioriza salida de app", () => {
      const resultado = clasificarResultado("p-abc", null, "nueva");

      expect(resultado).toBe("salio-de-app");
    });
  });

  describe("Estado y checkpoint", () => {
    it("convierte estado a checkpoint", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const { pantalla } = reconocerPantalla(arbol, new Map());

      const estado = {
        pantallasEncontradas: new Map([[pantalla!.id, pantalla!]]),
        transiciones: [],
        accionesEjecutadas: 0,
        pantallasUnicas: 1,
        tiempoTotal: 0,
        accionesAlcanzadas: new Set(),
        fronteraPendiente: [],
      };

      const checkpoint = estadoACheckpoint(estado);

      expect(checkpoint).toHaveProperty("pantallasEncontradas");
      expect(checkpoint).toHaveProperty("transiciones");
      expect(checkpoint).toHaveProperty("timestamp");
    });

    it("reconstruye estado desde checkpoint", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const { pantalla } = reconocerPantalla(arbol, new Map());

      const estado1 = {
        pantallasEncontradas: new Map([[pantalla!.id, pantalla!]]),
        transiciones: [],
        accionesEjecutadas: 0,
        pantallasUnicas: 1,
        tiempoTotal: 0,
        accionesAlcanzadas: new Set(),
        fronteraPendiente: [],
      };

      const checkpoint = estadoACheckpoint(estado1);
      const estado2 = checkpointAEstado(checkpoint);

      expect(estado2.pantallasUnicas).toBe(estado1.pantallasUnicas);
      expect(estado2.accionesEjecutadas).toBe(estado1.accionesEjecutadas);
      expect(estado2.pantallasEncontradas.size).toBe(estado1.pantallasEncontradas.size);
    });

    it("calcula estadísticas", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const { pantalla } = reconocerPantalla(arbol, new Map());

      const estado = {
        pantallasEncontradas: new Map([[pantalla!.id, pantalla!]]),
        transiciones: [
          {
            desdeId: pantalla!.id,
            accionIndice: 0,
            resultado: "nueva" as const,
            hastaId: null,
            tiempo: 2000,
          },
        ],
        accionesEjecutadas: 1,
        pantallasUnicas: 1,
        tiempoTotal: 2000,
        accionesAlcanzadas: new Set(),
        fronteraPendiente: [],
      };

      const stats = calcularEstadisticas(estado);

      expect(stats.pantallasEncontradas).toBe(1);
      expect(stats.accionesEjecutadas).toBe(1);
      expect(stats.tiempoPromedioPorAccion).toBe(2000);
      expect(stats.transicionesTotales).toBe(1);
    });
  });

  describe("Análisis Wikipedia", () => {
    it("imprime análisis de exploración simulada", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const pantallasEncontradas = new Map();

      const { pantalla: pantalla1 } = reconocerPantalla(arbol, pantallasEncontradas);
      pantallasEncontradas.set(pantalla1!.id, pantalla1!);

      // Simular segunda visita
      fusionarEnPantalla(pantalla1!, arbol);

      const estado = {
        pantallasEncontradas,
        transiciones: [
          {
            desdeId: pantalla1!.id,
            accionIndice: 0,
            resultado: "nueva" as const,
            hastaId: null,
            tiempo: 1000,
          },
        ],
        accionesEjecutadas: 1,
        pantallasUnicas: 1,
        tiempoTotal: 1000,
        accionesAlcanzadas: new Set(),
        fronteraPendiente: [],
      };

      const stats = calcularEstadisticas(estado);

      console.log("\n📊 Exploración simulada (E0 proto):");
      console.log(`   Pantallas únicas: ${stats.pantallasEncontradas}`);
      console.log(`   Transiciones: ${stats.transicionesTotales}`);
      console.log(`   Acciones: ${stats.accionesEjecutadas}`);
      console.log(`   Tiempo total: ${stats.tiempoTotal}ms`);
      console.log(`   Tiempo/acción: ${stats.tiempoPromedioPorAccion.toFixed(0)}ms\n`);

      expect(stats.pantallasEncontradas).toBeGreaterThan(0);
    });
  });
});
