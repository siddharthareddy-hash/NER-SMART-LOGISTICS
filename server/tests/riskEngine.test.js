// tests/riskEngine.test.js
const { scoreRoute } = require('../src/services/riskEngine');

describe('scoreRoute', () => {
  it('returns LOW for clear weather', () => {
    const r = scoreRoute({ rainfall: 0, windSpeed: 5, visibility: 10 }, { floodHistory: 0 });
    expect(r.level).toBe('LOW');
    expect(r.score).toBe(0);
  });

  it('returns CRITICAL for extreme rain + fog', () => {
    const r = scoreRoute({ rainfall: 60, windSpeed: 90, visibility: 0.5 }, { floodHistory: 80 });
    expect(r.level).toBe('CRITICAL');
    expect(r.score).toBeGreaterThanOrEqual(75);
  });

  it('handles missing weather data without crashing', () => {
    expect(() => scoreRoute({}, {})).not.toThrow();
    const r = scoreRoute(undefined, undefined);
    expect(r.score).toBe(0);
  });

  it('handles garbage input safely', () => {
    const r = scoreRoute({ rainfall: 'banana', windSpeed: null }, { floodHistory: -50 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('clamps score within 0-100', () => {
    const r = scoreRoute({ rainfall: 999, windSpeed: 500, visibility: -10 }, { floodHistory: 500 });
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('returns factor breakdown for explainability', () => {
    const r = scoreRoute({ rainfall: 20 }, { floodHistory: 10 });
    expect(r.factors).toHaveLength(4);
    expect(r.factors[0].name).toBe('RAIN');
  });
});
