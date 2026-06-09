'use strict';

const mongoose = require('mongoose');

const bboxSchema = new mongoose.Schema(
  { x1: Number, y1: Number, x2: Number, y2: Number },
  { _id: false }
);

const detectedObjectSchema = new mongoose.Schema(
  {
    class_name: { type: String, required: true, index: true },
    confidence: { type: Number, required: true },
    bbox: { type: bboxSchema, required: true },
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    raw_image_id: { type: String, required: true, index: true },
    filename: { type: String, required: true, index: true },
    device_id: { type: String, required: true, index: true },
    original_image_url: { type: String },
    detected_image_path: { type: String },
    total_objects: { type: Number, default: 0 },
    objects: { type: [detectedObjectSchema], default: [] },
    detected_at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: 'detections' }
);

detectionSchema.index({ 'objects.class_name': 1 });

module.exports = mongoose.model('Detection', detectionSchema);
