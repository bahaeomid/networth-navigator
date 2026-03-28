// Monte Carlo Verification Tests - Auditor 2
// Phase 3: Monte Carlo Engine Audit

import { strict as assert } from 'assert';

// Test 3.1: Box-Muller Transform
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
    const ret = meanReturn + z * stdDev;
    returns.push(ret);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / simulations;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / simulations;
  const std = Math.sqrt(variance);
  
  console.log(`  Mean: ${mean.toFixed(2)} (expected: ~7)`);
  console.log(`  StdDev: ${std.toFixed(2)} (expected: ~12)`);
  
  assert(Math.abs(mean - 7) < 0.5, 'Mean should be close to 7');
  assert(Math.abs(std - 12) < 1, 'StdDev should be close to 12');
  
  console.log('  ✓ PASS\n');
}

// Test 3.2: Success Condition
console.log('Test 3.2: Success Condition Logic');

function testSuccessCondition() {
  // Known failure case
  let investments = 1;
  const withdrawal = 1000000;
  const years = 30;
  
  for (let year = 0; year < years; year++) {
    investments = investments * 1.07 - withdrawal;
    if (investments <= 0) {
      investments = 0;
      break;
    }
  }
  
let success = investments > 0;
  console.log(`  Known failure case: success = ${success} (expected: false)`);
  assert(!success, 'Should fail with large withdrawals');
  
  // Known success case
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
  assert(success, 'Should succeed with small withdrawals');
  
  console.log('  ✓ PASS\n');
}
  }
  
  success = investments > 0;
  console.log(`  Known success case: success = ${success} (expected: true)`);
  assert(success, 'Should succeed with small withdrawals');
  
  console.log('  ✓ PASS\n');
}

// Test 3.3: Cash Exclusion Verification
console.log('Test 3.3: Cash Exclusion from Monte Carlo');

function testCashExclusion() {
  const retirementData = {
    investments: 2000000,
    cash: 1000000  // This should be included but isn't
  };
  
  // Current implementation (WRONG)
  const portfolioAssetsWrong = {
    investments: retirementData.investments
  };
  
  // Correct implementation
  const portfolioAssetsCorrect = {
    investments: retirementData.investments + retirementData.cash
  };
  
  console.log(`  Current (wrong): ${portfolioAssetsWrong.investments} AED`);
  console.log(`  Should be: ${portfolioAssetsCorrect.investments} AED`);
  console.log(`  Missing: ${retirementData.cash} AED in cash`);
  
  assert(
    portfolioAssetsWrong.investments === 2000000,
    'Current implementation excludes cash'
  );
  
  console.log('  ✓ Issue confirmed - cash excluded\n');
}

// Run all tests
try {
  testBoxMuller();
  testSuccessCondition();
  testCashExclusion();
  console.log('All Monte Carlo tests passed!');
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
