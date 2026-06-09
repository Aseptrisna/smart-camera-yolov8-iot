'use strict';

const path = require('path');
const fs = require('fs');
const detectionService = require('../service/detection.service');
const config = require('../config');
const logger = require('../logger');

/**
 * @swagger
 * /api/detections:
 *   get:
 *     tags: [Detections]
 *     summary: Get all detections with pagination and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: device_id
 *         schema: { type: string }
 *       - in: query
 *         name: class_name
 *         schema: { type: string }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of detections
 */
const getAll = async (req, res, next) => {
  try {
    const result = await detectionService.getAll(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Error in detections getAll', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/detections/{id}:
 *   get:
 *     tags: [Detections]
 *     summary: Get detection detail by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detection detail with raw image
 *       404:
 *         description: Not found
 */
const getById = async (req, res, next) => {
  try {
    const detail = await detectionService.getById(req.params.id);
    if (!detail) return res.status(404).json({ success: false, message: 'Detection not found' });
    return res.json({ success: true, data: detail });
  } catch (err) {
    logger.error('Error in detections getById', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/detected-images/{filename}:
 *   get:
 *     tags: [Detections]
 *     summary: Serve annotated detection image file
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 */
const getDetectedImage = (req, res, next) => {
  try {
    const filename = req.params.filename;

    // Security: prevent path traversal
    const safeName = path.basename(filename);
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(safeName).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }

    const filePath = path.resolve(config.storage.uploadDir, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  } catch (err) {
    logger.error('Error serving detected image', { error: err.message });
    next(err);
  }
};

module.exports = { getAll, getById, getDetectedImage };
