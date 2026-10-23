# PLAN DE IMPLEMENTACION APPTRAK (E0-E3)

## PASO 1: Entorno Appium (SDD 5.1, 13)

**Objetivo**: Sesión abierta contra emulador + getPageSource guardado

**Tareas**:
1. Verificar servidor Appium en `http://localhost:4723`
2. Emulador Pixel_4_API_34 con Android 14 disponible
3. Wikipedia instalada (`org.wikipedia`)
4. Conectar sesión WebDriver con capabilities mínimas
5. Capturar pageSource inicial → `test/fixtures/arboles/wikipedia-inicio.xml`

**Artifacts**: 
- Sesión activa
- 1 XML de página inicial

**Referencias SDD**:
- SDD 5.1: Capabilities mínimas (platformName, appium:automationName, etc.)
- SDD 13: Verificación de entorno

---

## PASO 2: Fixtures reales (10-20 pantallas)

**Objetivo**: Capturar XML de diferentes pantallas + variantes de Wikipedia

**Tareas**:
1. Navegar Wikipedia manualmente (15-20 min)
2. Por cada pantalla nueva: capturar XML con Appium Inspector
3. Incluir variantes: dialogo, teclado, lista corta, lista larga
4. Guardar en `test/fixtures/arboles/*.xml`
5. Etiquetarlas a mano (pares: misma pantalla / pantalla distinta)

**Pantallas esperadas** (~10):
- Inicio (Feed/Explore)
- Guardados
- Búsqueda
- Resultados búsqueda
- Artículo
- Historial
- Configuración
- Selector de idioma
- Onboarding/Welcome
- Acerca de

**Artifacts**:
- `test/fixtures/arboles/` (~15-20 XML)
- `test/fixtures/arboles/pares.json` (opcional, etiquetas)

**Referencias SDD**:
- SDD 6.2: Contexto esperado por elemento

---

## PASO 3: Normalizador (SDD 6.2)

**Objetivo**: Función pura que convierte page source (Android XML) a nodo normalizado

**Tareas**:
1. Parser XML → árbol DOM
2. Por cada elemento: extraer campos norma (ver SDD 6.2)
3. Calcular contexto: ancestros (max 3), descendientes (max 8)
4. Excluir barras del sistema (`com.android.systemui`)
5. Tests con fixtures (sin dispositivo)

**Modelo del nodo normalizado**:
```typescript
interface NodoNormalizado {
  indice: number;
  padre: number | null;
  clase: string;
  idEstable: string | null;    // resource-id
  descripcion: string | null;   // content-desc
  texto: string | null;
  bounds: { x1: number; y1: number; x2: number; y2: number };
  habilitado: boolean;
  visible: boolean;
  clickable: boolean;
  scrollable: boolean;
  enfocado: boolean;
  esCampoTexto: boolean;
  sensible: boolean;            // password=true
  paquete: string | null;       // Android only
  // Contexto
  ancestros: number[];
  descendientes: number[];
  etiquetaCercana: string | null;
}
```

**Artifacts**:
- `src/normalizador/types.ts` – tipos
- `src/normalizador/parser.ts` – parser XML
- `test/normalizador.test.ts` – tests con fixtures

**Referencias SDD**:
- SDD 6.2: Modelo de nodo normalizado + contexto
- SDD 6.5: Pantallas largas (desplazamiento, truncado)

---

## PASO 4: Huella y variantes (SDD 6.3, 17.1)

**Objetivo**: Calcular identidad de pantalla con similitud Jaccard

**Tareas**:
1. Generar tokens: `clase | idEstable` (o `clase | descripcion` si no hay id)
2. Colapsar listas: grupos de hermanos con misma estructura → token único
3. Calcular huella: hash de tokens (excluir texto y bounds)
4. Similitud Jaccard: comparar dos huellas
5. Detectar variante: Jaccard >= 0.85 pero hay nodos nuevos → marcar como variante
6. Calibrar umbral 0.85 con pares etiquetados

**Decisión pendiente** (4.1):
- ¿Detectar overlays (diálogos) por ventana/paquete/clase + Jaccard?
- ¿Usar contención (A ⊂ B) además de Jaccard?

**Artifacts**:
- `src/huella/tipos.ts`
- `src/huella/tokens.ts` – generación de tokens
- `src/huella/jaccard.ts` – similitud
- `src/huella/variantes.ts` – detección
- `test/huella.test.ts`

