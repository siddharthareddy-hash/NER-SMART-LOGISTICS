import React,{ useEffect, useState } from "react";
import api from "../api";

export default function Vehicles() {
  const [v, setV] = useState([]);
  useEffect(() => {
    const load = () => api.get("/api/vehicles").then(r => setV(r.data));
    load(); const t = setInterval(load, 4000); return () => clearInterval(t);
  }, []);
  const badge = s => s === "DIVERTED" ? "🟡 DIVERTED" : "🟢 IN TRANSIT";
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🚚 Fleet — Live Status</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {v.map(x => (
          <div key={x._id} className="bg-white rounded-xl shadow p-5">
            <div className="font-bold text-lg">🚚 {x.plate}</div>
            <div className="text-gray-500">{x.cargo}</div>
            <div className="mt-2">{x.from} → {x.to}</div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="font-semibold">{badge(x.status)}</span><span>ETA {x.eta}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded">
              <div className="h-2 bg-blue-500 rounded" style={{ width: `${x.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
