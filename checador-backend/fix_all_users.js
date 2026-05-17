const { queryMaster } = require('./config/database');
const bcrypt = require('bcryptjs');

async function fix() {
  try {
    const hash = await bcrypt.hash('Admin2024!', 12);
    await queryMaster('UPDATE usuarios SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL, activo = 1', [hash]);
    console.log('All users password override successful with genuine hash!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fix();
