export type CalidadLocator = "estable" | "media" | "ancla" | "fragil";

export type TipoLocator = "id" | "accessibility-id" | "texto" | "xpath" | "clase";

export type EstrategiaLocator =
  | "direct-id"
  | "direct-accessibility"
  | "direct-text"
  | "parent"
  | "ancestor"
  | "descendant"
  | "following-sibling"
  | "preceding-sibling"
  | "class-fallback";

export interface LocatorCandidate {
  valor: string;
  tipo: TipoLocator;
  estrategia: EstrategiaLocator;

  unico: boolean;
  dinamico: boolean;

  score: number;
  confianza: number;
  calidad: CalidadLocator;

  motivo: string;
}

export interface LocalizadorElementoV2 {
  titulo: string;
  principal: LocatorCandidate;
  alternativas: LocatorCandidate[];
  descripcion: string;
}
