# dx-micro-fd-ng (Microfrontends con Angular)

Arquitectura de Plugins Dinámicos basada en Native Federation, permitiendo un Shell estático que carga módulos remotos en tiempo de ejecución sin recompilar.
🛠️ Estructura del Proyecto

    Shell: Aplicación principal (Host). Gestiona el menú y la carga de plugins.
    Plugins: Aplicaciones independientes (Remotes) que exponen componentes o rutas.
    common: Librería compartida (Singleton) para Seguridad (Auth) y Menú.

🚀 Comandos de Inicialización
bash

# 1. Crear Workspace y Apps

```bash
npx @angular/cli new dx-micro-fd-ng --no-create-application
npx ng generate application shell --routing
npx ng generate application plugin-demo --routing
npx ng generate library common
```

# 2. Configurar Native Federation (Runtime)

```bash
npm install @angular-architects/native-federation -D
npx ng g @angular-architects/native-federation:init --project shell --port 4200 --type dynamic-host
npx ng g @angular-architects/native-federation:init --project plugin-demo --port 4201 --type remote
```

Usa el código con precaución.
⚙️ Configuración Crítica

1. El Manifiesto (Shell)
   Ubicado en `projects/shell/src/public/federation.manifest.json:`

```json
{
  "plugin-demo": "http://localhost:4201/remoteEntry.json"
}
```

2. Exposición (Plugin)
   En projects/plugin-demo/federation.config.js:

```js
exposes: {
'./AppComponent': './projects/plugin-demo/src/app/app.component.ts',
'./App': './projects/plugin-demo/src/app/app.ts',
},
```

3. Carga Dinámica (Shell)
   En projects/shell/src/app/app.routes.ts:

```ts
{
    path: 'app',
    loadComponent: () => loadRemoteModule('plugin-demo', './App').then((m) => m.App),
},
```

📦 Build y Despliegue (Unificado)
Para servir todo desde un único servidor sin problemas de CORS:

```bash
npx ng build common
npx ng build plugin-demo
npx ng build shell
```

Unificar:
Copiar contenido para servir todo junto

```bash
cp -r dist/plugin-demo/browser/* dist/shell/browser/plugins/plugin-demo/
```

Actualizar el `federation.manifest.json` en dist con la ruta relativa: `"plugin-demo": "/plugins/plugin-demo/remoteEntry.json"`.

Servir el sitio productivo:

```bash
npx http-server dist/shell/browser -p 4200

```
