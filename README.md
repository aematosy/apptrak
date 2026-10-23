# Apptrak

Explorador autónomo de apps móviles. Genera catálogos de pantallas, elementos, locators y transiciones para automatización de pruebas.

## Desarrollo rápido

```bash
# Instalar dependencias
pnpm install

# Desarrollo (watch mode)
pnpm run dev

# Tests
pnpm test
pnpm test-watch

# Lint y format
pnpm run lint
pnpm run fix

# Build
pnpm run build

# Generar esquemas JSON
pnpm run schemas
```

## Entorno Appium

```bash
# Instalar drivers locales
pnpm run appium -- driver install uiautomator2

# Iniciar servidor Appium
pnpm run appium
```

## Hitos (E0-E7)

- **E0**: Prototipo de exploración con Wikipedia (validar huella y tiempo)
- **E1**: Catálogo completo (normalización, variantes, calidad)
- **E2**: Entradas (exploracion.json, datos.json) y progreso
- **E3**: Informes y consulta del catálogo
- **E4**: IA opcional (nombres de pantallas)
- **E5**: Soporte iOS
- **E6**: Granja de dispositivos
- **E7**: Impacto ante cambios de UI

## Estructura

```
src/
  cli.ts              # Punto de entrada
  config/             # Esquemas zod
  driver/             # Envolvedor de Appium
  normalizador/       # Árbol XML → nodo normalizado
  huella/             # Identidad de pantalla (Jaccard)
  frontera/           # Acciones candidatas
  calidad/            # Locators: unicidad y consistencia
  politica/           # Continuidad y exclusiones
  datos/              # Lee datos.json
  motor/              # Bucle de exploración
  almacen/            # Catálogo, checkpoint, progreso
  informe/            # Reportes (Markdown, Mermaid)
  comparador/         # Equivalencia entre catálogos
  impacto/            # Análisis de cambios
  ia/                 # Interfaz ProveedorIA

test/
  fixtures/arboles/   # XML reales capturados
  config.test.ts
```

## App piloto: Wikipedia Android

- **Package**: `org.wikipedia`
- **Platform**: Android 14 (API 34)
- **Precondition**: `ya-iniciada` (no requiere login)
- **Referencia**: ~10 pantallas (Explorar, Guardados, Búsqueda, etc.)

## Decisiones E0

| Aspecto | Decisión |
|---------|----------|
| IDs | A validar con Appium Inspector |
| Almacenamiento | `estado.json` (SDD) |
| Pantallas inestables | Última lectura + marcar inestable |
| iOS | Pospuesto a E5 |
| Normalizador | Agnóstico desde inicio |

---

**Versión**: 0.1.0  
**Status**: PASO 0 completado (esqueleto base)
