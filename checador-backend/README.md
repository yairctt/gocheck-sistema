# GoCheck — Backend API
### Node.js · Express · MySQL · JWT · v2.1

---

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de BD y JWT_SECRET

# 3. Aplicar el esquema de base de datos
mysql -u root -p < ../database/checador_abarrotes_pruebas.sql

# 4. Crear usuario inicial (ejemplo en MySQL)
#    Ver sección "Usuario inicial" más abajo

# 5. Iniciar
npm start          # producción
npm run dev        # desarrollo con nodemon
```

---

## Estructura del proyecto

```
backend/
├── server.js                   → Entrada principal, Express, middlewares globales
├── package.json
├── .env.example                → Plantilla de variables de entorno
│
├── config/
│   ├── env.js                  → Validación y exportación de configuración
│   └── database.js             → Pools MySQL Master/Replica + helpers
│
├── routes/                     → Definición de rutas (Express Router)
│   ├── auth.routes.js
│   ├── dashboard.routes.js
│   ├── empleados.routes.js
│   ├── turnos.routes.js
│   ├── asistencias.routes.js
│   ├── reportes.routes.js
│   ├── solicitudes.routes.js
│   ├── usuarios.routes.js
│   ├── bitacora.routes.js
│   ├── checador.routes.js
│   └── catalogos.routes.js
│
├── controllers/                → Lógica HTTP (req/res), validaciones de entrada
│   ├── auth.controller.js
│   ├── dashboard.controller.js
│   ├── empleados.controller.js
│   ├── turnos.controller.js
│   ├── asistencias.controller.js
│   ├── reportes.controller.js
│   ├── solicitudes.controller.js
│   ├── usuarios.controller.js
│   ├── bitacora.controller.js
│   ├── checador.controller.js
│   └── catalogos.controller.js
│
├── services/                   → Lógica de negocio y acceso a BD
│   ├── auth.service.js
│   ├── empleados.service.js
│   ├── turnos.service.js
│   ├── movimientos.service.js
│   └── reportes.service.js
│
├── middlewares/
│   ├── auth.middleware.js      → Verificación JWT + sesión activa en BD
│   ├── role.middleware.js      → Control de acceso por rol (RBAC)
│   └── error.middleware.js     → Manejo centralizado de errores
│
└── utils/
    ├── response.js             → Helpers de respuesta estandarizada
    ├── logger.js               → Winston (consola + archivos rotados)
    └── audit.js                → Escritura automática en bitacora_accesos
