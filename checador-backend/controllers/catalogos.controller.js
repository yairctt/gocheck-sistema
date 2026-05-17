'use strict';
const { queryReplica } = require('../config/database');
const R = require('../utils/response');

async function departamentos(req, res, next) {
  try {
    const [rows] = await queryReplica(
      'SELECT id_departamento, nombre, descripcion, activo FROM departamentos WHERE activo = 1 ORDER BY nombre'
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
}

async function puestos(req, res, next) {
  try {
    const { id_departamento } = req.query;
    const where  = id_departamento ? 'WHERE p.id_departamento = ? AND p.activo = 1' : 'WHERE p.activo = 1';
    const params = id_departamento ? [id_departamento] : [];
    const [rows] = await queryReplica(
      `SELECT p.id_puesto, p.nombre, p.id_departamento, d.nombre AS departamento_nombre
       FROM puestos p
       JOIN departamentos d ON d.id_departamento = p.id_departamento
       ${where} ORDER BY p.nombre`,
      params
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
}

async function tiposMovimiento(req, res, next) {
  try {
    const [rows] = await queryReplica(
      'SELECT id_tipo_movimiento, clave, nombre, descuenta_tiempo, requiere_autorizacion FROM tipos_movimiento WHERE activo = 1 ORDER BY id_tipo_movimiento'
    );
    return R.success(res, rows);
  } catch (err) { next(err); }
}

module.exports = { departamentos, puestos, tiposMovimiento };
