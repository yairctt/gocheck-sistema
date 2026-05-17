'use strict';
const { queryMaster, queryReplica } = require('../config/database');
const crypto = require('crypto');

// ── Listar con filtros y paginación ──────────────────────────────────

async function list({ search, id_departamento, activo, page, perPage, offset }) {
  const where  = [];
  const params = [];

  if (search) {
    where.push(`(e.nombre LIKE ? OR e.apellido_paterno LIKE ? OR e.numero_empleado LIKE ?)`);
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (id_departamento) { where.push('d.id_departamento = ?');  params.push(id_departamento); }
  if (activo !== undefined && activo !== '') { where.push('e.activo = ?'); params.push(Number(activo)); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const countSQL = `
    SELECT COUNT(*) AS total
    FROM empleados e
    JOIN puestos p ON p.id_puesto = e.id_puesto
    JOIN departamentos d ON d.id_departamento = p.id_departamento
    ${whereSQL}`;

  const dataSQL = `
    SELECT
      e.id_empleado, e.numero_empleado, e.nombre, e.apellido_paterno, e.apellido_materno,
      e.telefono, e.correo, e.foto_url, e.metodo_checada, e.activo,
      e.fecha_ingreso, e.id_puesto, e.id_turno,
      p.nombre  AS puesto_nombre,
      d.id_departamento, d.nombre AS departamento_nombre,
      t.nombre  AS turno_nombre
    FROM empleados e
    JOIN puestos      p ON p.id_puesto        = e.id_puesto
    JOIN departamentos d ON d.id_departamento = p.id_departamento
    JOIN turnos       t ON t.id_turno         = e.id_turno
    ${whereSQL}
    ORDER BY e.apellido_paterno, e.nombre
    LIMIT ? OFFSET ?`;

  const [[{ total }]] = await queryReplica(countSQL, params);
  const [rows]        = await queryReplica(dataSQL,  [...params, Number(perPage), Number(offset)]);

  // Normalizar para el frontend
  const data = rows.map(r => ({
    id_empleado:      r.id_empleado,
    numero_empleado:  r.numero_empleado,
    nombre:           r.nombre,
    apellido_paterno: r.apellido_paterno,
    apellido_materno: r.apellido_materno,
    telefono:         r.telefono,
    correo:           r.correo,
    foto_url:         r.foto_url,
    metodo_checada:   r.metodo_checada,
    activo:           r.activo,
    fecha_ingreso:    r.fecha_ingreso,
    id_puesto:        r.id_puesto,
    id_turno:         r.id_turno,
    puesto:           { id_puesto: r.id_puesto, nombre: r.puesto_nombre },
    departamento:     { id_departamento: r.id_departamento, nombre: r.departamento_nombre },
    turno:            { id_turno: r.id_turno, nombre: r.turno_nombre },
  }));

  return { data, total };
}

// ── Obtener por ID ────────────────────────────────────────────────────

async function getById(id) {
  const [rows] = await queryReplica(
    `SELECT e.*, p.nombre AS puesto_nombre, d.nombre AS departamento_nombre, t.nombre AS turno_nombre
     FROM empleados e
     JOIN puestos p ON p.id_puesto = e.id_puesto
     JOIN departamentos d ON d.id_departamento = p.id_departamento
     JOIN turnos t ON t.id_turno = e.id_turno
     WHERE e.id_empleado = ?`,
    [id]
  );
  return rows[0] || null;
}

// ── Crear ─────────────────────────────────────────────────────────────

async function create(data) {
  // El sistema decide automáticamente el número de empleado si no se proporciona o viene como 'Autogenerado'
  if (!data.numero_empleado || data.numero_empleado === 'Autogenerado') {
    const [rows] = await queryReplica(
      `SELECT numero_empleado FROM empleados 
       WHERE numero_empleado LIKE 'EMP-%' 
       ORDER BY CAST(SUBSTRING(numero_empleado, 5) AS UNSIGNED) DESC LIMIT 1`
    );
    let nextNum = 1;
    if (rows.length && rows[0].numero_empleado) {
      const lastNumStr = rows[0].numero_empleado.substring(4);
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    data.numero_empleado = `EMP-${String(nextNum).padStart(3, '0')}`;
  }

  const qrToken = crypto.randomBytes(24).toString('hex');
  const [result] = await queryMaster(
    `INSERT INTO empleados
      (id_puesto, id_turno, numero_empleado, nombre, apellido_paterno, apellido_materno,
       fecha_ingreso, hora_entrada, hora_salida, tolerancia_min,
       telefono, correo, foto_url, qr_token, metodo_checada)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.id_puesto, data.id_turno, data.numero_empleado,
      data.nombre, data.apellido_paterno, data.apellido_materno || null,
      data.fecha_ingreso,
      data.hora_entrada || '08:00:00',
      data.hora_salida  || '17:00:00',
      data.tolerancia_min || 10,
      data.telefono || null, data.correo || null, data.foto_url || null,
      qrToken, data.metodo_checada || 'qr',
    ]
  );
  return { id_empleado: result.insertId, qr_token: qrToken };
}

// ── Actualizar ────────────────────────────────────────────────────────

async function update(id, data) {
  const fields = [];
  const params = [];

  const allowed = [
    'nombre','apellido_paterno','apellido_materno','id_puesto','id_turno',
    'numero_empleado','telefono','correo','foto_url','metodo_checada',
    'fecha_ingreso','hora_entrada','hora_salida','tolerancia_min',
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
  }

  if (!fields.length) return { affected: 0 };
  params.push(id);

  const [result] = await queryMaster(
    `UPDATE empleados SET ${fields.join(', ')} WHERE id_empleado = ?`,
    params
  );
  return { affected: result.affectedRows };
}

// ── Cambiar estado ────────────────────────────────────────────────────

async function toggleEstado(id, activo) {
  const [result] = await queryMaster(
    'UPDATE empleados SET activo = ?, fecha_baja = ? WHERE id_empleado = ?',
    [activo, activo ? null : new Date(), id]
  );
  return { affected: result.affectedRows };
}

// ── QR token ──────────────────────────────────────────────────────────

async function getQrToken(id) {
  const [rows] = await queryMaster(
    'SELECT qr_token, numero_empleado, nombre, apellido_paterno FROM empleados WHERE id_empleado = ?',
    [id]
  );
  return rows[0] || null;
}

// ── Regenerar QR ──────────────────────────────────────────────────────

async function regenerateQr(id) {
  const newToken = crypto.randomBytes(24).toString('hex');
  await queryMaster('UPDATE empleados SET qr_token = ? WHERE id_empleado = ?', [newToken, id]);
  return newToken;
}

// ── Horario semanal (dias_laborales) ──────────────────────────────────

async function getHorario(id) {
  const [rows] = await queryReplica(
    'SELECT * FROM dias_laborales WHERE id_empleado = ? ORDER BY dia_semana',
    [id]
  );
  
  const [[emp]] = await queryReplica(
    'SELECT t.hora_entrada, t.hora_salida FROM empleados e JOIN turnos t ON e.id_turno = t.id_turno WHERE e.id_empleado = ?',
    [id]
  );

  return { 
    dias_laborales: rows, 
    turno_base: emp ? { hora_entrada: emp.hora_entrada, hora_salida: emp.hora_salida } : null 
  };
}

async function saveHorario(id, dias) {
  // Borrar y reinsertar (simple y limpio para pocos registros)
  await queryMaster('DELETE FROM dias_laborales WHERE id_empleado = ?', [id]);

  if (!dias.length) return;

  const values = dias.map(d => [id, d.dia_semana, d.hora_entrada, d.hora_salida, d.activo ?? 1]);
  await queryMaster(
    `INSERT INTO dias_laborales (id_empleado, dia_semana, hora_entrada, hora_salida, activo)
     VALUES ?`,
    [values]
  );
}

module.exports = { list, getById, create, update, toggleEstado, getQrToken, regenerateQr, getHorario, saveHorario };
