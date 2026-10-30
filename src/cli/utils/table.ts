/**
 * Utilidades simples para salida tabular de la CLI.
 */

import { COLORS, paint } from "../ui/colors.js";

type Fila = Record<string, unknown>;

function stripAnsi(value: string): string {
  return value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

function visibleLength(value: string): number {
  return stripAnsi(value).length;
}

function padVisible(value: string, width: number): string {
  return value + " ".repeat(Math.max(0, width - visibleLength(value)));
}

function obtenerAncho(anchos: Map<string, number>, columna: string): number {
  return anchos.get(columna) ?? columna.length;
}

export function crearTabla(filas: Fila[], columnas: string[]): string {
  const anchos = new Map<string, number>();

  for (const columna of columnas) {
    let ancho = columna.length;

    for (const fila of filas) {
      const valor = String(fila[columna] ?? "");
      ancho = Math.max(ancho, visibleLength(valor));
    }

    anchos.set(columna, ancho);
  }

  const header = columnas
    .map((columna) => columna.padEnd(obtenerAncho(anchos, columna)))
    .join("  ");

  const separator = columnas
    .map((columna) => "─".repeat(obtenerAncho(anchos, columna)))
    .join("──");

  const lines = [header, separator];

  for (const fila of filas) {
    const line = columnas
      .map((columna) => {
        const valor = String(fila[columna] ?? "");
        return padVisible(valor, obtenerAncho(anchos, columna));
      })
      .join("  ");

    lines.push(line);
  }

  return lines.join("\n");
}

export function estado(ok: boolean): string {
  return ok
    ? paint("✓", COLORS.bold, COLORS.green)
    : paint("✗", COLORS.bold, COLORS.red);
}

export function exito(mensaje: string): string {
  return `${paint("✓", COLORS.bold, COLORS.green)} ${mensaje}`;
}

export function warning(mensaje: string): string {
  return `${paint("!", COLORS.bold, COLORS.yellow)} ${mensaje}`;
}

export function error(mensaje: string): string {
  return `${paint("✗", COLORS.bold, COLORS.red)} ${mensaje}`;
}
