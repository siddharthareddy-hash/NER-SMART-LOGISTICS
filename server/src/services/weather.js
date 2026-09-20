const { OPENWEATHER_KEY } = require('../config/env');

async function getWeather(lat, lon) {
  if (!OPENWEATHER_KEY) throw new Error('WEATHER_KEY_MISSING');

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather HTTP ${res.status}`);
  const data = await res.json();

  return {
    rainfall: data.rain?.['1h'] ?? 0,
    windSpeed: data.wind?.speed ?? 0,
    visibility: (data.visibility ?? 10000) / 1000,
    temp: data.main?.temp ?? 0,
    condition: data.weather?.[0]?.main ?? 'Clear',
    description: data.weather?.[0]?.description ?? '',
  };
}

module.exports = { getWeather };
