# GoCheck — Reglas Globales del Proyecto

Este repositorio contiene el ecosistema **GoCheck**, un sistema de control de asistencia para abarrotes. Se divide en dos sub-proyectos principales:

- `checador-frontend`: Aplicación cliente (HTML, Vanilla JS, Bootstrap).
- `checador-backend`: API REST (Node.js, Express, MySQL).

## Cómo actuar (Guías para la IA)

### 1. Idioma y Tono
- **Idioma**: Toda la documentación, comentarios de código y mensajes de la interfaz deben estar en **Español**.
- **Tono**: Profesional, técnico y conciso.

### 2. Consistencia Tecnológica
- **Frontend**: Mantener el uso de Vanilla JavaScript (ES6+). No introducir frameworks como React o Vue a menos que se solicite explícitamente. Respetar el tema "Industrial Dark".
- **Backend**: Respetar la arquitectura de Servicios/Controladores y el manejo de base de datos Master-Replica.
- **Comunicación**: Siempre usar el objeto global `API` en el frontend para comunicarse con el backend.

### 3. Seguridad y Buenas Prácticas
- **Secrets**: NUNCA hardcodear credenciales o tokens. Usar variables de entorno (`.env`).
- **Validación**: Siempre validar los datos tanto en el frontend (UI) como en el backend (Controller/Service).
- **Auditoría**: Registrar acciones críticas en la bitácora del sistema.
- **Performance**: Usar `queryReplica` para consultas de lectura pesadas o reportes.

### 4. Estructura de Trabajo
- Antes de realizar cambios, analiza los `CLAUDE.md` específicos de cada carpeta:
  - [Reglas Frontend](./checador-frontend/CLAUDE.md)
  - [Reglas Backend](./checador-backend/CLAUDE.md)
- Mantén la trazabilidad: si cambias un endpoint en el backend, actualiza `api.js` en el frontend.

### 5. Estilo de Código
- **Indetación**: 2 espacios.
- **Strings**: Comillas simples (`'`) en JavaScript, dobles (`"`) en JSON/HTML.
- **Nomenclatura**:
  - JavaScript: `camelCase`.
  - Base de Datos / API: `snake_case`.
  - Archivos: `kebab-case`.

## Comandos Principales
| Proyecto | Comando de Desarrollo | Puerto |
|----------|-----------------------|--------|
| Frontend | `npx http-server .`   | 8080   |
| Backend  | `npm run dev`         | 3000   |
