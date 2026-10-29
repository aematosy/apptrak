# Arquitectura de CLI para Apptrak

## Estructura de Directorios

```
src/cli/
├── main.ts              # Punto de entrada
├── menu.ts              # Menú principal persistente
├── commands/
│   ├── verificar.ts     # Opción 1: Verificar entorno
│   ├── capturar.ts      # Opción 2: PASO 2 (reutiliza capturador)
│   ├── estado.ts        # Opción 3: Estado de fixtures
│   ├── diagnostico.ts   # Opción 4: Diagnóstico H1
│   ├── jaccard.ts       # Opción 5: Matriz Jaccard
│   ├── validacion.ts    # Opción 6: Tests/typecheck/build
│   ├── git-status.ts    # Opción 7: Estado Git
│   └── roadmap.ts       # Opción 8: Ayuda/Roadmap
├── utils/
│   ├── paths.ts         # Centralizar rutas
│   ├── table.ts         # Formato de tablas
│   ├── errors.ts        # Manejo de errores
│   └── spinner.ts       # UI básica (sin deps externas)
└── types.ts             # Tipos compartidos
```

## Flujo

1. main.ts carga menu.ts
2. menu.ts muestra opciones persistentes
3. Cada opción (1-8) llama a commands/
4. commands/ orquestan los scripts existentes sin duplicar
5. Vuelta al menú (salvo 0. Salir)
6. Manejo de errores sin cerrar la CLI

## Reutilización de Scripts

- capturar.ts: Refactoriza capturar-wikipedia-fixtures.ts → funciones reutilizables
- diagnostico.ts: Llama a diagnostico-h1.ts como subproceso o importa lógica
- jaccard.ts: Llama a analizar-wikipedia-jaccard.ts como subproceso
- validacion.ts: Ejecuta tests/typecheck/build/lint

