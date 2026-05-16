// Gap-Closing Levers Verification Tests - Auditor 2
// Validates actionable parity: applying a lever recommendation should close the gap.

import { strict as assert } from 'assert';

console.log('=== Gap-Closing Levers Verification ===\n');

const profile = { currentAge: 35, retirementAge: 55, lifeExpectancy: 90 };
const assumptions = { investmentReturn: 7 };
const nestEggSwr = 4;
const assets = {
  investments: 300000,
  investmentItems: [
    { annualContrib: 24000, contribGrowthRate: 3 },
    { annualContrib: 12000, contribGrowthRate: 0, contribStartYear: new Date().getFullYear() + 5, contribEndYear: new Date().getFullYear() + 12 },
  ],
};
const retirementBudget = {
  needs: 95000,
};
const expenseCategories = [{ key: 'needs' }];
const retExpenseGrowthRates = { needs: 2 };
const retExpensePhaseOutYears = {};
const currentYear = new Date().getFullYear();

function requiredNestEggForAge(candidateRetirementAge) {
  const candidateCalYear = currentYear + (candidateRetirementAge - profile.currentAge);
  const yearsAhead = candidateRetirementAge - profile.currentAge;
  const nominalExpense = expenseCategories.reduce((sum, cat) => {
    const po = retExpensePhaseOutYears[cat.key];
    if (po && candidateCalYear >= po) return sum;
    const base = retirementBudget[cat.key] || 0;
    const rate = (retExpenseGrowthRates[cat.key] || 0) / 100;
    return sum + base * Math.pow(1 + rate, yearsAhead);
  }, 0);
  return nominalExpense / (nestEggSwr / 100);
}

function projectedInvestmentsForLever(candidateRetirementAge, returnPct, extraAnnualContribution) {
  const years = Math.max(0, candidateRetirementAge - profile.currentAge);
  const rate = Math.max(0, returnPct || 0) / 100;
  let balance = assets.investments || 0;
  const candidateRetirementYear = currentYear + years;
  for (let i = 0; i < years; i++) {
    const contributionYear = currentYear + i;
    const plannedContrib = (assets.investmentItems || []).reduce((sum, item) => {
      const base = item.annualContrib || 0;
      if (base <= 0) return sum;
      const startYear = item.contribStartYear || currentYear;
      const endYear = Math.max(startYear, Math.min(candidateRetirementYear - 1, item.contribEndYear || candidateRetirementYear - 1));
      if (contributionYear < startYear || contributionYear > endYear) return sum;
      const growthRate = (item.contribGrowthRate || 0) / 100;
      return sum + base * Math.pow(1 + growthRate, contributionYear - startYear);
    }, 0);
    balance = Math.max(0, balance * (1 + rate) + plannedContrib + (extraAnnualContribution || 0));
  }
  return balance;
}

const requiredNestEgg = requiredNestEggForAge(profile.retirementAge);
const baselineProjected = projectedInvestmentsForLever(profile.retirementAge, assumptions.investmentReturn, 0);
const baselineGap = requiredNestEgg - baselineProjected;

assert(baselineGap > 0, 'Fixture must start with a positive retirement gap');

// Save More
console.log('Test 5.1: "Save More" actionable parity');
let hi = Math.max(baselineGap / Math.max(profile.retirementAge - profile.currentAge, 1), 1000);
let guard = 0;
while (guard < 40 && projectedInvestmentsForLever(profile.retirementAge, assumptions.investmentReturn, hi) < requiredNestEgg) {
  hi *= 2;
  guard += 1;
}
assert(guard < 40, 'Save More solver should find an upper bound');
let lo = 0;
for (let i = 0; i < 50; i++) {
  const mid = (lo + hi) / 2;
  if (projectedInvestmentsForLever(profile.retirementAge, assumptions.investmentReturn, mid) >= requiredNestEgg) hi = mid;
  else lo = mid;
}
const extraMonthly = Math.ceil(hi / 12);
const saveMoreProjected = projectedInvestmentsForLever(profile.retirementAge, assumptions.investmentReturn, extraMonthly * 12);
assert(saveMoreProjected >= requiredNestEgg, 'Applying Save More recommendation should close the gap');
console.log(`  extraMonthly=${extraMonthly} -> closes gap ✓`);

// Retire Later
console.log('Test 5.2: "Retire Later" actionable parity');
let extraYears = null;
for (let yr = 1; yr <= 30; yr++) {
  const age = profile.retirementAge + yr;
  const req = requiredNestEggForAge(age);
  const proj = projectedInvestmentsForLever(age, assumptions.investmentReturn, 0);
  if (proj >= req) {
    extraYears = yr;
    break;
  }
}
assert(extraYears !== null, 'Retire Later solver should find a valid age in fixture');
const rlAge = profile.retirementAge + extraYears;
const rlReq = requiredNestEggForAge(rlAge);
const rlProj = projectedInvestmentsForLever(rlAge, assumptions.investmentReturn, 0);
assert(rlProj >= rlReq, 'Applying Retire Later recommendation should close the gap');
if (extraYears > 1) {
  const prevAge = rlAge - 1;
  const prevReq = requiredNestEggForAge(prevAge);
  const prevProj = projectedInvestmentsForLever(prevAge, assumptions.investmentReturn, 0);
  assert(prevProj < prevReq, 'Retire Later recommendation should be the first qualifying year');
}
console.log(`  extraYears=${extraYears} -> closes gap ✓`);

// Higher Return
console.log('Test 5.3: "Higher Return" actionable parity');
assert(projectedInvestmentsForLever(profile.retirementAge, 30, 0) >= requiredNestEgg, 'Fixture should be solvable under return cap');
let lowRet = Math.max(0, assumptions.investmentReturn);
let highRet = 30;
for (let i = 0; i < 50; i++) {
  const mid = (lowRet + highRet) / 2;
  if (projectedInvestmentsForLever(profile.retirementAge, mid, 0) >= requiredNestEgg) highRet = mid;
  else lowRet = mid;
}
const solvedReturn = Math.min(30, Math.ceil(highRet * 10) / 10);
const hrProjected = projectedInvestmentsForLever(profile.retirementAge, solvedReturn, 0);
assert(hrProjected >= requiredNestEgg, 'Applying Higher Return recommendation should close the gap');
console.log(`  solvedReturn=${solvedReturn.toFixed(1)}% -> closes gap ✓`);

console.log('\nAll gap lever tests completed!');
