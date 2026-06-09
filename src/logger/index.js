'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
  if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
  if (stack) log += `\n${stack}`;
  return log;
});

const logger = createLogger({
  level: config.app.logLevel,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5 * 1024 * 1024, maxFiles: 5 }),
    new transports.File({ filename: 'logs/combined.log', maxsize: 10 * 1024 * 1024, maxFiles: 10 }),
  ],
  exitOnError: false,
});

module.exports = logger;
