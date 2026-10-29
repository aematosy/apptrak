/**
 * Utilidades simples para salida tabular de la CLI.
 */

type Fila = Record<string, unknown>;

function obtenerAncho(anchos: Map<string, number>, columna: string): number {
  return anchos.get(columna) ?? columna.length;
}

export function crearTabla(filas: Fila[], columnas: string[]): string {
  const anchos = new Map<string, number>();

  for (const columna of columnas) {
    let ancho = columna.length;

    for (const fila of filas) {
      const valor = String(fila[columna] ?? "");
      ancho = Math.max(ancho, valor.length);
    }

    anchos.set(columna, ancho);
  }

  const header = columnas
    .map((columna) => columna.padEnd(obtenerAncho(anchos, columna)))
    .join("  ");

  const separator = columnas.map((columna) => "─".repeat(obtenerAncho(anchos, columna))).join("──");

  const lines = [header, separator];

  for (const fila of filas) {
    const line = columnas
      .map((columna) => String(fila[columna] ?? "").padEnd(obtenerAncho(anchos, columna)))
      .join("  ");

    lines.push(line);
  }

  return lines.join("\n");
}

export function estado(ok: boolean): string {
  return ok ? "✅" : "❌";
}

export function exito(mensaje: string): string {
  return `✅ ${mensaje}`;
}

export function warning(mensaje: string): string {
  return `⚠️ ${mensaje}`;
}

export function error(mensaje: string): string {
  return `❌ ${mensaje}`;
}
