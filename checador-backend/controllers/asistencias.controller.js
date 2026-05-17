'use strict';
const { queryReplica } = require('../config/database');
const R = require('../utils/response');

async function list(req, res, next) {
  try {
    const { search, fecha, id_departamento, tipo, page: pageQ, per_page } = req.query;
    const { page, perPage, offset } = R.parsePagination(req.query);

    const where  = [];
    const params = [];

    if (fecha) { where.push('m.fecha = ?'); params.push(fecha); }

    if (search) {
      where.push('(e.nombre LIKE ? OR e.apellido_paterno LIKE ? OR e.numero_empleado LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (id_departamento) { where.push('d.id_departamento = ?'); params.push(id_departamento); }
    if (tipo)            { where.push('tm.clave = ?');          params.push(tipo); }

    const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await queryReplica(
      `SELECT COUNT(*) AS total
       FROM movimientos m
       JOIN empleados e ON e.id_empleado = m.id_empleado
       JOIN puestos p ON p.id_puesto = e.id_puesto
       JOIN departamentos d ON d.id_departamento = p.id_departamento
       JOIN tipos_movimiento tm ON tm.id_tipo_movimiento = m.id_tipo_movimiento
       ${whereSQL}`, params
    );

    const [rows] = await queryReplica(
      `SELECT m.id_movimiento, m.fecha_hora, m.metodo_registro, m.dispositivo,
              e.numero_empleado,
              CONCAT(e.nombre,' ',e.apellido_paterno) AS nombre_completo,
              p.nombre AS puesto, d.nombre AS departamento,
              tm.clave AS tipo_clave, tm.nombre AS tipo_nombre
       FROM movimientos m
       JOIN empleados e ON e.id_empleado = m.id_empleado
       JOIN puestos p ON p.id_puesto = e.id_puesto
       JOIN departamentos d ON d.id_departamento = p.id_departamento
       JOIN tipos_movimiento tm ON tm.id_tipo_movimiento = m.id_tipo_movimiento
       ${whereSQL}
       ORDER BY m.fecha_hora DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(perPage), Number(offset)]
    );

    return R.paginated(res, rows, total, page, perPage);
  } catch (err) { next(err); }
}

module.exports = { list };
