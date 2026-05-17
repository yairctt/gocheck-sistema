'use strict';
const movSvc = require('../services/movimientos.service');
const R      = require('../utils/response');

async function kpis(req, res, next) {
  try {
    const data = await movSvc.getKpis();
    return R.success(res, data);
  } catch (err) { next(err); }
}

async function movimientosHoy(req, res, next) {
  try {
    const { search, id_departamento, tipo, limit } = req.query;
    const data = await movSvc.getMovimientosHoy({ search, id_departamento, tipo, limit });
    return R.success(res, data);
  } catch (err) { next(err); }
}

async function noLlegados(req, res, next) {
  try {
    const data = await movSvc.getNoLlegadosHoy();
    return R.success(res, data);
  } catch (err) { next(err); }
}

module.exports = { kpis, movimientosHoy, noLlegados };
