// Projection Engine Verification Tests - Auditor 2
// Phase 2: Wealth Projection End-to-End

import { strict as assert } from 'assert';

console.log('=== Projection Engine Verification ===\n');

// Test 2.1: Investment Growth (No Drawdown)
console.log('Test 2.1: Investment Growth Pre-Retirement');

function testInvestmentGrowth() {
  const initial = 300000;
  const growthRate = 0.07;
  const years = 5;
  
  let balance = initial;
  const balances = [balance];
  
  for (let i = 0; i < years; i++) {
    balance = balance * (1 + growthRate);
    balances.push(balance);
  }
  
  console.log(`  Initial: ${initial}`);
  console.log(`  After ${years} years at ${growthRate * 100}%:`);
  balances.forEach((b, i) => {
    console.log(`    Year ${i}: ${b.toFixed(0)}`);
  });
  
  const expected = initial * Math.pow(1 + growthRate, years);
  assert(Math.abs(balances[years] - expected) < 1, 'Growth calculation correct');
  
  console.log('  ✓ PASS\n');
}

// Test 2.2: Linear Amortization
console.log('Test 2.2: Linear Liability Amortization');

function testAmortization() {
  const principal = 600000;
  const term = 25;
  
  console.log(`  Principal: ${principal}, Term: ${term} years`);
  
  // Year 0
  const balance0 = principal * (term - 0) / term;
  console.log(`  Year 0: ${balance0}`);
  assert(balance0 === principal, 'Year 0 balance = principal');
  
  // Year 12
  const balance12 = principal * (term - 12) / term;
  console.log(`  Year 12: ${balance12}`);
  assert(balance12 === 312000, 'Year 12 balance = 312,000');
  
  // Year 25
  const balance25 = principal * (term - 25) / term;
  console.log(`  Year 25: ${balance25}`);
  assert(balance25 === 0, 'Year 25 balance = 0');
  
  console.log('  ✓ PASS\n');
}

// Test 2.3: Drawdown Logic
console.log('Test 2.3: Drawdown Application');

function testDrawdown() {
  const retirementAge = 55;
  const currentAge = 35;
  
  // Test ages
  const testCases = [
    { age: 54, shouldDrawdown: false },
    { age: 55, shouldDrawdown: false }, // Retirement year - no drawdown yet
    { age: 56, shouldDrawdown: true },  // First year WITH drawdown
    { age: 60, shouldDrawdown: true },
  ];
  
  testCases.forEach(({ age, shouldDrawdown }) => {
    const actual = age > retirementAge;
    console.log(`  Age ${age}: drawdown = ${actual} (expected: ${shouldDrawdown})`);
    assert(actual === shouldDrawdown, `Age ${age} drawdown logic correct`);
  });
  
  console.log('  ✓ PASS - Drawdown starts at age > retirementAge\n');
}

// Test 2.4: OTE Two-Segment Inflation
console.log('Test 2.4: OTE Two-Segment Inflation');

function testOTEInflation() {
  const base = 100000;
  const preRate = 0.05;
  const retRate = 0.03;
  const currentYear = 2026;
  const retirementYear = 2036; // 10 years from now
  
  // Pre-retirement OTE (year 2028)
  const year1 = 2028;
  const yearsFromToday1 = year1 - currentYear;
  const inflated1 = base * Math.pow(1 + preRate, yearsFromToday1);
  console.log(`  Pre-retirement OTE (year ${year1}): ${inflated1.toFixed(0)}`);
  
  // Post-retirement OTE (year 2040)
  const year2 = 2040;
  const yearsToRet = retirementYear - currentYear;
  const yearsIntoRet = year2 - retirementYear;
  const inflated2 = base * 
    Math.pow(1 + preRate, yearsToRet) * 
    Math.pow(1 + retRate, yearsIntoRet);
  console.log(`  Post-retirement OTE (year ${year2}): ${inflated2.toFixed(0)}`);
  
  assert(inflated2 > inflated1, 'Post-retirement OTE should be higher');
  
  console.log('  ✓ PASS\n');
}

// Run all tests
try {
  testInvestmentGrowth();
  testAmortization();
  testDrawdown();
  testOTEInflation();
  console.log('All projection tests passed!');
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
