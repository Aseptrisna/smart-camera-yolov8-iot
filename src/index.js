'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const logger = require('./logger');
const swaggerSpec = require('./swagger/swagger');

const rawImageRoutes = require('./route/raw_image.routes');
const detectionRoutes = require('./route/detection.routes');
const dashboardRoutes = require('./route/dashboard.routes');
const deviceRoutes = require('./route/device.routes');
const { getDetectedImage } = require('./controller/detection.controller');
const { notFoundHandler, globalErrorHandler } = require('./middleware/error.middleware');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // website loads CDN resources (Bootstrap, Chart.js)
}));

// CORS
app.use(cors({ origin: config.cors.origin }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart Camera API',
  swaggerOptions: { persistAuthorization: true },
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Static files for detected images
app.use(
  '/uploads',
  express.static(path.resolve(config.storage.uploadDir, '..'), {
    maxAge: '1d',
  })
);

// Website — serve from /web, redirect root to /web
const WEBSITE_DIR = path.resolve(__dirname, '../website');
app.use('/web', express.static(WEBSITE_DIR));
app.get('/', (req, res) => res.redirect('/web'));

// API routes
app.use('/api/devices',         deviceRoutes);
app.use('/api/raw-images',      rawImageRoutes);
app.use('/api/detections',      detectionRoutes);
app.get('/api/detected-images/:filename', getDetectedImage);
app.use('/api/dashboard',       dashboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
