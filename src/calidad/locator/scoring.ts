import type { CalidadLocator, LocatorCandidate } from "./types.js";

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function calidadDesdeScore(score: number, unico: boolean): CalidadLocator {
  if (!unico) {
    return score >= 60 ? "ancla" : "fragil";
  }

  if (score >= 90) {
    return "estable";
  }

  if (score >= 70) {
    return "media";
  }

  if (score >= 55) {
    return "ancla";
  }

  return "fragil";
}

export function crearCandidato(
  input: Omit<LocatorCandidate, "score" | "confianza" | "calidad"> & {
    score: number;
  },
): LocatorCandidate {
  const score = clampScore(input.score);

  return {
    ...input,
    score,
    confianza: score / 100,
    calidad: calidadDesdeScore(score, input.unico),
  };
}

export function ordenarCandidatos(candidates: LocatorCandidate[]): LocatorCandidate[] {
  return [...candidates].sort((a, b) => {
    if (a.unico !== b.unico) {
      return a.unico ? -1 : 1;
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.valor.length - b.valor.length;
  });
}
