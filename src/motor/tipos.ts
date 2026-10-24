/**
 * PASO 7: Motor de exploración E0
 * Basado en SDD 6.1, 6.6-8: Bucle de exploración, retroceso, recuperación
 *
 * Bucle principal:
 * 1. Leer árbol de UI
 * 2. Normalizar
 * 3. Calcular huella
 * 4. Pantalla conocida? (registrar o fusionar)
 * 5. Generar frontera
 * 6. Ejecutar acción
 * 7. Esperar estabilidad
 * 8. Clasificar resultado
 * 9. Registrar transición
 * 10. Volver a 1
 */

import type { ArbolNormalizado } from "../normalizador/tipos.js";
import type { Huella } from "../huella/index.js";

export type ResultadoAccion =
  | "nueva"
  | "conocida"
  | "variante"
  | "sin-cambio"
  | "salio-de-app"
  | "bloqueada"
  | "error";

export interface Pantalla {
  id: string; // hash de huella
  huella: Huella;
  arbol: ArbolNormalizado;
  textosVisibles: string[];
  visitas: number; // cuántas veces se vio esta pantalla
  primera: string; // ISO timestamp primera visita
  ultima: string; // ISO timestamp última visita
}

export interface Transicion {
  desdeId: string; // pantalla origen
  accionIndice: number; // índice del nodo donde se hizo tap
  resultado: ResultadoAccion;
  hastaId: string | null; // pantalla destino (null si error/bloqueada)
  tiempo: number; // ms
}

export interface EstadoMotor {
  pantallasEncontradas: Map<string, Pantalla>;
  transiciones: Transicion[];
  accionesEjecutadas: number;
  pantallasUnicas: number;
  tiempoTotal: number; // ms
  accionesAlcanzadas: Set<string>; // {pantallaId}:{índiceNodo}
  fronteraPendiente: Array<{ pantalla: Pantalla; acciones: number[] }>;
}

export interface ConfigMotor {
  maxPantallas?: number;
  maxAcciones?: number;
  maxMinutos?: number;
  esperaMaxSegundos?: number;
  checkpointCada?: number;
}

/**
 * Estado de una corrida resumido para checkpoint
 */
export interface Checkpoint {
  pantallasEncontradas: Array<[string, Pantalla]>;
  transiciones: Transicion[];
  accionesEjecutadas: number;
  pantallasUnicas: number;
  tiempoTotal: number;
  fronteraPendiente: Array<{ id: string; acciones: number[] }>;
  timestamp: string;
}

/**
 * Convierte EstadoMotor a Checkpoint (serializable)
 */
export function estadoACheckpoint(estado: EstadoMotor): Checkpoint {
  return {
    pantallasEncontradas: Array.from(estado.pantallasEncontradas.entries()),
    transiciones: estado.transiciones,
    accionesEjecutadas: estado.accionesEjecutadas,
    pantallasUnicas: estado.pantallasUnicas,
    tiempoTotal: estado.tiempoTotal,
    fronteraPendiente: Array.from(estado.fronteraPendiente).map((fp) => ({
      id: fp.pantalla.id,
      acciones: fp.acciones,
    })),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convierte Checkpoint a EstadoMotor (requirens pantallas conocidas)
 */
export function checkpointAEstado(
  checkpoint: Checkpoint,
  pantallaMap?: Map<string, Pantalla>
): EstadoMotor {
  const pantallasEncontradas = new Map(checkpoint.pantallasEncontradas);
  const fronteraPendiente = (checkpoint.fronteraPendiente ?? [])
    .map((fp) => {
      const pantalla = pantallaMap?.get(fp.id) || pantallasEncontradas.get(fp.id);
      return pantalla ? { pantalla, acciones: fp.acciones } : null;
    })
    .filter((x) => x !== null) as Array<{ pantalla: Pantalla; acciones: number[] }>;

  return {
    pantallasEncontradas,
    transiciones: checkpoint.transiciones,
    accionesEjecutadas: checkpoint.accionesEjecutadas,
    pantallasUnicas: checkpoint.pantallasUnicas,
    tiempoTotal: checkpoint.tiempoTotal,
    accionesAlcanzadas: new Set(
      checkpoint.transiciones.map((t) => `${t.desdeId}:${t.accionIndice}`)
    ),
    fronteraPendiente,
  };
}

/**
 * Estadísticas de exploración
 */
export interface EstadisticasExploracion {
  pantallasEncontradas: number;
  transicionesTotales: number;
  accionesEjecutadas: number;
  tiempoTotal: number;
  tiempoPromedioPorAccion: number;
  cobertura: number; // 0-100, si hay lista de referencia
  repetibilidad: number; // 0-100, entre dos corridas
}

export function calcularEstadisticas(
  estado: EstadoMotor
): EstadisticasExploracion {
  const tiempoPromedioPorAccion =
    estado.accionesEjecutadas > 0
      ? estado.tiempoTotal / estado.accionesEjecutadas
      : 0;

  return {
    pantallasEncontradas: estado.pantallasUnicas,
    transicionesTotales: estado.transiciones.length,
    accionesEjecutadas: estado.accionesEjecutadas,
    tiempoTotal: estado.tiempoTotal,
    tiempoPromedioPorAccion,
    cobertura: 0, // TBD con lista de referencia
    repetibilidad: 0, // TBD segunda corrida
  };
}
