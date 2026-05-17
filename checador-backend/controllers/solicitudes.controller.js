'use strict';
const { queryMaster, queryReplica } = require('../config/database');
const R = require('../utils/response');
const { logAction } = require('../utils/audit');

async function list(req, res, next) {
  try {
    const { page, perPage, offset } = R.parsePagination(req.query);
    const { estatus, tipo, fecha } = req.query;

    const where  = [];
    const params = [];

    if (estatus) { where.push('es.clave = ?');  params.push(estatus); }
    if (tipo)    { where.push('tm.clave = ?');  params.push(tipo); }
    if (fecha)   { where.push('s.fecha_inicio <= ? AND s.fecha_fin >= ?'); params.push(fecha, fecha); }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await queryReplica(
      `SELECT COUNT(*) AS total
       FROM solicitudes s
       JOIN tipos_movimiento tm ON tm.id_tipo_movimiento = s.id_tipo_movimiento
       JOIN estatus_solicitud es ON es.id_estatus = s.id_estatus
       JOIN empleados e ON e.id_empleado = s.id_empleado
       ${whereSQL}`, params
    );

    const [rows] = await queryReplica(
      `SELECT s.*,
              CONCAT(e.nombre,' ',e.apellido_paterno) AS nombre_completo,
              e.numero_empleado,
              tm.clave AS tipo_clave, tm.nombre AS tipo_nombre,
              es.clave AS estatus_clave, es.nombre AS estatus_nombre
       FROM solicitudes s
       JOIN tipos_movimiento tm ON tm.id_tipo_movimiento = s.id_tipo_movimiento
       JOIN estatus_solicitud es ON es.id_estatus = s.id_estatus
       JOIN empleados e ON e.id_empleado = s.id_empleado
       ${whereSQL}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(perPage), Number(offset)]
    );

    return R.paginated(res, rows, total, page, perPage);
  } catch (err) { next(err); }
}
async function create(req, res, next) {
  try {
    const { tipo_clave, fecha_inicio, fecha_fin, motivo, id_empleado: reqIdEmp } = req.body;
    if (!tipo_clave || !fecha_inicio || !fecha_fin || !motivo) {
      return R.clientError(res, 'tipo_clave, fecha_inicio, fecha_fin y motivo son requeridos');
    }

    // Resolver id_empleado desde el body o desde el token (el usuario logueado debe estar ligado a un empleado)
    const id_empleado = reqIdEmp || req.user.id_empleado;
    if (!id_empleado) return R.clientError(res, 'Debes seleccionar un empleado o estar vinculado a uno');

    // Obtener el id del tipo de movimiento
    const [[tipo]] = await queryReplica(
      'SELECT id_tipo_movimiento FROM tipos_movimiento WHERE clave = ?', [tipo_clave]
    );
    if (!tipo) return R.clientError(res, 'Tipo de solicitud inválido');

    // Obtener estatus PENDIENTE
    const [[estatus]] = await queryReplica(
      "SELECT id_estatus FROM estatus_solicitud WHERE clave = 'PENDIENTE'" , []
    );
    if (!estatus) return R.clientError(res, 'No se encontró el estatus PENDIENTE en la BD');

    // Calcular días
    const dias = Math.max(1, Math.ceil(
      (new Date(fecha_fin) - new Date(fecha_inicio)) / (1000 * 60 * 60 * 24)
    ) + 1);

    const [result] = await queryMaster(
      `INSERT INTO solicitudes
         (id_empleado, id_tipo_movimiento, id_estatus, fecha_inicio, fecha_fin, total_dias, motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_empleado, tipo.id_tipo_movimiento, estatus.id_estatus, fecha_inicio, fecha_fin, dias, motivo]
    );

    await logAction(req, 'CREATE', 'solicitudes', result.insertId);
    return R.created(res, { id_solicitud: result.insertId }, 'Solicitud creada correctamente');
  } catch (err) { next(err); }
}


async function getOne(req, res, next) {
  try {
    const [rows] = await queryReplica(
      `SELECT s.*,
              CONCAT(e.nombre,' ',e.apellido_paterno) AS nombre_completo,
              e.numero_empleado,
              tm.clave AS tipo_clave, tm.nombre AS tipo_nombre,
              es.clave AS estatus_clave, es.nombre AS estatus_nombre
       FROM solicitudes s
       JOIN tipos_movimiento tm ON tm.id_tipo_movimiento = s.id_tipo_movimiento
       JOIN estatus_solicitud es ON es.id_estatus = s.id_estatus
       JOIN empleados e ON e.id_empleado = s.id_empleado
       WHERE s.id_solicitud = ?`,
      [req.params.id]
    );
    if (!rows.length) return R.notFound(res, 'Solicitud no encontrada');
    return R.success(res, rows[0]);
  } catch (err) { next(err); }
}

async function _cambiarEstatus(req, res, next, clave) {
  try {
    const { observaciones } = req.body;
    const [[{ id_estatus }]] = await queryReplica(
      'SELECT id_estatus FROM estatus_solicitud WHERE clave = ?', [clave]
    );

    const [result] = await queryMaster(
      `UPDATE solicitudes
       SET id_estatus = ?, id_autorizador = ?, fecha_autorizacion = NOW(), observaciones_auth = ?
       WHERE id_solicitud = ? AND id_estatus = (SELECT id_estatus FROM estatus_solicitud WHERE clave = 'PENDIENTE')`,
      [id_estatus, req.user.id_usuario, observaciones || null, req.params.id]
    );

    if (!result.affectedRows) return R.clientError(res, 'Solicitud no encontrada o ya fue procesada', 409);
    await logAction(req, clave === 'APROBADO' ? 'APPROVE' : 'REJECT', 'solicitudes', req.params.id);
    return R.success(res, null, `Solicitud ${clave.toLowerCase()}`);
  } catch (err) { next(err); }
}

const aprobar  = (req, res, next) => _cambiarEstatus(req, res, next, 'APROBADO');
const rechazar = (req, res, next) => _cambiarEstatus(req, res, next, 'RECHAZADO');

module.exports = { list, create, getOne, aprobar, rechazar };

