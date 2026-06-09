'use strict';

const path = require('path');
const https = require('https');
const http = require('http');
const rawImageService = require('../service/raw_image.service');
const config = require('../config');
const logger = require('../logger');

/**
 * @swagger
 * /api/raw-images:
 *   get:
 *     tags: [Raw Images]
 *     summary: Get all raw images with pagination and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: filename
 *         schema: { type: string }
 *       - in: query
 *         name: device_id
 *         schema: { type: string }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of raw images
 */
const getAll = async (req, res, next) => {
  try {
    const result = await rawImageService.getAll(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Error in raw-images getAll', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/raw-images/{id}:
 *   get:
 *     tags: [Raw Images]
 *     summary: Get raw image by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Raw image detail
 *       404:
 *         description: Not found
 */
const getById = async (req, res, next) => {
  try {
    const doc = await rawImageService.getById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Raw image not found' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('Error in raw-images getById', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/raw-images/image/{filename}:
 *   get:
 *     tags: [Raw Images]
 *     summary: Proxy raw image from external camera server
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Image file
 *       404:
 *         description: Image not found
 */
const getRawImage = (req, res, next) => {
  const safeName = path.basename(req.params.filename);
  const ext = path.extname(safeName).toLowerCase();

  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return res.status(400).json({ success: false, message: 'Invalid file type' });
  }

  const targetUrl = `${config.image.baseUrl}/${safeName}`;
  const client = targetUrl.startsWith('https') ? https : http;

  const proxyReq = client.get(targetUrl, (imgRes) => {
    if (imgRes.statusCode !== 200) {
      imgRes.resume(); // drain the response
      return res.status(404).json({ success: false, message: 'Image not found on camera server' });
    }
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    imgRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    logger.error('Error proxying raw image', { error: err.message, targetUrl });
    next(err);
  });
};

module.exports = { getAll, getById, getRawImage };
