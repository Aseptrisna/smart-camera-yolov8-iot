'use strict';

const deviceRepository  = require('../repository/device.repository');
const actuatorService   = require('./actuator.service');

const VALID_TYPES = ['camera', 'sensor', 'aktuator'];

class DeviceService {
  async getAll(query) {
    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return deviceRepository.findAll({
      page,
      limit,
      type:      query.type,
      is_active: query.is_active,
      search:    query.search,
    });
  }

  async getById(id) {
    return deviceRepository.findById(id);
  }

  async create(data) {
    const { device_id, name, type, location, description, ip_address, is_active, guid, metadata } = data;

    if (!device_id || !name || !type) {
      throw Object.assign(new Error('device_id, name, dan type wajib diisi'), { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      throw Object.assign(new Error(`type harus salah satu dari: ${VALID_TYPES.join(', ')}`), { status: 400 });
    }

    const existing = await deviceRepository.findByDeviceId(device_id);
    if (existing) {
      throw Object.assign(new Error(`device_id '${device_id}' sudah terdaftar`), { status: 409 });
    }

    return deviceRepository.create({ device_id, name, type, location, description, ip_address, is_active, guid, metadata });
  }

  async update(id, data) {
    const { device_id, type, ...rest } = data;

    // Validate type if provided
    if (type && !VALID_TYPES.includes(type)) {
      throw Object.assign(new Error(`type harus salah satu dari: ${VALID_TYPES.join(', ')}`), { status: 400 });
    }

    // Prevent duplicate device_id if being changed
    if (device_id) {
      const existing = await deviceRepository.findByDeviceId(device_id);
      if (existing && existing._id.toString() !== id) {
        throw Object.assign(new Error(`device_id '${device_id}' sudah digunakan`), { status: 409 });
      }
      rest.device_id = device_id;
    }
    if (type) rest.type = type;

    const updated = await deviceRepository.update(id, rest);
    if (!updated) throw Object.assign(new Error('Device tidak ditemukan'), { status: 404 });
    return updated;
  }

  async delete(id) {
    const deleted = await deviceRepository.delete(id);
    if (!deleted) throw Object.assign(new Error('Device tidak ditemukan'), { status: 404 });
    return deleted;
  }

  async getSummary() {
    return deviceRepository.countByType();
  }

  async control(id, action) {
    if (!['on', 'off'].includes(action)) {
      throw Object.assign(new Error("action harus 'on' atau 'off'"), { status: 400 });
    }

    const device = await deviceRepository.findById(id);
    if (!device) throw Object.assign(new Error('Device tidak ditemukan'), { status: 404 });
    if (device.type !== 'aktuator') {
      throw Object.assign(new Error('Kontrol hanya berlaku untuk tipe aktuator'), { status: 400 });
    }
    if (!device.guid) {
      throw Object.assign(new Error('GUID belum diatur pada device ini'), { status: 400 });
    }

    // Send command to RabbitMQ
    const result = await actuatorService.control(device.guid, action);

    // Persist last known status
    const updated = await deviceRepository.update(id, {
      last_status:        action,
      last_controlled_at: new Date(),
    });

    return { device: updated, command: result };
  }
}

module.exports = new DeviceService();
