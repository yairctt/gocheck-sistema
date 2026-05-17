'use strict';
const svc = require('../services/turnos.service');
const R   = require('../utils/response');
const { logAction } = require('../utils/audit');

async function list(req, res, next) {
  try {
    const rows = await svc.list({ activo: req.query.activo });
    return R.success(res, rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const t = await svc.getById(req.params.id);
    if (!t) return R.notFound(res, 'Turno no encontrado');
    return R.success(res, t);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { nombre, hora_entrada, hora_salida } = req.body;
    if (!nombre || !hora_entrada || !hora_salida) return R.clientError(res, 'nombre, hora_entrada y hora_salida son requeridos');
    const result = await svc.create(req.body);
    await logAction(req, 'CREATE', 'turnos', result.id_turno);
    return R.created(res, result);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const result = await svc.update(req.params.id, req.body);
    if (!result.affected) return R.notFound(res, 'Turno no encontrado');
    await logAction(req, 'UPDATE', 'turnos', req.params.id);
    return R.success(res, null, 'Turno actualizado');
  } catch (err) { next(err); }
}

async function toggleEstado(req, res, next) {
  try {
    const activo = Number(req.body.activo ?? 1);
    const result = await svc.toggleEstado(req.params.id, activo);
    if (!result.affected) return R.notFound(res, 'Turno no encontrado');
    await logAction(req, activo ? 'ACTIVATE' : 'DEACTIVATE', 'turnos', req.params.id);
    return R.success(res, null, 'Estado actualizado');
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, toggleEstado };
