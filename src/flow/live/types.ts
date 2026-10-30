import type { FlowLocator, FlowScreenReference } from "../types.js";

/**
 * Señal física temporal del dispositivo.
 *
 * Puede contener coordenadas durante runtime,
 * pero nunca debe persistirse como locator
 * ni formar parte del flow final.
 */
export interface RawTouchEvent {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Elemento semántico detectado en la UI.
 *
 * Esta representación es común para Android e iOS.
 */
export interface LiveElement {
  nodeIndex: number;

  title: string;

  locator?: FlowLocator;

  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  clickable: boolean;
  editable: boolean;

  enabled: boolean;
  visible: boolean;

  sensitive: boolean;

  depth?: number;
}

/**
 * Snapshot semántico de la pantalla.
 *
 * Se obtiene desde Appium y es independiente
 * de la plataforma.
 */
export interface LiveSnapshot {
  capturedAt: number;

  screen: FlowScreenReference;

  elements: LiveElement[];

  visibleTexts: string[];

  focusedElement?: LiveElement;
}

/**
 * TAP ya resuelto semánticamente.
 *
 * No guarda coordenadas.
 */
export interface DetectedTap {
  type: "tap";

  element: LiveElement;
}

/**
 * Escritura detectada sobre un elemento.
 */
export interface DetectedWrite {
  type: "write";

  element: LiveElement;

  value: string;

  sensitive: boolean;
}

/**
 * Navegación hacia atrás.
 */
export interface DetectedBack {
  type: "back";
}

export interface DetectedScroll {
  type: "scroll";

  direction: "up" | "down" | "left" | "right";
}

/**
 * Cambio entre dos estados de UI.
 */
export interface DetectedUiChange {
  type: "ui-change";

  addedTexts: string[];

  removedTexts: string[];

  fromScreen?: FlowScreenReference;

  toScreen?: FlowScreenReference;
}

/**
 * Evento semántico final detectado por LIVE REC.
 *
 * Estos eventos sí pueden convertirse en
 * pasos persistentes del flow.
 */
export type LiveDetectedEvent =
  | DetectedTap
  | DetectedWrite
  | DetectedBack
  | DetectedScroll
  | DetectedUiChange;
