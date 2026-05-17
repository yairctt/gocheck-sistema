require('dotenv').config({ path: 'd:/Check/checador-backend/.env' });
const { queryReplica } = require('d:/Check/checador-backend/config/database');

async function test() {
  try {
    const [mov] = await queryReplica('SELECT * FROM movimientos ORDER BY fecha_hora DESC LIMIT 1');
    console.log('Movimientos:', mov);
    const [bit] = await queryReplica('SELECT * FROM bitacora_accesos ORDER BY fecha_hora DESC LIMIT 5');
    console.log('Bitacora:', bit);
    const [rep] = await queryReplica('SELECT * FROM v_resumen_diario ORDER BY fecha DESC LIMIT 1');
    console.log('Resumen diario:', rep);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
