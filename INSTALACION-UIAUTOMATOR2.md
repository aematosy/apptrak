# Instalación del Driver UiAutomator2 para Appium

El error indica que Appium no tiene el driver UiAutomator2 instalado.

## Solución

Ejecuta en terminal:

```bash
appium driver install uiautomator2
```

Esto descargará e instalará el driver UiAutomator2 para Android.

## Verificar instalación

Después de instalar, verifica que está disponible:

```bash
appium driver list --installed
```

Deberás ver algo como:

```
✔ uiautomator2@2.x.x
```

## Luego

Una vez instalado, vuelve a ejecutar:

```bash
pnpm exec tsx scripts/capturar-wikipedia-fixtures.ts
```

## Alternativa: Si Appium sigue sin encontrarlo

Reinicia Appium después de instalar el driver:

```bash
# En otra terminal:
appium --port 4723
```

Luego vuelve a ejecutar el script de captura.

