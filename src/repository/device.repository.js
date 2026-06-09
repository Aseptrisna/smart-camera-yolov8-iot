'use strict';

const Device = require('../model/device.model');

class DeviceRepository {
  async findAll({ page = 1, limit = 20, type, is_active, search } = {}) {
    const filter = {};
    if (type)   filter.type = type;
    if (is_active !== undefined && is_active !== '') {
      filter.is_active = is_active === 'true' || is_active === true;
    }
    if (search) {
      filter.$or = [
        { device_id: { $regex: search, $options: 'i' } },
        { name:      { $regex: search, $options: 'i' } },
        { location:  { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Device.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Device.countDocuments(filter),
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
    return Device.findById(id).lean();
  }

  async findByDeviceId(device_id) {
    return Device.findOne({ device_id }).lean();
  }

  async create(data) {
    const doc = new Device(data);
    return (await doc.save()).toObject();
  }

  async update(id, data) {
    return Device.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
  }

  async delete(id) {
    return Device.findByIdAndDelete(id).lean();
  }

  async countByType() {
    return Device.aggregate([
      { $group: { _id: '$type', total: { $sum: 1 }, active: { $sum: { $cond: ['$is_active', 1, 0] } } } },
      { $project: { _id: 0, type: '$_id', total: 1, active: 1 } },
      { $sort: { type: 1 } },
    ]);
  }
}

module.exports = new DeviceRepository();
