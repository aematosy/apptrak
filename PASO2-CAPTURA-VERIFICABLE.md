# PASO 2 - REDO: Captura Verificable con SHA-256

## 🎯 Objetivo

Capturar 10-12 pantallas Wikipedia **REALMENTE DISTINTAS** y verificables mediante SHA-256.

## ✅ Pre-requisitos

1. **Appium corriendo**:
   ```bash
   appium --port 4723
   ```

2. **Emulador Android activo**:
   ```bash
   adb devices  # Debe mostrar emulator-5554 en estado device
   ```

3. **Wikipedia app instalada**:
   ```bash
   adb shell pm list packages | grep wikipedia
   ```

4. **Compilar scripts**:
   ```bash
   pnpm build
   ```

## 🚀 Iniciar Captura

```bash
pnpm exec tsx scripts/capturar-wikipedia-fixtures.ts
```

## 📋 Pantallas a Capturar (SIN SOBREESCRIBIR ANTERIORES)

Limpia primero (opcional):
```bash
rm -rf test/fixtures/wikipedia/wikipedia-*.{xml,png,json}
```

Luego captura en este ORDEN exacto:

### 1. Onboarding
```
>> c wikipedia-01-onboarding
```
- Debe mostrar: ✅ NUEVO ESTADO CAPTURADO
- SHA debe ser DIFERENTE a cualquier anterior

### 2. Home (Sin scroll)
```
>> tap "Explore"  # o buscar el botón de home
>> c wikipedia-02-home-tab
```
- SHA debe ser DIFERENTE a onboarding

### 3. Home (Con scroll)
```
>> pause 500
>> [scroll down manualmente en el emulador]
>> c wikipedia-03-home-scroll
```
- SHA puede ser similar a wikipedia-02 pero NO igual
- Si ves "CAPTURA DUPLICADA", scrollea más y recaptura

### 4. Search (Vacío)
```
>> tap "Search"
>> c wikipedia-04-search-empty
```
- SHA debe ser diferente

### 5. Search (Con texto)
```
>> write Python
>> c wikipedia-05-search-typed
```
- SHA debe ser diferente

### 6. Resultados de búsqueda
```
>> pause 1000  # esperar a que carguen
>> c wikipedia-06-results
```
- SHA debe ser diferente

### 7. Artículo (Top)
```
>> tap "Python"  # o primer resultado
>> pause 1500
>> c wikipedia-07-article-top
```
- SHA debe ser diferente

### 8. Artículo (Scrolled mid)
```
>> pause 500
>> [scroll down manualmente]
>> c wikipedia-08-article-mid
```
- SHA puede ser similar a wikipedia-07 pero NO igual
- Si ves "CAPTURA DUPLICADA", scrollea MÁS

### 9. Artículo (Bottom)
```
>> [scroll más hacia el final]
>> c wikipedia-09-article-bottom
```
- SHA debe ser diferente de las dos anteriores

### 10. Menú lateral
```
>> back
>> back
>> [buscar botón de menú/hamburger]
>> tap "[Menu button]"
>> c wikipedia-10-menu
```
- SHA debe ser diferente

### 11. Settings
```
>> tap "Settings"
>> c wikipedia-11-settings
```
- SHA debe ser diferente

### 12. Idioma (opcional)
```
>> tap "Language"
>> c wikipedia-12-language
```
- SHA debe ser diferente

## 🔍 Monitoreo Durante Captura

Después de CADA captura, verifica:

```
>> status
```

Debe mostrar:
```
📊 STATUS DE CAPTURA
   Session: [12 chars]...
   Package: org.wikipedia
   Activity actual: [Activity actual]
   Capturas únicas: [N]
   Última captura: [nombre]
   Último SHA: [12 chars]...
   Nodos en última: [N]
```

## ⚠️ Señales de Error

### "CAPTURA DUPLICADA"
```
⚠️  CAPTURA DUPLICADA
   Este pageSource es idéntico al fixture: wikipedia-02-home-tab
   SHA-256: 27f1a8a24f627f...
   NO se guardará (no sobrescribir)
```

**Acción**: Navega a OTRA pantalla realmente distinta y recaptura.

### SHA sin cambios después de scroll
- Scrollea MÁS (puede no haber contenido suficiente)
- O navega a otra pantalla completamente distinta

## ✅ Validar Capturas Post-sesión

```bash
pnpm exec tsx scripts/diagnostico-h1.ts
```

Debe mostrar:
- Huellas únicas: 10-12/10-12 (NO 1/6 como antes)
- XMLs únicos: 10-12/10-12 (todos con SHA256 distintos)
- Comparativas: Pares sin exclusivos A/B = cambios detectados

## 📊 Comando de diagnóstico después

Una vez capturado, ejecuta:

```bash
pnpm exec tsx scripts/analizar-wikipedia-jaccard.ts
```

Debe mostrar:
- Variedad de similitudes (no todas 1.000)
- Pares en diferentes categorías (MISMA_PANTALLA, VARIANTE, PANTALLA_DISTINTA)
- Mejor distribución de Jaccard

## Fin de sesión

```
>> exit
```

Logs se mostrarán en consola.

