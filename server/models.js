const mongoose = require("mongoose");

const Route = mongoose.model("Route", new mongoose.Schema({
  name: String,
  coords: [[Number]],
  historicalRisk: Number,
  traffic: Number,
  terrainRisk: Number,
  status: { type: String, default: "SAFE" },
}, { timestamps: true }));

const Incident = mongoose.model("Incident", new mongoose.Schema({
  type: String, location: String, severity: String,
  rainfall: Number, description: String,
  lat: Number, lng: Number,
  riskScore: Number, status: String,
}, { timestamps: true }));

const Vehicle = mongoose.model("Vehicle", new mongoose.Schema({
  plate: String, cargo: String, from: String, to: String,
  routeId: String, status: String, eta: String,
  progress: { type: Number, default: 0 },
}, { timestamps: true }));

const Alert = mongoose.model("Alert", new mongoose.Schema({
  title: String, message: String, level: String,
  riskScore: Number, affectedVehicles: [String], recommendedRoute: String,
}, { timestamps: true }));

module.exports = { Route, Incident, Vehicle, Alert };
