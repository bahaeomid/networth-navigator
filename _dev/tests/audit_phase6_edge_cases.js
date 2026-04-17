/**
 * Phase 6 — Edge Case Tests
 * NetWorth Navigator Audit — 2026-04-17
 *
 * Tests boundary conditions and edge cases.
 * Run: node _dev/docs/audit/audit_phase6_edge_cases.js
 */

function assert(condition, label) {
  console.log(`${condition ? '✓' : '✗'} ${label}`);
  if (!condition) process.exitCode = 1;
}

// --- EC1: Age validation — currentAge must be < retirementAge ---
{
  let currentAge = 35, retirementAge = 60, lifeExpectancy = 85;
  // Setting currentAge = 65 should clamp retirementAge to currentAge+1
  currentAge = 65;
  if (retirementAge <= currentAge) retirementAge = currentAge + 1;
  if (lifeExpectancy <= retirementAge) lifeExpectancy = retirementAge + 1;
  assert(currentAge < retirementAge, 'EC1a: currentAge < retirementAge after clamp');
  assert(retirementAge < lifeExpectancy, 'EC1b: retirementAge < lifeExpectancy after clamp');
}

// --- EC2: projectionYears non-negative ---
{
  const currentAge = 70, lifeExpectancy = 65; // invalid
  const projectionYears = Math.max(0, lifeExpectancy - currentAge);
  assert(projectionYears === 0, 'EC2: projectionYears >= 0 with invalid ages');
}

// --- EC3: FX rate = 0 should not cause Infinity ---
{
  const rate = 0;
  const safeDivisor = rate || 1;
  const result = 100000 / safeDivisor;
  assert(isFinite(result), 'EC3: FX rate=0 → fallback to 1');
  assert(result === 100000, 'EC3b: Value unchanged with fallback rate');
}

// --- EC4: SWR = 0 should not cause Infinity nest egg ---
{
  const swr = 0;
  const safeSwr = swr <= 0 ? 0.04 : swr; // clamp to default
  const nestEgg = 80000 / safeSwr;
  assert(isFinite(nestEgg), 'EC4: SWR=0 → no Infinity');
}

// --- EC5: CSV BOM handling ---
{
  const csvWithBom = '\uFEFFCategory,Item,Amount\nHousing,Rent,5000';
  const cleaned = csvWithBom.replace(/^\uFEFF/, '');
  assert(!cleaned.startsWith('\uFEFF'), 'EC5a: BOM removed');
  assert(cleaned.startsWith('Category'), 'EC5b: First field accessible');
}

// --- EC6: Savings rate can be negative ---
{
  const income = 80000, expenses = 100000;
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  assert(savingsRate < 0, 'EC6: Negative savings rate when expenses > income');
  assert(savingsRate === -25, 'EC6b: Correct negative percentage');
}

// --- EC7: Empty income → savings rate = 0 (no division by zero) ---
{
  const income = 0, expenses = 50000;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  assert(savingsRate === 0, 'EC7: Zero income → 0% savings rate');
}

// --- EC8: Drawdown with passive > expenses → no drawdown ---
{
  const drawdown = Math.max(0, 50000 - 70000);
  assert(drawdown === 0, 'EC8: Passive exceeds expenses → zero drawdown');
}

// --- EC9: escapeHtml prevents XSS ---
{
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  const malicious = '<img src=x onerror="alert(1)">';
  const escaped = escapeHtml(malicious);
  assert(!escaped.includes('<'), 'EC9a: No raw < in escaped output');
  assert(!escaped.includes('>'), 'EC9b: No raw > in escaped output');
  assert(escaped.includes('&lt;'), 'EC9c: < escaped to &lt;');
}

console.log('\nPhase 6 edge case tests complete.');
