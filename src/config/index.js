'use strict';

const path = require('path');
require('dotenv').config();

// api/ directory (two levels up from src/config/)
const API_ROOT = path.resolve(__dirname, '../../');

function resolveUploadDir(raw) {
  return path.isAbsolute(raw) ? raw : path.resolve(API_ROOT, raw);
}

const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3003,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-camera',
  },
  storage: {
    uploadDir: resolveUploadDir(process.env.UPLOAD_DIR || 'uploads/detection'),
  },
  image: {
    baseUrl: process.env.IMAGE_BASE_URL || 'https://smartparking.pptik.id/data/data',
  },
  actuator: {
    host:     process.env.ACTUATOR_MQTT_HOST     || 'rabbit-mq.sta.my.id',
    port:     parseInt(process.env.ACTUATOR_MQTT_PORT) || 1883,
    username: process.env.ACTUATOR_MQTT_USERNAME || '/panic:panic',
    password: process.env.ACTUATOR_MQTT_PASSWORD || '5bG0rtnJwARlalg',
    topic:    process.env.ACTUATOR_MQTT_TOPIC    || 'Aktuator',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

module.exports = config;
