<div align="center">

# 🚚 NER SMART LOGISTICS
### Weather-Aware Disaster Response Command Center

**"We don't react to disasters. We see them coming."**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Vercel-blue)](YOUR_VERCEL_URL)
[![API](https://img.shields.io/badge/⚡_API-Render-green)](YOUR_RENDER_URL)
[![SIH](https://img.shields.io/badge/🏆_Smart_India_Hackathon-2025-orange)]()

</div>

---

## 📌 Problem Statement

The **North East Region (NER) of India** is among the country's most disaster-prone
logistics corridors:

- 🌧️ **Extreme monsoon rainfall** — landslides routinely block critical highways
  (Shillong → Guwahati, a lifeline for Meghalaya)
- 🛣️ **Very few alternate routes** — one blockage strands entire fleets for hours
- 📵 **No central visibility** — fleet operators coordinate by phone calls *after*
  a road is already blocked, losing precious response time

Existing logistics trackers are **reactive**. In a disaster, hours matter.

---

## 💡 Our Solution

> A **cloud-hosted command center** that fuses **live weather**, **6-hour rainfall
> forecasts**, and **operator-reported incidents** into a single real-time
> **risk score (0–100)** for every route — then automatically fires critical
> alerts, diverts vehicles to safe corridors, and issues **predictive advisories
> hours before disaster strikes**.

### Two engines, one loop:

| Engine | Trigger | Action | Speed |
|---|---|---|---|
| 🔴 **Reactive** | Incident reported (landslide/flood/accident) | Routes re-scored → CRITICAL alert → vehicles auto-diverted | Seconds |
| 🟡 **Predictive** | OpenWeather 6h forecast shows incoming rain | Advisory strip: *"Heavy rain (3.18mm) expected on Route A in ~4h — pre-position vehicles now"* | Hours early |

---

## ✨ Key Features

| # | Feature | Description |
|---|---|---|
| 1 | 🌤️ **Live weather per route** | OpenWeather queried at up to 3 waypoints per route; worst reading shown (temp, condition, rainfall mm/h, wind) |
| 2 | 🎯 **Weather-aware risk scoring** | Server-side engine fuses incident severity + rainfall + road state → 0–100 score. `>80` CRITICAL, `>60` HIGH RISK, else SAFE |
| 3 | 🚨 **Auto-alert + diversion** | Incident crosses threshold → CRITICAL alert created → affected vehicles auto-diverted to safest alternate corridor |
| 4 | 📊 **Real-time dashboard** | React command center: KPI cards, per-route weather chips, risk badges, alert panel — polling every 5s |
| 5 | ⛈️ **Predictive 6h advisory** | Reads OpenWeather forecast (2 × 3h steps); generates pre-positioning advisories *before* rain arrives — **validated live with real Meghalaya rainfall** |
| 6 | ☁️ **Fully cloud-deployed** | Vercel (client) + Render (API) + MongoDB Atlas — demoable from any browser |

---

## 🏗️ System Architecture

```
┌─────────────────┐      REST · 5s polling     ┌─────────────────┐
│  React Dashboard│◄──────────────────────────►│  Express API    │
│  (Vercel)       │                            │  (Render)       │
└─────────────────┘                            └────────┬────────┘
                                               │        │
                                    Mongoose   │        │ Axios
                                               ▼        ▼
                                     ┌──────────────┐  ┌──────────────┐
                                     │ MongoDB Atlas│  │ OpenWeather  │
                                     │ Routes ·     │  │ /weather     │
                                     │ Vehicles ·   │  │ /forecast    │
                                     │ Incidents ·  │  └──────────────┘
                                     │ Alerts       │
                                     └──────────────┘
```

**Core modules:**
- `riskEngine.js` — fuses incident severity, live rainfall & road state → risk score
- `weather.js` — OpenWeather wrapper: `routeWeather()` (current) + `routeForecast()` (6h predictive)
- `models.js` — Mongoose schemas: `Route`, `Vehicle`, `Incident`, `Alert`

### 🔄 Data Flow — Incident Response

```
Operator reports landslide ──► POST /api/incidents
                                     │
                    1. Re-score ALL routes (incident + live weather)
                    2. Highest-risk route → status BLOCKED
                    3. Score > 80 → CRITICAL Alert created
                    4. Affected vehicles → DIVERTED to safest alternate
                                     │
Dashboard (next 5s poll) ◄── JSON: {incident, scored[], alert, diverted}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| External API | OpenWeather (current + 5-day/3h forecast) |
| Deployment | Vercel (client) · Render (API) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server + DB health check |
| `GET` | `/api/routes` | All routes with live weather + risk score |
| `GET` | `/api/vehicles` | Fleet state & positions |
| `GET` | `/api/incidents` | Incident history |
| `GET` | `/api/alerts` | Active alerts |
| `POST` | `/api/incidents` | Report incident → triggers scoring, alerts & auto-diversion |
| `GET` | `/api/weather` | Current weather per route |
| `GET` | `/api/forecast` | ⛈️ 6h predictive advisories per route |
| `POST` | `/api/simulate-tick` | Advance simulation: vehicle movement & diversions |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- OpenWeather API key ([free sign-up](https://openweathermap.org/api))

### 1. Clone

```bash
git clone https://github.com/siddharthareddy-hash/NER-SMART-LOGISTICS.git
cd NER-SMART-LOGISTICS
```

### 2. Server

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
OPENWEATHER_KEY=your_openweather_api_key
```

```bash
npx nodemon server.js
# ✅ API on 5000
```

### 3. Client

```bash
cd ../client
npm install
npm run dev
```

Dashboard: `http://localhost:5173`

### 4. Try the demo flow

```bash
# 1. See live route scores + weather
curl -s http://localhost:5000/api/routes

# 2. See predictive advisories
curl -s http://localhost:5000/api/forecast | python3 -m json.tool

# 3. Report a landslide → watch alerts & diversion fire
curl -X POST http://localhost:5000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"type":"Landslide","routeName":"Route A: Shillong → Nongpoh → Guwahati","location":"25.6,91.9","rainfall":5}'

# 4. Advance simulation
curl -X POST http://localhost:5000/api/simulate-tick
```

---

## 📸 Demo

> ⛈️ **Live validation:** during testing, the system ingested OpenWeather's real
> forecast for Meghalaya and generated — *before any rain fell*:
>
> ```
> ⚠️ WARNING ADVISORY — PREDICTIVE
> Heavy rain (3.18mm) expected on Route A in ~4h —
> pre-position vehicles on alternate corridor now.
> ```

*(insert dashboard screenshot here)*

---

## 🧠 Design Decisions

1. **Fail-soft everywhere** — if OpenWeather times out, routes still render with
   static risk scores. The system degrades gracefully; it never crashes.
2. **Server-side decision logic** — the client only displays. All scoring and
   diversion decisions happen on the API (single source of truth).
3. **Free-tier aware** — waypoints capped at 3/route, forecast windows limited,
   keeping us within OpenWeather's free plan.
4. **5s polling over WebSockets** — deliberate robustness/simplicity tradeoff;
   upgrade path exists.
5. **Secrets hygiene** — all credentials via environment variables; `.env`
   git-ignored.

---

## 🔮 Roadmap

- [ ] GPS telemetry ingestion (real vehicle positions)
- [ ] SMS/WhatsApp alerts via Twilio for field operators
- [ ] ML-based landslide risk from rainfall history
- [ ] WebSocket live updates
- [ ] Multi-region expansion (all 8 NE states)

---


| Name | Role |
|---|---|
| **Siddhartha Reddy** | Full-stack & system design |


---

<div align="center">

### 🏆 Built for Smart India Hackathon 2025

**"We don't react to disasters. We see them coming."**

</div>
# 🛰 NER Smart Logistics — SIH Problem Statement 26002

AI-assisted route risk prediction & dynamic rerouting for North-East Region logistics.

## The Problem
Landslides, floods, and road blockades frequently cut off NH corridors in the NER.
Convoys get stranded because operators learn about blockages only when they reach them.

## Our Solution
Field officers report incidents → AI Risk Engine scores all corridors →
blocked routes are flagged on a live GIS map → affected vehicles are auto-diverted
to the safest alternative route → alerts are generated in real time.

## Risk Engine (MVP implementation)
Weighted multi-factor scoring:
- Rainfall 30% · Road condition 30% · Historical incidents 20% · Traffic 10% · Terrain 10%
- 0–30 LOW 🟢 · 31–60 MEDIUM  · 61–80 HIGH 🔴 · 81–100 CRITICAL 🚨
> Production roadmap: replace the weighted scorer with an ML model trained on
> historical incident, IMD weather, terrain (SRTM) and road-condition datasets.

## Tech Stack
React + Leaflet (GIS) · Node/Express · MongoDB · Simulated GPS telemetry



## Demo Flow
1. Dashboard: all routes 🟢
2. Report landslide on NH-6 (HIGH, 82mm)
3. Risk Engine: Route A = 87% CRITICAL → BLOCKED
4. System recommends Route B (24%) and auto-diverts 3 vehicles
5. Live map shows red/green corridors + moving trucks + critical alert
