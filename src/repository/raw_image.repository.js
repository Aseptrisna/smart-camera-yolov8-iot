'use strict';

const RawImage = require('../model/raw_image.model');

class RawImageRepository {
  async findAll({ page = 1, limit = 20, filename, device_id, start_date, end_date } = {}) {
    const filter = {};
    if (filename) filter.filename = { $regex: filename, $options: 'i' };
    if (device_id) filter.device_id = { $regex: device_id, $options: 'i' };
    if (start_date || end_date) {
      filter.received_at = {};
      if (start_date) filter.received_at.$gte = new Date(start_date);
      if (end_date) filter.received_at.$lte = new Date(end_date);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      RawImage.find(filter).sort({ received_at: -1 }).skip(skip).limit(limit).lean(),
      RawImage.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    };
  }

  async findById(id) {
    return RawImage.findById(id).lean();
  }

  async countToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return RawImage.countDocuments({ received_at: { $gte: start } });
  }

  async countTotal() {
    return RawImage.countDocuments();
  }

  async getActiveDevices() {
    const result = await RawImage.distinct('device_id');
    return result;
  }
}

module.exports = new RawImageRepository();
