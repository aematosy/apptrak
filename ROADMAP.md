# ROADMAP: QUÉ SIGUE

## Status Actual: PASO 1-2 (Appium ✅ + Fixtures en progreso)

```
┌─────────────────────────────────────────────────────────────┐
│                    HITO E0: PROTOTIPO                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ PASO 0: Esqueleto base (repo, CLI, zod)                  │
│  ✅ PASO 1: Appium verificado (Wikipedia abierta)            │
│  ⏳ PASO 2: Fixtures (1/15 capturadas)                       │
│  ⏳ PASO 3: Normalizador (XML → nodo normalizado)            │
│  ⏳ PASO 4: Huella (Jaccard, tokens, variantes)              │
│  ⏳ PASO 5: Calidad de locators                              │
│  ⏳ PASO 6: Frontera + política de continuidad               │
│  ⏳ PASO 7: Motor E0 minimo (MEDIR H1 y H2)                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 INMEDIATO (Hoy)

### 1. **Capturar 10-15 pantallas de Wikipedia**
   - Guía en: `PASO2-FIXTURES.md`
   - Usar: `pnpm run capturar-secuencia`
   - Pantallas objetivo:
     - ✅ Onboarding (wikipedia-inicio.xml)
     - ⏳ Home/Feed
     - ⏳ Búsqueda (input + resultados)
     - ⏳ Artículo (lectura + expandida)
     - ⏳ Guardados
     - ⏳ Historial
     - ⏳ Ajustes
     - ⏳ Variantes (diálogo, scroll)
   
   **Tiempo**: ~20-30 min

### 2. **Analizar cobertura de IDs**
   ```bash
   pnpm run analizar-arboles
   ```
   **Esperado**: Reporte mostrando resource-ids, content-descs, textos

---

## 🔨 SEMANA 1 (Próximos 3-5 días)

### PASO 3: Normalizador (SDD 6.2)
**Objetivo**: XML → nodo normalizado (función pura, sin dispositivo)

**Tareas**:
1. Crear tipos TypeScript (NodoNormalizado, Contexto)
2. Parser XML con fast-xml-parser
3. Extractor de atributos: resource-id, content-desc, text, bounds, etc.
4. Calcular contexto: ancestros (max 3), descendientes (max 8)
5. Tests con fixtures (sin Appium)

**Artefactos**:
```
src/normalizador/
  tipos.ts          # interfaces
  parser.ts         # XML → JSON
  extractor.ts      # atributos
  contexto.ts       # ancestros/descendientes
  
test/normalizador.test.ts
```

**Tiempo**: 1-2 días

---

### PASO 4: Huella (SDD 6.3)
**Objetivo**: Identidad de pantalla con Jaccard

**Tareas**:
1. Generar tokens: `clase | idEstable` (o `clase | descripcion`)
2. Colapsar listas (BLOQUEANTE: algoritmo)
3. Calcular hash de huella
4. Similitud Jaccard entre dos huellas
5. Detectar variante: Jaccard >= 0.85 + nodos nuevos
6. Calibrar umbral 0.85 con pares etiquetados

**Artefactos**:
```
src/huella/
  tipos.ts
  tokens.ts         # generación
  jaccard.ts        # similitud
  variantes.ts      # detección