**Referencias SDD**:
- SDD 6.3: Tokens, Jaccard, umbral, variantes
- SDD 17.1: Algoritmo de colapso de listas (BLOQUEANTE 4.1)

---

## PASO 5: Calidad de locators (SDD 10.3)

**Objetivo**: Asignar mejor locator + calidad a cada elemento

**Tareas**:
1. Por elemento: generar candidatos de locators (id, xpath, accessibility ID, etc.)
2. Verificar unicidad en la pantalla
3. Asignar calidad: `estable`, `media`, `ancla`, `frágil`
4. Orden de preferencia: estable > media > ancla > frágil
5. Almacenar alternativas

**Estrategias por orden** (SDD 10.3):
1. resource-id exacto (estable)
2. Accesibilidad ID (estable)
3. XPath con estructura (media)
4. Descripción (ancla)
5. Clase + índice (frágil)

**Artifacts**:
- `src/calidad/tipos.ts`
- `src/calidad/locator.ts` – generación
- `src/calidad/unicidad.ts` – verificación
- `test/calidad.test.ts`

**Referencias SDD**:
- SDD 10.3: Estrategias, verificación, criterios de calidad y consistencia

---

## PASO 6: Frontera y política (SDD 6.4, 8, 17)

**Objetivo**: Calcular acciones candidatas por pantalla

**Tareas**:
1. Orden de prueba: campos (tocar, escribir), navegación principal, ids estables, resto
2. Excluir por continuidad: botones de "cerrar sesión", "eliminar cuenta", etc.
3. Topes: max N elementos por pantalla, profundidad máxima
4. Tratamiento de listas: scrollear y explorar nuevos elementos
5. Generar frontera: lista ordenada de elementos a probar

**Artifacts**:
- `src/frontera/tipos.ts`
- `src/frontera/orden.ts` – orden de prueba
- `src/politica/continuidad.ts` – exclusiones
- `src/politica/perimetro.ts` – límites
- `test/frontera.test.ts`

**Referencias SDD**:
- SDD 6.4: Frontera, orden de prueba, topes, listas
- SDD 8: Exclusiones por continuidad
- SDD 17: Lista base de exclusiones (español + inglés)

---

## PASO 7: Motor E0 minimo (SDD 6.1, 6.6-8)

**Objetivo**: Bucle de exploración sin IA, volcando JSON

**Tareas**:
1. Leer árbol de UI (pageSource)
2. Normalizar
3. Calcular huella
4. Pantalla conocida? Registrar o fusionar
5. Generar frontera
6. Ejecutar acción (tap, write, back)
7. Esperar estabilidad (SDD 6.6)
8. Clasificar resultado (nueva, conocida, variante, sin cambio, salió-app, bloqueada, error)
9. Registrar transición
10. Volver a leer

**Decisión pendiente** (4.2):
- Al agotar `esperaMaxSegundos`: tomar última lectura y marcar pantalla como inestable

**Outputs intermedios**:
- `progreso.json` – avance en %
- `estado.json` – checkpoint cada N acciones

**Artifacts**:
- `src/motor/bucle.ts` – loop principal
- `src/motor/retroceso.ts` – back key + recuperación
- `src/motor/espera.ts` – estabilidad
- `src/motor/resultado.ts` – clasificación
- `src/almacen/checkpoint.ts` – estado.json
- `test/motor.test.ts`

**MEDICIONES CRÍTICAS (validan H1 y H2)**:
- Tiempo promedio por acción (objetivo: < 5 seg)
- Pantallas encontradas vs referencia (objetivo: >= 80%)
- Repetibilidad entre corridas (objetivo: >= 90%)
- Calidad de huella (objetivo: 0 fusiones incorrectas)

**Referencias SDD**:
- SDD 6.1: Bucle principal
- SDD 6.6: Espera y estabilidad (BLOQUEANTE 4.2)
- SDD 6.7: Clasificación de resultados
- SDD 6.8: Retroceso y recuperación
- SDD 9: Indicadores de avance

---

## PASO 8: Catálogo + checkpoint = E1 (SDD 10.1, 10.4, 6.9)

**Objetivo**: Almacenar catálogo versionado con reanudación

**Tareas**:
1. Modelo de catálogo: pantallas, elementos, transiciones, textos
2. Estructura de carpetas por corrida
3. Evolución del contrato (campos opcionales únicamente)
4. Checkpoint: guardar frontera pendiente cada N acciones
5. Reanudación: cargar checkpoint y continuar

