'use strict';
const { queryMaster, queryReplica } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Identifica un empleado por token (QR), número de empleado (PIN) o hash de huella.
 */
async function identificarEmpleado(token, metodo) {
  let sql;
  if (metodo === 'qr') {
    sql = `SELECT id_empleado, numero_empleado, qr_token,
                  CONCAT(nombre,' ',apellido_paterno) AS nombre_completo,
                  foto_url, metodo_checada,
                  (SELECT nombre FROM puestos WHERE id_puesto = e.id_puesto) AS puesto
           FROM empleados e
           WHERE qr_token = ? AND activo = 1 LIMIT 1`;
  } else if (metodo === 'pin') {
    sql = `SELECT id_empleado, numero_empleado, qr_token,
                  CONCAT(nombre,' ',apellido_paterno) AS nombre_completo,
                  foto_url, metodo_checada,
                  (SELECT nombre FROM puestos WHERE id_puesto = e.id_puesto) AS puesto
           FROM empleados e
           WHERE numero_empleado = ? AND activo = 1 LIMIT 1`;
  } else if (metodo === 'huella') {
    sql = `SELECT id_empleado, numero_empleado, qr_token,
                  CONCAT(nombre,' ',apellido_paterno) AS nombre_completo,
                  foto_url, metodo_checada,
                  (SELECT nombre FROM puestos WHERE id_puesto = e.id_puesto) AS puesto
           FROM empleados e
           WHERE huella_hash = ? AND activo = 1 LIMIT 1`;
  } else {
    throw Object.assign(new Error('Método de identificación inválido'), { status: 400 });
  }

  const [rows] = await queryReplica(sql, [token]);
  const emp = rows[0] || null;

  if (emp) {
    // Consultar qué movimientos ya realizó el empleado el día de hoy
    const [movs] = await queryReplica(`
      SELECT tm.clave 
      FROM movimientos m
      JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
      WHERE m.id_empleado = ? AND m.fecha = CURDATE()
    `, [emp.id_empleado]);
    emp.movimientos_hoy = movs.map(m => m.clave);
  }

  return emp;
}

/**
 * Registra una checada ejecutando sp_registrar_checada.
 * Retorna { id_movimiento, codigo, mensaje }
 */
async function registrarChecada({ qr_token, tipo_movimiento, dispositivo, metodo_registro }) {
  // Primero validar si ya existe ese tipo de movimiento hoy para este empleado
  const [empRows] = await queryReplica(
    `SELECT id_empleado FROM empleados WHERE qr_token = ? AND activo = 1 LIMIT 1`,
    [qr_token]
  );
  if (!empRows.length) {
    return { codigo: 1, mensaje: 'Empleado no encontrado o inactivo' };
  }
  const id_empleado = empRows[0].id_empleado;

  // Validar si es uno de los movimientos que solo se pueden hacer una vez al día
  const [existing] = await queryReplica(`
    SELECT m.id_movimiento 
    FROM movimientos m
    JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
    WHERE m.id_empleado = ? AND m.fecha = CURDATE() AND tm.clave = ?
    LIMIT 1
  `, [id_empleado, tipo_movimiento]);

  if (existing.length > 0) {
    const nombresLabels = {
      ENTRADA: 'Entrada de inicio de jornada',
      SALIDA: 'Salida de fin de jornada',
      SALIDA_COMIDA: 'Salida a comida',
      REGRESO_COMIDA: 'Regreso de comida'
    };
    const label = nombresLabels[tipo_movimiento] || tipo_movimiento;
    return { codigo: 2, mensaje: `Ya has registrado tu ${label} el día de hoy.` };
  }

  const conn = await require('../config/database').masterPool.getConnection();
  try {
    // Llamar SP con parámetros OUT usando variables de sesión
    await conn.query(
      `CALL sp_registrar_checada(?, ?, ?, ?, @p_id_movimiento, @p_codigo, @p_mensaje)`,
      [qr_token, tipo_movimiento, dispositivo || null, metodo_registro || 'qr']
    );

    const [outRows] = await conn.query(
      'SELECT @p_id_movimiento AS id_movimiento, @p_codigo AS codigo, @p_mensaje AS mensaje'
    );

    const result = outRows[0];
    logger.info('[Checador] Checada registrada', {
      qr_token,
      tipo_movimiento,
      codigo: result.codigo,
      mensaje: result.mensaje,
    });

    return result;
  } finally {
    conn.release();
  }
}

/**
 * Ejecuta sp_generar_resumen_dia para una fecha dada.
 */