test/huella.test.ts
```

**Bloqueante a resolver**:
- 4.1: Algoritmo de colapso de listas (cuántos hermanos, cómo comparar)

**Tiempo**: 2-3 días

---

### PASO 5: Calidad de locators (SDD 10.3)
**Objetivo**: Asignar mejor locator + calidad a cada elemento

**Tareas**:
1. Estrategias de locators: id → xpath → descripción → clase+índice
2. Verificar unicidad en pantalla
3. Asignar calidad: estable, media, ancla, frágil
4. Almacenar alternativas

**Tiempo**: 1-2 días

---

### PASO 6: Frontera + política (SDD 6.4, 8)
**Objetivo**: Acciones candidatas por pantalla

**Tareas**:
1. Orden de prueba: campos, navegación, ids estables, resto
2. Exclusiones por continuidad (SDD 17)
3. Topes: max N elementos, profundidad
4. Tratamiento de listas
5. Generar frontera ordenada

**Tiempo**: 1-2 días

---

## 🚀 SEMANA 2 (PASO 7: Motor E0)

### PASO 7: Motor E0 minimo (SDD 6.1, 6.6-8)
**Objetivo**: Bucle de exploración completo + MEDICIONES

**Tareas**:
1. Bucle principal: leer → normalizar → huella → ejecutar → esperar → clasificar
2. Retroceso (back key) + recuperación
3. Espera de estabilidad (SDD 6.6)
4. Clasificación de resultados: nueva, conocida, variante, sin-cambio, salió-app, bloqueada, error
5. Checkpoint cada N acciones (estado.json)
6. Progreso en consola (%)

**MEDICIONES CRÍTICAS (validan H1 y H2)**:
```
- Tiempo promedio por acción (objetivo: < 5 seg)
- Pantallas encontradas vs referencia (objetivo: >= 80%)
- Repetibilidad entre corridas (objetivo: >= 90%)
- Calidad de huella (objetivo: 0 fusiones incorrectas)
```

**Outputs**:
- `exploraciones/{id}/catalogo.json` (provisional)
- `exploraciones/{id}/estado.json` (checkpoint)
- `progreso.json` (avance en %)

**Tiempo**: 3-4 días (CRÍTICO)

---

## 📊 HITO E0: COMPLETADO
Después de PASO 7:
- ✅ Exploración autónoma funcional
- ✅ Huella calibrada
- ✅ H1 y H2 validadas (o re-calibrar)
- 📈 Medir tiempo/pantallas/repetibilidad

**Decisión**: ¿Continuar con E1-E3 o ajustar E0?

---

## 📅 SEMANA 3-4 (E1-E3: Catálogo, entradas, informes)

### PASO 8: Catálogo E1 (SDD 10.1, 10.4)
- Modelo de catálogo (pantallas, elementos, transiciones, textos)
- Estructura de carpetas
- Evolución del contrato
- Reanudación de corridas

### PASO 9: Entradas E2 (SDD 5.2-5.3, 9)
- Cargar exploracion.json + datos.json
- Precondiciones (ya-iniciada, pasos, comando)
- Resolver datos (búsqueda por id+pantalla > id > etiqueta)
- Avance y progreso.json

### PASO 10: Informes E3 (SDD 10.4, 11.1, 11.5)
- `catalogo.md` (legible)
- `grafo.mmd` (Mermaid)
- `informe.md` (cobertura)
- CLI `consultar` (pantallas, buscar, sin-id, textos, camino)
- Comparar catálogos

---

## 🎯 Bloqueantes a resolver

| ID | Problema | Impacto | Decide |
|----|----------|---------|--------|
| 4.1a | Algoritmo colapso listas | ALTO (PASO 4) | TBD |
| 4.1b | Variante vs pantalla nueva (overlays) | ALTO (PASO 4) | TBD |
| 4.2 | Pantallas inestables | MEDIO (PASO 7) | ✅ Última lectura |
| 4.3 | Tipo de campo porTipo | BAJO (PASO 9) | Validar en E0 |

---

## 💾 Decisiones documentadas

- `E0-DECISIONS.md` – decisiones E0
- `IMPLEMENTATION-PLAN.md` – detalles PASO 1-10 con SDD
- `.axet-code/memoria.md` – contexto persistente
- `PASO2-FIXTURES.md` – guía de capturas

---

## 🚦 Próximo commit

**Después de capturar fixtures**:
```bash
# Ir a Terminal 1: Appium corriendo
# Ir a Terminal 2: Emulador con Wikipedia
# Ir a Terminal 3:

pnpm run capturar-secuencia

# Dentro:
capturar> capturar wikipedia-inicio        # ✅ Ya existe
capturar> tap Forward
capturar> capturar home
... (capturar 10-15 pantallas)
capturar> salir

pnpm run analizar-arboles

# Commit cuando tengas 10-15 pantallas
git add test/fixtures/arboles/*.xml PASO2-FIXTURES.md
git commit -m "PASO 2: Capturadas 15 pantallas de Wikipedia

- wikipedia-inicio.xml (onboarding)
- home.xml (feed principal)
- busqueda-input.xml (campo de búsqueda)
- busqueda-resultados.xml (resultados)
- articulo-contenido.xml (artículo)
- articulo-expandida.xml (sección expandida)
- guardados.xml (lista guardados)
- historial.xml (historial)
- ajustes.xml (configuración)
- y 6 más

Análisis: 45% resource-ids, uso de content-desc y textos

Status: Ready for PASO 3 (Normalizador)"
```

---

**¿Qué quieres hacer ahora?**

A) Capturar las 10-15 pantallas faltantes (PASO 2)
B) Empezar PASO 3 (Normalizador) con los fixtures que ya tienes
C) Resolver un bloqueante (4.1a, 4.1b)
D) Otra cosa
