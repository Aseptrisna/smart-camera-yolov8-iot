'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('../config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Camera Detection API',
      version: '1.0.0',
      description:
        'REST API for Smart Camera YOLO Object Detection System. ' +
        'Provides endpoints to query raw images, detections, and dashboard statistics.',
      contact: {
        name: 'Smart Camera System',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Raw Images', description: 'Raw image data from cameras' },
      { name: 'Detections', description: 'YOLO object detection results' },
      { name: 'Dashboard', description: 'Summary and statistics endpoints' },
    ],
  },
  apis: [
    './src/controller/*.js',
    './src/route/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
