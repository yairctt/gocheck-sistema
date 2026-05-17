# GoCheck Frontend — Guía de Desarrollo

Este documento resume las reglas del proyecto, el stack tecnológico y las convenciones para mantener la consistencia en el desarrollo del frontend de GoCheck.

## Comandos de Ejecución
Como es un proyecto de archivos estáticos (HTML/JS), puedes usar cualquier servidor local:

- **Node.js**: `npx http-server . -p 8080 --cors`
- **Python**: `python -m http.server 8080`
- **Visual Studio Code**: Extensión "Live Server".

## Stack Tecnológico
- **Core**: HTML5, Vanilla JavaScript (ES6+).
- **Estilos**: Bootstrap 5.3.3 (offline) + CSS Personalizado (Industrial Dark Theme).
- **Iconos**: FontAwesome 6.5.2 (offline).
- **Librerías Externas (CDN)**: QRCode.js, html5-qrcode.

## Estructura de Archivos
- `/assets/js/api.js`: Capa de comunicación centralizada con el backend.
- `/assets/js/main.js`: Inicialización global, carga de componentes (sidebar/navbar) y config.
- `/assets/js/utils.js`: Helpers comunes (formateo de fechas, badges, toasts, auth guard).
- `/components/`: Fragmentos HTML reutilizables (sidebar.html, navbar.html).
- `/pages/`: Páginas principales del sistema.

## Reglas de Desarrollo

### 1. Comunicación con la API
- **NUNCA** uses `fetch()` directamente en las páginas.
- Todas las peticiones deben pasar por el objeto global `API` definido en `api.js`.
- Ejemplo: `const res = await API.Empleados.list();`

### 2. Lógica de Página
- Cada página debe definir un objeto global `Page` con un método `init()`.
- `main.js` ejecutará `Page.init()` automáticamente al cargar el DOM.
```javascript
const Page = {
  init: async () => {
    await Page.loadData();
    Page.bindEvents();
  },
  loadData: async () => { ... },
  bindEvents: () => { ... }
};
```

### 3. Componentes Reutilizables
- Los componentes comunes (Sidebar, Navbar, Footer) se cargan dinámicamente.
- Asegúrate de tener los placeholders correspondientes en el HTML:
  `<div id="sidebar-placeholder"></div>`

### 4. Estilos y UI
- Prioriza el uso de las variables CSS definidas en `styles.css` (e.g., `var(--accent-primary)`).
- Usa los badges de `Utils` para mantener la consistencia visual:
  - `Utils.incidenciaBadge(status)`
  - `Utils.activoBadge(boolean)`
- Para notificaciones, usa `Utils.toast('Mensaje', 'success|error|info')`.

### 5. Autenticación
- El token se almacena en `localStorage` como `auth_token`.
- En páginas protegidas, `main.js` llama a `Utils.requireAuth()`.
- Si necesitas verificar el rol, usa el objeto `auth_user` en `localStorage`.

### 6. Convenciones de Nomenclatura
- **Archivos**: `nombre-pagina.html`, `scripts.js` (kebab-case).
- **Variables/Funciones JS**: `camelCase`.
- **IDs/Clases HTML**: `id-unico`, `clase-estilo` (kebab-case).
- **Datos de API**: Generalmente `snake_case` (para coincidir con la DB del backend).

## Flujo de Trabajo Sugerido
1. Crea el archivo HTML en `/pages/`.
2. Añade los placeholders de componentes y los scripts necesarios (`api.js`, `utils.js`, `main.js`).
3. Define la lógica de la página en un bloque `<script>` o un archivo JS separado usando el patrón `Page`.
4. Si la API no existe aún, añade el endpoint en `api.js` y usa datos mock temporalmente.
