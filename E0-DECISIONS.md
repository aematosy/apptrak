# DECISIONES E0 - APPTRAK

## Estado: COMPLETADO (2026-10-23)

### Esqueleto del Repositorio (PASO 0)

✅ **Estructura de carpetas creada**
```
src/
  cli.ts
  lib/logger.ts
  config/schemas.ts
  driver/, normalizador/, huella/, etc. (placeholder)
  
test/
  fixtures/arboles/ (placeholder)
  config.test.ts

scripts/
  generar-esquemas.ts
```

✅ **Archivos de configuración**
- `tsconfig.json` – ES2022, strict mode
- `biome.json` – formatter, linter, 100 chars width
- `.gitignore` – node_modules, dist, .appium, exploraciones/
- `package.json` – deps actualizadas, scripts configurados

✅ **Dependencias principales (E0)**
- `commander` – CLI
- `zod` – validación con esquemas
- `pino` + `pino-pretty` – logs
- `webdriverio` – cliente Appium
- `@appium/types` – tipos
- `fast-xml-parser` – XML → JSON
- `tsx`, `tsup`, `@biomejs/biome`, `vitest` – dev

✅ **Artefactos de entrada (ejemplos)**
- `exploracion.json` – config Wikipedia (ya-iniciada)
- `datos.json` – datos de prueba (search, idioma)

✅ **CLI con todos los comandos**
- `apptrak run [--config] [--reanudar] [--nueva]`
- `apptrak comparar <a> <b> [--entre-plataformas] [--fallar-si]`
- `apptrak consultar <catalogo> [subcomando...]`
- `apptrak impacto [--usos] [--despues] [--antes]`
- `apptrak actualizar [--usos] [--despues] [--antes] [--aplicar]`

✅ **Tests**
- `pnpm test` – vitest ejecuta config.test.ts (2 tests pass)
- `pnpm run typecheck` – tsc strict OK

✅ **Build**
- `pnpm run build` – tsup genera dist/cli.js (ESM)
- CLI funcional: `node dist/cli.js --help` ✓

---

## Decisiones E0 Confirmadas (del documento de contexto)

### App piloto
- **Name**: Wikipedia Android
- **Package**: `org.wikipedia` (a validar)
- **Platform**: Android 14 (API 34)
- **Login**: NO (`ya-iniciada`)
- **Backend**: Ya está (no necesita setup)

### Verificaciones pendientes (PASO 1)
- ✅ Appium instalado y server en `http://localhost:4723`
- ✅ Emulador Pixel_4_API_34 disponible
- ✅ Wikipedia instalada en emulador
- ✅ `getPageSource` guardado en fixtures

### Huella y variantes (decisiones bloqueantes resueltas)
- **Variante vs pantalla nueva**: Tomar última lectura si agota `esperaMaxSegundos`. Marcar pantalla como `inestable`.
- **Pantallas inestables**: Huella solo con nodos que aparecen en TODAS las lecturas. Textos marcados como NO estáticos.
- **Umbral Jaccard**: 0.85 (default, calibrar en E0 con pares etiquetados)
- **Tokens**: clase | idEstable (sin texto, sin bounds)

### Almacenamiento
- **Formato checkpoint**: `estado.json` (SDD, no SQLite aún)
- **Intervalo**: cada 50 acciones

### Pantallas de referencia (a capturar en PASO 2)
- ~10 pantallas conocidas de Wikipedia
- Nombre + identificador (id, texto)
- Variantes (dialogo, teclado, lista corta/larga)

### Consumidor del catálogo
- QA manual: `catalogo.md` (legible)
- Agente IA / generador: `consultar` CLI (JSON)

### iOS
- **Versión**: Pospuesto a E5
- **Normalizador**: Agnóstico desde inicio (no duplicar luego)

### Continuidad (exclusiones por defecto)
- Textos de botones: "cerrar sesion", "close session", "eliminar cuenta", etc.
- Comparación: sin mayúsculas ni acentos
- Scope: texto, descripción, id del elemento y descendientes

---

## Próximos pasos (PASO 1 en adelante)

### PASO 1: Entorno Appium (paralelo)
```bash
# Verificar servidor
curl http://localhost:4723/status

# Instalar drivers si falta
pnpm run appium -- driver install uiautomator2

# Verificar emulador
adb devices

# Capturar pageSource inicial
getPageSource > test/fixtures/arboles/wikipedia-inicio.xml
```

### PASO 2: Fixtures reales (10-20 pantallas)
- Navegar Wikipedia manualmente
- Capturar XML de cada pantalla nueva + variantes
- Guardar en `test/fixtures/arboles/*.xml`

### PASO 3-7: Implementación según SDD
- Normalización, huella, calidad, frontera, motor
- Tests con fixtures (sin dispositivo)
- MEDIR: tiempo/acción, repetibilidad, calidad huella (valida H1 y H2)

---

## Comandos útiles

```bash
# Setup
pnpm install
pnpm run build

# Dev
pnpm dev
pnpm test-watch

# Lint y format
pnpm run lint
pnpm run fix

# Appium
pnpm run appium

# Generar esquemas (futuro)
pnpm run schemas
```

---

**Fecha**: 2026-10-23  
**Completado por**: E0 planning  
**Status**: Ready for PASO 1
