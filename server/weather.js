const axios = require("axios");

// Coordinates for NER corridor waypoints
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
    condition: data.weather[0].main,          // "Rain", "Clear", "Thunderstorm"...
    description: data.weather[0].description,
    rainfall: data.rain?.["1h"] || 0,          // mm in last hour
    wind: data.wind.speed,
  };
}

// Weather for a route = worst of its waypoints (capped at 3 to save free-tier calls)
async function routeWeather(route) {
  const points = (route.coords || []).slice(0, 3);
  if (!points.length) return null;
  const readings = await Promise.all(points.map(p => fetchWeather(p[0], p[1])));
  const worst = readings.reduce((a, b) => (b.rainfall > a.rainfall ? b : a));
  return { ...worst, region: worst.description };
}

module.exports = { routeWeather, fetchWeather, REGIONS };
