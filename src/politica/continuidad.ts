/**
 * PASO 6: Política de continuidad
 * Basado en SDD 8 y 17: Exclusiones por continuidad
 *
 * No tocar: cerrar sesion, eliminar cuenta, etc.
 * Comparación: sin mayúsculas ni acentos
 * Scope: texto, descripción, id del elemento y descendientes
 */

import type { NodoNormalizado, ArbolNormalizado } from "../normalizador/tipos.js";

/**
 * Lista base de exclusiones (SDD 17)
 * Español e inglés, sin mayúsculas ni acentos
 */
const EXCLUSIONES_BASE = [
  "cerrar sesion",
  "cerrar sesión",
  "close session",
  "logout",
  "eliminar cuenta",
  "delete account",
  "cambiar contrasena",
  "cambiar contraseña",
  "change password",
  "desinstalar",
  "uninstall",
  "restablecer",
  "restore",
  "reset",
  "pagar",
  "pay",
  "eliminar",
  "delete",
  "remove",
  "enviar",
  "send",
];

/**
 * Normaliza texto para comparación: minúsculas, sin acentos
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .trim();
}

/**
 * Verifica si un nodo debe ser excluido por continuidad
 */
export function debeExcluirse(
  nodo: NodoNormalizado,
  arbol: ArbolNormalizado
): boolean {
  const textosAVerificar: string[] = [];

  // Recolectar textos del nodo y sus descendientes
  if (nodo.texto) textosAVerificar.push(nodo.texto);
  if (nodo.descripcion) textosAVerificar.push(nodo.descripcion);
  if (nodo.idEstable) textosAVerificar.push(nodo.idEstable);

  // Descendientes (máximo 3 niveles)
  for (const indiceDesc of nodo.descendientes) {
    const desc = arbol.nodos.find((n) => n.indice === indiceDesc);
    if (desc) {
      if (desc.texto) textosAVerificar.push(desc.texto);
      if (desc.descripcion) textosAVerificar.push(desc.descripcion);
    }
  }

  // Verificar si alguno de los textos coincide con exclusiones
  for (const texto of textosAVerificar) {
    if (!texto) continue;

    const textNorm = normalizarTexto(texto);
    for (const excl of EXCLUSIONES_BASE) {
      if (textNorm.includes(excl) || excl.includes(textNorm)) {
        return true; // Excluir este nodo
      }
    }
  }

  return false;
}

/**
 * Filtra una lista de nodos según política de continuidad
 */
export function aplicarPoliticaContinuidad(
  nodos: NodoNormalizado[],
  arbol: ArbolNormalizado
): NodoNormalizado[] {
  return nodos.filter((nodo) => !debeExcluirse(nodo, arbol));
}

/**
 * Estadísticas de exclusiones
 */
export interface EstadisticasExclusiones {
  totalNodos: number;
  excluidos: number;
  permitidos: number;
  porcentajeExcluido: number;
}

export function estadisticasExclusiones(
  nodos: NodoNormalizado[],
  arbol: ArbolNormalizado
): EstadisticasExclusiones {
  const excluidos = nodos.filter((n) => debeExcluirse(n, arbol)).length;
  const permitidos = nodos.length - excluidos;

  return {
    totalNodos: nodos.length,
    excluidos,
    permitidos,
    porcentajeExcluido: (excluidos / nodos.length) * 100,
  };
}
