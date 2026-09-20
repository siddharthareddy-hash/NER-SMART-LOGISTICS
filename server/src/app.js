const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { scoreRoute } = require('./services/riskEngine');
const { getWeather } = require('./services/weather');
const Route = require('./models/Route');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/routes/:id/risk', async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    let weather = { rainfall: 0, windSpeed: 0, visibility: 10 };
    let weatherSource = 'fallback';
    try {
      weather = await getWeather(route.coordinates.lat, route.coordinates.lon);
      weatherSource = 'openweather';
    } catch (e) {
      console.warn(`Weather unavailable (${e.message}), using fallback`);
    }

    const risk = scoreRoute(weather, { floodHistory: route.floodHistory });
    res.json({ routeId: route._id, name: route.name, weatherSource, ...risk });
  } catch (err) {
    next(err);
  }
});

app.post('/api/routes', async (req, res, next) => {
  try {
    const { name, lat, lon, floodHistory } = req.body;
    if (!name || lat == null || lon == null) {
      return res.status(400).json({ error: 'name, lat, lon are required' });
    }
    const route = await Route.create({ name, coordinates: { lat, lon }, floodHistory });
    res.status(201).json(route);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error('Boom:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
