# PASO 2: Captura de Fixtures - Guía

**Objetivo**: Capturar 10-20 pantallas reales de Wikipedia Android con variantes

**Status**: ✅ Empezado (1/15 pantallas)
- ✅ `wikipedia-inicio.xml` - Onboarding

**Pantallas por capturar**:

## 1. Onboarding (✅ Capturado)
- **Archivo**: `wikipedia-inicio.xml`
- **Actividad**: InitialOnboardingActivity
- **Característico**: Logo Wikipedia, texto descriptivo, botón "Forward"
- **Cómo capturar**: Ya está. Análisis:
  - resource-ids: 1 (muy bajo)
  - content-descs: 2
  - textos: 3
  - clickables: 1 (botón Forward)

---

## 2. Home / Feed (Exploración)
- **Qué buscar**: Pantalla principal de Wikipedia después de onboarding
- **Característico**: CardView con artículos destacados, barra inferior con iconos
- **Cómo capturar**:
  1. `capturar-secuencia`
  2. `tap Forward` (o tap en el botón Forward del onboarding)
  3. `capturar home`

---

## 3. Búsqueda (input activo)
- **Qué buscar**: Campo de búsqueda con teclado
- **Característico**: EditText enfocado, teclado del SO
- **Cómo capturar**:
  1. Desde Home, `tap` en barra de búsqueda
  2. `capturar busqueda-input`

---

## 4. Resultados de búsqueda
- **Qué buscar**: Lista de artículos resultantes
- **Característico**: RecyclerView con items, texto de búsqueda
- **Cómo capturar**:
  1. Desde búsqueda, escribir en la consola: `tap "Albert Einstein"`
  2. Esperar 2 segundos (o `pause 2000`)
  3. `capturar busqueda-resultados`

---

## 5. Artículo (vista lectura)
- **Qué buscar**: Contenido de artículo con texto, títulos, enlaces
- **Característico**: Scrollable, múltiples TextView con contenido
- **Cómo capturar**:
  1. Desde resultados, `tap` en un artículo
  2. `capturar articulo-contenido`

---

## 6. Artículo (variante: expandir sección)
- **Qué buscar**: Mismo artículo pero con una sección expandida
- **Característico**: Más elementos visibles, diferentes nodos
- **Cómo capturar**:
  1. Desde artículo anterior, `tap` en un título de sección
  2. `capturar articulo-seccion-expandida`

---

## 7. Guardados (lista vacía)
- **Qué buscar**: Pantalla de artículos guardados
- **Característico**: Pantalla vacía o icono de favoritos
- **Cómo capturar**:
  1. `tap` en el icono de Guardados en barra inferior
  2. `capturar guardados-vacio`

---

## 8. Historial
- **Qué buscar**: Historial de visitas
- **Característico**: Lista de artículos visitados recientemente
- **Cómo capturar**:
  1. `tap` en icono de Historial
  2. `capturar historial`

---

## 9. Configuración / Ajustes
- **Qué buscar**: Pantalla de settings
- **Característico**: Preferences, switches, opciones de idioma/tema
- **Cómo capturar**:
  1. `tap` en icono de Configuración (⚙️)
  2. `capturar ajustes`

---

## 10. Selector de idioma
- **Qué buscar**: Diálogo o pantalla de selección de idiomas
- **Característico**: Lista de idiomas, flags o códigos ISO
- **Cómo capturar**:
  1. Desde Ajustes, `tap` en la opción de idioma
  2. `capturar selector-idioma`

---

## Variantes (capturar 2-3 más)

### Diálogo / Alert
- **Qué buscar**: Cualquier diálogo emergente
- **Cómo**: En cualquier pantalla, generar un alert (ej: intentar acciones destructivas)
- **Guardar como**: `dialogo-confirmacion`

### Pantalla larga con scroll
- **Qué buscar**: Artículo largo donde scroll revela nuevos elementos
- **Cómo**: Capturar normal, scrollear, capturar de nuevo
- **Guardar como**: `articulo-scroll-1`, `articulo-scroll-2`

### Teclado visible
- **Qué buscar**: Campo de texto con teclado del SO
- **Cómo**: Ya está capturado en "Búsqueda"

---

## Workflow recomendado

```bash
# Terminal 1: Iniciar Appium
pnpm run appium

# Terminal 2: Abrir emulador con Wikipedia en onboarding
adb devices

# Terminal 3: Script interactivo
pnpm run capturar-secuencia

# Dentro del script:
capturar> capturar wikipedia-inicio     # ✅ Ya existe
capturar> tap Forward
capturar> capturar home
capturar> tap "Discover"                # O buscar
capturar> capturar busqueda-input
capturar> tap "Albert"
capturar> capturar busqueda-resultados
capturar> tap "Albert Einstein"
capturar> capturar articulo-contenido
... (continuar con otras pantallas)
capturar> salir

# Analizar resultados
pnpm run analizar-arboles
```

---

## Checklist de calidad

Cada captura debe tener:
- [ ] Nombre descriptivo (ej: `home`, `articulo-contenido`)
- [ ] Al menos 5 elementos clickables
- [ ] Mixtura de resource-ids, content-descs y textos
- [ ] Si es una variante, incluir en el nombre (ej: `articulo-scroll-1`)

---

## Próximos pasos

1. **Capturar 10-15 pantallas** siguiendo la guía
2. **Analizar**: `pnpm run analizar-arboles`
3. **Etiquetar pares** (opcional): crear `test/fixtures/arboles/pares.json`
   ```json
   {
     "pares": [
       { "a": "articulo-1.xml", "b": "articulo-2.xml", "resultado": "misma_pantalla" },
       { "a": "home.xml", "b": "busqueda-input.xml", "resultado": "distinta" }
     ]
   }
   ```
4. **Pasar a PASO 3**: Implementar Normalizador

---

**Duración estimada**: 20-30 min en emulador  
**Artefactos**: 15-20 XML en `test/fixtures/arboles/`