```

---

## Endpoints de la API

### Autenticación
| Método | Ruta         | Roles    | Descripción                   |
|--------|--------------|----------|-------------------------------|
| POST   | /api/login   | público  | Login → devuelve JWT          |
| GET    | /api/me      | todos    | Usuario autenticado actual    |
| POST   | /api/logout  | todos    | Invalida sesión               |

### Dashboard
| Método | Ruta                          | Descripción                   |
|--------|-------------------------------|-------------------------------|
| GET    | /api/dashboard/kpis           | KPIs del día                  |
| GET    | /api/dashboard/movimientos-hoy| Vista v_movimientos_hoy       |

### Empleados
| Método | Ruta                         | Rol mínimo  |
|--------|------------------------------|-------------|
| GET    | /api/empleados               | consulta    |
| GET    | /api/empleados/:id           | consulta    |
| POST   | /api/empleados               | admin       |
| PUT    | /api/empleados/:id           | admin       |
| PATCH  | /api/empleados/:id/estado    | admin       |
| GET    | /api/empleados/:id/qr        | consulta    |
| GET    | /api/empleados/:id/horario   | consulta    |
| PUT    | /api/empleados/:id/horario   | supervisor  |

### Turnos
| Método | Ruta                       | Rol mínimo |
|--------|----------------------------|------------|
| GET    | /api/turnos                | consulta   |
| POST   | /api/turnos                | admin      |
| PUT    | /api/turnos/:id            | admin      |
| PATCH  | /api/turnos/:id/estado     | admin      |

### Asistencias / Movimientos
| Método | Ruta              | Parámetros query                       |
|--------|-------------------|----------------------------------------|
| GET    | /api/asistencias  | search, fecha, id_departamento, tipo   |

### Reportes
| Método | Ruta                         | Descripción                           |
|--------|------------------------------|---------------------------------------|
| GET    | /api/reportes/resumen        | Vista v_resumen_diario con filtros    |
| POST   | /api/reportes/generar-resumen| Ejecuta sp_generar_resumen_dia        |

### Solicitudes
| Método | Ruta                          | Rol mínimo |
|--------|-------------------------------|------------|
| GET    | /api/solicitudes              | consulta   |
| GET    | /api/solicitudes/:id          | consulta   |
| PATCH  | /api/solicitudes/:id/aprobar  | supervisor |
| PATCH  | /api/solicitudes/:id/rechazar | supervisor |

### Usuarios
| Método | Ruta                       | Rol mínimo |
|--------|----------------------------|------------|
| GET    | /api/usuarios              | admin      |
| POST   | /api/usuarios              | admin      |
| PUT    | /api/usuarios/:id          | admin      |
| PATCH  | /api/usuarios/:id/estado   | admin      |

### Bitácora
| Método | Ruta           | Parámetros            |
|--------|----------------|-----------------------|
| GET    | /api/bitacora  | search, fecha, accion |

### Checador (kiosco — sin JWT)
| Método | Ruta                       | Descripción                      |
|--------|----------------------------|----------------------------------|
| POST   | /api/checador/identificar  | Identifica empleado por token    |
| POST   | /api/checador/registrar    | Ejecuta sp_registrar_checada     |

### Catálogos
| Método | Ruta                    |
|--------|-------------------------|
| GET    | /api/departamentos      |
| GET    | /api/puestos            |
| GET    | /api/tipos-movimiento   |

---

## Formato de respuesta

Todas las respuestas siguen este formato:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

Respuestas paginadas incluyen `meta`:

```json
{
  "success": true,
  "message": "OK",
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "pages": 8
  }
}
```

---

## Roles y permisos

```
superadmin  →  acceso total
admin       →  gestión de empleados, turnos, usuarios, reportes
supervisor  →  aprobar/rechazar solicitudes, consultar todo
consulta    →  solo lectura
```

---

## Usuario inicial (MySQL)

Ejecuta esto en MySQL para crear el primer superadmin:

```sql
-- Contraseña: Admin2024! (cámbiala inmediatamente)
INSERT INTO usuarios (username, password_hash, rol)
VALUES (
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2.',
  'superadmin'
);
```

O desde Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('Admin2024!', 12);
// INSERT INTO usuarios ...
```

---

## ═══════════════════════════════════════════════════════
## GUÍA DBA — Arquitectura y Administración de Base de Datos
## ═══════════════════════════════════════════════════════

### Arquitectura de infraestructura recomendada

