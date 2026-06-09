'use strict';

const detectionRepository = require('../repository/detection.repository');
const rawImageRepository = require('../repository/raw_image.repository');

class DetectionService {
  async getAll(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return detectionRepository.findAll({
      page,
      limit,
      device_id: query.device_id,
      class_name: query.class_name,
      start_date: query.start_date,
      end_date: query.end_date,
    });
  }

  async getById(id) {
    const detection = await detectionRepository.findById(id);
    if (!detection) return null;

    const rawImage = await rawImageRepository.findById(detection.raw_image_id);

    return {
      raw_image: rawImage || null,
      detection,
      objects: detection.objects || [],
      image_original: rawImage ? rawImage.image_url : null,
      image_detection: detection.detected_image_path || null,
    };
  }
}

module.exports = new DetectionService();
