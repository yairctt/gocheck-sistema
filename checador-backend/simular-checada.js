const { queryMaster } = require('./config/database');
require('dotenv').config();

// =========================================================================
// 🧪 CONFIGURA TU PRUEBA AQUÍ:
// =========================================================================
const NUMERO_EMPLEADO      = 'EMP-028';  // Código del empleado (ej. HUGO)
const TIPO_MOVIMIENTO      = 'ENTRADA';     // ENTRADA, SALIDA, SALIDA_COMIDA, REGRESO_COMIDA
const FECHA_HORA_SIMULADA  = '2026-05-16 23:15:00'; // YYYY-MM-DD HH:mm:ss
// =========================================================================

async function simular() {
  try {
    // 1. Obtener ID del empleado
    const [empRows] = await queryMaster(
      'SELECT id_empleado, nombre FROM empleados WHERE numero_empleado = ? AND activo = 1',
      [NUMERO_EMPLEADO]
    );
    if (!empRows.length) {
      console.error(`❌ Error: El empleado con código "${NUMERO_EMPLEADO}" no existe o está inactivo.`);
      process.exit(1);
    }
    const { id_empleado, nombre } = empRows[0];

    // 2. Obtener ID del tipo de movimiento
    const [tipoRows] = await queryMaster(
      'SELECT id_tipo_movimiento FROM tipos_movimiento WHERE clave = ?',
      [TIPO_MOVIMIENTO]
    );
    if (!tipoRows.length) {
      console.error(`❌ Error: El tipo de movimiento "${TIPO_MOVIMIENTO}" no es válido (usa ENTRADA, SALIDA, etc.).`);
      process.exit(1);
    }
    const { id_tipo_movimiento } = tipoRows[0];

    const fecha = FECHA_HORA_SIMULADA.split(' ')[0];

    console.log(`\n🚀 Iniciando simulación para ${nombre} (${NUMERO_EMPLEADO})...`);

    // 3. Insertar movimiento con la hora simulada
    const [result] = await queryMaster(
      `INSERT INTO movimientos (id_empleado, id_tipo_movimiento, fecha_hora, metodo_registro, dispositivo) 
       VALUES (?, ?, ?, 'pin', 'Terminal-Simulador')`,
      [id_empleado, id_tipo_movimiento, FECHA_HORA_SIMULADA]
    );
    console.log(`   ✓ Checada insertada correctamente (ID Movimiento: ${result.insertId})`);
    console.log(`   ✓ Hora registrada: ${FECHA_HORA_SIMULADA}`);

    // 4. Recalcular el resumen diario para ese día
    await queryMaster('CALL sp_generar_resumen_dia(?)', [fecha]);
    console.log(`   ✓ Resumen diario recalculado con éxito para el día: ${fecha}`);

    console.log('\n🎉 ¡Simulación completada con éxito!');
    console.log('   Ya puedes ir a tu navegador, recargar el Dashboard o los Reportes y verás el resultado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error durante la simulación:', err);
    process.exit(1);
  }
}

simular();