async function generarResumenDia(fecha) {
  const conn = await require('../config/database').masterPool.getConnection();
  try {
    await conn.query('CALL sp_generar_resumen_dia(?)', [fecha]);
    return { ok: true, fecha };
  } finally {
    conn.release();
  }
}

/**
 * KPIs del dashboard para hoy.
 */
async function getKpis() {
  const [[kpis]] = await queryReplica(`
    SELECT
      e.empleados_activos,
      m.entradas_hoy,
      (SELECT COUNT(*) FROM movimientos mov
         JOIN empleados emp ON mov.id_empleado = emp.id_empleado
         JOIN turnos t ON emp.id_turno = t.id_turno
         LEFT JOIN dias_laborales dl ON dl.id_empleado = emp.id_empleado AND dl.dia_semana = WEEKDAY(CURDATE()) + 1 AND dl.activo = 1
         WHERE mov.fecha = CURDATE()
           AND mov.id_tipo_movimiento = (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE clave='ENTRADA')
           AND TIME(mov.fecha_hora) > ADDTIME(COALESCE(dl.hora_entrada, t.hora_entrada), SEC_TO_TIME(t.tolerancia_min * 60))
      ) AS retardos,
      (e.empleados_activos - m.entradas_hoy - p.permisos_hoy) AS faltas
    FROM 
      (SELECT COUNT(*) AS empleados_activos FROM empleados WHERE activo = 1) e,
      (SELECT COUNT(DISTINCT id_empleado) AS entradas_hoy FROM movimientos WHERE fecha = CURDATE() AND id_tipo_movimiento = (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE clave='ENTRADA')) m,
      (SELECT COUNT(DISTINCT s.id_empleado) AS permisos_hoy FROM solicitudes s 
         WHERE s.id_estatus = (SELECT id_estatus FROM estatus_solicitud WHERE clave = 'APROBADO' LIMIT 1)
           AND CURDATE() BETWEEN s.fecha_inicio AND s.fecha_fin
           AND s.id_empleado NOT IN (SELECT id_empleado FROM movimientos WHERE fecha = CURDATE() AND id_tipo_movimiento = (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE clave='ENTRADA'))
      ) p
  `);
  return kpis;
}

/**
 * Movimientos de hoy (vista v_movimientos_hoy) con filtros opcionales.
 */
async function getMovimientosHoy({ search, id_departamento, tipo, limit = 100 }) {
  const where  = [];
  const params = [];

  if (search) {
    where.push('(v.nombre_completo LIKE ? OR v.numero_empleado LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s);
  }
  if (id_departamento) { where.push('v.departamento LIKE ?'); params.push(`%${id_departamento}%`); }
  if (tipo)            { where.push('v.tipo_clave = ?');      params.push(tipo); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [rows] = await queryReplica(
    `SELECT * FROM v_movimientos_hoy ${whereSQL} ORDER BY fecha_hora DESC LIMIT ?`,
    [...params, Number(limit)]
  );
  return rows;
}

/**
 * Obtiene la lista de empleados activos que no han registrado ENTRADA hoy.
 */
async function getNoLlegadosHoy() {
  const [rows] = await queryReplica(`
    SELECT 
      e.id_empleado, 
      e.numero_empleado, 
      CONCAT(e.nombre, ' ', e.apellido_paterno) AS nombre_completo,
      p.nombre AS puesto,
      d.nombre AS departamento
    FROM empleados e
    JOIN puestos p ON p.id_puesto = e.id_puesto
    JOIN departamentos d ON d.id_departamento = p.id_departamento
    WHERE e.activo = 1
      AND e.id_empleado NOT IN (
        SELECT DISTINCT id_empleado 
        FROM movimientos 
        WHERE fecha = CURDATE() 
          AND id_tipo_movimiento = (SELECT id_tipo_movimiento FROM tipos_movimiento WHERE clave='ENTRADA' LIMIT 1)
      )
      AND e.id_empleado NOT IN (
        SELECT DISTINCT s.id_empleado 
        FROM solicitudes s
        WHERE CURDATE() BETWEEN s.fecha_inicio AND s.fecha_fin
          AND s.id_estatus = (SELECT id_estatus FROM estatus_solicitud WHERE clave = 'APROBADO' LIMIT 1)
      )
    ORDER BY e.apellido_paterno, e.nombre
  `);
  return rows;
}

module.exports = { identificarEmpleado, registrarChecada, generarResumenDia, getKpis, getMovimientosHoy, getNoLlegadosHoy };
