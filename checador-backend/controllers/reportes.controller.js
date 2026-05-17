'use strict';
const svc    = require('../services/reportes.service');
const movSvc = require('../services/movimientos.service');
const R      = require('../utils/response');

async function resumen(req, res, next) {
  try {
    const { page, perPage, offset } = R.parsePagination(req.query);
    const result = await svc.getResumenDiario({ ...req.query, page, perPage, offset });
    return R.paginated(res, result.data, result.total, page, perPage);
  } catch (err) { next(err); }
}

async function generarResumen(req, res, next) {
  try {
    const fecha = req.body.fecha || new Date().toISOString().split('T')[0];
    const result = await movSvc.generarResumenDia(fecha);
    return R.success(res, result, `Resumen generado para ${fecha}`);
  } catch (err) { next(err); }
}

module.exports = { resumen, generarResumen };
