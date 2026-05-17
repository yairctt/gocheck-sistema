'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queryMaster } = require('../config/database');
const cfg    = require('../config/env');
const logger = require('../utils/logger');

/**
 * Intenta autenticar un usuario.
 * Controla bloqueo por intentos fallidos.
 * @returns {{ user, token, expiresAt }}
 */
async function login(username, password, ip = null, userAgent = null) {
  console.log(`[DEBUG] Attempting login for username: "${username}"`);
  console.log(`[DEBUG] Provided password length: ${password.length}`);

  // 1. Buscar usuario
  const [rows] = await queryMaster(
    `SELECT id_usuario, id_empleado, username, password_hash, rol, activo,
            intentos_fallidos, bloqueado_hasta
     FROM usuarios
     WHERE username = ? LIMIT 1`,
    [username]
  );
  
  console.log(`[DEBUG] Database returned rows:`, rows.length);

  if (!rows.length) {
    throw Object.assign(new Error('Credenciales incorrectas'), { status: 401 });
  }

  const user = rows[0];
  console.log(`[DEBUG] Database hash: "${user.password_hash}"`);

  // 2. Verificar bloqueo
  if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
    throw Object.assign(
      new Error(`Cuenta bloqueada hasta ${new Date(user.bloqueado_hasta).toLocaleString('es-MX')}`),
      { status: 401 }
    );
  }

  // 3. Verificar activo
  if (!user.activo) {
    throw Object.assign(new Error('Cuenta desactivada'), { status: 401 });
  }

  // 4. Verificar contraseña
  const valid = await bcrypt.compare(password, user.password_hash);
  console.log(`[DEBUG] bcrypt.compare result: ${valid}`);
  if (!valid) {
    await _handleFailedLogin(user);
    throw Object.assign(new Error('Credenciales incorrectas'), { status: 401 });
  }

  // 5. Resetear intentos fallidos
  try {
    await queryMaster(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW() WHERE id_usuario = ?',
      [user.id_usuario]
    );

    // 6. Generar JWT (incluyendo id_empleado si está vinculado)
    const payload = {
      id_usuario: user.id_usuario,
      username: user.username,
      rol: user.rol,
      id_empleado: user.id_empleado || null,
    };
    const token   = jwt.sign(payload, cfg.jwt.secret, { expiresIn: cfg.jwt.expiresIn });

    // 7. Registrar sesión
    const expMs  = _parseExpiry(cfg.jwt.expiresIn);
    const expDate = new Date(Date.now() + expMs);

    await queryMaster(
      `INSERT INTO sesiones (id_usuario, token_hash, ip_origen, user_agent, expira_en)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id_usuario, token, ip, userAgent, expDate]
    );

    // 8. Bitácora
    await _log(user.id_usuario, 'LOGIN', 'usuarios', user.id_usuario, ip);

    return {
      token,
      expiresAt: expDate,
      user: { id_usuario: user.id_usuario, username: user.username, rol: user.rol },
    };
  } catch (err) {
    console.error("[DEBUG] Error inside auth.service.login:", err);
    throw err;
  }
}

async function logout(userId, token, ip) {
  await queryMaster('UPDATE sesiones SET activa = 0 WHERE token_hash = ?', [token]);
  await _log(userId, 'LOGOUT', 'usuarios', userId, ip);
}

// ── Helpers internos ──────────────────────────────────────

async function _handleFailedLogin(user) {
  const intentos = (user.intentos_fallidos || 0) + 1;
  let bloqueado  = null;

  if (intentos >= cfg.security.maxLoginAttempts) {
    bloqueado = new Date(Date.now() + cfg.security.lockoutMinutes * 60000);
    logger.warn('[Auth] Cuenta bloqueada por intentos fallidos', { username: user.username });
  }

  await queryMaster(
    'UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id_usuario = ?',
    [intentos, bloqueado, user.id_usuario]
  );
}

function _parseExpiry(exp) {
  const match = String(exp).match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 3600 * 1000;
  const val = parseInt(match[1], 10);
  const map  = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return val * (map[match[2]] || 3600000);
}

async function _log(userId, accion, entidad, idEntidad, ip) {
  try {
    await queryMaster(
      'INSERT INTO bitacora_accesos (id_usuario, accion, entidad, id_entidad, ip) VALUES (?,?,?,?,?)',
      [userId, accion, entidad, idEntidad, ip]
    );
  } catch (e) {
    logger.error('[Auth] Error al escribir bitácora:', e.message);
  }
}

/**
 * Hash de contraseña.
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, cfg.security.bcryptRounds);
}

module.exports = { login, logout, hashPassword };