```
┌─────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA                        │
│                                                           │
│   ┌──────────────┐      ┌──────────────────────────┐     │
│   │  VM1         │      │  VM2                     │     │
│   │  MySQL       │─────>│  MySQL                   │     │
│   │  MASTER      │ rep. │  REPLICA (Slave)         │     │
│   │  escrituras  │      │  lecturas / reportes     │     │
│   └──────────────┘      └──────────────────────────┘     │
│           │                        │                      │
│           └──────────┬─────────────┘                      │
│                      │                                     │
│               ┌──────────────┐                            │
│               │  VM3         │                            │
│               │  Node.js     │                            │
│               │  Backend API │                            │
│               └──────────────┘                            │
│                      │                                     │
│              ┌───────────────┐                            │
│              │  Clientes     │                            │
│              │  Frontend Web │                            │
│              └───────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

### Separación de operaciones

**MASTER (VM1) — Escrituras críticas:**
- `INSERT/UPDATE` en `movimientos` (checadas en tiempo real)
- `INSERT/UPDATE` en `solicitudes`
- `INSERT` en `sesiones` y `bitacora_accesos`
- Ejecución de stored procedures: `sp_registrar_checada`, `sp_generar_resumen_dia`

**REPLICA (VM2) — Lecturas / reportes:**
- Consultas sobre `v_movimientos_hoy`, `v_resumen_diario`, `v_empleados_activos`
- Reportes de asistencia y resúmenes históricos
- Catálogos: departamentos, puestos, turnos
- Consultas de la bitácora y auditoría

El backend selecciona automáticamente el pool correcto:
```javascript
// config/database.js
await queryMaster(sql, params);  // INSERT/UPDATE/DELETE
await queryReplica(sql, params); // SELECT, vistas, reportes
```

---

### Configuración de Replicación MySQL Master-Slave

#### En VM1 (Master) — `/etc/mysql/mysql.conf.d/mysqld.cnf`

```ini
[mysqld]
server-id          = 1
log_bin            = /var/log/mysql/mysql-bin.log
binlog_do_db       = checador_abarrotes_pruebas
binlog_format      = ROW
expire_logs_days   = 7
max_binlog_size    = 100M
sync_binlog        = 1
innodb_flush_log_at_trx_commit = 1
```

```sql
-- En MySQL Master: crear usuario de replicación
CREATE USER 'replicador'@'IP_VM2' IDENTIFIED BY 'password_replicacion';
GRANT REPLICATION SLAVE ON *.* TO 'replicador'@'IP_VM2';
FLUSH PRIVILEGES;

-- Obtener posición actual del binlog
SHOW MASTER STATUS;
-- Anota: File y Position
```

#### En VM2 (Replica) — `/etc/mysql/mysql.conf.d/mysqld.cnf`

```ini
[mysqld]
server-id          = 2
relay-log          = /var/log/mysql/mysql-relay-bin.log
log_bin            = /var/log/mysql/mysql-bin.log
read_only          = 1
super_read_only    = 1
binlog_do_db       = checador_abarrotes_pruebas
```

```sql
-- En MySQL Replica: configurar fuente de replicación
CHANGE MASTER TO
  MASTER_HOST     = 'IP_VM1',
  MASTER_USER     = 'replicador',
  MASTER_PASSWORD = 'password_replicacion',
  MASTER_LOG_FILE = 'mysql-bin.000001',  -- del SHOW MASTER STATUS
  MASTER_LOG_POS  =  154;                -- del SHOW MASTER STATUS

START SLAVE;
SHOW SLAVE STATUS\G  -- Verificar: Slave_IO_Running: Yes, Slave_SQL_Running: Yes
```

---

### Backups automáticos con mysqldump

#### Script de backup diario (`/opt/checkerpro/backup.sh`)

```bash
#!/bin/bash
# CheckerPRO — Backup automático de MySQL
# Agregar a crontab: 0 2 * * * /opt/checkerpro/backup.sh

DB_HOST="localhost"
DB_USER="backup_user"
DB_PASS="password_backup"
DB_NAME="checador_abarrotes_pruebas"
BACKUP_DIR="/var/backups/checkerpro"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump comprimido
mysqldump \
  --host="$DB_HOST" \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --add-drop-table \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup creado: $BACKUP_FILE ($(du -sh $BACKUP_FILE | cut -f1))"

# Eliminar backups antiguos
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backups limpiados (>$RETENTION_DAYS días)"
```

```bash
# Usuario de solo backup en MySQL
CREATE USER 'backup_user'@'localhost'
  IDENTIFIED BY 'password_backup';
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES, PROCESS
  ON checador_abarrotes_pruebas.* TO 'backup_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### Usuarios de base de datos por rol

