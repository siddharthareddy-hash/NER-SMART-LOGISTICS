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

## Run
cd server && npm i && npm run seed && npm start
cd client && npm i && npm run dev

## Demo Flow
1. Dashboard: all routes 🟢
2. Report landslide on NH-6 (HIGH, 82mm)
3. Risk Engine: Route A = 87% CRITICAL → BLOCKED
4. System recommends Route B (24%) and auto-diverts 3 vehicles
5. Live map shows red/green corridors + moving trucks + critical alert
