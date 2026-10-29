/**
 * OPCIÓN 3: Ver Estado de Fixtures
 * Diagnostica integridad del dataset sin conectar Appium.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { getFixturesDir } from "../utils/paths.js";
import { crearTabla, error, exito, warning } from "../utils/table.js";

interface ArchivoFixture {
  nombre: string;
  xml: boolean;
  png: boolean;
  json: boolean;
  bytes: number;
  sha256?: string;
}

function calcularSha256(contenido: Buffer): string {
  return createHash("sha256").update(contenido).digest("hex").substring(0, 16);
}

function obtenerFixtures(fixturesDir: string): ArchivoFixture[] {
  const fixtures = new Map<string, ArchivoFixture>();

  try {
    const files = readdirSync(fixturesDir);

    for (const file of files) {
      const match = file.match(/^(.+?)\.(xml|png|json)$/);
      if (!match) continue;

      const [, nombre, ext] = match;

      if (!nombre || !ext) continue;

      if (!fixtures.has(nombre)) {
        fixtures.set(nombre, {
          nombre,
          xml: false,
          png: false,
          json: false,
          bytes: 0,
        });
      }

      const fixture = fixtures.get(nombre);
      if (!fixture) continue;

      const filePath = join(fixturesDir, file);
      const stat = statSync(filePath);

      if (ext === "xml") {
        fixture.xml = true;
        fixture.bytes = stat.size;

        try {
          const contenido = readFileSync(filePath);
          fixture.sha256 = calcularSha256(contenido);
        } catch {
          // El estado mostrará la ausencia de hash.
        }
      } else if (ext === "png") {
        fixture.png = true;
      } else if (ext === "json") {
        fixture.json = true;
      }
    }
  } catch {
    // Directorio inexistente o no accesible.
  }

  return Array.from(fixtures.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function detectarProblemas(fixtures: ArchivoFixture[]): string[] {
  const problemas: string[] = [];

  for (const fixture of fixtures) {
    if (fixture.xml && !fixture.png) {
      problemas.push(`${fixture.nombre}: XML sin PNG`);
    }

    if (fixture.xml && !fixture.json) {
      problemas.push(`${fixture.nombre}: XML sin JSON`);
    }

    if (fixture.png && !fixture.xml) {
      problemas.push(`${fixture.nombre}: PNG sin XML`);
    }
  }

  const shaMap = new Map<string, string[]>();

  for (const fixture of fixtures) {
    if (!fixture.sha256) continue;

    const nombres = shaMap.get(fixture.sha256) ?? [];
    nombres.push(fixture.nombre);
    shaMap.set(fixture.sha256, nombres);
  }

  for (const [sha, nombres] of shaMap) {
    if (nombres.length > 1) {
      problemas.push(`SHA duplicado [${sha}]: ${nombres.join(", ")}`);
    }
  }

  return problemas;
}

export async function cmdEstado() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║      ESTADO DE FIXTURES              ║");
  console.log("╚═══════════════════════════════════════╝\n");

  const fixturesDir = getFixturesDir();

  if (!fixturesDir) {
    console.log(error("No hay proyecto activo"));
    console.log("  Configura o carga un proyecto primero.\n");
    return;
  }

  const fixtures = obtenerFixtures(fixturesDir);

  if (fixtures.length === 0) {
    console.log(error("No hay fixtures en el dataset"));
    console.log(`  Directorio: ${fixturesDir}\n`);
    return;
  }

  const filas = fixtures.map((fixture) => ({
    nombre: fixture.nombre,
    xml: fixture.xml ? "✅" : "❌",
    png: fixture.png ? "✅" : "❌",
    json: fixture.json ? "✅" : "❌",
    bytes: fixture.bytes > 0 ? `${fixture.bytes}` : "-",
    sha: fixture.sha256 ?? "-",
  }));

  console.log(`Dataset: ${basename(fixturesDir)}\n`);
  console.log(crearTabla(filas, ["nombre", "xml", "png", "json", "bytes", "sha"]));

  const totalXml = fixtures.filter((fixture) => fixture.xml).length;
  const totalPng = fixtures.filter((fixture) => fixture.png).length;
  const totalJson = fixtures.filter((fixture) => fixture.json).length;

  const shaUnicos = new Set(
    fixtures.map((fixture) => fixture.sha256).filter((sha): sha is string => Boolean(sha)),
  ).size;

  const archivosCompletos = fixtures.filter(
    (fixture) => fixture.xml && fixture.png && fixture.json,
  );

  console.log("\n📊 RESUMEN\n");
  console.log(`Fixtures XML:        ${totalXml}`);
  console.log(`PNG encontrados:     ${totalPng}`);
  console.log(`JSON encontrados:    ${totalJson}`);
  console.log(`SHA únicos:          ${shaUnicos}`);
  console.log(`Archivos completos:  ${archivosCompletos.length}`);
  console.log(`Directorio:          ${fixturesDir}\n`);

  const problemas = detectarProblemas(fixtures);

  if (problemas.length > 0) {
    console.log(warning(`${problemas.length} PROBLEMAS DETECTADOS:\n`));

    for (const problema of problemas.slice(0, 5)) {
      console.log(`  ⚠️ ${problema}`);
    }

    if (problemas.length > 5) {
      console.log(`  ... y ${problemas.length - 5} más`);
    }

    console.log();
    return;
  }

  console.log(exito("Dataset consistente\n"));
}
