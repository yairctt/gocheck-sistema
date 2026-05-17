# GoCheck — Frontend de Control de Asistencia
### Sistema para Tienda de Abarrotes · v2.1

---

## Estructura del proyecto

```
checador-frontend/
├── index.html                  → Redirección al login
├── login.html                  → Autenticación
│
├── pages/
│   ├── dashboard.html          → Panel principal con KPIs y últimas checadas
│   ├── empleados.html          → CRUD de empleados + horario semanal + QR
│   ├── turnos.html             → Administración de turnos laborales
│   ├── asistencias.html        → Monitor de movimientos (v_movimientos_hoy)
│   ├── reportes.html           → Resumen diario + exportar CSV (v_resumen_diario)
│   ├── solicitudes.html        → Gestión de permisos / vacaciones / incapacidades
│   ├── usuarios.html           → Administración de usuarios y roles
│   ├── bitacora.html           → Auditoría del sistema (bitacora_accesos)
│   └── checador.html           → Terminal de checador (QR / PIN / Huella)
│
├── assets/
│   ├── css/styles.css          → Estilos globales (tema oscuro industrial)
│   └── js/
│       ├── api.js              → Capa de comunicación con la API REST
│       ├── utils.js            → Helpers: formateo, badges, toast, CSV export
│       └── main.js             → Inicialización global, carga de componentes
│
├── components/
│   ├── sidebar.html            → Menú lateral reutilizable
│   ├── navbar.html             → Barra superior con reloj y breadcrumb
│   └── footer.html             → Pie de página
│
└── vendor/
    ├── bootstrap/              → Bootstrap 5.3.3 (offline)
    └── fontawesome/            → FontAwesome 6.5.2 (offline)
```

---

## Configuración de la API

Edita la variable `apiBase` en `assets/js/main.js`:

```javascript
window.APP_CONFIG = {
  apiBase: '/api',          // → Cambia por la URL real de tu backend
  appName: 'GoCheck',
  store:   'Abarrotes La Central',
};
```

O directamente en cada página, antes de cargar los scripts:

```html
<script>
  window.APP_CONFIG = { apiBase: 'http://localhost:3000/api' };
</script>
```

---

## Endpoints esperados por el frontend

| Módulo        | Método | Ruta                              | Descripción                       |
|---------------|--------|-----------------------------------|-----------------------------------|
| Auth          | POST   | `/api/login`                      | Login → devuelve `{ token, user }` |
| Auth          | GET    | `/api/me`                         | Usuario actual                    |
| Dashboard     | GET    | `/api/dashboard/kpis`             | Indicadores del día               |
| Dashboard     | GET    | `/api/dashboard/movimientos-hoy`  | Vista `v_movimientos_hoy`         |
| Empleados     | GET    | `/api/empleados`                  | Listar (con filtros y paginación) |
| Empleados     | POST   | `/api/empleados`                  | Crear empleado                    |
| Empleados     | PUT    | `/api/empleados/:id`              | Editar empleado                   |
| Empleados     | PATCH  | `/api/empleados/:id/estado`       | Activar / desactivar              |
| Empleados     | GET    | `/api/empleados/:id/qr`           | Obtener `qr_token`                |
| Empleados     | GET    | `/api/empleados/:id/horario`      | Horario semanal (`dias_laborales`)|
| Empleados     | PUT    | `/api/empleados/:id/horario`      | Guardar horario semanal           |
| Turnos        | GET    | `/api/turnos`                     | Listar turnos                     |
| Turnos        | POST   | `/api/turnos`                     | Crear turno                       |
| Turnos        | PUT    | `/api/turnos/:id`                 | Editar turno                      |
| Asistencias   | GET    | `/api/asistencias`                | Movimientos filtrados             |
| Reportes      | GET    | `/api/reportes/resumen`           | Vista `v_resumen_diario`          |
| Solicitudes   | GET    | `/api/solicitudes`                | Listar solicitudes                |
| Solicitudes   | PATCH  | `/api/solicitudes/:id/aprobar`    | Aprobar solicitud                 |
| Solicitudes   | PATCH  | `/api/solicitudes/:id/rechazar`   | Rechazar solicitud                |
| Usuarios      | GET    | `/api/usuarios`                   | Listar usuarios                   |
| Usuarios      | POST   | `/api/usuarios`                   | Crear usuario                     |
| Usuarios      | PUT    | `/api/usuarios/:id`               | Editar usuario                    |
| Bitácora      | GET    | `/api/bitacora`                   | Listar registros de auditoría     |
| Checador      | POST   | `/api/checador/identificar`       | Identificar empleado              |
| Checador      | POST   | `/api/checador/registrar`         | Ejecutar `sp_registrar_checada`   |
| Catálogos     | GET    | `/api/departamentos`              | Catálogo de departamentos         |
| Catálogos     | GET    | `/api/puestos`                    | Catálogo de puestos               |

