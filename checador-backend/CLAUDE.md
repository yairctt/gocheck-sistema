# GoCheck Backend — Guía de Desarrollo

Este documento resume las reglas del proyecto, la arquitectura de base de datos y las convenciones para mantener la consistencia en la API de GoCheck.

## Comandos de Ejecución
- **Instalar**: `npm install`
- **Desarrollo**: `npm run dev` (usa nodemon)
- **Producción**: `npm start`
- **Tests**: `npm test`

## Stack Tecnológico
- **Core**: Node.js (>=18), Express.
- **Base de Datos**: MySQL (Pools Master/Replica con `mysql2`).
- **Autenticación**: JWT (`jsonwebtoken`), BcryptJS.
- **Logging**: Winston (Consola + Archivos rotados).
- **Seguridad**: Helmet, CORS, Rate Limit.

## Estructura de Archivos (Arquitectura)
- `/routes/`: Definición de endpoints (Express Router).
- `/controllers/`: Lógica HTTP (valida entrada, llama al servicio, formatea respuesta).
- `/services/`: Lógica de negocio y consultas SQL directas.
- `/middlewares/`: Protección de rutas (auth, roles) y manejo de errores.
- `/config/`: Configuración de entorno (`env.js`) y base de datos (`database.js`).
- `/utils/`: Helpers globales (`response.js`, `logger.js`, `audit.js`).

## Reglas de Desarrollo

### 1. Manejo de Base de Datos (Crucial)
El sistema usa una arquitectura **Master-Replica**:
- **Escrituras** (INSERT, UPDATE, DELETE) y Stored Procedures: Usar `queryMaster(sql, params)`.
- **Lecturas** (SELECT, Vistas, Reportes): Usar `queryReplica(sql, params)`.
```javascript
const { queryMaster, queryReplica } = require('../config/database');
```

### 2. Formato de Respuesta Estandarizado
**NUNCA** envíes `res.json()` directamente con objetos arbitrarios. Usa el helper `R` de `utils/response.js`:
- `R.success(res, data, message)` -> 200 OK
- `R.paginated(res, data, total, page, perPage)` -> 200 OK + meta
- `R.created(res, data, message)` -> 201 Created
- `R.notFound(res, message)` -> 404 Not Found
- `R.clientError(res, message)` -> 400 Bad Request

### 3. Lógica de Controladores
Cada controlador debe usar `async/await` y estar envuelto en `try/catch` para pasar errores al middleware global:
```javascript
async function miMetodo(req, res, next) {
  try {
    const data = await svc.hacerAlgo(req.body);
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
}
```

### 4. Auditoría y Bitácora
Cualquier acción que modifique datos sensibles (empleados, usuarios, configuraciones) debe quedar registrada:
```javascript
const { logAction } = require('../utils/audit');
await logAction(req, 'UPDATE', 'nombre_tabla', id_referencia);
```

### 5. Convenciones de Nomenclatura
- **Archivos**: `nombre.routes.js`, `nombre.controller.js`, `nombre.service.js` (kebab-case).
- **Variables/Funciones JS**: `camelCase`.
- **Campos de API/DB**: `snake_case`.
- **Claves JWT/Config**: `SCREAMING_SNAKE_CASE`.

### 6. Seguridad y Roles
- Las rutas protegidas requieren el middleware `auth`.
- Para restringir por rol, usa `minRole('admin|supervisor|consulta')`.
```javascript
router.post('/', auth, minRole('admin'), ctrl.create);
```

## Flujo de Trabajo Sugerido
1. Define el endpoint en `routes/`.
2. Implementa la lógica de respuesta en `controllers/`.
3. Escribe las consultas SQL en `services/`.
4. Si hay variables nuevas, añádelas a `.env.example` y valídalas en `config/env.js`.
