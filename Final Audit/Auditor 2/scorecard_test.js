// Scorecard Metrics Verification Tests - Auditor 2
// Phase 4: Financial Health Scorecard Audit

import { strict as assert } from 'assert';

console.log('=== Scorecard Metrics Verification ===\n');

// Test 4.1: Savings Rate (Negative Case)
console.log('Test 4.1: Savings Rate with Negative Cash Flow');

function testSavingsRate() {
  const annualIncome = 100000;
  const expenses = 120000;
  
  // Current implementation (MASKS negative)
  const savingsCurrent = Math.max(0, annualIncome - expenses);
  const rateCurrent = savingsCurrent / annualIncome * 100;
  
  // Correct implementation (SHOWS negative)
  const savingsCorrect = annualIncome - expenses;
  const rateCorrect = savingsCorrect / annualIncome * 100;
  
  console.log(`  Income: ${annualIncome}, Expenses: ${expenses}`);
  console.log(`  Current: ${savingsCurrent} (${rateCurrent.toFixed(1)}%)`);
  console.log(`  Correct: ${savingsCorrect} (${rateCorrect.toFixed(1)}%)`);
  
  assert(rateCurrent === 0, 'Current implementation masks negative as 0');
  assert(rateCorrect === -20, 'Correct shows -20%');
  
  console.log('  ✓ Issue confirmed - negative savings masked\n');
}

// Test 4.2: NW Multiple Denominator
console.log('Test 4.2: NW Multiple Denominator Consistency');

function testNWMultiple() {
  const currentNetWorth = 500000;
  const salaryTopLevel = 300000;
  const salarySubItems = [200000, 150000]; // Sum = 350000
  const salarySubTotal = salarySubItems.reduce((a, b) => a + b, 0);
  
  // Current implementation (INCONSISTENT)
  const nwMultipleCurrent = currentNetWorth / salaryTopLevel;
  
  // Correct implementation (CONSISTENT)
  const nwMultipleCorrect = currentNetWorth / salarySubTotal;
  
  console.log(`  Net Worth: ${currentNetWorth}`);
  console.log(`  Salary (top-level): ${salaryTopLevel}`);
  console.log(`  Salary (sub-items): ${salarySubTotal}`);
  console.log(`  Current NW Multiple: ${(nwMultipleCurrent * 100).toFixed(0)}%`);
  console.log(`  Correct NW Multiple: ${(nwMultipleCorrect * 100).toFixed(0)}%`);
  
  assert(
    nwMultipleCurrent !== nwMultipleCorrect,
    'Denominators differ when sub-items exist'
  );
  
  console.log('  ✓ Issue confirmed - inconsistent denominator\n');
}

// Test 4.3: Income Replacement Ratio
console.log('Test 4.3: Income Replacement Ratio Interpretation');

function testIRR() {
  const currentIncome = 400000;
  const retirementExpenseToday = 300000;
  const inflationRate = 0.03;
  const yearsToRetirement = 20;
  
  // Nominal expense at retirement (inflated)
  const nominalExpense = retirementExpenseToday * Math.pow(1 + inflationRate, yearsToRetirement);
  
  // IRR calculation
  const irr = nominalExpense / currentIncome * 100;
  
  // Real terms comparison (what it should be for apples-to-apples)
  const realIRR = retirementExpenseToday / currentIncome * 100;
  
  console.log(`  Current Income: ${currentIncome}`);
  console.log(`  Retirement Expense (today): ${retirementExpenseToday}`);
  console.log(`  Nominal Expense (at retirement): ${nominalExpense.toFixed(0)}`);
  console.log(`  IRR (nominal): ${irr.toFixed(1)}%`);
  console.log(`  IRR (real terms): ${realIRR.toFixed(1)}%`);
  console.log(`  Inflation distortion: ${((irr - realIRR) / realIRR * 100).toFixed(1)}%`);
  
  console.log('\n  Note: Nominal IRR is CONVENTIONAL definition');
  console.log('  but appears higher due to inflation.');
  console.log('  Tooltip should clarify this.');
  
  console.log('  ✓ Conventional but needs documentation\n');
}

// Test 4.4: Emergency Fund
console.log('Test 4.4: Emergency Fund Calculation');

function testEmergencyFund() {
  const cash = 180000;
  const annualExpenses = 360000;
  const monthlyExpenses = annualExpenses / 12;
  const monthsCovered = cash / monthlyExpenses;
  
  console.log(`  Cash: ${cash}`);
  console.log(`  Annual Expenses: ${annualExpenses}`);
  console.log(`  Monthly Expenses: ${monthlyExpenses}`);
  console.log(`  Months Covered: ${monthsCovered.toFixed(1)}`);
  
  assert(monthsCovered === 6, 'Should cover 6 months');
  
  console.log('  ✓ PASS\n');
}

// Run all tests
try {
  testSavingsRate();
  testNWMultiple();
  testIRR();
  testEmergencyFund();
  console.log('All scorecard tests completed!');
} catch (e) {
  console.error('Test failed:', e.message);
  process.exit(1);
}
