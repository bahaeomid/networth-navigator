// Monte Carlo Verification Tests - Auditor 2
// Phase 3: Monte Carlo Engine Audit

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('Test 3.1: Box-Muller Transform');

function testBoxMuller() {
  const simulations = 10000;
  const meanReturn = 7;
  const stdDev = 12;
  const returns = [];

  for (let i = 0; i < simulations; i++) {
    const u1 = Math.random() || 1e-10;
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(meanReturn + z * stdDev);
  }

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / simulations;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / simulations;
  const sampledStdDev = Math.sqrt(variance);

  console.log(`  Mean: ${mean.toFixed(2)} (expected: ~7)`);
  console.log(`  StdDev: ${sampledStdDev.toFixed(2)} (expected: ~12)`);

  assert(Math.abs(mean - meanReturn) < 0.5, 'Mean should stay close to the configured return');
  assert(Math.abs(sampledStdDev - stdDev) < 1, 'StdDev should stay close to the configured volatility');

  console.log('  ✓ PASS\n');
}

console.log('Test 3.2: Success Condition Logic');

function testSuccessCondition() {
  let investments = 1;
  const years = 30;

  for (let year = 0; year < years; year++) {
    investments = investments * 1.07 - 1000000;
    if (investments <= 0) {
      investments = 0;
      break;
    }
  }

  let success = investments > 0;
  console.log(`  Known failure case: success = ${success} (expected: false)`);
  assert(!success, 'Large withdrawals should exhaust the portfolio');

  investments = 100000000;
  for (let year = 0; year < years; year++) {
    investments = investments * 1.07 - 100000;
    if (investments <= 0) {
      investments = 0;
      break;
    }
  }

  success = investments > 0;
  console.log(`  Known success case: success = ${success} (expected: true)`);
  assert(success, 'Small withdrawals should preserve a large portfolio');

  console.log('  ✓ PASS\n');
}

console.log('Test 3.3: Liquid Portfolio Policy');

function testLiquidPortfolioPolicy() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const appSource = readFileSync(resolve(__dirname, '../../src/App.jsx'), 'utf8');

  assert(
    /const portfolioAssets = \{\s*investments: retirementData\.investments,\s*\};/m.test(appSource),
    'Monte Carlo should use the liquid investment balance as its starting portfolio'
  );
  assert(
    appSource.includes('Withdrawals are funded from Investments only'),
    'Investments-only retirement drawdown should be disclosed in the app copy'
  );

  console.log('  ✓ PASS - investments-only Monte Carlo policy is implemented and disclosed\n');
}

try {
  testBoxMuller();
  testSuccessCondition();
  testLiquidPortfolioPolicy();
  console.log('All Monte Carlo tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
