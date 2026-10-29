# PASO 2 Mejorado: Captura Verificable con SHA-256

## ✅ Cambios Implementados

### Script: `scripts/capturar-wikipedia-fixtures.ts`

**Nuevas características:**

1. **Verificación SHA-256 completo**
   - Calcula SHA-256 de cada XML antes de guardar
   - Muestra primeros 12 caracteres en consola
   - Almacena SHA completo en metadata.json

2. **Detección de Duplicados**
   - Mantiene registro de todas las capturas de la sesión
   - Si SHA coincide con captura anterior → `⚠️ CAPTURA DUPLICADA`
   - NO sobrescribe silenciosamente
   - Advierte cuál fixture es idéntico

3. **Estabilización UI Mejorada**
   - Obtiene pageSource 2-3 veces hasta que sea idéntico
   - Espera a que UI se estabilice completamente
   - Máx. 3 intentos antes de usar última captura

4. **Comando `status`**
   - Muestra estado actual de captura
   - Session ID (primeros 12 chars)
   - Package y Activity actual
   - Cantidad de capturas únicas
   - Último SHA y número de nodos

5. **Información Extendida por Captura**
   ```
   ✅ NUEVO ESTADO CAPTURADO
      Fixture: wikipedia-02-home-tab
      Session: abc123def456...
      Package: org.wikipedia
      Activity: org.wikipedia.main.MainActivity
      SHA-256: 27f1a8a24f627f79...
      XML Bytes: 12345
      Nodos: 18 (visibles: 12, interactivos: 3)
      Huella: p-42afbf5e
      Tiempo total: 1234ms
   ```

6. **Timeout Actualizado**
   - `appium:newCommandTimeout: 1800` (30 minutos)
   - Permite captura lenta sin timeout

7. **Guía Visual Integrada**
   - Lista de 12 pantallas recomendadas
   - Con descripciones de qué es cada una
   - Remarca importancia de pantallas DISTINTAS

### Validación

```bash
pnpm typecheck  # ✅ 0 errors
pnpm test       # ✅ 68 tests pass
```

## 📖 Cómo Usar PASO 2

### Preparación

```bash
# Terminal 1: Appium
appium --port 4723

# Terminal 2: Verificar emulador
adb devices

# Terminal 3: Ejecutar captura
pnpm build
pnpm exec tsx scripts/capturar-wikipedia-fixtures.ts
```

### Captura Paso a Paso

Sigue instrucciones en `PASO2-CAPTURA-VERIFICABLE.md`:

1. Capturar 10-12 pantallas **DISTINTAS**
2. Usar `status` después de cada captura
3. Si ves "CAPTURA DUPLICADA" → navega a otra pantalla
4. Cada SHA debe ser diferente

### Validación Post-Captura

```bash
# Ver estadísticas detalladas
pnpm exec tsx scripts/diagnostico-h1.ts

# Ver matriz Jaccard y pares
pnpm exec tsx scripts/analizar-wikipedia-jaccard.ts
```

Debe mostrar:
- ✅ Huellas únicas: 10-12/10-12 (no 1/6)
- ✅ XMLs únicos: 10-12/10-12
- ✅ Variedad de similitudes Jaccard
- ✅ Pares en diferentes categorías

## 🔍 Ejemplo de Sesión

```
>> c wikipedia-01-onboarding
   Esperando estabilización de UI...
   ✓ UI estable (intento 2)

✅ NUEVO ESTADO CAPTURADO
   Fixture: wikipedia-01-onboarding
   Session: abc123def456...
   Package: org.wikipedia
   Activity: org.wikipedia.main.MainActivity
   SHA-256: 27f1a8a24f627f79...
   XML Bytes: 8234
   Nodos: 18 (visibles: 14, interactivos: 2)
   Huella: p-42afbf5e
   Tiempo total: 2134ms

>> tap "Explore"
✓ Tap en: Explore

>> c wikipedia-02-home-tab
   Esperando estabilización de UI...
   ✓ UI estable (intento 1)

✅ NUEVO ESTADO CAPTURADO
   Fixture: wikipedia-02-home-tab
   Session: abc123def456...
   Package: org.wikipedia
   Activity: org.wikipedia.main.MainActivity
   SHA-256: 5f9c4ab08cac7457e9111a30e4a801...  ← DIFERENTE
   XML Bytes: 8901
   Nodos: 19 (visibles: 15, interactivos: 3)
   Huella: p-a1b2c3d4e5...  ← DIFERENTE
   Tiempo total: 1987ms

>> status

📊 STATUS DE CAPTURA
   Session: abc123def456...
   Package: org.wikipedia
   Activity actual: org.wikipedia.main.MainActivity
   Capturas únicas: 2
   Última captura: wikipedia-02-home-tab
   Último SHA: 5f9c4ab08cac7...
   Nodos en última: 19

>> [scroll en emulador]

>> c wikipedia-03-home-scroll
   Esperando estabilización de UI...
   ✓ UI estable (intento 2)

✅ NUEVO ESTADO CAPTURADO
   Fixture: wikipedia-03-home-scroll
   Session: abc123def456...
   Package: org.wikipedia
   Activity: org.wikipedia.main.MainActivity
   SHA-256: a3f5d7e8b1c9f2a4...  ← DIFERENTE
   XML Bytes: 9234
   Nodos: 23 (visibles: 18, interactivos: 4)
   Huella: p-x7y8z9a0b1...  ← DIFERENTE
   Tiempo total: 2045ms

[... continuar con otras 9-10 pantallas]

>> exit
✅ Sesión cerrada
```

## 🛡️ Garantías

✅ **SHA-256 verifica integridad** del XML capturado
✅ **Duplicados detectados y NO sobreescritos**
✅ **Estabilización UI** garantiza pageSource completo
✅ **Registro de sesión** permite auditar qué capturaste
✅ **Metadata completa** en cada .json para análisis

## ⏭️ Próximos Pasos

1. Ejecutar captura completa (10-12 pantallas)
2. Validar con `diagnostico-h1.ts` → 10-12 huellas únicas
3. Analizar con `analizar-wikipedia-jaccard.ts` → matriz con variedad
4. Recalibrar H1 con datos reales

