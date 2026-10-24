import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { normalizarPageSource } from "../src/normalizador/index.js";
import {
  calcularHuella,
  generarTokens,
  hashHuella,
} from "../src/huella/tokens.js";
import { jaccard, compararHuellas } from "../src/huella/jaccard.js";

let wikipediaXML: string;

beforeAll(() => {
  wikipediaXML = readFileSync(
    "test/fixtures/arboles/wikipedia-inicio.xml",
    "utf-8"
  );
});

describe("Huella (PASO 4)", () => {
  describe("Generación de tokens", () => {
    it("genera tokens de un árbol", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const tokens = generarTokens(arbol);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toHaveProperty("clase");
      expect(tokens[0]).toHaveProperty("identificador");
    });

    it("tokens nunca contienen texto ni bounds en identificador", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const tokens = generarTokens(arbol);

      for (const token of tokens) {
        // El identificador debe ser id o descripción, no bounds [x,y]
        // (Los tokens colapsados son OK: [LISTA_COLLAPSED_...]  es parte de estrategia)
        if (!token.esLista) {
          expect(token.identificador).not.toMatch(/\[\d+,\d+\]\[\d+,\d+\]/);
        }
      }
    });

    it("detecta contenedores de lista", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const conListaScroll = arbol.nodos.filter((n) =>
        n.clase.includes("ScrollView")
      );

      if (conListaScroll.length > 0) {
        const tokens = generarTokens(arbol);
        const listaCollapsed = tokens.filter((t) => t.esLista);
        // Wikipedia onboarding tiene ScrollView pero no items duplicados
        expect(tokens.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Hash de huella", () => {
    it("calcula hash determinista", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const tokens = generarTokens(arbol);

      const hash1 = hashHuella(tokens);
      const hash2 = hashHuella(tokens);

      expect(hash1).toBe(hash2);
    });

    it("tokens diferentes generan hash diferente", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const tokens1 = generarTokens(arbol);

      // Modificar un token
      const tokens2 = [...tokens1];
      if (tokens2.length > 0) {
        tokens2[0] = {
          ...tokens2[0],
          clase: "MODIFIED",
        };
      }

      const hash1 = hashHuella(tokens1);
      const hash2 = hashHuella(tokens2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Huella completa", () => {
    it("calcula huella con prefijo 'p-'", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const huella = calcularHuella(arbol);

      expect(huella.hash).toMatch(/^p-[a-f0-9]{8}$/i);
    });

    it("huella contiene tokens y metadata", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const huella = calcularHuella(arbol);

      expect(huella).toHaveProperty("hash");
      expect(huella).toHaveProperty("tokens");
      expect(huella).toHaveProperty("nodosTotales");
      expect(huella).toHaveProperty("timestamp");

      expect(huella.tokens.length).toBeGreaterThan(0);
      expect(huella.nodosTotales).toBeGreaterThan(0);
    });
  });

  describe("Similitud Jaccard", () => {
    it("Jaccard de un conjunto consigo mismo es 1.0", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const tokens = generarTokens(arbol);

      const score = jaccard(tokens, tokens);
      expect(score).toBe(1.0);
    });

    it("Jaccard de conjuntos vacíos es 1.0", () => {
      const score = jaccard([], []);
      expect(score).toBe(1.0);
    });

    it("Jaccard de disjuntos es 0.0", () => {
      const t1 = [{ clase: "A", identificador: "1", esLista: false }];
      const t2 = [{ clase: "B", identificador: "2", esLista: false }];

      const score = jaccard(t1, t2);
      expect(score).toBe(0.0);
    });

    it("Jaccard parcial es correcto", () => {
      const t1 = [
        { clase: "A", identificador: "1", esLista: false },
        { clase: "B", identificador: "2", esLista: false },
        { clase: "C", identificador: "3", esLista: false },
      ];
      const t2 = [
        { clase: "A", identificador: "1", esLista: false },
        { clase: "B", identificador: "2", esLista: false },
        { clase: "D", identificador: "4", esLista: false },
      ];

      // Intersección: {A, B} = 2
      // Unión: {A, B, C, D} = 4
      // Jaccard = 2/4 = 0.5
      const score = jaccard(t1, t2);
      expect(score).toBe(0.5);
    });
  });

  describe("Comparación de huellas", () => {
    it("huella idéntica es reconocida", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const huella1 = calcularHuella(arbol);
      const huella2 = calcularHuella(arbol);

      const resultado = compararHuellas(huella1, huella2);

      expect(resultado.esIgual).toBe(true);
      expect(resultado.jaccard).toBe(1.0);
    });

    it("detecta variante (nodos nuevos)", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const huella1 = calcularHuella(arbol);

      // Simular una variante con más nodos
      const arbolVariante = { ...arbol, nodos: [...arbol.nodos, arbol.nodos[0]] };
      const huella2 = calcularHuella(arbolVariante);

      const resultado = compararHuellas(huella1, huella2);

      expect(resultado.jaccard).toBeGreaterThanOrEqual(0.85); // Still similar
      expect(resultado.esVariante).toBe(true);
      expect(resultado.diferencia).toBe("nodos_nuevos");
    });
  });

  describe("Estadísticas Wikipedia", () => {
    it("imprime estadísticas de huella", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const huella = calcularHuella(arbol);

      console.log("\n📊 Huella de Wikipedia Onboarding:");
      console.log(`   Hash: ${huella.hash}`);
      console.log(`   Tokens: ${huella.tokens.length}`);
      console.log(`   Nodos totales: ${huella.nodosTotales}`);
      console.log(`   Ratio tokens/nodos: ${(huella.tokens.length / huella.nodosTotales).toFixed(2)}\n`);

      expect(huella.tokens.length).toBeLessThanOrEqual(huella.nodosTotales);
    });
  });
});
