'use strict';

const rawImageRepository = require('../repository/raw_image.repository');

class RawImageService {
  async getAll(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return rawImageRepository.findAll({
      page,
      limit,
      filename: query.filename,
      device_id: query.device_id,
      start_date: query.start_date,
      end_date: query.end_date,
    });
  }

  async getById(id) {
    return rawImageRepository.findById(id);
  }
}

module.exports = new RawImageService();
