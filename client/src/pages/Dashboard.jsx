import React, { useEffect, useState } from "react";

import api from "../api";

const badge = r => r?.riskScore > 80 ? "🔴 CRITICAL" : r?.riskScore > 60 ? "🟠 HIGH RISK" : "🟢 SAFE";

const wIcon = c => ({
  Thunderstorm: "⛈️", Drizzle: "🌦️", Rain: "🌧️", Snow: "❄️",
  Clear: "☀️", Clouds: "☁️", Mist: "🌫️", Fog: "🌫️", Haze: "🌫️",
}[c] || "🌡️");

export default function Dashboard() {
  const [d, setD] = useState({ routes: [], vehicles: [], alerts: [], incidents: [] });
  const [advisories, setAdvisories] = useState([]);

  const load = async () => {
    const [r, v, a, i] = await Promise.all(
      ["routes", "vehicles", "alerts", "incidents"].map(k => api.get(`/api/${k}`))
    );
    setD({ routes: r.data, vehicles: v.data, alerts: a.data, incidents: i.data });
    // forecast advisories — refresh every cycle, fail-soft
    try { const f = await api.get("/api/forecast"); setAdvisories(f.data); }
    catch { setAdvisories([]); }
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  const rainRoutes = d.routes.filter(r => r.liveWeather?.rainfall > 0).length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Command Center Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[["Routes", d.routes.length, "🗺"], ["Vehicles", d.vehicles.length, "🚚"],
          ["Alerts", d.alerts.length, "🔔"], ["Incidents", d.incidents.length, "📍"],
          ["Rain-affected", rainRoutes, "🌧️"]].map(([l, n, e]) => (
          <div key={l} className="bg-white p-6 rounded-xl shadow text-center">
            <div className="text-4xl">{e}</div>
            <div className="text-3xl font-extrabold mt-2">{n}</div>
            <div className="text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      {/* 🌦️ Predictive advisories — visible only when heavy rain/thunderstorms are forecast */}
      {advisories.map(a => (
        <div key={a.routeId}
          className={`p-4 rounded-xl shadow mt-4 border-l-4 ${a.forecast.level === "CRITICAL" ? "bg-red-100 border-red-600" : "bg-amber-100 border-amber-500"}`}>
          <b>{a.forecast.level === "CRITICAL" ? "⛈️" : "⚠️"} {a.forecast.level} ADVISORY — PREDICTIVE</b>
          <p className="text-sm mt-1">{a.forecast.advisory}</p>
          <p className="text-xs text-gray-500 mt-1">
            Current: {wIcon(a.forecast.condition)} {a.forecast.description} · {Math.round(a.forecast.temp)}°C · expected rainfall {a.forecast.rainfall}mm
          </p>
        </div>
      ))}

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-bold text-lg mb-3">Route Status</h2>
          {d.routes.map(r => (
            <div key={r._id} className="flex justify-between items-center p-3 border-b last:border-0">
              <div>
                <div>{r.name}</div>
                {r.liveWeather && (
                  <div className="text-xs text-gray-500">
                    {wIcon(r.liveWeather.condition)} {r.liveWeather.description} · {Math.round(r.liveWeather.temp)}°C
                    {r.liveWeather.rainfall > 0 && <span className="text-blue-600"> · {r.liveWeather.rainfall}mm/h</span>}
                  </div>
                )}
              </div>
              <span className="font-bold">{badge(r)} {r.riskScore ?? "—"}%</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-bold text-lg mb-3">🚨 Critical Alerts</h2>
          {d.alerts.length === 0 && <p className="text-gray-400">No alerts. All clear.</p>}
          {d.alerts.slice(0, 6).map(a => (
            <div key={a._id} className={`p-3 my-2 rounded-lg ${a.level === "CRITICAL" ? "bg-red-100" : "bg-blue-50"}`}>
              <b>{a.title}</b>
              <p className="text-sm text-gray-600">{a.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
