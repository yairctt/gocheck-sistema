require('dotenv').config({ path: 'd:/Check/checador-backend/.env' });
const { queryReplica } = require('d:/Check/checador-backend/config/database');
const movSvc = require('d:/Check/checador-backend/services/movimientos.service');

async function test() {
  try {
    // 1. Obtener empleados activos
    const [employees] = await queryReplica(`
      SELECT id_empleado, numero_empleado, qr_token, CONCAT(nombre, ' ', apellido_paterno) AS nombre_completo 
      FROM empleados 
      WHERE activo = 1 
      LIMIT 3
    `);
    console.log('--- Empleados Activos ---');
    console.log(employees);

    if (employees.length === 0) {
      console.log('No se encontraron empleados activos.');
      process.exit(0);
    }

    const testEmp = employees[0];
    console.log(`\n--- Probando identificarEmpleado para ${testEmp.nombre_completo} ---`);
    
    // Probar identificar por PIN
    const resultPin = await movSvc.identificarEmpleado(testEmp.numero_empleado, 'pin');
    console.log('Resultado por PIN:', resultPin);

    // Probar identificar por QR
    const resultQr = await movSvc.identificarEmpleado(testEmp.qr_token, 'qr');
    console.log('Resultado por QR:', resultQr);

    // Intentar registrar una checada duplicada de prueba (simulada)
    console.log(`\n--- Probando registrarChecada duplicada de tipo ENTRADA para token ${testEmp.qr_token} ---`);
    
    // Primero, veamos si ya tiene una ENTRADA hoy
    if (resultPin.movimientos_hoy && resultPin.movimientos_hoy.includes('ENTRADA')) {
      console.log('El empleado ya tiene ENTRADA hoy. Intentando registrar otra ENTRADA...');
      const registerResult = await movSvc.registrarChecada({
        qr_token: testEmp.qr_token,
        tipo_movimiento: 'ENTRADA',
        dispositivo: 'Test-Script',
        metodo_registro: 'qr'
      });
      console.log('Resultado de registro duplicado:', registerResult);
    } else {
      console.log('El empleado no tiene ENTRADA hoy en este momento de la prueba.');
    }

    process.exit(0);
  } catch (e) {
    console.error('Error durante la prueba:', e);
    process.exit(1);
  }
}
test();
