'use strict';

const mongoose = require('mongoose');

const rawImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, index: true },
    device_id: { type: String, required: true, index: true },
    image_url: { type: String, required: true },
    source_queue: { type: String, default: 'camera.quiz' },
    received_at: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['pending_detection', 'processing', 'completed', 'failed'],
      default: 'pending_detection',
    },
  },
  { timestamps: true, collection: 'raw_images' }
);

module.exports = mongoose.model('RawImage', rawImageSchema);
