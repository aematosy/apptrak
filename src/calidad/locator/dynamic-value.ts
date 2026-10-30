/**
 * Detecta valores potencialmente dinámicos sin conocer
 * ninguna aplicación concreta.
 */
export function pareceValorDinamico(value: string): boolean {
  const text = value.trim();

  if (!text) {
    return false;
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    return true;
  }

  if (/^[0-9a-f]{16,}$/i.test(text)) {
    return true;
  }

  if (/\d{7,}/.test(text)) {
    return true;
  }

  if (text.length >= 18 && /[a-z]/i.test(text) && /\d/.test(text) && !/\s/.test(text)) {
    const alphanumeric = text.replace(/[^a-z0-9]/gi, "");
    const digits = alphanumeric.replace(/\D/g, "").length;

    if (alphanumeric.length > 0 && digits / alphanumeric.length >= 0.35) {
      return true;
    }
  }

  return false;
}

/**
 * Detecta textos visibles que probablemente representen
 * datos de negocio o estado variable de la UI.
 *
 * No depende de ninguna aplicación concreta.
 */
export function pareceTextoVolatil(value: string): boolean {
  const text = value.trim();

  if (!text) {
    return false;
  }

  // Badges / contadores: 1, 15, 99+
  if (/^\d{1,4}\+?$/.test(text)) {
    return true;
  }

  // Porcentajes
  if (/^[+-]?\d+(?:[.,]\d+)?\s*%$/.test(text)) {
    return true;
  }

  // Montos monetarios comunes
  if (/^(?:S\/|US\$|\$|€|£|¥)\s*[+-]?\d[\d.,]*$/i.test(text)) {
    return true;
  }

  // Horas
  if (/^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?$/i.test(text)) {
    return true;
  }

  return pareceValorDinamico(text);
}
