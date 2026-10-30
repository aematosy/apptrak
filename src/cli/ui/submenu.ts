import { COLORS, paint } from "./colors.js";

export function submenuTitle(title: string): string {
  return [
    "",
    paint(`APPTRAK · ${title}`, COLORS.bold, COLORS.cyan),
    paint("─".repeat(60), COLORS.gray),
    "",
  ].join("\n");
}

export function submenuSection(title: string): string {
  return paint(`  ${title}`, COLORS.bold, COLORS.violet);
}

export function submenuOption(number: string, label: string): string {
  const numberColor = number === "0" ? COLORS.red : COLORS.cyan;

  return `  ${paint(number.padStart(2), COLORS.bold, numberColor)}  ${paint(label, COLORS.white)}`;
}

export function submenuInfo(label: string, value: string): string {
  return `  ${paint(label.padEnd(18), COLORS.cyan)} ${paint(value, COLORS.white)}`;
}

export function submenuSuccess(text: string): string {
  return paint(`✓ ${text}`, COLORS.green);
}

export function submenuWarning(text: string): string {
  return paint(`⚠ ${text}`, COLORS.yellow);
}

export function submenuError(text: string): string {
  return paint(`✕ ${text}`, COLORS.red);
}
