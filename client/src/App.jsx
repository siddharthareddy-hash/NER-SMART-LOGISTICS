import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Report from "./pages/Report";
import Vehicles from "./pages/Vehicles";
import "leaflet/dist/leaflet.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center gap-8 sticky top-0 z-[1000]">
        <span className="font-extrabold text-lg">🛰 NER SMART LOGISTICS</span>
        <div className="flex gap-5">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/map">Live Map</NavLink>
          <NavLink to="/report" className="text-red-400 font-bold">⚠ Report Incident</NavLink>
          <NavLink to="/vehicles">Vehicles</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report" element={<Report />} />
        <Route path="/vehicles" element={<Vehicles />} />
      </Routes>
    </BrowserRouter>
  );
}
