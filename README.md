# GoCheck - Sistema de Control de Asistencia

GoCheck es una solución integral y profesional para la gestión y control de asistencia del personal en tiendas de abarrotes y supermercados. El proyecto está estructurado bajo una arquitectura cliente-servidor desacoplada, compuesta por un terminal web interactivo (Frontend) y una API REST robusta (Backend) con base de datos relacional.

---

## Arquitectura del Proyecto

El ecosistema está dividido en dos sub-proyectos principales:

*   **`checador-frontend`**: Aplicación web del cliente (diseñada para terminales de control física y kioscos) construida utilizando HTML5 semántico, CSS3 personalizado (tema oscuro/industrial), JavaScript ES6+ y Bootstrap para una interfaz adaptativa y de alta fidelidad.
*   **`checador-backend`**: API de servicios REST construida sobre Node.js y Express. Utiliza una base de datos MySQL configurada con un pool Master-Replica para optimizar lecturas/escrituras, autenticación segura mediante JSON Web Tokens (JWT), encriptación BcryptJS, auditoría de logs mediante Winston/Morgan y limitador de peticiones para mitigar denegación de servicios.

---

## Funcionalidades Principales

*   **Identificación Flexible**: Acceso rápido de empleados a través de escaneo de código QR (cámara web) o ingreso de PIN numérico.
*   **Registro de Jornada**: Control de cuatro movimientos clave por día: Entrada, Salida a comida, Regreso de comida y Salida definitiva de jornada.
*   **Prevención de Duplicados**: Validación estricta en base de datos y UI para evitar que un empleado registre dos veces la entrada o salida en el mismo día.
*   **Panel de Administración (Dashboard)**: Visualización en tiempo real de estadísticas clave (KPIs) como empleados activos, asistencias de hoy, retardos, permisos vigentes y faltas.
*   **Auditoría y Seguridad**: Sistema de bitácora que registra accesos y modificaciones en registros sensibles (roles, horarios, etc.) asociándolo al usuario responsable.

---

## Requisitos Previos

Para ejecutar la aplicación de forma local, se requiere:

*   Node.js (versión 18.0.0 o superior)
*   MySQL Server (versión 8.0 o superior)
*   Un servidor web local (como `http-server` para el frontend)

---

## Configuración y Ejecución del Entorno

Siga los siguientes pasos para levantar ambos entornos localmente:

### 1. Base de Datos
1. Cree una base de datos en su servidor MySQL local llamada `checador_abarrotes_pruebas`.
2. Importe el esquema DDL y los procedimientos almacenados desde el archivo provisto en el proyecto:
   ```bash
   mysql -u root -p checador_abarrotes_pruebas < database/checador_abarrotes_pruebas.sql
   ```

### 2. Configuración del Backend
1. Navegue al directorio del servidor:
   ```bash
   cd checador-backend
   ```
2. Instale las dependencias del sistema:
   ```bash
   npm install
   ```
3. Copie la plantilla de variables de entorno y renómbrela a `.env`:
   ```bash
   cp .env.example .env
   ```
4. Edite el archivo `.env` configurando los accesos a su servidor de MySQL (`DB_MASTER_USER` y `DB_MASTER_PASSWORD`).
5. Inicie el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *La API estará disponible en http://localhost:3000.*

### 3. Configuración del Frontend
1. En otra terminal, navegue al directorio del cliente:
   ```bash
   cd checador-frontend
   ```
2. Levante el servidor web estático para la interfaz:
   ```bash
   npx http-server . -p 8080 --cors
   ```
3. Abra su navegador e ingrese a http://localhost:8080 para ver la interfaz interactiva.
