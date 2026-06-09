'use strict';

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../logger');

let isConnected = false;

const connect = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    isConnected = true;
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    setTimeout(connect, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected. Reconnecting...');
  setTimeout(connect, 5000);
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected');
});

module.exports = { connect };
