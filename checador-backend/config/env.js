'use strict';
require('dotenv').config();

const required = [
  'JWT_SECRET',
  'DB_MASTER_HOST', 'DB_MASTER_USER', 'DB_MASTER_PASSWORD', 'DB_MASTER_DATABASE',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Variable de entorno requerida no definida: ${key}`);
    process.exit(1);
  }
}

module.exports = {
  env:     process.env.NODE_ENV || 'development',
  port:    parseInt(process.env.PORT, 10) || 3000,
  appName: process.env.APP_NAME || 'CheckerPRO',

  jwt: {
    secret:            process.env.JWT_SECRET,
    expiresIn:         process.env.JWT_EXPIRES_IN         || '8h',
    refreshExpiresIn:  process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  db: {
    master: {
      host:            process.env.DB_MASTER_HOST,
      port:            parseInt(process.env.DB_MASTER_PORT, 10) || 3306,
      user:            process.env.DB_MASTER_USER,
      password:        process.env.DB_MASTER_PASSWORD,
      database:        process.env.DB_MASTER_DATABASE,
      connectionLimit: parseInt(process.env.DB_MASTER_CONNECTION_LIMIT, 10) || 10,
    },
    replica: {
      host:            process.env.DB_REPLICA_HOST     || process.env.DB_MASTER_HOST,
      port:            parseInt(process.env.DB_REPLICA_PORT, 10) || 3306,
      user:            process.env.DB_REPLICA_USER     || process.env.DB_MASTER_USER,
      password:        process.env.DB_REPLICA_PASSWORD || process.env.DB_MASTER_PASSWORD,
      database:        process.env.DB_REPLICA_DATABASE || process.env.DB_MASTER_DATABASE,
      connectionLimit: parseInt(process.env.DB_REPLICA_CONNECTION_LIMIT, 10) || 20,
    },
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  },

  security: {
    bcryptRounds:    parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    maxLoginAttempts:parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutMinutes:  parseInt(process.env.LOCKOUT_MINUTES, 10) || 15,
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir:   process.env.LOG_DIR   || 'logs',
  },
};
