/**
 * battery.test.js
 *
 * Tests for battery SoH computation and classification.
 * Original asserts are preserved. Boundary-condition tests are added.
 *
 * Sections:
 *   1. computeSoH()
 *   2. classifyBattery()  — normal ranges
 *   3. classifyBattery()  — boundary conditions  [added]
 *   4. countBatteriesByHealth()  — count correctness
 *   5. countBatteriesByHealth()  — boundary capacities  [added]
 *   6. classifyBatteries()  — full report
 *   7. Edge cases  [added]
 */

const {
  computeSoH,
  classifyBattery,
  countBatteriesByHealth,
  classifyBatteries,
  RATED_CAPACITY_AH,
  THRESHOLDS,
} = require('../src/battery');

// ── Minimal assert helpers ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅  ${message}`);
    passed++;
  } else {
    console.error(`  ❌  FAILED: ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(
    ok,
    `${message}\n       expected : ${JSON.stringify(expected)}\n       received : ${JSON.stringify(actual)}`
  );
}

function section(title) {
  console.log(`\n${'─'.repeat(56)}`);
  console.log(`  📋  ${title}`);
  console.log('─'.repeat(56));
}

// ─────────────────────────────────────────────────────────────
// 1. computeSoH
// ─────────────────────────────────────────────────────────────
section('1. computeSoH()');

// Assignment spec example
assert(computeSoH(105, 120) === 87.5,  'Spec example: 105/120 → 87.5%');

assert(computeSoH(120, 120) === 100,   'Full capacity 120/120 → 100%');
assert(computeSoH(0, 120)   === 0,     'Zero capacity → 0%');
assert(computeSoH(60, 120)  === 50,    '60 Ah / 120 rated → 50%');

// Default rated capacity should be 120 Ah
assert(computeSoH(120) === 100,  'Default rated capacity is 120 Ah');

// Exact boundary values
// 83% of 120 = 99.6 Ah
assert(computeSoH(99.6) === 83,  '99.6 Ah → exactly 83%');

// 63% of 120 = 75.6 Ah — floating-point gives 62.999...  round to 2dp
assert(
  parseFloat(computeSoH(75.6).toFixed(2)) === 63,
  '75.6 Ah → 63% (2dp, floating-point safe)'
);

// ─────────────────────────────────────────────────────────────
// 2. classifyBattery — normal ranges
// ─────────────────────────────────────────────────────────────
section('2. classifyBattery() — normal ranges');

assert(classifyBattery(100)  === 'healthy',   '100% → healthy');
assert(classifyBattery(90)   === 'healthy',   '90%  → healthy');
assert(classifyBattery(84)   === 'healthy',   '84%  → healthy');
assert(classifyBattery(75)   === 'exchange',  '75%  → exchange');
assert(classifyBattery(70)   === 'exchange',  '70%  → exchange');
assert(classifyBattery(64)   === 'exchange',  '64%  → exchange');
assert(classifyBattery(50)   === 'failed',    '50%  → failed');
assert(classifyBattery(10)   === 'failed',    '10%  → failed');
assert(classifyBattery(0)    === 'failed',    '0%   → failed');

// ─────────────────────────────────────────────────────────────
// 3. classifyBattery — boundary conditions  [added]
// ─────────────────────────────────────────────────────────────
section('3. classifyBattery() — boundary conditions [added]');

// "more than 83%" → 83.0 itself is NOT healthy
assert(classifyBattery(83.1) === 'healthy',   '83.1% → healthy  (just above 83)');
assert(classifyBattery(83.0) === 'exchange',  '83.0% → exchange (exactly 83, not > 83)');
assert(classifyBattery(82.9) === 'exchange',  '82.9% → exchange (just below 83)');

// "below 63%" → 63.0 itself is NOT exchange, it is failed
assert(classifyBattery(63.1) === 'exchange',  '63.1% → exchange (just above 63)');
assert(classifyBattery(63.0) === 'failed',    '63.0% → failed   (exactly 63, not > 63)');
assert(classifyBattery(62.9) === 'failed',    '62.9% → failed   (just below 63)');

// ─────────────────────────────────────────────────────────────
// 4. countBatteriesByHealth — count correctness
// ─────────────────────────────────────────────────────────────
section('4. countBatteriesByHealth() — count correctness');

// Hand-verified:
//   113 → 94.17% healthy  |  116 → 96.67% healthy
//    80 → 66.67% exchange |   95 → 79.17% exchange  |  92 → 76.67% exchange
//    70 → 58.33% failed
assertEqual(
  countBatteriesByHealth([113, 116, 80, 95, 92, 70]),
  { healthy: 2, exchange: 3, failed: 1 },
  'Mixed set: 2 healthy, 3 exchange, 1 failed'
);

assertEqual(
  countBatteriesByHealth([120, 110, 105, 101]),
  { healthy: 4, exchange: 0, failed: 0 },
  'All healthy'
);

assertEqual(
  countBatteriesByHealth([99, 90, 77]),
  { healthy: 0, exchange: 3, failed: 0 },
  'All exchange'
);

assertEqual(
  countBatteriesByHealth([70, 50, 30]),
  { healthy: 0, exchange: 0, failed: 3 },
  'All failed'
);

assertEqual(
  countBatteriesByHealth([105]),
  { healthy: 1, exchange: 0, failed: 0 },
  'Single battery 105 Ah → 87.5% → healthy'
);

// ─────────────────────────────────────────────────────────────
// 5. countBatteriesByHealth — boundary capacities  [added]
// ─────────────────────────────────────────────────────────────
section('5. countBatteriesByHealth() — boundary capacities [added]');

// 83% of 120 Ah = 99.6 Ah
assertEqual(countBatteriesByHealth([99.7]), { healthy: 1, exchange: 0, failed: 0 },
  '99.7 Ah → 83.08% → healthy');
assertEqual(countBatteriesByHealth([99.6]), { healthy: 0, exchange: 1, failed: 0 },
  '99.6 Ah → exactly 83% → exchange (not > 83)');
assertEqual(countBatteriesByHealth([99.5]), { healthy: 0, exchange: 1, failed: 0 },
  '99.5 Ah → 82.92% → exchange');

// 63% of 120 Ah = 75.6 Ah
assertEqual(countBatteriesByHealth([75.7]), { healthy: 0, exchange: 1, failed: 0 },
  '75.7 Ah → 63.08% → exchange');
assertEqual(countBatteriesByHealth([75.6]), { healthy: 0, exchange: 0, failed: 1 },
  '75.6 Ah → exactly 63% → failed (not > 63)');
assertEqual(countBatteriesByHealth([75.5]), { healthy: 0, exchange: 0, failed: 1 },
  '75.5 Ah → 62.92% → failed');

// One in each category
assertEqual(
  countBatteriesByHealth([99.7, 99.6, 75.7, 75.6]),
  { healthy: 1, exchange: 2, failed: 1 },
  'Boundary set: 1 healthy, 2 exchange, 1 failed'
);

// ─────────────────────────────────────────────────────────────
// 6. classifyBatteries — full report
// ─────────────────────────────────────────────────────────────
section('6. classifyBatteries() — full report');

const report = classifyBatteries([105, 80, 50]);

assertEqual(report.summary, { healthy: 1, exchange: 1, failed: 1 },
  'Summary: 1 healthy, 1 exchange, 1 failed');

assertEqual(report.details[0].sohPercent,     87.5,       'Battery 1 SoH = 87.5%');
assertEqual(report.details[0].classification, 'healthy',  'Battery 1 → healthy');
assertEqual(report.details[1].sohPercent,     66.67,      'Battery 2 SoH = 66.67%');
assertEqual(report.details[1].classification, 'exchange', 'Battery 2 → exchange');
assertEqual(report.details[2].sohPercent,     41.67,      'Battery 3 SoH = 41.67%');
assertEqual(report.details[2].classification, 'failed',   'Battery 3 → failed');

// ─────────────────────────────────────────────────────────────
// 7. Edge cases  [added]
// ─────────────────────────────────────────────────────────────
section('7. Edge cases [added]');

// Empty input
assertEqual(countBatteriesByHealth([]), { healthy: 0, exchange: 0, failed: 0 },
  'Empty array → all zeros');

// All 120 batteries in large batch are accounted for
const largeBatch = Array.from({ length: 120 }, (_, i) => i + 1);
const largeResult = countBatteriesByHealth(largeBatch);
assert(
  largeResult.healthy + largeResult.exchange + largeResult.failed === 120,
  'Large dataset: all 120 batteries classified'
);

// Custom rated capacity (100 Ah)
assertEqual(countBatteriesByHealth([85], 100), { healthy: 1, exchange: 0, failed: 0 },
  'Custom rated 100 Ah: 85 Ah → 85% → healthy');
assertEqual(countBatteriesByHealth([80], 100), { healthy: 0, exchange: 1, failed: 0 },
  'Custom rated 100 Ah: 80 Ah → 80% → exchange');
assertEqual(countBatteriesByHealth([60], 100), { healthy: 0, exchange: 0, failed: 1 },
  'Custom rated 100 Ah: 60 Ah → 60% → failed');

// Constants sanity check
assert(RATED_CAPACITY_AH  === 120, 'RATED_CAPACITY_AH constant = 120');
assert(THRESHOLDS.HEALTHY  === 83,  'THRESHOLDS.HEALTHY  = 83');
assert(THRESHOLDS.EXCHANGE === 63,  'THRESHOLDS.EXCHANGE = 63');

// ─────────────────────────────────────────────────────────────
// Result
// ─────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(56));
console.log(`  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
console.log('═'.repeat(56));

if (failed > 0) {
  console.error(`\n❌  ${failed} test(s) failed.\n`);
  process.exit(1);
} else {
  console.log('\n🎉  All tests passed!\n');
}
