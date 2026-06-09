'use strict';

const rawImageRepository = require('../repository/raw_image.repository');
const detectionRepository = require('../repository/detection.repository');

class DashboardService {
  async getSummary() {
    const [
      total_raw_images,
      total_detections,
      total_detected_objects,
      today_images,
      today_detections,
      active_devices,
    ] = await Promise.all([
      rawImageRepository.countTotal(),
      detectionRepository.countTotal(),
      detectionRepository.sumTotalObjects(),
      rawImageRepository.countToday(),
      detectionRepository.countToday(),
      rawImageRepository.getActiveDevices(),
    ]);

    return {
      total_raw_images,
      total_detections,
      total_detected_objects,
      today_images,
      today_detections,
      active_devices: active_devices.length,
    };
  }

  async getDeviceStats() {
    return detectionRepository.getDeviceStats();
  }

  async getObjectStats() {
    return detectionRepository.getObjectStats();
  }

  async getDailyStats(days = 7) {
    return detectionRepository.getDailyStats(days);
  }
}

module.exports = new DashboardService();
