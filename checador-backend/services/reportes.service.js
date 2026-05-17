'use strict';
const { queryReplica } = require('../config/database');

async function getResumenDiario({ fecha_ini, fecha_fin, id_departamento, incidencia, page, perPage, offset }) {
  const where  = [];
  const params = [];

  if (fecha_ini) { where.push('v.fecha >= ?'); params.push(fecha_ini); }
  if (fecha_fin) { where.push('v.fecha <= ?'); params.push(fecha_fin); }
  if (id_departamento) { where.push('v.departamento = (SELECT nombre FROM departamentos WHERE id_departamento = ?)'); params.push(id_departamento); }
  if (incidencia)      { where.push('v.incidencia = ?'); params.push(incidencia); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [[{ total }]] = await queryReplica(
    `SELECT COUNT(*) AS total FROM v_resumen_diario v ${whereSQL}`, params
  );

  const [rows] = await queryReplica(
    `SELECT v.* FROM v_resumen_diario v ${whereSQL}
     ORDER BY v.fecha DESC, v.nombre_completo
     LIMIT ? OFFSET ?`,
    [...params, Number(perPage), Number(offset)]
  );

  return { data: rows, total };
}

module.exports = { getResumenDiario };
