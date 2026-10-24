# Apptrak

Explorador autónomo de apps móviles. Genera catálogos de pantallas, elementos, locators y transiciones para automatización de pruebas.

**Status actual**: E0 EN PROGRESO — Arquitectura implementada, en validación y calibración.

## Desarrollo rápido

```bash
# Instalar dependencias
pnpm install

# Tests (65 pass, 0 fail)
pnpm test
pnpm test-watch

# Lint y format
pnpm run lint
pnpm run fix

# Build
pnpm run build

# Capturar fixtures (Wikipedia)
pnpm run capturar-secuencia
pnpm run analizar-arboles
```

## Entorno Appium

```bash
# Instalar drivers locales
pnpm run appium -- driver install uiautomator2

# Iniciar servidor Appium
pnpm run appium
```

## Estado detallado de PASO 0-7

| PASO | Descripción | Estado |
|------|-------------|--------|
| **0** | Esqueleto base (repo, CLI, zod) | ✅ Completado |
| **1** | Conectividad Appium | ✅/🟡 Scripts funcionales, sin automatización |
| **2** | Fixtures reales Wikipedia | 🟡 1 capturado, 10-14 pendientes |
| **3** | Normalizador (XML → nodos) | 🟡 Implementado, en validación (displayed fix) |
| **4** | Huella (tokens + Jaccard) | 🟡 Implementado, calibración pendiente |
| **5** | Calidad de locators | 🟡 Prototipo, no validado en campo |
| **6** | Frontera + política continuidad | 🟡 Prototipo, no validado en campo |
| **7** | Motor autónomo Appium | 🔴 Pendiente integración real |

## Hipótesis E0 a validar

| Hipótesis | Algoritmo | Evidencia | Próximo |
|-----------|-----------|-----------|----------|
| **H1**: Jaccard >= 0.85 separa bien | ✓ Implementado (1.0 consigo) | ⏳ Pendiente calibración 10-15+ pantallas | Capturar fixtures |
| **H2**: Tiempo/acción < 5s | ⏳ Proto solo | ❌ Sin medición real (1000ms hardcodeado) | Motor real Appium |

### ⏳ E1: Catálogo (PASO 8)
- Modelo: Pantallas + Elementos + Transiciones
- Versionado y reanudable
- catalogo.json

### ⏳ E2: Entradas (PASO 9)
- exploracion.json + datos.json
- Precondiciones
- progreso.json

### ⏳ E3: Informes (PASO 10)
- catalogo.md, grafo.mmd, informe.md
- Subcomandos: consultar, comparar

### ⏳ E4-E7: Futuro
- E4: IA opcional
- E5: iOS
- E6: Granja
- E7: Impacto

## Estructura

```
src/
  cli.ts              # Punto de entrada
  config/             # Esquemas zod
  normalizador/       # XML → nodo (PASO 3)
  huella/             # Tokens + Jaccard (PASO 4)
  calidad/            # Locators (PASO 5)
  frontera/           # Orden de prueba (PASO 6)
  politica/           # Continuidad (PASO 6)
  motor/              # Reconocimiento (PASO 7)
  driver/             # Appium (stub)
  datos/              # datos.json (stub)
  almacen/            # Checkpoint (stub)
  informe/            # Reportes (stub)
  comparador/         # Equivalencia (stub)
  impacto/            # Análisis (stub)
  ia/                 # ProveedorIA (stub)

test/
  config.test.ts           (2 tests)
  normalizador.test.ts     (17 tests) ✓
  huella.test.ts           (14 tests) ✓
  calidad.test.ts          (11 tests) ✓
  frontera.test.ts         (13 tests) ✓
  motor.test.ts            (10 tests) ✓

fixtures/
  arboles/
    wikipedia-inicio.xml   (capturado)
    wikipedia-inicio.png   (capturado)
```

## App piloto: Wikipedia Android

- **Package**: `org.wikipedia`
- **Platform**: Android 14 (API 34)
- **Emulador**: Pixel_4_API_34
- **Precondición**: `ya-iniciada` (sin login)
- **Referencia**: ~10 pantallas

### Línea base (Wikipedia Onboarding)

| Métrica | Valor |
|---------|-------|
| Nodos detectados | 18 |
| Resource-ids | 16.7% |
| Content-descs | 11.1% |
| Ratio tokens/nodos | 0.89 |
| Hash huella | p-02e268ed |
| Jaccard consigo | 1.0 |
| Locators estable | 27.8% (5/18) |
| Locators estable+media | 77.8% |
| Exclusiones política | 0% (segura) |

## Decisiones E0

| Aspecto | Decisión |
|---------|----------|
| **Bloqueante 4.1a** | Colapso listas: N >= 3 hermanos → 1 token ✓ |
| **Bloqueante 4.1b** | Variante: Jaccard >= 0.85 + nodos nuevos ✓ |
| **Bloqueante 4.2** | Inestables: última lectura + marcar ✓ |
| **Bloqueante 4.3** | Tipo porTipo: validar en motor real |
| **Almacenamiento** | estado.json (SDD) |
| **iOS** | Pospuesto a E5 |
| **Normalizador** | Agnóstico desde inicio |

## Hipótesis a validar

- **H1**: Jaccard >= 0.85 separa bien pantallas (✓ implementado, ⏳ validar con 10+ pantallas)
- **H2**: Tiempo/acción < 5s (✓ proto 1000ms, ⏳ validar con corrida real)

## Próximos pasos

1. **Capturar 10-15 pantallas** de Wikipedia (PASO 2)
   ```bash
   pnpm run capturar-secuencia
   pnpm run analizar-arboles
   ```

2. **Motor real Appium** (PASO 7 integración)
   - Sesión + getPageSource
   - Bucle: leer → normalizar → explorar
   - Retroceso y recuperación
   - Medición H1 + H2

3. **E1: Catálogo** (PASO 8-10)
   - Modelo persistente
   - Entradas
   - Informes

---

**Versión**: 0.1.0  
**Status**: E0 proto (PASO 0-7) ✓  
**Tests**: 65 pass, 0 fail  
**LOC**: ~3500  
**Última actualización**: 2026-10-23
