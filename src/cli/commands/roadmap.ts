/**
 * OPCIÓN 8: Ayuda / Roadmap
 * Muestra información del proyecto y estado de desarrollo
 */

export async function cmdRoadmap() {
  console.log(`
╔═════════════════════════════════════════════════════════════════╗
║                      APPTRAK - ROADMAP                         ║
║        Mobile App Exploration Toolkit - E0 Prototipo      ║
╚═════════════════════════════════════════════════════════════════╝

📍 ESTADO ACTUAL

  E0: EN PROGRESO (prototipo)
  ├─ PASO 0: Arquitectura base        ✅ Completado
  ├─ PASO 1: Parser & Normalizador    ✅ Completado
  ├─ PASO 2: Captura REDO             🟡 En progreso
  ├─ PASO 3: Diferenciación           🟡 En progreso
  ├─ PASO 4: Calibración H1           🟡 En progreso
  ├─ PASO 5: Mediación                🔴 No iniciado
  ├─ PASO 6: Generación de Catálogo   🔴 No iniciado
  └─ PASO 7: Motor Appium completo    🔴 No iniciado

  E1: Plataforma productiva            🔴 No iniciado
  E2+: Extensiones futuras             🔴 No iniciado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 HIPÓTESIS CRÍTICAS

  H1: Algoritmo Jaccard + tokenización discriminan estados
      Estado: 🟡 Pendiente de calibración con datos reales
      Próximo: Capturar 10-12 pantallas Wikipedia distintas
      
  H2: Motor Appium puede explorar automáticamente
      Estado: 🔴 Pendiente de medición real
      Próximo: Implementar PASO 7 después de H1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRÓXIMOS PASOS INMEDIATOS

  1. PASO 2 REDO: Capturar dataset verificable
     → Comando: Opción 2 en el menú principal
     → Objetivo: 12 pantallas Wikipedia con SHA distintos
     → Tiempo estimado: 30-45 minutos
     
  2. PASO 4: Calibración H1
     → Comando: Opciones 4-5 en el menú principal
     → Analizar: Matriz Jaccard, huellas, variantes
     → Decidir: ¿Ajustar threshold? ¿Mejorar tokenización?
     
  3. PASO 7: Motor Appium real (si H1 valida)
     → Implementar: Sesión persistente, bucle exploratorio, retroceso
     → NO implementar aún: Esperar validación de H1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUÉ NO ESTÁ EN SCOPE E0

  ❌ E1 (Plataforma con almacenamiento, autenticación, API)
  ❌ Mediación avanzada (PASO 5)
  ❌ Generación de catálogos completos (PASO 6)
  ❌ UI web / Dashboard
  ❌ Reportes automáticos
  ❌ Integración CI/CD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ESTRUCTURA DE LA CLI

  1️⃣  Verificar entorno      → Chequea Node, pnpm, adb, Appium, Wikipedia
  
  2️⃣  PASO 2 - Capturar      → Orquesta captura interactiva de fixtures
  
  3️⃣  Ver estado             → Diagnostica integridad del dataset sin Appium
  
  4️⃣  PASO 4 - Diagnóstico   → Analiza tokenización y huellas
  
  5️⃣  PASO 4 - Jaccard       → Calcula matriz de similitud
  
  6️⃣  Validación técnica     → Ejecuta tests, typecheck, build, lint
  
  7️⃣  Estado Git            → Muestra cambios sin hacer commit/push
  
  8️⃣  Ayuda / Roadmap        → Esta pantalla

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 TECNOLOGÍA

  Lenguaje:     TypeScript
  Test:         Vitest
  Build:        tsup
  Lint:         Biome
  Mobile:       Appium + UiAutomator2
  App piloto:   Wikipedia Android

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ PREGUNTAS FRECUENTES

  P: ¿Debo hacer commit de mis cambios?
  R: No. La CLI es solo orquestación. Usa git directamente cuando esté listo.
  
  P: ¿Se va a cambiar el threshold 0.85?
  R: Solo si H1 lo justifica. Primero necesitamos datos reales.
  
  P: ¿Cuándo puedo usar PASO 7?
  R: Después de que H1 sea concluyente (H1 calibrado ✅).
  
  P: ¿Qué es E1?
  R: La plataforma productiva. E0 es solo prototipo de hipótesis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para más información, revisa:
  • README.md (proyecto)
  • PASO2-CAPTURA-VERIFICABLE.md (captura de fixtures)
  • Código en src/

`);
}
