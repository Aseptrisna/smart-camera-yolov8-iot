'use strict';

const Detection = require('../model/detection_model');

class DetectionRepository {
  async findAll({ page = 1, limit = 20, device_id, class_name, start_date, end_date } = {}) {
    const filter = {};
    if (device_id) filter.device_id = { $regex: device_id, $options: 'i' };
    if (class_name) filter['objects.class_name'] = { $regex: class_name, $options: 'i' };
    if (start_date || end_date) {
      filter.detected_at = {};
      if (start_date) filter.detected_at.$gte = new Date(start_date);
      if (end_date) filter.detected_at.$lte = new Date(end_date);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Detection.find(filter).sort({ detected_at: -1 }).skip(skip).limit(limit).lean(),
      Detection.countDocuments(filter),
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
    return Detection.findById(id).lean();
  }

  async findByRawImageId(rawImageId) {
    return Detection.findOne({ raw_image_id: rawImageId }).lean();
  }

  async countToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Detection.countDocuments({ detected_at: { $gte: start } });
  }

  async countTotal() {
    return Detection.countDocuments();
  }

  async sumTotalObjects() {
    const result = await Detection.aggregate([
      { $group: { _id: null, total: { $sum: '$total_objects' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }

  async getDeviceStats() {
    return Detection.aggregate([
      {
        $group: {
          _id: '$device_id',
          total_detections: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'raw_images',
          localField: '_id',
          foreignField: 'device_id',
          as: 'raw_images',
        },
      },
      {
        $project: {
          _id: 0,
          device_id: '$_id',
          total_images: { $size: '$raw_images' },
          total_detections: 1,
        },
      },
      { $sort: { total_detections: -1 } },
    ]);
  }

  async getObjectStats() {
    return Detection.aggregate([
      { $unwind: '$objects' },
      {
        $group: {
          _id: '$objects.class_name',
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          class_name: '$_id',
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  async getDailyStats(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    return Detection.aggregate([
      { $match: { detected_at: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$detected_at' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);
  }
}

module.exports = new DetectionRepository();
