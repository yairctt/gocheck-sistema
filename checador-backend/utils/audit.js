'use strict';
const { queryMaster } = require('../config/database');
const logger = require('./logger');

/**
 * Registra una acción en bitacora_accesos.
 * Se llama desde los controladores después de operaciones exitosas.
 */
async function logAction(req, accion, entidad = null, idEntidad = null, detalle = null) {
  try {
    if (!req.user?.id_usuario) return;
    await queryMaster(
      'INSERT INTO bitacora_accesos (id_usuario, accion, entidad, id_entidad, detalle, ip) VALUES (?,?,?,?,?,?)',
      [req.user.id_usuario, accion, entidad, idEntidad || null, detalle, req.ip || null]
    );
  } catch (err) {
    logger.error('[Audit] Error al registrar bitácora:', err.message);
  }
}

module.exports = { logAction };