---

## Autenticación

El frontend usa **JWT Bearer token**:

1. El usuario hace login → el backend devuelve `{ token, user }`.
2. El token se guarda en `localStorage('auth_token')`.
3. Todas las peticiones incluyen: `Authorization: Bearer <token>`.
4. Si el backend responde `401`, se redirige automáticamente al login.

---

## Terminal Checador (`checador.html`)

Diseñada para operar en modo kiosco (pantalla táctil o monitor de tienda).

### Métodos de identificación:
- **QR** — Usa la cámara del dispositivo con `html5-qrcode` (CDN).
- **PIN** — Ingreso manual del número de empleado.
- **Huella** — Simulada (preparada para integrar SDK real).

### Flujo:
```
Identificar empleado → Mostrar nombre y puesto → Seleccionar movimiento
→ POST /api/checador/registrar → Confirmación visual → Reset en 5 seg
```

El backend ejecuta el stored procedure `sp_registrar_checada` con:
```json
{
  "qr_token":        "TOKEN_DEL_EMPLEADO",
  "tipo_movimiento": "ENTRADA | SALIDA | SALIDA_COMIDA | REGRESO_COMIDA",
  "dispositivo":     "Terminal-hostname",
  "metodo_registro": "qr | pin | huella"
}
```

---

## Dependencias (todas locales / sin internet)

| Librería         | Versión | Ruta                           |
|-----------------|---------|--------------------------------|
| Bootstrap CSS+JS | 5.3.3   | `/vendor/bootstrap/`           |
| FontAwesome Free | 6.5.2   | `/vendor/fontawesome/`         |

### Dependencias CDN (cargadas en páginas específicas):

| Librería        | Uso                        |
|----------------|----------------------------|
| QRCode.js       | Generación de QR           |
| html5-qrcode    | Lectura de QR por cámara   |

---

## Despliegue con servidor local

### Node.js (http-server):
```bash
npx http-server checador-frontend -p 8080 --cors
```

### Python:
```bash
cd GoCheck-frontend && python -m http.server 8080


### Apache / Nginx:
Apuntar el `DocumentRoot` / `root` a la carpeta `checador-frontend/`.

---

## Roles del sistema

| Rol         | Descripción                                      |
|-------------|--------------------------------------------------|
| superadmin  | Acceso total, administración de usuarios         |
| admin       | Gestión de empleados, solicitudes y reportes     |
| supervisor  | Consulta y validación de asistencias             |
| consulta    | Solo lectura de reportes                         |

---

## Notas de desarrollo

- El frontend **nunca** accede a la base de datos directamente.
- Toda la lógica de negocio reside en el backend (API REST).
- Los stored procedures (`sp_registrar_checada`, `sp_generar_resumen_dia`) son invocados exclusivamente desde el backend.
- El módulo `api.js` centraliza todas las llamadas HTTP — nunca usar `fetch()` directamente en las páginas.
- Los componentes (`sidebar.html`, `navbar.html`, `footer.html`) se cargan dinámicamente con `loadComponent()` en `main.js`.

---

*GoCheck · Desarrollado para Abarrotes La Central*
