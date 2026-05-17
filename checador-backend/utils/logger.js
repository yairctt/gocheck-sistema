'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');
const cfg  = require('../config/env');

const logDir = path.resolve(cfg.log.dir);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = format;

// Formato legible para consola
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: cfg.log.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    // Consola (solo en desarrollo)
    ...(cfg.env !== 'production'
      ? [new transports.Console({
          format: combine(colorize(), consoleFormat),
        })]
      : []),
    // Archivo combinado (JSON)
    new transports.File({
      filename: path.join(logDir, 'app.log'),
      format:   json(),
      maxsize:  10 * 1024 * 1024, // 10 MB
      maxFiles: 7,
      tailable: true,
    }),
    // Solo errores
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level:    'error',
      format:   json(),
      maxsize:  10 * 1024 * 1024,
      maxFiles: 14,
      tailable: true,
    }),
  ],
});

module.exports = logger;
