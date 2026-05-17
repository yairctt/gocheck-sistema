'use strict';
const movSvc = require('../services/movimientos.service');
const R      = require('../utils/response');

async function identificar(req, res, next) {
  try {
    const { token, metodo = 'qr' } = req.body;
    if (!token) return R.clientError(res, 'Token de identificación requerido');

    const emp = await movSvc.identificarEmpleado(token, metodo);
    if (!emp) return R.notFound(res, 'Empleado no encontrado o inactivo');

    return R.success(res, emp);
  } catch (err) {
    if (err.status === 400) return R.clientError(res, err.message);
    next(err);
  }
}

async function registrar(req, res, next) {
  try {
    const { qr_token, tipo_movimiento, dispositivo, metodo_registro } = req.body;

    if (!qr_token)        return R.clientError(res, 'qr_token es requerido');
    if (!tipo_movimiento) return R.clientError(res, 'tipo_movimiento es requerido');

    const tipos_validos = ['ENTRADA','SALIDA','SALIDA_COMIDA','REGRESO_COMIDA','PERMISO'];
    if (!tipos_validos.includes(tipo_movimiento))
      return R.clientError(res, `tipo_movimiento inválido. Válidos: ${tipos_validos.join(', ')}`);

    const result = await movSvc.registrarChecada({
      qr_token,
      tipo_movimiento,
      dispositivo:     dispositivo || 'Terminal',
      metodo_registro: metodo_registro || 'qr',
    });

    if (result.codigo !== 0) {
      return R.clientError(res, result.mensaje || 'Error al registrar checada', 422);
    }

    return R.success(res, { id_movimiento: result.id_movimiento }, result.mensaje);
  } catch (err) { next(err); }
}

module.exports = { identificar, registrar };
