# PASO 2: Captura de Fixtures Wikipedia para Calibración H1

## Preparación

### 1. Iniciar Appium en otra terminal

```bash
appium --port 4723
```

Debe mostrar algo como:
```
[Appium] Appium server listening on http://0.0.0.0:4723
```

### 2. Verificar entorno

```bash
adb devices                    # Emulador debe estar en "device"
pnpm run build                 # Compilar scripts
```

### 3. Ejecutar captura interactiva

```bash
pnpm exec node scripts/capturar-wikipedia-fixtures.ts
```

## Guía de Pantallas a Capturar

Número y tipo de pantalla recomendado:

1. **wikipedia-01-onboarding** — Pantalla inicial de Wikipedia
   - Primera vez que abre la app o reset
   - Muestra onboarding/intro

2. **wikipedia-02-onboarding-next** — Después de interacción en onboarding
   - Tap en "Next" o similar
   - Progreso en el flujo onboarding

3. **wikipedia-03-home** — Pantalla principal / Home
   - Explore tab, feed, o home principal
   - Estado normal después de onboarding

4. **wikipedia-04-search** — Search sin teclado
   - Tap en search box, pero sin escribir
   - Solo visible la caja de búsqueda

5. **wikipedia-05-search-keyboard** — Search con teclado visible
   - Search box con teclado virtual abierto
   - Antes de escribir texto

6. **wikipedia-06-search-text** — Search con texto ingresado
   - Texto como "Python" o "Wikipedia" en search
   - Antes de ver resultados

7. **wikipedia-07-results** — Resultados de búsqueda
   - Lista de artículos de búsqueda
   - Estado con resultados visibles

8. **wikipedia-08-article** — Artículo completo
   - Abrir un artículo (ej: Python)
   - Pantalla sin scroll, solo el top

9. **wikipedia-09-article-scroll** — Mismo artículo después de scroll
   - Scroll down en el mismo artículo
   - Contenido diferente del anterior

10. **wikipedia-10-settings** — Pantalla de Configuración
    - Tap en settings/menu
    - Pantalla de opciones/preferencias

Opcional (si es posible):
- 11. **wikipedia-11-menu** — Menú desplegable o lateral
- 12. **wikipedia-12-list-short** — Lista corta de items
- 13. **wikipedia-13-list-long** — La misma lista con más items
- 14. **wikipedia-14-dialog** — Diálogo o overlay

## Comandos Disponibles

En el prompt interactivo:

```
c <nombre>      — Capturar pantalla con nombre
tap <texto>     — Tap en botón con texto
write <texto>   — Escribir en search box
back            — Volver atrás
pause <ms>      — Pausa (ej: pause 1000)
help            — Ver menú
exit            — Terminar
```

### Ejemplo de sesión

```
>> c wikipedia-01-onboarding
✅ Capturado: wikipedia-01-onboarding
   Nodos: 42, Visibles: 38, Interactivos: 12
   Huella: p-abcd1234

>> tap "Get started"
✓ Tap en: Get started

>> c wikipedia-02-onboarding-next
✅ Capturado: wikipedia-02-onboarding-next

>> tap "Search"
✓ Tap en: Search

>> c wikipedia-04-search

>> write Python
✓ Texto ingresado: Python

>> c wikipedia-06-search-text

>> back
✓ Atrás

>> exit
✅ Sesión cerrada
```

## Después de Capturar

Una vez capturados los 10-15 fixtures:

```bash
pnpm exec node scripts/analizar-wikipedia-jaccard.ts
```

Esto generará:
- Matriz de similitud Jaccard entre todos los pares
- Clasificación automática (MISMA_PANTALLA / VARIANTE / PANTALLA_DISTINTA)
- Estadísticas

## Archivos Generados

Cada captura crea 3 archivos:

- `test/fixtures/wikipedia/wikipedia-NN-nombre.xml` — Page source completo
- `test/fixtures/wikipedia/wikipedia-NN-nombre.png` — Screenshot
- `test/fixtures/wikipedia/wikipedia-NN-nombre.json` — Metadata

JSON contiene:
```json
{
  "nombre": "wikipedia-01-onboarding",
  "timestamp": "2026-10-24T...",
  "app": "org.wikipedia",
  "totales": 42,
  "visibles": 38,
  "interactivos": 12,
  "huella": "p-abcd1234",
  "tiempoXML": 145,
  "tiempoTotal": 892
}
```

