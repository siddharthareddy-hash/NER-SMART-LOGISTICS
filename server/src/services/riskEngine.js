const WEIGHTS = { RAIN: 0.4, WIND: 0.2, VISIBILITY: 0.25, FLOOD_HISTORY: 0.15 };

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const rainScore = (mm) => {
  if (mm == null || mm < 0 || typeof mm !== 'number') return 0;
  if (mm < 2.5) return mm / 2.5 * 25;
  if (mm < 10) return 25 + ((mm - 2.5) / 7.5) * 30;
  if (mm < 50) return 55 + ((mm - 10) / 40) * 30;
  return 100;
};

const windScore = (kmh) => {
  if (kmh == null || kmh < 0 || typeof kmh !== 'number') return 0;
  return clamp(((kmh - 20) / 80) * 100, 0, 100);
};

const visibilityScore = (km) => {
  if (km == null || km < 0 || typeof km !== 'number') return 0;
  return clamp((10 - km) / 10 * 100, 0, 100);
};

const levelOf = (score) => {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
};

const scoreRoute = (weather = {}, routeMeta = {}) => {
  const rain = rainScore(weather.rainfall);
  const wind = windScore(weather.windSpeed);
  const vis = visibilityScore(weather.visibility);
  const flood = clamp(Number(routeMeta.floodHistory) || 0, 0, 100);

  const raw = rain * WEIGHTS.RAIN + wind * WEIGHTS.WIND + vis * WEIGHTS.VISIBILITY + flood * WEIGHTS.FLOOD_HISTORY;
  const score = clamp(Math.round(raw) || 0, 0, 100);

  return {
    score,
    level: levelOf(score),
    factors: [
      { name: 'RAIN', value: rain, weight: WEIGHTS.RAIN },
      { name: 'WIND', value: wind, weight: WEIGHTS.WIND },
      { name: 'VISIBILITY', value: vis, weight: WEIGHTS.VISIBILITY },
      { name: 'FLOOD_HISTORY', value: flood, weight: WEIGHTS.FLOOD_HISTORY },
    ],
  };
};

module.exports = { scoreRoute, WEIGHTS };
