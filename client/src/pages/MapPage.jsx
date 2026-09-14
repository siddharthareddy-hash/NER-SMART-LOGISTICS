import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const truckIcon = (plate) => L.divIcon({
  html: '<div style="background:#1e293b;color:#fff;padding:2px 6px;border-radius:6px;font-size:11px;white-space:nowrap">🚚 ' + plate + '</div>',
  className: "", iconSize: [130, 22], iconAnchor: [65, 11]
});

const pin = L.divIcon({ html: "⚠️", className: "", iconSize: [26, 26], iconAnchor: [13, 13] });

function posOn(coords, p) {
  if (!coords || coords.length < 2) return coords?.[0] || [25.8, 91.9];
  const segs = coords.length - 1;
  const f = (p / 100) * segs, i = Math.min(Math.floor(f), segs - 1), t = f - i;
  return [coords[i][0] + (coords[i + 1][0] - coords[i][0]) * t,
          coords[i][1] + (coords[i + 1][1] - coords[i][1]) * t];
}

export default function MapPage() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const timer = useRef(null);

  const load = async () => {
    const [r, v, i] = await Promise.all(["routes", "vehicles", "incidents"].map(k => api.get(`/api/${k}`)));
    setRoutes(r.data); setVehicles(v.data); setIncidents(i.data);
  };

  // poll every 6s normally; while simulating, the sim tick drives refreshes
  useEffect(() => {
    load();
    if (simulating) return;
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [simulating]);

  const toggleSim = () => {
    if (simulating) { clearInterval(timer.current); setSimulating(false); return; }
    setSimulating(true);
    timer.current = setInterval(async () => { await api.post("/api/simulate-tick"); load(); }, 1500);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  const color = r => r.riskScore > 80 ? "#dc2626" : r.riskScore > 60 ? "#ea580c" : "#16a34a";

  return (
    <div className="relative">
      <button onClick={toggleSim}
        className={`absolute top-4 right-4 z-[1000] px-5 py-2 rounded-lg font-bold shadow-lg text-white ${simulating ? "bg-red-600" : "bg-green-600"}`}>
        {simulating ? "⏸ Stop GPS Simulation" : "▶ Start GPS Simulation"}
      </button>

      {/* Live weather + risk strip */}
      <div className="flex gap-3 p-3 flex-wrap">
        {routes.map(r => (
          <div key={r._id}
            className="px-4 py-2 rounded-lg bg-white shadow text-sm border-l-4"
            style={{ borderLeftColor: color(r) }}>
            <b>{r.name.split(":")[0]}</b> · Risk {r.riskScore}% · {r.status}
            {r.liveWeather && <> · 🌦️ {r.liveWeather.condition} {Math.round(r.liveWeather.temp)}°C{r.liveWeather.rainfall > 0 && ` · ${r.liveWeather.rainfall}mm/h rain`}</>}
          </div>
        ))}
      </div>

      <MapContainer center={[25.8, 91.9]} zoom={8} style={{ height: "80vh" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

        {routes.map(r => (
          <Polyline key={r._id} positions={r.coords} pathOptions={{ color: color(r), weight: 6 }}>
            <Popup>
              <b>{r.name}</b><br />
              Risk Score: <b>{r.riskScore}%</b> ({r.level})<br />
              Status: <b>{r.status}</b>
              {r.liveWeather && (
                <>
                  <br />🌦️ Live: <b>{r.liveWeather.condition}</b>, {Math.round(r.liveWeather.temp)}°C
                  {r.liveWeather.rainfall > 0 && <> · {r.liveWeather.rainfall}mm/h rain</>}
                </>
              )}
            </Popup>
          </Polyline>
        ))}

        {vehicles.map(v => {
          const route = routes.find(r => String(r._id) === String(v.routeId));
          if (!route) return null; // wait for data — never teleport trucks to a wrong route
          const p = posOn(route.coords, v.progress);
          return (
            <Marker key={v._id} position={p} icon={truckIcon(v.plate)}>
              <Popup>
                🚚 <b>{v.plate}</b><br />{v.cargo}<br />
                {v.from} → {v.to}<br />
                Status: <b>{v.status}</b> · ETA: {v.eta}<br />
                📍 Lat: {p[0].toFixed(4)}, Lng: {p[1].toFixed(4)}<br />
                Route progress: {v.progress || 0}%
              </Popup>
            </Marker>
          );
        })}

        {incidents.slice(0, 3).map(i => (
          <Marker key={i._id} position={[i.lat || 25.75, i.lng || 91.85]} icon={pin}>
            <Popup>
              <b>{i.type}</b> — {i.location}<br />
              Severity: {i.severity} · Rainfall: {i.rainfall}mm<br />
              Risk: <b>{i.riskScore}% ({i.status})</b>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
