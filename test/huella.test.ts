import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { compararHuellas, jaccard } from "../src/huella/jaccard.js";
import { calcularHuella, generarTokens, hashHuella } from "../src/huella/tokens.js";
import { normalizarPageSource } from "../src/normalizador/index.js";
import type { ArbolNormalizado, NodoNormalizado } from "../src/normalizador/tipos.js";

let wikipediaXML: string;

beforeAll(() => {
  wikipediaXML = readFileSync("test/fixtures/arboles/wikipedia-inicio.xml", "utf-8");
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

    it("colapso de listas SIN cardinalidad (3, 10, 30 items = mismo token)", () => {
      // Crear árboles ficticios con listas de 3, 10 y 30 items
      // Usando la estructura real que generaTokens() espera

      // Helper: crear árbol con lista de N items
      const crearArbolConLista = (cantidad: number): ArbolNormalizado => {
        const nodos: NodoNormalizado[] = [];
        let indice = 0;

        // Nodo padre (contenedor ListView)
        const padre: NodoNormalizado = {
          indice: indice++,
          padre: null,
          clase: "android.widget.ListView",
          idEstable: "lista_principal",
          descripcion: null,
          texto: null,
          bounds: { x1: 0, y1: 0, x2: 100, y2: 200 },
          habilitado: true,
          visible: true,
          clickable: false,
          scrollable: true,
          enfocado: false,
          esCampoTexto: false,
          sensible: false,
          paquete: null,
          platform: "android",
          ancestros: [],
          descendientes: [],
          etiquetaCercana: null,
          etiquetaPosicion: null,
          profundidad: 0,
          rolInferido: "lista",
        };
        nodos.push(padre);

        // Agregar N items idénticos
        for (let i = 0; i < cantidad; i++) {
          const item: NodoNormalizado = {
            indice: indice++,
            padre: padre.indice,
            clase: "android.widget.LinearLayout", // mismo para todos
            idEstable: null,
            descripcion: null,
            texto: `Item ${i}`,
            bounds: { x1: 0, y1: 10 + i * 20, x2: 100, y2: 30 + i * 20 },
            habilitado: true,
            visible: true,
            clickable: true,
            scrollable: false,
            enfocado: false,
            esCampoTexto: false,
            sensible: false,
            paquete: null,
            platform: "android",
            ancestros: [padre.indice],
            descendientes: [],
            etiquetaCercana: null,
            etiquetaPosicion: null,
            profundidad: 1,
            rolInferido: null,
          };
          nodos.push(item);
        }

        return {
          nodos,
          width: 100,
          height: 200,
          rotacion: 0,
          timestamp: Date.now(),
          platform: "android",
        };
      };

      // Generar tokens para listas de 3, 10 y 30 items
      const arbol3 = crearArbolConLista(3);
      const arbol10 = crearArbolConLista(10);
      const arbol30 = crearArbolConLista(30);

      const tokens3 = generarTokens(arbol3);
      const tokens10 = generarTokens(arbol10);
      const tokens30 = generarTokens(arbol30);

      // Extraer token colapsado de cada conjunto
      // Debe haber exactamente 1 token colapsado (el del ListView + sus items)
      const colapsado3 = tokens3.find((t) => t.esLista);
      const colapsado10 = tokens10.find((t) => t.esLista);
      const colapsado30 = tokens30.find((t) => t.esLista);

      // Validar que existen
      expect(colapsado3).toBeDefined();
      expect(colapsado10).toBeDefined();
      expect(colapsado30).toBeDefined();

      // Validar que son idénticos (identidad estructural)
      expect(colapsado3!.identificador).toBe(colapsado10!.identificador);
      expect(colapsado10!.identificador).toBe(colapsado30!.identificador);
      expect(colapsado3!.identificador).toBe(colapsado30!.identificador);

      // Validar que el token es el correcto
      expect(colapsado3!.identificador).toBe("[LISTA_COLLAPSED]");
      expect(colapsado10!.identificador).toBe("[LISTA_COLLAPSED]");
      expect(colapsado30!.identificador).toBe("[LISTA_COLLAPSED]");

      // Validar que NO contiene cardinalidad (números)
      expect(colapsado3!.identificador).not.toMatch(/\d+/);
      expect(colapsado10!.identificador).not.toMatch(/\d+/);
      expect(colapsado30!.identificador).not.toMatch(/\d+/);

      // Validar que NO tiene sufijo "_items"
      expect(colapsado3!.identificador).not.toMatch(/_items/);
      expect(colapsado10!.identificador).not.toMatch(/_items/);
      expect(colapsado30!.identificador).not.toMatch(/_items/);
    });

    it("token colapsado NO incluye cardinalidad", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const tokens = generarTokens(arbol);

      const colapsados = tokens.filter((t) => t.esLista);
      colapsados.forEach((token) => {
        // Verificar que NO hay números en el identificador
        expect(token.identificador).not.toMatch(/\d+_items/);
        // Debe ser exactamente "[LISTA_COLLAPSED]"
        expect(token.identificador).toBe("[LISTA_COLLAPSED]");
      });
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
      console.log(
        `   Ratio tokens/nodos: ${(huella.tokens.length / huella.nodosTotales).toFixed(2)}\n`,
      );

      expect(huella.tokens.length).toBeLessThanOrEqual(huella.nodosTotales);
    });
  });
});
