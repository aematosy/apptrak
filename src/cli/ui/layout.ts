/**
 * Layout principal de Apptrak CLI.
 */

import { currentProject } from "../config/current-project.js";
import { getLogo } from "../config/logo.js";
import { BRANDING } from "./branding.js";
import { COLORS, paint } from "./colors.js";

interface StateInfo {
  status: string;
  h1Status: string;
  h2Status: string;
  fixtureCount?: number;
}

function stripAnsi(value: string): string {
  return value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

function fit(value: string, width: number): string {
  const visible = stripAnsi(value);

  if (visible.length > width) {
    const maxVisible = Math.max(0, width - 1);

    let result = "";
    let visibleLength = 0;
    let index = 0;

    while (index < value.length && visibleLength < maxVisible) {
      if (value[index] === "\x1b") {
        const match = value.slice(index).match(/^\x1B\[[0-?]*[ -/]*[@-~]/);

        if (match) {
          result += match[0];
          index += match[0].length;
          continue;
        }
      }

      result += value[index];
      visibleLength++;
      index++;
    }

    return `${result}…${COLORS.reset}`;
  }

  return value.padEnd(value.length + Math.max(0, width - visible.length));
}

export function renderLogo(): string {
  const compact = (process.stdout.columns ?? 120) < 90;
  return getLogo(compact);
}

export function renderHeader(): string {
  return `
v${BRANDING.version}
${BRANDING.tagline}

────────────────────────────────────────────────────────────
`;
}

export function renderDashboard(state: StateInfo): string {
  const projectInfo = currentProject.getDashboardInfo();

  if (!projectInfo) {
    return `
No hay proyecto activo.

Configura o carga un proyecto para habilitar captura,
diagnóstico y análisis.

────────────────────────────────────────────────────────────
`;
  }

  const labelWidth = 16;
  const valueWidth = 42;

  const row = (label: string, value: string) =>
    `${COLORS.gray}│${COLORS.reset} ${paint(fit(label, labelWidth), COLORS.bold, COLORS.cyan)} ${COLORS.gray}│${COLORS.reset} ${fit(value, valueWidth)} ${COLORS.gray}│${COLORS.reset}`;

  const horizontal = paint(
    `├${"─".repeat(labelWidth + 2)}┼${"─".repeat(valueWidth + 2)}┤`,
    COLORS.gray,
  );

  const top = paint(`┌${"─".repeat(labelWidth + 2)}┬${"─".repeat(valueWidth + 2)}┐`, COLORS.gray);

  const bottom = paint(
    `└${"─".repeat(labelWidth + 2)}┴${"─".repeat(valueWidth + 2)}┘`,
    COLORS.gray,
  );

  const statusValue = paint(
    state.status,
    state.status.toLowerCase().includes("progreso") ? COLORS.yellow : COLORS.green,
  );

  const h1Value = paint(
    state.h1Status,
    state.h1Status.toLowerCase().includes("pendiente") ? COLORS.yellow : COLORS.green,
  );

  const h2Value = paint(
    state.h2Status,
    state.h2Status.toLowerCase().includes("pendiente") ? COLORS.yellow : COLORS.green,
  );

  const fixtureValue = paint(String(state.fixtureCount ?? 0), COLORS.bold, COLORS.white);

  return `
${top}
${row("Proyecto", projectInfo.proyecto)}
${row("Plataforma", projectInfo.plataforma)}
${row("Dispositivo", projectInfo.dispositivo)}
${row("Package", projectInfo.package)}
${row("Appium", projectInfo.appium)}
${horizontal}
${row("E0", statusValue)}
${row("Fixtures", fixtureValue)}
${row("H1", h1Value)}
${row("H2", h2Value)}
${bottom}
`;
}

export function renderMenuOptions(): string {
  const option = (number: string, label: string) =>
    `  ${paint(number.padStart(2), COLORS.bold, COLORS.cyan)}  ${paint(label, COLORS.white)}`;

  const section = (title: string) => paint(`  ${title}`, COLORS.bold, COLORS.violet);

  return [
    section("PROJECT"),
    option("1", "Configurar proyecto"),
    option("2", "Verificar entorno"),
    option("3", "Capturar fixtures"),
    option("4", "Ver estado de fixtures"),
    "",
    section("CATALOG"),
    option("5", "Catálogo de aplicación"),
    option("6", "Ver pantallas"),
    option("7", "Ver locators"),
    option("8", "Exportar JSON"),
    "",
    section("ANALYSIS"),
    option("9", "Diagnóstico H1"),
    option("10", "Matriz Jaccard"),
    option("11", "Validación técnica"),
    "",
    section("SYSTEM"),
    option("12", "Estado Git"),
    option("13", "Ayuda / Roadmap"),
    "",
    `  ${paint(" 0", COLORS.bold, COLORS.red)}  ${paint("Salir", COLORS.white)}`,
  ].join("\n");
}

export function renderMenu(state: StateInfo): string {
  return ["\n", renderLogo(), renderHeader(), renderDashboard(state), renderMenuOptions(), ""].join("");
}
