'use strict';

const dashboardService = require('../service/dashboard.service');
const logger = require('../logger');

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary statistics
 *     responses:
 *       200:
 *         description: Summary statistics
 */
const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('Error in dashboard getSummary', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/dashboard/devices:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get per-device detection statistics
 *     responses:
 *       200:
 *         description: Device statistics
 */
const getDeviceStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getDeviceStats();
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('Error in dashboard getDeviceStats', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/dashboard/object-stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get detected object class statistics
 *     responses:
 *       200:
 *         description: Object statistics
 */
const getObjectStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getObjectStats();
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('Error in dashboard getObjectStats', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/dashboard/daily-stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get daily detection count for last N days
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 7 }
 *     responses:
 *       200:
 *         description: Daily stats
 */
const getDailyStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await dashboardService.getDailyStats(days);
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('Error in dashboard getDailyStats', { error: err.message });
    next(err);
  }
};

module.exports = { getSummary, getDeviceStats, getObjectStats, getDailyStats };
