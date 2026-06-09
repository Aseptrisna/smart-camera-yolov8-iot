'use strict';

require('dotenv').config();

const config = require('./src/config');
const logger = require('./src/logger');
const { connect: mongoConnect } = require('./src/database/mongodb');
const app = require('./src/index');
const fs = require('fs');
const path = require('path');

// Ensure required directories exist
['logs', 'uploads', 'uploads/detection'].forEach((dir) => {
  const dirPath = path.resolve(dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
});

async function bootstrap() {
  logger.info('=== Smart Camera API Starting ===');

  await mongoConnect();

  const server = app.listen(config.app.port, () => {
    logger.info(`API server running on port ${config.app.port}`);
    logger.info(`Swagger docs: http://localhost:${config.app.port}/api-docs`);
    logger.info(`Health check: http://localhost:${config.app.port}/health`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: String(reason) });
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', { error: err.message });
  process.exit(1);
});
