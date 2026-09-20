const { OPENWEATHER_KEY } = require('../config/env');

const cache = new Map();
const TTL = 60 * 1000;

const getWeather = async (lat, lon) => {
  const key = `lat,{lat},lat,{lon}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  if (!OPENWEATHER_KEY) throw new Error('WEATHER_KEY_MISSING');

  const url = `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid=${OPENWEATHER_KEY}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`WEATHER_API_ERROR_${res.status}`);

  const json = await res.json();
  const data = {
    rainfall: json.rain?.['1h'] ?? 0,
    windSpeed: json.wind?.speed ? json.wind.speed * 3.6 : 0,
    visibility: json.visibility != null ? json.visibility / 1000 : 10,
  };

  cache.set(key, { ts: Date.now(), data });
  return data;
};

module.exports = { getWeather };
