/**
 * PASO 5: Módulo de calidad de locators
 *
 * API legacy:
 * - calcularLocators
 * - calcularLocatorsArbol
 * - estadisticasCalidad
 *
 * API v2:
 * - calcularLocatorV2
 * - calcularLocatorsArbolV2
 * - generarCandidatos
 * - pareceValorDinamico
 */

export * from "./locator.js";

export {
  calcularLocatorV2,
  calcularLocatorsArbolV2,
} from "./locator/engine.js";

export { generarCandidatos } from "./locator/candidates.js";

export { pareceValorDinamico } from "./locator/dynamic-value.js";

export type {
  EstrategiaLocator,
  LocalizadorElementoV2,
  LocatorCandidate,
  TipoLocator,
} from "./locator/types.js";
