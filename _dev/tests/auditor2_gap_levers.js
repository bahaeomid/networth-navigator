// Gap-Closing Levers Verification Tests - Auditor 2
// Phase 5: Gap-Closing Levers and Surplus Deployment

import { strict as assert } from 'assert';

console.log('=== Gap-Closing Levers Verification ===\n');

// Test 5.1: Save More Lever
console.log('Test 5.1: "Save More" Lever Calculation');

function testSaveMore() {
  const absGap = 1000000;
  const yearsToRetire = 20;
  const r = 0.07;
  
  // Annuity factor: FV = PMT × ((1+r)^n − 1) / r
  const annuityFactor = (Math.pow(1 + r, yearsToRetire) - 1) / r;
  const extraAnnual = absGap / annuityFactor;
  const extraMonthly = extraAnnual / 12;
  
  console.log(`  Gap: ${absGap}`);
  console.log(`  Years: ${yearsToRetire}`);
  console.log(`  Return: ${r * 100}%`);
  console.log(`  Annuity Factor: ${annuityFactor.toFixed(2)}`);
  console.log(`  Extra Annual: ${extraAnnual.toFixed(0)}`);
  console.log(`  Extra Monthly: ${extraMonthly.toFixed(0)}`);
  
  // Verify: 1,000,000 / 40.995 ≈ 24,390 / 12 ≈ 2,032
  assert(Math.abs(extraMonthly - 2032) < 10, 'Monthly savings should be ~2,032');
  
  console.log('  ✓ PASS\n');
}

// Test 5.2: Retire Later Lever
console.log('Test 5.2: "Retire Later" Lever Limitation');

function testRetireLater() {
  const currentInvestments = 300000;
  const requiredNestEgg = 2000000;
  const r = 0.07;
  
  console.log(`  Current Investments: ${currentInvestments}`);
  console.log(`  Required Nest Egg: ${requiredNestEgg}`);
  console.log(`  Return: ${r * 100}%`);
  
  // Current implementation: compound only
  let balance = currentInvestments;
  let years = 0;
  while (balance < requiredNestEgg && years < 30) {
    balance *= (1 + r);
    years++;
  }
  
  console.log(`  Years to reach goal (investments only): ${years}`);
  console.log(`  Balance after ${years} years: ${balance.toFixed(0)}`);
  
  console.log('\n  LIMITATION: Does not include:');
  console.log('  - Additional salary contributions');
  console.log('  - Reduced drawdown period');
  console.log('  - Only models compounding');
  
  console.log('  ✓ Limitation confirmed\n');
}

// Test 5.3: Higher Return Lever
console.log('Test 5.3: "Higher Return" Lever');

function testHigherReturn() {
  const pv = 300000;
  const fv = 2000000;
  const n = 20;
  
  // Formula: r = (FV/PV)^(1/n) - 1
  const neededCagr = Math.pow(fv / pv, 1 / n) - 1;
  
  console.log(`  PV: ${pv}`);
  console.log(`  FV: ${fv}`);
  console.log(`  Years: ${n}`);
  console.log(`  Needed CAGR: ${(neededCagr * 100).toFixed(2)}%`);
  
  // Verify: (2M/300K)^(1/20) - 1 = 6.667^0.05 - 1 ≈ 10.0%
  assert(Math.abs(neededCagr - 0.10) < 0.001, 'CAGR should be ~10%');
  
  console.log('  ✓ Formula correct');
  console.log('  LIMITATION: Ignores existing savings contributions\n');
}

// Test 5.4: Surplus Deployment Tile 1
console.log('Test 5.4: Surplus Deployment - Invest All');

function testSurplusDeployment() {
  const initialInvestments = 300000;
  const annualSurplus = 72000;
  const r = 0.07;
  
  let balance = initialInvestments;
  
  console.log(`  Initial: ${initialInvestments}`);
  console.log(`  Annual Surplus: ${annualSurplus}`);
  console.log(`  Return: ${r * 100}%\n`);
  
  for (let year = 1; year <= 3; year++) {
    balance = balance * (1 + r) + annualSurplus;
    console.log(`  Year ${year}: ${balance.toFixed(0)}`);
  }
  
  // Year 1: 300K × 1.07 + 72K = 393K
  // Year 2: 393K × 1.07 + 72K = 492.5K
  // Year 3: 492.5K × 1.07 + 72K = 599K
  
  assert(balance > 590000, 'Balance should grow correctly');
  
  console.log('  ✓ PASS\n');
}

// Run all tests
try {
  testSaveMore();
  testRetireLater();
  testHigherReturn();
  testSurplusDeployment();
  console.log('All gap lever tests completed!');
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
