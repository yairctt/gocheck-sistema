'use strict';
const authService = require('../services/auth.service');
const R           = require('../utils/response');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return R.clientError(res, 'username y password son requeridos');

    const result = await authService.login(
      username.trim(),
      password,
      req.ip,
      req.headers['user-agent']
    );
    return R.success(res, result, 'Login exitoso');
  } catch (err) {
    if (err.status === 401) return R.unauthorized(res, err.message);
    next(err);
  }
}

async function me(req, res) {
  return R.success(res, {
    id_usuario: req.user.id_usuario,
    username:   req.user.username,
    rol:        req.user.rol,
  });
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id_usuario, req.token, req.ip);
    return R.success(res, null, 'Sesión cerrada');
  } catch (err) { next(err); }
}

module.exports = { login, me, logout };
