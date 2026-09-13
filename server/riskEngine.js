const W = { rainfall: 0.25, roadDamage: 0.35, historical: 0.15, traffic: 0.10, terrain: 0.15 };
const SEV = { LOW: 25, MEDIUM: 55, HIGH: 90, CRITICAL: 100 };
const BONUS = { LOW: 0, MEDIUM: 5, HIGH: 10, CRITICAL: 15 };

function scoreRoute(route, incident) {
  const severity = (incident?.severity || "").toUpperCase();
  const rainfall = Math.min((Number(incident?.rainfall) || 0) / 120, 1) * 100;
  const roadDamage = SEV[severity] ?? 50;

  let riskScore = Math.round(
    rainfall * W.rainfall +
    roadDamage * W.roadDamage +
    (route.historicalRisk ?? 30) * W.historical +
    (route.traffic ?? 40) * W.traffic +
    (route.terrainRisk ?? 60) * W.terrain

  );

  // incident severity bonus — real-time hazard escalation
  riskScore = Math.min(riskScore + (BONUS[severity] || 0), 100);

  const level = riskScore <= 30 ? "LOW" : riskScore <= 60 ? "MEDIUM" : riskScore <= 80 ? "HIGH" : "CRITICAL";
  const status = riskScore > 80 ? "BLOCKED" : riskScore > 60 ? "HIGH RISK" : "SAFE";

  return { routeId: route._id, name: route.name, riskScore, level, status };
}

module.exports = { scoreRoute };
