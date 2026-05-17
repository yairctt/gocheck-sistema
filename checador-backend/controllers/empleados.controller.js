'use strict';
const svc = require('../services/empleados.service');
const R   = require('../utils/response');
const { logAction } = require('../utils/audit');

async function list(req, res, next) {
  try {
    const { page, perPage, offset } = R.parsePagination(req.query);
    const result = await svc.list({ ...req.query, page, perPage, offset });
    return R.paginated(res, result.data, result.total, page, perPage);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const emp = await svc.getById(req.params.id);
    if (!emp) return R.notFound(res, 'Empleado no encontrado');
    return R.success(res, emp);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const required = ['nombre', 'apellido_paterno', 'id_puesto', 'id_turno', 'fecha_ingreso'];
    for (const f of required) {
      if (!req.body[f] && req.body[f] !== 0) return R.clientError(res, `El campo "${f}" es requerido`);
    }

    // Sanitización de campos numéricos: si vienen vacíos, eliminarlos para no intentar insertar NULL
    const numericFields = ['id_puesto', 'id_turno', 'tolerancia_min'];
    numericFields.forEach(f => {
      if (req.body[f] === '') delete req.body[f];
    });
    const result = await svc.create(req.body);
    await logAction(req, 'CREATE', 'empleados', result.id_empleado);
    return R.created(res, result);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    // Sanitización de campos numéricos: si vienen vacíos, eliminarlos para no intentar insertar NULL
    const numericFields = ['id_puesto', 'id_turno', 'tolerancia_min'];
    numericFields.forEach(f => {
      if (req.body[f] === '') delete req.body[f];
    });

    const result = await svc.update(req.params.id, req.body);
    if (!result.affected) return R.notFound(res, 'Empleado no encontrado');
    await logAction(req, 'UPDATE', 'empleados', req.params.id);
    return R.success(res, null, 'Empleado actualizado');
  } catch (err) { next(err); }
}

async function toggleEstado(req, res, next) {
  try {
    const activo = req.body.activo !== undefined ? Number(req.body.activo) : null;
    if (activo === null) return R.clientError(res, 'Campo "activo" requerido (0 o 1)');
    const result = await svc.toggleEstado(req.params.id, activo);
    if (!result.affected) return R.notFound(res, 'Empleado no encontrado');
    await logAction(req, activo ? 'ACTIVATE' : 'DEACTIVATE', 'empleados', req.params.id);
    return R.success(res, null, `Empleado ${activo ? 'activado' : 'desactivado'}`);
  } catch (err) { next(err); }
}

async function getQr(req, res, next) {
  try {
    const emp = await svc.getQrToken(req.params.id);
    if (!emp) return R.notFound(res, 'Empleado no encontrado');
    return R.success(res, { qr_token: emp.qr_token, nombre_completo: `${emp.nombre} ${emp.apellido_paterno}`, numero_empleado: emp.numero_empleado });
  } catch (err) { next(err); }
}

async function getHorario(req, res, next) {
  try {
    const dias = await svc.getHorario(req.params.id);
    return R.success(res, dias);
  } catch (err) { next(err); }
}

async function saveHorario(req, res, next) {
  try {
    const { dias } = req.body;
    if (!Array.isArray(dias)) return R.clientError(res, 'Se esperaba un array "dias"');
    await svc.saveHorario(req.params.id, dias);
    await logAction(req, 'UPDATE_HORARIO', 'dias_laborales', req.params.id);
    return R.success(res, null, 'Horario guardado correctamente');
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, toggleEstado, getQr, getHorario, saveHorario };
