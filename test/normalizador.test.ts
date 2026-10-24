import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { normalizarPageSource } from "../src/normalizador/index.js";

let wikipediaXML: string;

beforeAll(() => {
  wikipediaXML = readFileSync(
    "test/fixtures/arboles/wikipedia-inicio.xml",
    "utf-8"
  );
});

describe("Normalizador", () => {
  describe("parseXMLAppium", () => {
    it("carga XML de Wikipedia sin errores", () => {
      const arbol = normalizarPageSource(wikipediaXML, { platform: "android" });

      expect(arbol).toBeDefined();
      expect(arbol.nodos).toBeDefined();
      expect(arbol.nodos.length).toBeGreaterThan(0);
    });

    it("extrae dimensiones de pantalla", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      expect(arbol.width).toBeGreaterThan(0);
      expect(arbol.height).toBeGreaterThan(0);
      expect(arbol.rotacion).toBeDefined();
    });

    it("excluye nodos de systemui", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const conSystemUI = arbol.nodos.some((n) =>
        n.paquete?.includes("systemui")
      );

      expect(conSystemUI).toBe(false);
    });
  });

  describe("Nodos normalizados", () => {
    it("todos los nodos tienen indice único", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const indices = arbol.nodos.map((n) => n.indice);
      const unicos = new Set(indices);

      expect(unicos.size).toBe(indices.length);
    });

    it("extrae atributos principales", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const conTexto = arbol.nodos.filter((n) => n.texto);
      const conDesc = arbol.nodos.filter((n) => n.descripcion);
      const clickables = arbol.nodos.filter((n) => n.clickable);

      expect(conTexto.length).toBeGreaterThan(0);
      expect(conDesc.length).toBeGreaterThan(0);
      expect(clickables.length).toBeGreaterThan(0);
    });

    it("parsea bounds correctamente", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const nodo = arbol.nodos.find((n) => n.descripcion === "Wikipedia");

      expect(nodo).toBeDefined();
      expect(nodo!.bounds.x1).toBeGreaterThanOrEqual(0);
      expect(nodo!.bounds.y1).toBeGreaterThanOrEqual(0);
      expect(nodo!.bounds.x2).toBeGreaterThan(nodo!.bounds.x1);
      expect(nodo!.bounds.y2).toBeGreaterThan(nodo!.bounds.y1);
    });

    it("infiere rol de componentes comunes", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const botones = arbol.nodos.filter((n) => n.rolInferido === "botón");
      const textos = arbol.nodos.filter((n) => n.rolInferido === "texto");

      // Wikipedia onboarding tiene al menos un botón
      expect(botones.length + textos.length).toBeGreaterThan(0);
    });
  });

  describe("Contexto: ancestros y descendientes", () => {
    it("construye relaciones padre-hijo", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      // Buscar un nodo con padre
      const conPadre = arbol.nodos.find((n) => n.padre !== null);
      expect(conPadre).toBeDefined();

      if (conPadre) {
        // El padre debe existir en el árbol
        const padre = arbol.nodos.find((n) => n.indice === conPadre.padre);
        expect(padre).toBeDefined();
      }
    });

    it("calcula ancestros correctamente", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      // Buscar nodo profundo
      const profundos = arbol.nodos.filter((n) => n.profundidad >= 3);
      const conContexto = profundos.find((n) => n.ancestros.length > 0);

      expect(conContexto).toBeDefined();

      if (conContexto) {
        // Los ancestros deben estar en el árbol
        for (const indiceAncestro of conContexto.ancestros) {
          const ancestro = arbol.nodos.find((n) => n.indice === indiceAncestro);
          expect(ancestro).toBeDefined();
          expect(ancestro!.profundidad).toBeLessThan(conContexto.profundidad);
        }
      }
    });

    it("calcula descendientes correctamente", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      // Buscar un nodo con descendientes
      const conDesc = arbol.nodos.find((n) => n.descendientes.length > 0);
      expect(conDesc).toBeDefined();

      if (conDesc) {
        // Los descendientes deben estar en el árbol y tener este como padre
        for (const indiceDesc of conDesc.descendientes) {
          const desc = arbol.nodos.find((n) => n.indice === indiceDesc);
          expect(desc).toBeDefined();
          expect(desc!.padre).toBe(conDesc.indice);
        }
      }
    });

    it("busca etiquetas cercanas", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      // Buscar un elemento con etiqueta cercana
      const conEtiqueta = arbol.nodos.find((n) => n.etiquetaCercana !== null);

      if (conEtiqueta) {
        expect(conEtiqueta.etiquetaCercana).toBeDefined();
        expect(
          ["arriba", "abajo", "izquierda", "derecha", null]
        ).toContain(conEtiqueta.etiquetaPosicion);
      }
    });
  });

  describe("Casos especiales", () => {
    it("maneja XML vacío", () => {
      const emptyXML = '<?xml version="1.0"?><hierarchy></hierarchy>';
      const arbol = normalizarPageSource(emptyXML);

      expect(arbol.nodos).toEqual([]);
    });

    it("campo de texto detectado correctamente", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const camposTexto = arbol.nodos.filter((n) => n.esCampoTexto);

      // Si hay campos de texto, deben marcar esCampoTexto
      camposTexto.forEach((campo) => {
        expect(
          campo.clase.includes("EditText") || campo.clase.includes("TextField")
        ).toBe(true);
      });
    });

    it("botón Forward identificado", () => {
      const arbol = normalizarPageSource(wikipediaXML);
      const forward = arbol.nodos.find((n) => n.descripcion?.includes("Forward"));

      expect(forward).toBeDefined();
      expect(forward!.rolInferido).toBeDefined();
    });
  });

  describe("Estadísticas de cobertura", () => {
    it("imprime estadísticas del árbol", () => {
      const arbol = normalizarPageSource(wikipediaXML);

      const conId = arbol.nodos.filter((n) => n.idEstable).length;
      const conDesc = arbol.nodos.filter((n) => n.descripcion).length;
      const conTexto = arbol.nodos.filter((n) => n.texto).length;
      const clickables = arbol.nodos.filter((n) => n.clickable).length;

      console.log("\n📊 Estadísticas de Wikipedia Onboarding:");
      console.log(`   Total nodos: ${arbol.nodos.length}`);
      console.log(`   Con resource-id: ${conId} (${((conId / arbol.nodos.length) * 100).toFixed(1)}%)`);
      console.log(`   Con content-desc: ${conDesc} (${((conDesc / arbol.nodos.length) * 100).toFixed(1)}%)`);
      console.log(`   Con texto: ${conTexto} (${((conTexto / arbol.nodos.length) * 100).toFixed(1)}%)`);
      console.log(`   Clickables: ${clickables} (${((clickables / arbol.nodos.length) * 100).toFixed(1)}%)\n`);

      expect(arbol.nodos.length).toBeGreaterThan(0);
    });
  });
});
