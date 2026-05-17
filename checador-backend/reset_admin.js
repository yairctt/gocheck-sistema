'use strict';
/**
 * reset_admin.js
 * Muestra los usuarios existentes y crea/resetea al usuario admin con contraseña conocida.
 * Uso: node reset_admin.js
 */
require('dotenv').config();
const { queryMaster } = require('./config/database');
const bcrypt = require('bcryptjs');

const NEW_PASSWORD = 'admin123';

async function run() {
  console.log('\n── Usuarios actuales en la BD ──────────────────────────────');
  const [users] = await queryMaster(
    'SELECT id_usuario, username, rol, activo, intentos_fallidos, bloqueado_hasta FROM usuarios'
  );

  if (!users.length) {
    console.log('  ⚠  No hay usuarios en la tabla usuarios.');
  } else {
    users.forEach(u => {
      console.log(`  - id=${u.id_usuario}  username="${u.username}"  rol=${u.rol}  activo=${u.activo}  intentos=${u.intentos_fallidos}  bloqueado_hasta=${u.bloqueado_hasta || 'null'}`);
    });
  }

  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  // Verificar si existe usuario admin
  const adminUser = users.find(u => u.username === 'admin');

  if (adminUser) {
    await queryMaster(
      `UPDATE usuarios
       SET password_hash = ?, intentos_fallidos = 0, bloqueado_hasta = NULL, activo = 1
       WHERE username = 'admin'`,
      [hash]
    );
    console.log(`\n✅ Usuario "admin" actualizado.`);
  } else {
    // Insertar nuevo usuario admin
    await queryMaster(
      `INSERT INTO usuarios (username, password_hash, rol, activo, intentos_fallidos)
       VALUES ('admin', ?, 'admin', 1, 0)`,
      [hash]
    );
    console.log(`\n✅ Usuario "admin" creado.`);
  }

  console.log(`\n🔑 Credenciales para iniciar sesión:`);
  console.log(`   Usuario:    admin`);
  console.log(`   Contraseña: ${NEW_PASSWORD}`);
  console.log(`   URL:        http://localhost:8080/login.html\n`);

  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
