'use strict';
const jwt    = require('jsonwebtoken');
const cfg    = require('../config/env');
const R      = require('../utils/response');
const { queryMaster } = require('../config/database');

/**
 * Verifica el JWT en el header Authorization: Bearer <token>.
 * Adjunta req.user con los datos del usuario autenticado.
 */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    if (!header.startsWith('Bearer ')) {
      return R.unauthorized(res, 'Token de autenticación no proporcionado');
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, cfg.jwt.secret);
    } catch (e) {
      const msg = e.name === 'TokenExpiredError' ? 'Sesión expirada' : 'Token inválido';
      return R.unauthorized(res, msg);
    }

    // Verificar que la sesión siga activa en BD
    const [rows] = await queryMaster(
      `SELECT s.id_sesion, u.id_usuario, u.username, u.rol, u.activo, u.bloqueado_hasta
       FROM sesiones s
       JOIN usuarios u ON u.id_usuario = s.id_usuario
       WHERE s.token_hash = ? AND s.activa = 1 AND s.expira_en > NOW()`,
      [token]
    );

    if (!rows.length) return R.unauthorized(res, 'Sesión no válida o expirada');

    const user = rows[0];
    if (!user.activo) return R.unauthorized(res, 'Usuario desactivado');
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      return R.unauthorized(res, 'Cuenta bloqueada temporalmente');
    }

    req.user  = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
