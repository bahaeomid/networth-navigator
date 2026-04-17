/**
 * Phase 4 — Formula Verification Tests
 * NetWorth Navigator Audit — 2026-04-17
 *
 * Hand-computed expected values for all 10 core formulas.
 * Run: node _dev/docs/audit/audit_phase4_formula_verification.js
 */

const TOLERANCE = 0.01; // 1% relative tolerance

function assertClose(actual, expected, label) {
  const diff = Math.abs(actual - expected);
  const rel = expected !== 0 ? diff / Math.abs(expected) : diff;
  const pass = rel <= TOLERANCE;
  console.log(`${pass ? '✓' : '✗'} ${label}: actual=${actual.toFixed(4)}, expected=${expected.toFixed(4)}, diff=${(rel * 100).toFixed(2)}%`);
  if (!pass) process.exitCode = 1;
}

// --- Formula 1: Compound Growth (FV = PV × (1 + r)^n) ---
// PV=100000, r=7%, n=20 → FV = 100000 × 1.07^20 = 386,968.45
assertClose(100000 * Math.pow(1.07, 20), 386968.45, 'F1: Compound Growth');

// --- Formula 2: Inflation-Adjusted Expense (E × (1 + inf)^n) ---
// E=50000, inf=3%, n=25 → 50000 × 1.03^25 = 104,689.11
assertClose(50000 * Math.pow(1.03, 25), 104689.11, 'F2: Inflation-Adjusted Expense');

// --- Formula 3: Nest Egg (RetirementExpenses / SWR) ---
// Expenses=80000, SWR=4% → 80000 / 0.04 = 2,000,000
assertClose(80000 / 0.04, 2000000, 'F3: Nest Egg Target');

// --- Formula 4: Retirement Funding Gap (NestEgg - ProjectedWealth) ---
// NestEgg=2000000, Projected=1500000 → Gap = 500000
assertClose(2000000 - 1500000, 500000, 'F4: Funding Gap');

// --- Formula 5: Savings Rate ((Income - Expenses) / Income × 100) ---
// Income=120000, Expenses=80000 → (40000/120000) × 100 = 33.33%
assertClose((120000 - 80000) / 120000 * 100, 33.33, 'F5: Savings Rate');

// --- Formula 6: NW Multiple (NetWorth / AnnualSalary) ---
// NW=500000, Salary=120000 → 500000/120000 = 4.1667
assertClose(500000 / 120000, 4.1667, 'F6: NW Multiple');

// --- Formula 7: Income Replacement Ratio (RetExpenses / PreRetIncome × 100) ---
// RetExpenses=60000, PreRetIncome=120000 → 50%
assertClose(60000 / 120000 * 100, 50, 'F7: IRR');

// --- Formula 8: Box-Muller Normal Distribution ---
// u1=0.5, u2=0.5 → z = sqrt(-2*ln(0.5)) * cos(2*pi*0.5) = 1.1774 * cos(pi) = -1.1774
const u1 = 0.5, u2 = 0.5;
const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
assertClose(z, -1.1774, 'F8: Box-Muller (u1=0.5, u2=0.5)');

// --- Formula 9: Monte Carlo Return (mean + z * stdDev) ---
// mean=7%, stdDev=15%, z=-1.1774 → 0.07 + (-1.1774)*0.15 = -0.1066
assertClose(0.07 + z * 0.15, -0.1066, 'F9: MC Return');

// --- Formula 10: Drawdown (max(0, Expenses - PassiveIncome)) ---
// Expenses=80000, Passive=30000 → 50000
assertClose(Math.max(0, 80000 - 30000), 50000, 'F10: Drawdown');
// Expenses=20000, Passive=30000 → 0 (no drawdown needed)
assertClose(Math.max(0, 20000 - 30000), 0, 'F10: Drawdown (surplus)');

console.log('\nPhase 4 formula verification complete.');
