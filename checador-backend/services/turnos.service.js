'use strict';
const { queryMaster, queryReplica } = require('../config/database');

async function list({ activo } = {}) {
  const where  = activo !== undefined && activo !== '' ? 'WHERE activo = ?' : '';
  const params = activo !== undefined && activo !== '' ? [activo] : [];
  const [rows] = await queryReplica(`SELECT * FROM turnos ${where} ORDER BY hora_entrada`, params);
  return rows;
}

async function getById(id) {
  const [rows] = await queryReplica('SELECT * FROM turnos WHERE id_turno = ?', [id]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await queryMaster(
    `INSERT INTO turnos (nombre, hora_entrada, hora_salida, tolerancia_min, descripcion)
     VALUES (?, ?, ?, ?, ?)`,
    [data.nombre, data.hora_entrada, data.hora_salida, data.tolerancia_min || 10, data.descripcion || null]
  );
  return { id_turno: result.insertId };
}

async function update(id, data) {
  const fields = [];
  const params = [];
  const allowed = ['nombre','hora_entrada','hora_salida','tolerancia_min','descripcion'];
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
  }
  if (!fields.length) return { affected: 0 };
  params.push(id);
  const [result] = await queryMaster(`UPDATE turnos SET ${fields.join(', ')} WHERE id_turno = ?`, params);
  return { affected: result.affectedRows };
}

async function toggleEstado(id, activo) {
  const [result] = await queryMaster('UPDATE turnos SET activo = ? WHERE id_turno = ?', [activo, id]);
  return { affected: result.affectedRows };
}

module.exports = { list, getById, create, update, toggleEstado };
