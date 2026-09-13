import React, { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const clickPin = L.divIcon({ html: "📍", className: "", iconSize: [26, 26], iconAnchor: [13, 13] });

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) { onPick([e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}

export default function Report() {
  const [f, setF] = useState({ type: "Landslide", location: "NH-6, Meghalaya",
    severity: "HIGH", rainfall: 82, description: "Road blocked due to landslide" });
  const [pos, setPos] = useState([25.75, 91.85]);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    const payload = { ...f, lat: pos[0], lng: pos[1] };
    const { data } = await api.post("/api/incidents", payload);
    setRes(data); setLoading(false);
  };

  if (loading) return (
    <div className="p-12 text-center text-2xl font-bold animate-pulse">
      🧠 Analyzing incident...<br />
      <span className="text-base text-gray-500">Weather → Road condition → Historical risk → Terrain → AI Risk Engine</span>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-8">
      {!res ? (
        <form onSubmit={submit} className="bg-white shadow rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-xl">📍 REPORT INCIDENT</h2>
          <div>
            <label className="text-sm font-semibold">Incident Type</label>
            <select className="w-full border p-2 rounded" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
              {["Landslide", "Flood", "Bridge Damage", "Accident", "Road Blockade"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Location</label>
            <input className="w-full border p-2 rounded" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-semibold">Pin exact spot on map</label>
            <MapContainer center={pos} zoom={9} style={{ height: "220px", borderRadius: "8px" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              <ClickCatcher onPick={setPos} />
              <Marker position={pos} icon={clickPin} />
            </MapContainer>
            <div className="text-xs text-gray-500 mt-1">
              Selected: {pos[0].toFixed(4)}, {pos[1].toFixed(4)} — click map to move the pin
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">Severity</label>
            <select className="w-full border p-2 rounded" value={f.severity} onChange={e => setF({ ...f, severity: e.target.value })}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Rainfall (mm)</label>
            <input type="number" className="w-full border p-2 rounded" value={f.rainfall} onChange={e => setF({ ...f, rainfall: +e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-semibold">Description</label>
            <textarea className="w-full border p-2 rounded" rows="3" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
          </div>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-bold">SUBMIT INCIDENT</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-gray-500 mb-2">AI Risk Engine Result</div>
            <div className="text-6xl font-extrabold text-red-600">{res.affected?.riskScore ?? 25}%</div>
            <div className="text-xl font-bold mt-1">{res.affected?.level ?? "LOW"} — {res.affected?.status ?? "SAFE"}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <b>Route evaluation:</b>
            {res.scored.map(s => (
              <div key={s.routeId} className="flex justify-between p-2 border-b last:border-0">
                <span>{s.name}</span>
                <span className={s.riskScore > 80 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {s.riskScore}% — {s.status}
                </span>
              </div>
            ))}
          </div>
          {res.recommended && (
            <div className="bg-green-100 rounded-xl p-5">
              ✅ <b>RECOMMENDED ALTERNATIVE</b><br />
              {res.recommended.name}<br />
              Risk: {res.recommended.riskScore}% · Est. delay: +35 min
            </div>
          )}
          {res.alert && (
            <div className="bg-red-100 rounded-xl p-5 font-bold">
              {res.alert.title}<br />
              <span className="font-normal text-sm">{res.alert.message}</span>
            </div>
          )}
          <button onClick={() => nav("/map")} className="w-full bg-gray-900 text-white p-3 rounded-lg font-bold">
            🗺 View on Live Map →
          </button>
        </div>
      )}
    </div>
  );
}
