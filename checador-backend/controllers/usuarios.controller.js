'use strict';
const { queryMaster, queryReplica } = require('../config/database');
const authService = require('../services/auth.service');
const R = require('../utils/response');
const { logAction } = require('../utils/audit');

async function list(req, res, next) {
  try {
    const { page, perPage, offset } = R.parsePagination(req.query);
    const { search, rol } = req.query;

    const where  = [];
    const params = [];
    if (search) { where.push('(username LIKE ?)'); params.push(`%${search}%`); }
    if (rol)    { where.push('rol = ?');            params.push(rol); }
    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await queryReplica(`SELECT COUNT(*) AS total FROM usuarios ${whereSQL}`, params);
    const [rows] = await queryReplica(
      `SELECT id_usuario, id_empleado, username, rol, activo, ultimo_login, created_at
       FROM usuarios ${whereSQL} ORDER BY username LIMIT ? OFFSET ?`,
      [...params, Number(perPage), Number(offset)]
    );
    return R.paginated(res, rows, total, page, perPage);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const [rows] = await queryReplica(
      'SELECT id_usuario, id_empleado, username, rol, activo, ultimo_login, created_at FROM usuarios WHERE id_usuario = ?',
      [req.params.id]
    );
    if (!rows.length) return R.notFound(res, 'Usuario no encontrado');
    return R.success(res, rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { username, password, rol, id_empleado } = req.body;
    if (!username || !password || !rol) return R.clientError(res, 'username, password y rol son requeridos');

    const ROLES_VALIDOS = ['superadmin','admin','supervisor','consulta'];
    if (!ROLES_VALIDOS.includes(rol)) return R.clientError(res, `Rol inválido. Válidos: ${ROLES_VALIDOS.join(', ')}`);

    const hash = await authService.hashPassword(password);
    const [result] = await queryMaster(
      'INSERT INTO usuarios (id_empleado, username, password_hash, rol) VALUES (?,?,?,?)',
      [id_empleado || null, username.trim(), hash, rol]
    );
    await logAction(req, 'CREATE', 'usuarios', result.insertId);
    return R.created(res, { id_usuario: result.insertId });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { username, password, rol, id_empleado } = req.body;
    const fields = [];
    const params = [];

    if (username)    { fields.push('username = ?');  params.push(username.trim()); }
    if (rol)         { fields.push('rol = ?');        params.push(rol); }
    if (id_empleado !== undefined) { fields.push('id_empleado = ?'); params.push(id_empleado || null); }
    if (password)    {
      const hash = await authService.hashPassword(password);
      fields.push('password_hash = ?');
      params.push(hash);
    }

    if (!fields.length) return R.clientError(res, 'Sin campos para actualizar');
    params.push(req.params.id);

    const [result] = await queryMaster(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`, params
    );
    if (!result.affectedRows) return R.notFound(res, 'Usuario no encontrado');
    await logAction(req, 'UPDATE', 'usuarios', req.params.id);
    return R.success(res, null, 'Usuario actualizado');
  } catch (err) { next(err); }
}

async function toggleEstado(req, res, next) {
  try {
    const activo = Number(req.body.activo ?? 1);
    const [result] = await queryMaster(
      'UPDATE usuarios SET activo = ? WHERE id_usuario = ?', [activo, req.params.id]
    );
    if (!result.affectedRows) return R.notFound(res, 'Usuario no encontrado');
    await logAction(req, activo ? 'ACTIVATE' : 'DEACTIVATE', 'usuarios', req.params.id);
    return R.success(res, null, 'Estado actualizado');
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, toggleEstado };
