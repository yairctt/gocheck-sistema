const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { queryMaster } = require('./config/database');

async function run() {
  try {
    console.log('Migrando vista v_movimientos_hoy...');
    await queryMaster(`
      CREATE OR REPLACE VIEW v_movimientos_hoy AS
      SELECT 
        m.id_movimiento,
        m.fecha_hora,
        m.metodo_registro,
        m.dispositivo,
        e.numero_empleado,
        CONCAT(e.nombre, ' ', e.apellido_paterno, IF(e.apellido_materno IS NOT NULL, CONCAT(' ', e.apellido_materno), '')) AS nombre_completo,
        e.foto_url,
        p.nombre AS puesto,
        d.nombre AS departamento,
        tm.clave AS tipo_clave,
        tm.nombre AS tipo_nombre,
        CASE 
          WHEN tm.clave = 'ENTRADA' AND TIME(m.fecha_hora) > ADDTIME(COALESCE(dl.hora_entrada, t.hora_entrada), SEC_TO_TIME(e.tolerancia_min * 60)) THEN 1 
          ELSE 0 
        END AS es_retardo
      FROM movimientos m
      JOIN empleados e ON e.id_empleado = m.id_empleado
      JOIN puestos p ON p.id_puesto = e.id_puesto
      JOIN departamentos d ON d.id_departamento = p.id_departamento
      JOIN tipos_movimiento tm ON tm.id_tipo_movimiento = m.id_tipo_movimiento
      JOIN turnos t ON t.id_turno = e.id_turno
      LEFT JOIN dias_laborales dl ON dl.id_empleado = e.id_empleado AND dl.dia_semana = WEEKDAY(CURDATE()) + 1 AND dl.activo = 1
      WHERE m.fecha = CURDATE()
      ORDER BY m.fecha_hora DESC
    `);
    console.log('✓ Vista v_movimientos_hoy migrada con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al migrar la vista:', err);
    process.exit(1);
  }
}

run();
