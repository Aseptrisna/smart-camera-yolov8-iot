'use strict';

const deviceService = require('../service/device.service');
const logger = require('../logger');

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Manajemen perangkat IoT (camera, sensor, aktuator)
 */

/**
 * @swagger
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: Daftar semua device dengan filter & pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [camera, sensor, aktuator] }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         description: Cari berdasarkan device_id, name, atau location
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of devices
 */
const getAll = async (req, res, next) => {
  try {
    const result = await deviceService.getAll(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Error in devices getAll', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/devices/summary:
 *   get:
 *     tags: [Devices]
 *     summary: Jumlah device per tipe
 *     responses:
 *       200:
 *         description: Summary count per type
 */
const getSummary = async (req, res, next) => {
  try {
    const data = await deviceService.getSummary();
    return res.json({ success: true, data });
  } catch (err) {
    logger.error('Error in devices getSummary', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Detail device by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device detail
 *       404:
 *         description: Not found
 */
const getById = async (req, res, next) => {
  try {
    const doc = await deviceService.getById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Device tidak ditemukan' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('Error in devices getById', { error: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/devices:
 *   post:
 *     tags: [Devices]
 *     summary: Tambah device baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [device_id, name, type]
 *             properties:
 *               device_id:   { type: string, example: CAM-P016 }
 *               name:        { type: string, example: Kamera Parkir Lantai 1 }
 *               type:        { type: string, enum: [camera, sensor, aktuator] }
 *               location:    { type: string, example: Lantai 1 }
 *               description: { type: string }
 *               ip_address:  { type: string, example: 192.168.1.10 }
 *               is_active:   { type: boolean, default: true }
 *               metadata:    { type: object }
 *     responses:
 *       201:
 *         description: Device berhasil dibuat
 *       400:
 *         description: Validasi gagal
 *       409:
 *         description: device_id sudah terdaftar
 */
const create = async (req, res, next) => {
  try {
    const doc = await deviceService.create(req.body);
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    logger.error('Error in devices create', { error: err.message });
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     tags: [Devices]
 *     summary: Update device
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               type:        { type: string, enum: [camera, sensor, aktuator] }
 *               location:    { type: string }
 *               description: { type: string }
 *               ip_address:  { type: string }
 *               is_active:   { type: boolean }
 *               metadata:    { type: object }
 *     responses:
 *       200:
 *         description: Device berhasil diupdate
 *       404:
 *         description: Device tidak ditemukan
 */
const update = async (req, res, next) => {
  try {
    const doc = await deviceService.update(req.params.id, req.body);
    return res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('Error in devices update', { error: err.message });
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     tags: [Devices]
 *     summary: Hapus device
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Device berhasil dihapus
 *       404:
 *         description: Device tidak ditemukan
 */
const remove = async (req, res, next) => {
  try {
    const doc = await deviceService.delete(req.params.id);
    return res.json({ success: true, message: 'Device berhasil dihapus', data: doc });
  } catch (err) {
    logger.error('Error in devices delete', { error: err.message });
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/**
 * @swagger
 * /api/devices/{id}/control:
 *   post:
 *     tags: [Devices]
 *     summary: Kirim perintah ON/OFF ke aktuator via RabbitMQ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [on, off] }
 *     responses:
 *       200:
 *         description: Perintah berhasil dikirim
 *       400:
 *         description: Validasi gagal atau bukan tipe aktuator
 *       404:
 *         description: Device tidak ditemukan
 */
const control = async (req, res, next) => {
  try {
    const result = await deviceService.control(req.params.id, req.body.action);
    return res.json({ success: true, message: `Aktuator berhasil di-${req.body.action}`, ...result });
  } catch (err) {
    logger.error('Error in devices control', { error: err.message });
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getAll, getSummary, getById, create, update, remove, control };
