require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { scoreRoute } = require("./riskEngine");
const { routeWeather } = require("./weather");
const { Route, Incident, Vehicle, Alert } = require("./models");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_q, s) => s.json({ ok: true, service: "NER Smart Logistics API" }));

app.get("/api/weather", async (_q, res) => {
  try {
    const routes = await Route.find();
    const out = await Promise.all(routes.map(async r => ({
      routeId: r.routeId, name: r.name, weather: await routeWeather(r),
    })));
    res.json(out);
  } catch (e) {
    res.status(502).json({ error: "Weather service unavailable: " + e.message });
  }
});

app.get("/api/routes", async (_q, res) => {
  const routes = await Route.find();
  const latest = await Incident.findOne().sort({ createdAt: -1 });
  const out = await Promise.all(routes.map(async r => {
    let live = null;
    try { live = await routeWeather(r); } catch (_e) {}   // fail-soft
    const scored = scoreRoute({ ...r.toObject() }, { ...(latest ? latest.toObject() : {}), liveWeather: live });
    return { ...r.toObject(), ...scored, liveWeather: live };
  }));
  res.json(out);
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
    const scored = await Promise.all(routes.map(async r => {
      let live = null;
      try { live = await routeWeather(r); } catch (_e) {}
      return scoreRoute(r, { ...req.body, liveWeather: live });
    }));
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
      v.routeId = safeAlt._id;
      v.progress = 5;
      v.status = "DIVERTED";
      diverted++;
    } else if (onBlocked) {
      v.status = "HALTED";
      halted++;
      continue;
    } else if (v.status === "HALTED") {
      v.status = "IN TRANSIT";
    }

    v.progress = (v.progress + 4) % 100;
    await v.save();
  }
  res.json({ ticked: vehicles.length, diverted, halted });
});

// ⚠️ catch-all MUST be the last route — everything above it is reachable
const dist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(dist));
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Unknown API endpoint" });
  }
  const indexPath = path.join(dist, "index.html");
  if (require("fs").existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(200).json({
    name: "NER Smart Logistics API",
    status: "live",
    endpoints: ["/api/routes", "/api/vehicles", "/api/incidents", "/api/alerts", "/api/weather", "/api/simulate-tick"],
    note: "Frontend hosted separately on Vercel",
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log("✅ API on " + PORT)))
  .catch(e => { console.error("Mongo failed:", e.message); process.exit(1); });
