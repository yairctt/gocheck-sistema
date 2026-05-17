'use strict';
/**
 * database.js
 * Gestión de pools de conexión MySQL con soporte Master / Replica.
 *
 * Arquitectura recomendada:
 *   VM1 → MySQL Master  (escrituras: movimientos, sesiones, bitácora…)
 *   VM2 → MySQL Replica (lecturas:   vistas, reportes, consultas…)
 *   VM3 → Backend Node.js
 *
 * El pool MASTER se usa para INSERT / UPDATE / DELETE y stored procedures.
 * El pool REPLICA se usa para SELECT en vistas y reportes.
 * Si la réplica no está configurada de forma diferente al master,
 * ambos pools apuntan al mismo servidor (modo desarrollo / single-node).
 */

const mysql  = require('mysql2/promise');
const config = require('./env');
const logger = require('../utils/logger');

// ── Opciones comunes de conexión ───────────────────────────────────────

const commonOptions = {
  charset:           'utf8mb4',
  timezone:          'local',
  waitForConnections: true,
  queueLimit:        0,
  enableKeepAlive:   true,
  keepAliveInitialDelay: 10000,
  connectTimeout:    10000,
};

// ── Pool MASTER (escritura) ────────────────────────────────────────────

const masterPool = mysql.createPool({
  ...commonOptions,
  host:            config.db.master.host,
  port:            config.db.master.port,
  user:            config.db.master.user,
  password:        config.db.master.password,
  database:        config.db.master.database,
  connectionLimit: config.db.master.connectionLimit,
});

// ── Pool REPLICA (lectura) ─────────────────────────────────────────────

const replicaPool = mysql.createPool({
  ...commonOptions,
  host:            config.db.replica.host,
  port:            config.db.replica.port,
  user:            config.db.replica.user,
  password:        config.db.replica.password,
  database:        config.db.replica.database,
  connectionLimit: config.db.replica.connectionLimit,
});

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Ejecuta una consulta en el pool MASTER (escritura).
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<[rows, fields]>}
 */
async function queryMaster(sql, params = []) {
  try {
    const safeParams = params.map(p => p === undefined ? null : p);
    return await masterPool.query(sql, safeParams);
  } catch (err) {
    logger.error('[DB Master] Error en consulta', { sql: sql.substring(0, 100), error: err.message, params: params });
    throw err;
  }
}

/**
 * Ejecuta una consulta en el pool REPLICA (lectura).
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<[rows, fields]>}
 */
async function queryReplica(sql, params = []) {
  try {
    const safeParams = params.map(p => p === undefined ? null : p);
    return await replicaPool.query(sql, safeParams);
  } catch (err) {
    logger.error('[DB Replica] Error en consulta', { sql: sql.substring(0, 100), error: err.message, params: params });
    throw err;
  }
}

/**
 * Ejecuta un stored procedure en el MASTER.
 * Se usa query() en lugar de execute() porque los SPs con OUT params
 * no son compatibles con prepared statements en mysql2.
 * @param {string} sql   — p.ej. "CALL sp_registrar_checada(?,?,?,?,@id,@codigo,@msg)"
 * @param {Array}  params
 * @returns {Promise<Array>} — primer elemento es el ResultSet del SP
 */
async function callProcedure(sql, params = []) {
  const conn = await masterPool.getConnection();
  try {
    await conn.query(sql, params);
    const [outRows] = await conn.query('SELECT @p_id_movimiento AS id_movimiento, @p_codigo AS codigo, @p_mensaje AS mensaje');
    return outRows[0] || {};
  } finally {
    conn.release();
  }
}

/**
 * Obtiene una conexión del MASTER para transacciones.
 * Recuerda llamar conn.release() al terminar.
 */
async function getConnection() {
  return masterPool.getConnection();
}

// ── Health check ──────────────────────────────────────────────────────

async function testConnections() {
  try {
    await masterPool.execute('SELECT 1');
    logger.info('[DB] Conexión MASTER OK');
  } catch (err) {
    logger.error('[DB] Error conexión MASTER:', err.message);
    process.exit(1);
  }
  try {
    await replicaPool.execute('SELECT 1');
    logger.info('[DB] Conexión REPLICA OK');
  } catch (err) {
    logger.warn('[DB] Replica no disponible — se usará MASTER para lecturas también:', err.message);
  }
}

module.exports = {
  masterPool,
  replicaPool,
  queryMaster,
  queryReplica,
  callProcedure,
  getConnection,
  testConnections,
};