```sql
-- ── Usuario de la aplicación (lectura + escritura restringida) ──
CREATE USER 'checkerpro_app'@'IP_VM3'
  IDENTIFIED BY 'password_app_seguro';

GRANT SELECT, INSERT, UPDATE ON checador_abarrotes_pruebas.* TO 'checkerpro_app'@'IP_VM3';
-- IMPORTANTE: no GRANT DELETE en producción (soft-delete con activo=0)
GRANT EXECUTE ON checador_abarrotes_pruebas.* TO 'checkerpro_app'@'IP_VM3';
FLUSH PRIVILEGES;

-- ── Usuario de solo lectura (para la réplica) ──
CREATE USER 'checkerpro_readonly'@'IP_VM3'
  IDENTIFIED BY 'password_readonly';

GRANT SELECT ON checador_abarrotes_pruebas.* TO 'checkerpro_readonly'@'IP_VM3';
FLUSH PRIVILEGES;
```

---

### Índices recomendados para optimización

```sql
-- Consultas frecuentes del dashboard (movimientos hoy)
-- Ya incluidos en el DDL. Verificar con EXPLAIN:
EXPLAIN SELECT * FROM v_movimientos_hoy WHERE tipo_clave = 'ENTRADA';

-- Índice adicional para reportes por rango de fechas
ALTER TABLE resumen_diario
  ADD INDEX idx_res_fecha_incidencia (fecha, incidencia);

-- Índice para búsqueda de empleados por nombre
ALTER TABLE empleados
  ADD INDEX idx_emp_nombre (apellido_paterno, nombre);

-- Limpiar sesiones expiradas (cron semanal)
DELETE FROM sesiones WHERE expira_en < NOW() AND activa = 0;

-- Analizar tablas de alto volumen mensualmente
ANALYZE TABLE movimientos;
ANALYZE TABLE resumen_diario;
ANALYZE TABLE bitacora_accesos;
```

---

### Monitoreo recomendado

```sql
-- Estado de la replicación (ejecutar en Slave)
SHOW SLAVE STATUS\G

-- Conexiones activas
SHOW PROCESSLIST;

-- Variables de rendimiento clave
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Slow_queries';
SHOW STATUS LIKE 'Innodb_buffer_pool_read_requests';

-- Tamaño de las tablas principales
SELECT table_name, ROUND((data_length + index_length) / 1024 / 1024, 2) AS MB
FROM information_schema.tables
WHERE table_schema = 'checador_abarrotes_pruebas'
ORDER BY (data_length + index_length) DESC;
```

**Herramientas recomendadas:**
- **Prometheus + Grafana** con `mysqld_exporter` para métricas en tiempo real
- **PMM** (Percona Monitoring and Management) — dashboard completo para MySQL
- **Alerta de lag de replicación:** `Seconds_Behind_Master` > 30 segundos

---

### Variables de entorno por ambiente

| Variable              | Desarrollo        | Producción               |
|-----------------------|-------------------|--------------------------|
| `NODE_ENV`            | development       | production               |
| `JWT_SECRET`          | cualquier string  | mínimo 64 chars aleatorio|
| `BCRYPT_ROUNDS`       | 10                | 12-14                    |
| `DB_MASTER_HOST`      | 127.0.0.1         | IP de VM1                |
| `DB_REPLICA_HOST`     | 127.0.0.1         | IP de VM2                |
| `CORS_ORIGIN`         | *                 | https://tudominio.com    |
| `RATE_LIMIT_MAX`      | 1000              | 200                      |
| `LOG_LEVEL`           | debug             | info                     |

---

### Despliegue con PM2 (producción en VM3)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar la aplicación
pm2 start server.js --name checkerpro-api --instances 2

# Guardar configuración para reinicio automático
pm2 save
pm2 startup

# Ver logs en tiempo real
pm2 logs checkerpro-api

# Monitoreo
pm2 monit
```

#### Configuración Nginx como reverse proxy (VM3)

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    location /api {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

*GoCheck Backend v2.1*
