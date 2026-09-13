require("dotenv").config();
const mongoose = require("mongoose");
const { Route, Vehicle, Alert } = require("./models");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([Route.deleteMany(), Vehicle.deleteMany(), Alert.deleteMany()]);

  await Route.insertMany([
    { name: "Route A: Shillong → Nongpoh → Guwahati",
      coords: [[25.5788, 91.8933], [25.9068, 91.8822], [26.1445, 91.7362]],
      historicalRisk: 65, traffic: 55, terrainRisk: 80, status: "SAFE" },
    { name: "Route B: Shillong → Jowai → Guwahati",
      coords: [[25.5788, 91.8933], [25.4588, 92.1975], [26.1445, 91.7362]],
      historicalRisk: 20, traffic: 30, terrainRisk: 35, status: "SAFE" },
  ]);

  const routes = await Route.find();
  await Vehicle.insertMany([
    { plate: "MH-01-AB-1234", cargo: "Medicine Supply", from: "Shillong", to: "Guwahati", routeId: routes[0]._id, status: "IN TRANSIT", eta: "4h 20m", progress: 30 },
    { plate: "ML-05-CD-7788", cargo: "Food Supply", from: "Shillong", to: "Guwahati", routeId: routes[0]._id, status: "IN TRANSIT", eta: "5h 10m", progress: 15 },
    { plate: "AS-09-EF-4455", cargo: "Construction Material", from: "Shillong", to: "Guwahati", routeId: routes[0]._id, status: "IN TRANSIT", eta: "4h 45m", progress: 22 },
    { plate: "NL-07-GH-9911", cargo: "Relief Supplies", from: "Shillong", to: "Guwahati", routeId: routes[1]._id, status: "IN TRANSIT", eta: "5h 30m", progress: 40 },
  ]);

  await Alert.create({ title: "ℹ️ System initialized", message: "All routes operational.", level: "INFO", riskScore: 12 });
  console.log("✅ Seed complete");
  process.exit();
})();
