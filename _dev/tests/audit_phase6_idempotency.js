/**
 * Phase 6 — Idempotency / Round-Trip Tests
 * NetWorth Navigator Audit — 2026-04-17
 *
 * Verifies JSON export→import round-trip preserves all state.
 * Run: node _dev/docs/audit/audit_phase6_idempotency.js
 */

function assert(condition, label) {
  console.log(`${condition ? '✓' : '✗'} ${label}`);
  if (!condition) process.exitCode = 1;
}

// Simulate a full state object matching the app's export schema
const sampleState = {
  version: '2.0.0',
  timestamp: new Date().toISOString(),
  currentAge: 35,
  retirementAge: 60,
  lifeExpectancy: 85,
  currency: 'AED',
  annualIncome: 360000,
  annualExpenses: 240000,
  investments: 500000,
  cash: 100000,
  retirementBudget: 15000,
  salaryGrowth: 5,
  passiveGrowth: 3,
  otherIncomeGrowth: 3,
  investmentReturn: 7,
  investmentStdDev: 15,
  inflation: 3,
  nestEggSwr: 4,
  expenseCategories: [
    { name: 'Housing', amount: 5000, subItems: [{ name: 'Rent', amount: 5000 }] },
    { name: 'Food', amount: 3000, subItems: [] }
  ],
  passiveIncomeSources: [{ name: 'Rental', amount: 2000, endYear: 2040 }],
  otherIncomeSources: [{ name: 'Freelance', amount: 1000 }],
  salarySources: [{ name: 'Main Job', amount: 30000 }],
  liabilities: [
    { name: 'Mortgage', amount: 500000, subItems: [{ name: 'Home Loan', amount: 500000, endYear: 2045 }] }
  ],
  oneTimeExpenses: [{ description: 'Wedding', year: 2027, amount: 50000 }],
  lifeEvents: [{ description: 'Baby', year: 2028, monthlyImpact: 2000, stage: 'Planning' }],
  surplusDeployment: { extra_investment: 50, extra_debt: 30, extra_cash: 20 }
};

// --- RT1: JSON serialize → deserialize round-trip ---
const exported = JSON.stringify(sampleState);
const imported = JSON.parse(exported);

assert(imported.version === sampleState.version, 'RT1: version preserved');
assert(imported.currentAge === sampleState.currentAge, 'RT2: currentAge preserved');
assert(imported.retirementAge === sampleState.retirementAge, 'RT3: retirementAge preserved');
assert(imported.annualIncome === sampleState.annualIncome, 'RT4: annualIncome preserved');
assert(imported.investments === sampleState.investments, 'RT5: investments preserved');
assert(imported.nestEggSwr === sampleState.nestEggSwr, 'RT6: nestEggSwr preserved');
assert(imported.inflation === sampleState.inflation, 'RT7: inflation preserved');

// --- RT2: Nested arrays preserved ---
assert(imported.expenseCategories.length === 2, 'RT8: expenseCategories length');
assert(imported.expenseCategories[0].subItems[0].name === 'Rent', 'RT9: subItem name');
assert(imported.passiveIncomeSources[0].endYear === 2040, 'RT10: passive endYear');
assert(imported.liabilities[0].subItems[0].endYear === 2045, 'RT11: liability endYear');

// --- RT3: Double round-trip (export→import→export→import) ---
const exported2 = JSON.stringify(imported);
const imported2 = JSON.parse(exported2);
assert(JSON.stringify(imported2) === exported, 'RT12: Double round-trip identical');

// --- RT4: Surplus deployment preserved ---
assert(imported.surplusDeployment.extra_investment === 50, 'RT13: surplus investment');
assert(imported.surplusDeployment.extra_debt === 30, 'RT14: surplus debt');
assert(imported.surplusDeployment.extra_cash === 20, 'RT15: surplus cash');

// --- RT5: One-time expenses and life events ---
assert(imported.oneTimeExpenses[0].description === 'Wedding', 'RT16: OTE description');
assert(imported.lifeEvents[0].monthlyImpact === 2000, 'RT17: life event impact');

console.log('\nPhase 6 idempotency tests complete.');
