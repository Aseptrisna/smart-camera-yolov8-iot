'use strict';

const { Router } = require('express');
const {
  getSummary,
  getDeviceStats,
  getObjectStats,
  getDailyStats,
} = require('../controller/dashboard.controller');

const router = Router();

router.get('/summary', getSummary);
router.get('/devices', getDeviceStats);
router.get('/object-stats', getObjectStats);
router.get('/daily-stats', getDailyStats);

module.exports = router;