**Artifacts**:
- `src/almacen/tipos.ts` – modelo completo
- `src/almacen/catalogo.ts` – persistencia
- `src/almacen/checkpoint.ts` – estado.json
- `test/almacen.test.ts`

**Outputs**:
- `exploraciones/{id}/catalogo.json`
- `exploraciones/{id}/estado.json` (checkpoint)

**Referencias SDD**:
- SDD 10.1: Modelo de datos (catálogo, pantalla, elemento, transición)
- SDD 10.4: Estructura de carpetas y evolución del contrato
- SDD 6.9: Checkpoint y reanudación

---

## PASO 9: Entradas + avance = E2 (SDD 5.2-5.3, 9)

**Objetivo**: Cargar `exploracion.json` + `datos.json` + mostrar progreso

**Tareas**:
1. Cargar y validar `exploracion.json` con zod
2. Resolver secretos (${ENV:VAR})
3. Ejecutar precondición (ya-iniciada, pasos, comando)
4. Entradas de datos (búsqueda por id+pantalla > id > etiqueta+pantalla > etiqueta > porTipo)
5. Mostrar avance en consola y en `progreso.json`
6. Etiquetas de estado (inicializando, explorando, terminado, etc.)

**Artifacts**:
- `src/datos/loader.ts` – cargar datos.json
- `src/datos/resolver.ts` – buscar campos
- `src/config/precondicion.ts` – ejecutar precondición
- `src/almacen/progreso.ts` – indicadores
- `test/datos.test.ts`

**Referencias SDD**:
- SDD 5.2: Formato v1 datos.json (orden de búsqueda, normalización, validación)
- SDD 5.3: Pasos de precondición (tocar, escribir, esperar)
- SDD 9: Indicadores de avance, formato progreso.json, etiquetas de estado

---

## PASO 10: Informes + consulta = E3 (SDD 10.4, 11.1, 11.5)

**Objetivo**: Reportes (Markdown, Mermaid) + CLI de consulta

**Tareas**:
1. Generar `catalogo.md` (legible, para QA manual)
2. Generar `grafo.mmd` (Mermaid, navegación)
3. Generar `informe.md` (cobertura, campos sin dato, pantallas inestables)
4. Subcomandos de `consultar`: pantallas, pantalla, buscar, sin-id, textos, camino
5. Comparar dos catálogos (equivalencia de pantallas, emparejamiento de elementos)

**Artifacts**:
- `src/informe/catalogo.ts` – Markdown
- `src/informe/grafo.ts` – Mermaid
- `src/informe/generador.ts` – informe.md
- `src/comparador/equivalencia.ts` – pantallas equivalentes
- `src/comparador/emparejamiento.ts` – elementos equivalentes
- CLI: `consultar <catalogo> [pantallas|pantalla|buscar|sin-id|textos|camino]`

**Outputs**:
- `exploraciones/{id}/catalogo.md`
- `exploraciones/{id}/grafo.mmd`
- `exploraciones/{id}/informe.md`

**Referencias SDD**:
- SDD 10.4: Estructura de carpetas y outputs
- SDD 11.1: Subcomandos de consultar y tipos de coincidencia
- SDD 11.5: Comparación de versiones y equivalencia

---

## Diagrama de dependencias

```
PASO 3 (Normalizador)
    ↓
PASO 4 (Huella)
    ↓
PASO 5 (Calidad)
    ↓
PASO 6 (Frontera)
    ├─ PASO 7 (Motor E0)
    │   ├─ PASO 8 (Catálogo E1)
    │   ├─ PASO 9 (Entradas E2)
    │   └─ PASO 10 (Informes E3)
    └─ PASO 1 (Appium setup) [paralelo inicial]
```

---

## Bloqueantes por PASO

| PASO | Bloqueante | Decisión |
|------|-----------|----------|
| 4 | Algoritmo colapso listas (4.1) | TBD |
| 4 | Detección variante vs pantalla nueva (4.1) | TBD |
| 7 | Pantallas que no se estabilizan (4.2) | Tomar última, marcar inestable |
| 3 | Tipo de campo `porTipo` (4.3) | Validar en E0 |

---

**Próximo**: ¿Empiezo con PASO 1 (verificar Appium) o prefieres resolver bloqueantes primero?
