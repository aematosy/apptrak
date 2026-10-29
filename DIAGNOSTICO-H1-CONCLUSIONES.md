# Diagnóstico H1: Análisis de Falla Crítica

## 🔴 CONCLUSIÓN PRINCIPAL: **A. FIXTURES REPETIDOS POR ERROR**

### Evidencia Contundente

**XML SHA256 de los 6 fixtures:**
```
wikipedia-01-onboarding: 27f1a8a24f627f79
wikipedia-04-home:       27f1a8a24f627f79  ← IDÉNTICO
wikipedia-05-search:     27f1a8a24f627f79  ← IDÉNTICO
wikipedia-08-results:    27f1a8a24f627f79  ← IDÉNTICO
wikipedia-09-article:    27f1a8a24f627f79  ← IDÉNTICO
wikipedia-11-settings:   27f1a8a24f627f79  ← IDÉNTICO
```

**Conclusión**: Los 6 fixtures contienen EXACTAMENTE EL MISMO XML.
No es problema del algoritmo: **capturamos accidentalmente el mismo pageSource con nombres distintos**.

---

## Análisis Secundario (válido, pero no es el problema)

### B. Pérdida de Multiplicidad (SÍ existe, pero secundario)

**Ejemplo: android.view.View**
```
- Total en nodos: 6 instancias
- Tokens generados: 0 (100% pérdida)
- Razón: Sin idEstable, descripción ni texto
```

**Ejemplo: android.widget.TextView**
```
- Total en nodos: 3 instancias
- Tokens generados: 1 (66.7% pérdida)
- Razón: Set() en generarTokens() pierde multiplicidad
```

**Impacto**: Secundario porque el XML es idéntico.

### C. Ausencia de IDs en Compose (SÍ existe)

**Análisis de disponibilidad de atributos:**
```
idEstable disponible: 3/18 (16.7%) ← CRÍTICO
Descripción disponible: 2/18 (11.1%) ← CRÍTICO
Texto disponible: 3/18 (16.7%) ← MUY BAJO
```

**Nodos sin id/desc/texto**: 10/18 (55.6%) ← Deben generar tokens solo por clase

**Impacto**: Crítico, pero el XML es idéntico así que no afecta comparación.

### D. Colapso de Listas (NO aplica aquí)

**Listas detectadas**: 0 por fixture
**Tokens colapsados [LISTA]**: 0

**Conclusión**: No hay colapso de listas en estos fixtures.

---

## Problema Real Subyacente

Aunque los fixtures capturados son iguales, el análisis SIGUE REVELANDO el VERDADERO PROBLEMA de H1:

### ⚠️ Tokens Generados (idéntico para todos):

```
1.  Button|
2.  ComposeView|
3.  FrameLayout|
4.  ImageView|
5.  LinearLayout|
6.  RelativeLayout|
7.  TextView| (solo 1 token de 3 TextView)
8.  View|
9-16. (4 tokens adicionales)
```

**Problema**: 
- 6 `android.view.View` → 0 tokens (100% descartadas)
- 4 `FrameLayout` → 0 tokens (100% descartadas)  
- 3 `TextView` → 1 token (multiplicidad perdida)

**Causa raíz**: Los nodos sin `idEstable`, `descripcion` ni `texto` generan tokens solo por clase.
Cuando todos los nodos tienen IGUAL estructura (mismos tipos de clase), todos generan MISMO conjunto de tokens.

---

## Recomendaciones (DATOS BASADOS)

### Inmediato (PASO 2 Redo)

1. **Recapturar realmente 10-15 pantallas DIFERENTES**
   - Verificar que cada captura tiene XML SHA256 DISTINTO
   - Navegar a pantallas verdaderamente diferentes
   - Incluir: onboarding, search, results, article, settings, menú, lista, etc.

### Mediano Plazo (Antes de E1)

Aunque los fixtures eran iguales, el diagnóstico revela que la representación actual SIGUE siendo débil:

**Problema de raíz**: Sin ids/descriptions en Compose, casi todo genera tokens solo por clase.

**3 Alternativas para H1:**

#### **Alternativa 1: Incluir Multiplicidad en Tokens** (Recomendado)
- **Cambio**: En `generarTokens()`, mantener contador de clases
- **Ejemplo**: `TextView|3` (3 instancias) en lugar de `TextView|` (1 token)
- **Impacto**: 
  - ✅ Distingue pantallas con diferente cantidad de TextView
  - ✅ Preserva información estructural
  - ❌ Pueden seguir siendo muy similares si usan mismas clases
- **Trade-off**: Menor complejidad, pero puede insuficiente si arquitectura es parecida

#### **Alternativa 2: Incluir Jerarquía/Profundidad** 
- **Cambio**: Tokens incluyen profundidad o relación padre
- **Ejemplo**: `android.view.View@depth=2|` 
- **Impacto**:
  - ✅ Distingue layouts profundos vs planos
  - ✅ Captura estructura jerárquica
  - ❌ Requiere refactor significativo
- **Trade-off**: Más información, pero complejidad aumenta

#### **Alternativa 3: Fallback a Texto + Posición** (Más Pragmático)
- **Cambio**: Si sin id/desc/texto, usar texto de hijos o clase+posición
- **Ejemplo**: Para nodos sin atributos, buscar texto en descendientes cercanos
- **Impacto**:
  - ✅ Captura contenido visible (lo que usuario ve)
  - ✅ Mejor discriminación que solo clase
  - ❌ Requiere análisis de árbol más profundo
- **Trade-off**: Mejor discriminación, pero lógica más compleja

---

## Acción Inmediata: RECAPTURAR

El problema no es el algoritmo: **capturamos el mismo XML 6 veces**.

Necesitas:
1. Verificar que estás navegando a pantallas distintas
2. Usar `pnpm exec tsx scripts/diagnostico-h1.ts` después de cada captura
3. Confirmar que SHA256 son distintos antes de continuar

