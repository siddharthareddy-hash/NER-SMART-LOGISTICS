import React, { useEffect, useState } from "react";
import api from "../api";

const wIcon = (c) => ({
  Thunderstorm: "⛈️", Drizzle: "🌦️", Rain: "🌧️", Snow: "❄️",
  Clear: "☀️", Clouds: "☁️", Mist: "🌫️", Fog: "🌫️", Haze: "🌫️",
}[c] || "🌡️");

export default function WeatherPanel() {
  const [wx, setWx] = useState([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const load = () => api.get("/api/weather")
      .then(r => { setWx(r.data); setErr(false); })
      .catch(() => setErr(true));
    load();
    const t = setInterval(load, 300000); // refresh every 5 min
    return () => clearInterval(t);
  }, []);

  if (err) return null; // fail-soft: don't break the dashboard

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
      {wx.map(r => (
        <div key={r.name} className="bg-white rounded-xl shadow p-4 flex items-center justify-between border-l-4"
          style={{ borderLeftColor: r.weather.rainfall > 2 ? "#dc2626" : r.weather.condition === "Rain" ? "#ea580c" : "#16a34a" }}>
          <div>
            <div className="font-bold text-sm text-slate-700">{r.name.split(":")[0]}</div>
            <div className="text-xs text-slate-500 capitalize">{r.weather.description}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl">{wIcon(r.weather.condition)}</div>
            <div className="text-sm font-semibold">{Math.round(r.weather.temp)}°C</div>
            {r.weather.rainfall > 0 && <div className="text-xs text-blue-600">{r.weather.rainfall}mm/h</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
