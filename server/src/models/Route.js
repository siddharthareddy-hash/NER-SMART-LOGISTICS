const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lon: { type: Number, required: true, min: -180, max: 180 },
    },
    floodHistory: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

routeSchema.index({ name: 1 });

module.exports = mongoose.model('Route', routeSchema);
