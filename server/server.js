require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { scoreRoute } = require("./riskEngine");
const { Route, Incident, Vehicle, Alert } = require("./models");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_q, s) => s.json({ ok: true, service: "NER Smart Logistics API" }));

app.get("/api/routes", async (_q, res) => {
  const routes = await Route.find();
  const latest = await Incident.findOne().sort({ createdAt: -1 });
  res.json(routes.map(r => ({ ...r.toObject(), ...scoreRoute(r, latest || {}) })));
});

app.post("/api/incidents", async (req, res) => {
  try {
    const type = req.body.type;
    const location = req.body.location;
    const severity = req.body.severity;
    const rainfall = req.body.rainfall;
    const description = req.body.description;
    if (!type || !location) return res.status(400).json({ error: "type & location required" });

    const routes = await Route.find();
    const scored = routes.map(r => scoreRoute(r, req.body));
    const affected = scored.filter(s => s.riskScore > 60).sort((a, b) => b.riskScore - a.riskScore)[0];
    const safe = scored
  .filter(s => String(s.routeId) !== String(affected?.routeId))
  .sort((a, b) => a.riskScore - b.riskScore)[0] || null;


    const incident = await Incident.create({
  type, location, severity, rainfall, description,
  lat: req.body.lat, lng: req.body.lng,
  riskScore: affected ? affected.riskScore : 25,
  status: affected ? affected.status : "SAFE",
});

    if (affected) await Route.findByIdAndUpdate(affected.routeId, { status: "BLOCKED" });

    let alert = null;
    if (affected && affected.riskScore > 80) {
      const vehicles = await Vehicle.find({ routeId: affected.routeId, status: "IN TRANSIT" });
      alert = await Alert.create({
        title: "🚨 CRITICAL ALERT: " + type + " on " + affected.name,
        message: vehicles.length + " vehicle(s) affected. Recommended action: divert to " + (safe ? safe.name : "nearest safe route") + ".",
        level: "CRITICAL", riskScore: affected.riskScore,
        affectedVehicles: vehicles.map(v => v.plate), recommendedRoute: safe ? safe.name : null,
      });
      if (safe && vehicles.length) {
        await Vehicle.updateMany(
          { _id: { $in: vehicles.map(v => v._id) } },
          { routeId: safe.routeId, status: "DIVERTED", eta: "4h 55m" }
        );
        await Alert.create({
          title: "✅ " + vehicles.length + " vehicle(s) diverted to " + safe.name,
          message: "Alternative route risk: " + safe.riskScore + "%.",
          level: "INFO", riskScore: safe.riskScore,
          affectedVehicles: vehicles.map(v => v.plate), recommendedRoute: safe.name,
        });
      }
    }
    res.json({ incident, scored, recommended: safe, affected, alert });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/incidents", async (_q, res) => res.json(await Incident.find().sort({ createdAt: -1 }).limit(50)));
app.get("/api/vehicles", async (_q, res) => res.json(await Vehicle.find()));
app.post("/api/vehicles", async (req, res) => res.json(await Vehicle.create(req.body)));
app.get("/api/alerts", async (_q, res) => res.json(await Alert.find().sort({ createdAt: -1 }).limit(50)));

app.post("/api/simulate-tick", async (_q, res) => {
  const routes = await Route.find();
  const lastAlert = await Alert.findOne().sort({ createdAt: -1 });

  // find a blocked/high-risk route and the safe alternative (from the latest alert)
  const blocked = routes.find(r => r.status === "BLOCKED" || r.riskScore > 80);
  const safeAlt = lastAlert?.recommendedRoute
    ? routes.find(r => r.name.startsWith(lastAlert.recommendedRoute.split(":")[0]) && r.status !== "BLOCKED" && r.riskScore <= 80)
    : routes.find(r => r.status !== "BLOCKED" && r.riskScore <= 80);

  const vehicles = await Vehicle.find({ status: { $in: ["IN TRANSIT", "DIVERTED", "HALTED"] } });
  let diverted = 0, halted = 0;

  for (const v of vehicles) {
    const vRoute = routes.find(r => String(r._id) === String(v.routeId));
    const onBlocked = vRoute && (vRoute.status === "BLOCKED" || vRoute.riskScore > 80);

    if (onBlocked && safeAlt && String(safeAlt._id) !== String(v.routeId)) {
      // reroute onto the safe corridor
      v.routeId = safeAlt._id;
      v.progress = 5; // rejoin near the start of the safe route
      v.status = "DIVERTED";
      diverted++;
    } else if (onBlocked) {
      v.status = "HALTED"; // blocked, no alternative — hold position
      halted++;
      continue;
    } else if (v.status === "HALTED") {
      v.status = "IN TRANSIT"; // route cleared again, resume
    }

    v.progress = (v.progress + 4) % 100;
    await v.save();
  }
  res.json({ ticked: vehicles.length, diverted, halted });
});

const dist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (_q, res) => res.sendFile(path.join(dist, "index.html")));

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log("✅ API on " + PORT)))
  .catch(e => { console.error("Mongo failed:", e.message); process.exit(1); });
