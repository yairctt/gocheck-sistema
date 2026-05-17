'use strict';
const { queryReplica } = require('../config/database');
const R = require('../utils/response');

async function list(req, res, next) {
  try {
    const { page, perPage, offset } = R.parsePagination(req.query);
    const { search, fecha, accion } = req.query;

    const where  = [];
    const params = [];
    if (search) { where.push('(u.username LIKE ? OR b.accion LIKE ? OR b.detalle LIKE ?)'); const s = `%${search}%`; params.push(s,s,s); }
    if (fecha)  { where.push('DATE(b.fecha_hora) = ?'); params.push(fecha); }
    if (accion) { where.push('b.accion = ?'); params.push(accion); }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await queryReplica(
      `SELECT COUNT(*) AS total FROM bitacora_accesos b JOIN usuarios u ON u.id_usuario = b.id_usuario ${whereSQL}`, params
    );

    const [rows] = await queryReplica(
      `SELECT b.id_bitacora, b.accion, b.entidad, b.id_entidad, b.detalle, b.ip, b.fecha_hora,
              u.username
       FROM bitacora_accesos b
       JOIN usuarios u ON u.id_usuario = b.id_usuario
       ${whereSQL}
       ORDER BY b.fecha_hora DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(perPage), Number(offset)]
    );

    return R.paginated(res, rows, total, page, perPage);
  } catch (err) { next(err); }
}

module.exports = { list };
