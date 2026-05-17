'use strict';
/**
 * server.js — Punto de entrada de GoCheck API
 *
 * Arquitectura:
 *   VM1 → MySQL Master   (escritura)
 *   VM2 → MySQL Replica  (lectura / reportes)
 *   VM3 → Este servidor  Node.js / Express
 *   Clientes → Frontend web (HTML + Bootstrap + JS)
 */

const cfg = require('./config/env');           // Carga y valida variables de entorno
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const { testConnections } = require('./config/database');
const logger       = require('./utils/logger');
const { errorMiddleware, notFoundMiddleware } = require('./middlewares/error.middleware');

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────

app.use(helmet());
app.set('trust proxy', 1);   // Necesario si hay reverse proxy (Nginx)

app.use(cors({
  origin:  cfg.cors.origin,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// ── Rate limiting global ───────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: cfg.rateLimit.windowMs,
  max:      cfg.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Demasiadas solicitudes. Intenta más tarde.' },
});
app.use('/api', globalLimiter);

// Rate limiting estricto para el checador (kiosco público)
const checadorLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max:      30,         // 30 registros por minuto máximo
  message: { success: false, message: 'Límite de checadas alcanzado. Espera un momento.' },
});
app.use('/api/checador', checadorLimiter);

// Rate limiting para login (anti-brute-force adicional a nivel BD)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max:      20,
  message: { success: false, message: 'Demasiados intentos de login. Intenta en 15 minutos.' },
});
app.use('/api/login', loginLimiter);

// ── Parsers y utilidades ──────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging HTTP (solo en desarrollo se usa el formato detallado)
if (cfg.env !== 'test') {
  app.use(morgan(cfg.env === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ── Health check (sin autenticación) ─────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    app:     cfg.appName,
    env:     cfg.env,
    version: require('./package.json').version,
    time:    new Date().toISOString(),
  });
});

// ── Rutas API ─────────────────────────────────────────────────────────

app.use('/api',             require('./routes/auth.routes'));
app.use('/api/dashboard',   require('./routes/dashboard.routes'));
app.use('/api/empleados',   require('./routes/empleados.routes'));
app.use('/api/turnos',      require('./routes/turnos.routes'));
app.use('/api/asistencias', require('./routes/asistencias.routes'));
app.use('/api/reportes',    require('./routes/reportes.routes'));
app.use('/api/solicitudes', require('./routes/solicitudes.routes'));
app.use('/api/usuarios',    require('./routes/usuarios.routes'));
app.use('/api/bitacora',    require('./routes/bitacora.routes'));
app.use('/api/checador',    require('./routes/checador.routes'));

// Catálogos (departamentos, puestos, tipos-movimiento)
const catRoutes = require('./routes/catalogos.routes');
app.use('/api', catRoutes);

// ── Manejadores de errores (siempre al final) ─────────────────────────

app.use(notFoundMiddleware);
app.use(errorMiddleware);

// ── Arranque del servidor ─────────────────────────────────────────────

async function start() {
  await testConnections();

  const server = app.listen(cfg.port, () => {
    logger.info(`[Server] GoCheck v${require('./package.json').version} iniciado`);
    logger.info(`[Server] Ambiente: ${cfg.env}`);
    logger.info(`[Server] Escuchando en http://localhost:${cfg.port}`);
    logger.info(`[Server] Health: http://localhost:${cfg.port}/health`);
  });

  // Apagado ordenado (graceful shutdown)
  const shutdown = (signal) => {
    logger.info(`[Server] Señal ${signal} recibida. Cerrando servidor…`);
    server.close(() => {
      logger.info('[Server] Servidor cerrado correctamente.');
      process.exit(0);
    });
    setTimeout(() => { logger.error('[Server] Forzando cierre.'); process.exit(1); }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('[Server] unhandledRejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    logger.error('[Server] uncaughtException:', err);
    process.exit(1);
  });
}

start();

module.exports = app; // Para testing
