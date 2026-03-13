/**
 * battery.js
 * Core logic: compute SoH and classify battery health.
 *
 * SoH% = 100 * present_capacity / rated_capacity
 *
 * Classifications:
 *   healthy  → SoH  > 83%
 *   exchange → SoH  > 63% (up to 83%)
 *   failed   → SoH <= 63%
 */

const RATED_CAPACITY_AH = 120;

const THRESHOLDS = {
  HEALTHY:  83,
  EXCHANGE: 63,
};

/**
 * Compute State-of-Health as a percentage.
 * @param {number} presentCapacity - Ah after full charge
 * @param {number} ratedCapacity   - Ah of a brand-new battery
 * @returns {number} SoH percentage
 */
function computeSoH(presentCapacity, ratedCapacity = RATED_CAPACITY_AH) {
  return (100 * presentCapacity) / ratedCapacity;
}

/**
 * Classify one battery by its SoH percentage.
 * @param {number} sohPercent
 * @returns {'healthy' | 'exchange' | 'failed'}
 */
function classifyBattery(sohPercent) {
  if (sohPercent > THRESHOLDS.HEALTHY)  return 'healthy';
  if (sohPercent > THRESHOLDS.EXCHANGE) return 'exchange';
  return 'failed';
}

/**
 * Count batteries in each health category from an array of present capacities.
 * @param {number[]} presentCapacities - Array of present capacities (Ah)
 * @param {number}   ratedCapacity     - Rated capacity for all batteries
 * @returns {{ healthy: number, exchange: number, failed: number }}
 */
function countBatteriesByHealth(presentCapacities, ratedCapacity = RATED_CAPACITY_AH) {
  const counts = { healthy: 0, exchange: 0, failed: 0 };

  for (const capacity of presentCapacities) {
    const soh        = computeSoH(capacity, ratedCapacity);
    const category   = classifyBattery(soh);
    counts[category] += 1;
  }

  return counts;
}

/**
 * Produce a full report: per-battery details + summary counts.
 * @param {number[]} presentCapacities
 * @param {number}   ratedCapacity
 * @returns {{ summary: object, details: object[] }}
 */
function classifyBatteries(presentCapacities, ratedCapacity = RATED_CAPACITY_AH) {
  const details = presentCapacities.map((capacity, index) => {
    const soh            = computeSoH(capacity, ratedCapacity);
    const classification = classifyBattery(soh);
    return {
      id:              index + 1,
      presentCapacity: capacity,
      ratedCapacity,
      sohPercent:      parseFloat(soh.toFixed(2)),
      classification,
    };
  });

  const summary = details.reduce(
    (acc, item) => { acc[item.classification] += 1; return acc; },
    { healthy: 0, exchange: 0, failed: 0 }
  );

  return { summary, details };
}

module.exports = {
  RATED_CAPACITY_AH,
  THRESHOLDS,
  computeSoH,
  classifyBattery,
  countBatteriesByHealth,
  classifyBatteries,
};
