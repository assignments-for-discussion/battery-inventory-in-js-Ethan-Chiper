/**
 * batteryRoutes.js
 * REST endpoints for battery health classification.
 *
 * GET  /api/battery/info       → thresholds and rated capacity info
 * POST /api/battery/classify   → full per-battery report + summary
 * POST /api/battery/count      → summary counts only
 * POST /api/battery/single     → classify one battery
 */

const express = require('express');
const router  = express.Router();

const {
  computeSoH,
  classifyBattery,
  countBatteriesByHealth,
  classifyBatteries,
  RATED_CAPACITY_AH,
  THRESHOLDS,
} = require('../src/battery');

const { validateBatchRequest, validateSingleRequest } = require('../utils/validators');

// GET /api/battery/info
router.get('/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      ratedCapacityAh: RATED_CAPACITY_AH,
      thresholds: {
        healthy:  `SoH > ${THRESHOLDS.HEALTHY}%  (up to 100%)`,
        exchange: `SoH > ${THRESHOLDS.EXCHANGE}% up to ${THRESHOLDS.HEALTHY}%`,
        failed:   `SoH <= ${THRESHOLDS.EXCHANGE}%`,
      },
    },
  });
});

// POST /api/battery/classify
// Body: { presentCapacities: number[], ratedCapacity?: number }
router.post('/classify', (req, res) => {
  const check = validateBatchRequest(req.body);
  if (!check.valid) return res.status(400).json({ success: false, message: check.error });

  const { presentCapacities, ratedCapacity } = req.body;
  const result = classifyBatteries(presentCapacities, ratedCapacity);

  res.json({
    success: true,
    message: `Classified ${presentCapacities.length} battery/batteries`,
    data: result,
  });
});

// POST /api/battery/count
// Body: { presentCapacities: number[], ratedCapacity?: number }
router.post('/count', (req, res) => {
  const check = validateBatchRequest(req.body);
  if (!check.valid) return res.status(400).json({ success: false, message: check.error });

  const { presentCapacities, ratedCapacity } = req.body;
  const counts = countBatteriesByHealth(presentCapacities, ratedCapacity);

  res.json({ success: true, data: counts });
});

// POST /api/battery/single
// Body: { presentCapacity: number, ratedCapacity?: number }
router.post('/single', (req, res) => {
  const check = validateSingleRequest(req.body);
  if (!check.valid) return res.status(400).json({ success: false, message: check.error });

  const { presentCapacity, ratedCapacity } = req.body;
  const soh            = computeSoH(presentCapacity, ratedCapacity);
  const classification = classifyBattery(soh);

  res.json({
    success: true,
    data: {
      presentCapacity,
      ratedCapacity:  ratedCapacity || RATED_CAPACITY_AH,
      sohPercent:     parseFloat(soh.toFixed(2)),
      classification,
    },
  });
});

module.exports = router;
