require("dotenv").config();
const axios = require("axios");

const REGIONS = {
  Shillong:  { lat: 25.5788, lng: 91.8933 },
  Nongpoh:   { lat: 25.9068, lng: 91.8822 },
  Jowai:     { lat: 25.4588, lng: 92.1975 },
  Guwahati:  { lat: 26.1445, lng: 91.7362 },
};

async function fetchWeather(lat, lng) {
  const { data } = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather",
    { params: { lat, lon: lng, appid: process.env.OPENWEATHER_KEY, units: "metric" } }
  );
  return {
    temp: data.main.temp,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    rainfall: data.rain?.["1h"] || 0,
    wind: data.wind.speed,
  };
}

async function routeWeather(route) {
  const points = (route.coords || []).slice(0, 3);
  if (!points.length) return null;
  const readings = await Promise.all(points.map(p => fetchWeather(p[0], p[1])));
  const worst = readings.reduce((a, b) => (b.rainfall > a.rainfall ? b : a));
  return { ...worst, region: worst.description };
}

async function routeForecast(route) {
  const key = process.env.OPENWEATHER_KEY;
  const points = (route.coords || []).slice(0, 3);
  if (!key || !points.length) return null;

  let worst = null;
  for (const [lat, lng] of points) {
    const { data } = await axios.get(
      "https://api.openweathermap.org/data/2.5/forecast",
      { params: { lat, lon: lng, appid: key, units: "metric" } }
    );
    for (const f of (data.list || []).slice(0, 2)) {
      const rain = f.rain?.["3h"] || 0;
      const cond = f.weather?.[0]?.main || "Clear";
      const desc = f.weather?.[0]?.description || "";
      const score = rain + (cond === "Thunderstorm" ? 10 : 0);
      if (!worst || score > worst.score) {
        worst = {
          score,
          hoursAhead: Math.round((new Date(f.dt * 1000) - new Date()) / 3600000),
          rainfall: rain, condition: cond, description: desc,
          temp: f.main?.temp,
        };
      }
    }
  }

  if (worst && worst.score >= 2) {
    worst.advisory =
      "⚠️ " + (worst.condition === "Thunderstorm" ? "Thunderstorms" : "Heavy rain") +
      " (" + worst.rainfall + "mm) expected on " + route.name.split(":")[0] +
      " in ~" + worst.hoursAhead + "h — pre-position vehicles on alternate corridor now.";
    worst.level = worst.condition === "Thunderstorm" || worst.rainfall > 10 ? "CRITICAL" : "WARNING";
  }
  return worst;
}

module.exports = { routeWeather, routeForecast, fetchWeather, REGIONS };
