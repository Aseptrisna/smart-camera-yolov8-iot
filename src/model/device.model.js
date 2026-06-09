'use strict';

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, unique: true, index: true, trim: true },
    name:      { type: String, required: true, trim: true },
    type:      { type: String, required: true, enum: ['camera', 'sensor', 'aktuator'], index: true },
    location:  { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    ip_address:  { type: String, default: '', trim: true },
    is_active:          { type: Boolean, default: true, index: true },
    last_seen:          { type: Date, default: null },
    // Aktuator fields
    guid:               { type: String, default: '', trim: true },
    last_status:        { type: String, enum: ['on', 'off', 'unknown'], default: 'unknown' },
    last_controlled_at: { type: Date, default: null },
    metadata:           { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'devices',
    versionKey: false,
  }
);

module.exports = mongoose.model('Device', deviceSchema);
