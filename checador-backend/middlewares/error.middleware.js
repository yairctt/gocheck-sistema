'use strict';
const logger = require('../utils/logger');
const cfg    = require('../config/env');

/**
 * Middleware de manejo centralizado de errores.
 * Debe registrarse DESPUÉS de todas las rutas.
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  logger.error('[ErrorMiddleware]', {
    status,
    message,
    stack:  cfg.env !== 'production' ? err.stack : undefined,
    method: req.method,
    url:    req.originalUrl,
    user:   req.user?.id_usuario,
    ip:     req.ip,
  });

  // Errores conocidos de MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'Referencia inválida en los datos enviados.' });
  }

  return res.status(status).json({
    success: false,
    message: cfg.env === 'production' && status === 500 ? 'Error interno del servidor' : message,
    ...(cfg.env !== 'production' && { stack: err.stack }),
  });
}

/**
 * Middleware para rutas no encontradas (404).
 */
function notFoundMiddleware(req, res) {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorMiddleware, notFoundMiddleware };
