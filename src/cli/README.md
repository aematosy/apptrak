# Apptrak CLI

Interfaz de línea de comandos unificada para Apptrak.

## Uso

```bash
pnpm apptrak
```

Abre un menú interactivo persistente que orquestra todo el flujo de Apptrak.

## Arquitectura

```
src/cli/
├── menu.ts              # Menú principal persistente
├── types.ts             # Tipos compartidos
├── commands/
│   ├── verificar.ts     # 1. Verificar entorno
│   ├── capturar.ts      # 2. PASO 2 - Capturar fixtures
│   ├── estado.ts        # 3. Estado de fixtures
│   ├── diagnostico.ts   # 4. Diagnóstico H1
│   ├── jaccard.ts       # 5. Matriz Jaccard
│   ├── validacion.ts    # 6. Validación técnica
│   ├── git-status.ts    # 7. Estado Git
│   └── roadmap.ts       # 8. Ayuda/Roadmap
└── utils/
    ├── paths.ts         # Rutas centralizadas
    ├── table.ts         # Formato de tablas
    └── errors.ts        # Manejo de errores
```

## Características

- ✅ Menú interactivo persistente
- ✅ Verificación completa de entorno
- ✅ Captura de fixtures (PASO 2) con validación SHA
- ✅ Estado de fixtures sin Appium
- ✅ Diagnóstico H1
- ✅ Matriz Jaccard
- ✅ Validación técnica (tests/typecheck/build/lint)
- ✅ Estado Git
- ✅ Ayuda / Roadmap
- ✅ Detección de componentes faltantes
- ✅ Rutas centralizadas (no hardcodeadas)
- ✅ Manejo robusto de errores
- ✅ Sin dependencias externas (usa node:readline/promises)

## Reutilización

Los comandos orquestan los scripts existentes sin duplicar lógica:

- `cmdVerificar()` → Verifica entorno de forma independiente
- `cmdCapturar()` → Orquestra capturador-wikipedia-fixtures.ts con submenú
- `cmdEstado()` → Diagnostica dataset sin Appium
- `cmdDiagnostico()` → Ejecuta diagnostico-h1.ts como subproceso
- `cmdJaccard()` → Ejecuta analizar-wikipedia-jaccard.ts como subproceso
- `cmdValidacion()` → Ejecuta tests/typecheck/build/lint
- `cmdGitStatus()` → Muestra estado Git sin commit/push
- `cmdRoadmap()` → Ayuda y roadmap del proyecto

## Rutas Centralizadas

Todos los comandos usan `src/cli/utils/paths.ts`:

```typescript
const PATHS = {
  fixturesDir: "test/fixtures/arboles/wikipedia-redo",
  // ...
};
```

No hay rutas hardcodeadas en múltiples lugares.

## Próximas Implementaciones

- [ ] Refinar submenú capturar (acciones durante captura: tap, write, back, etc.)
- [ ] Integración más profunda de shell para gestionar Appium en vivo
- [ ] Almacenamiento de preferencias (dispositivo, package, etc.)
- [ ] Exportación de reportes desde state y diagnostico

## Estado de Implementación

| Opción | Comando | Estado |
|--------|---------|--------|
| 1 | verificar | ✅ Completado |
| 2 | capturar | ✅ Completado |
| 3 | estado | ✅ Completado |
| 4 | diagnostico | ✅ Completado |
| 5 | jaccard | ✅ Completado |
| 6 | validacion | ✅ Completado |
| 7 | git-status | ✅ Completado |
| 8 | roadmap | ✅ Completado |
