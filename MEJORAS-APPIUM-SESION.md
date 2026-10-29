# Mejoras de Estabilidad de Sesión Appium

## Problema

La sesión Appium se cerraba inmediatamente después de crear, impidiendo capturar getPageSource.

Error: "A session is either terminated or not started when running 'source'"

## Cambios Realizados

### 1. `scripts/capturar-wikipedia-fixtures.ts`

**En `conectar()`:**
- ✅ Agregado `appium:newCommandTimeout: 300` (5 minutos)
- ✅ Agregado `appium:connectHardwareKeyboard: false`
- ✅ Agregada validación post-conexión con `getStatus()`
- ✅ Mejor logging de éxito

**En `capturar()`:**
- ✅ Agregada pausa de 1000ms antes de getPageSource (permitir estabilización)
- ✅ Try-catch con reconexión automática si getPageSource falla
- ✅ Manejo seguro de screenshot (no falla si no se captura)
- ✅ Mejor manejo de errores sin detener el script

### 2. `scripts/test-appium-conexion.ts`

- ✅ Agregado `appium:newCommandTimeout: 300`
- ✅ Agregado `appium:connectHardwareKeyboard: false`
- ✅ Agregada pausa antes de getPageSource
- ✅ Agregada validación con `getStatus()`
- ✅ Mejor logging

## Configuración WebdriverIO Final (Moderna)

```typescript
driver = await remote({
  host: "localhost",
  port: 4723,
  path: "/",
  capabilities: {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "emulator-5554",
    "appium:appPackage": "org.wikipedia",
    "appium:appActivity": "org.wikipedia.main.MainActivity",
    "appium:ensureFreshStart": false,
    "appium:newCommandTimeout": 300,
    "appium:connectHardwareKeyboard": false,
  },
});

// Validar sesión
await driver.pause(1000);
await driver.getStatus();

// Luego: getPageSource
const xml = await driver.getPageSource();
```

## Próximos Intentos

Ejecutar nuevamente:

```bash
pnpm exec tsx scripts/capturar-wikipedia-fixtures.ts
```

Si aún persiste el error de sesión cerrada:
1. Verificar que el emulador está activo: `adb devices`
2. Reiniciar Appium: Ctrl+C y `appium --port 4723` nuevamente
3. Reiniciar emulador si es necesario

