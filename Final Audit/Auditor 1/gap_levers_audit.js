// Phase 5: Gap-Closing Levers and Surplus Deployment Audit

console.log("=== Phase 5: Gap-Closing Levers and Surplus Deployment Audit ===");

console.log("\n=== 5.1 'Save More' Lever ===");
console.log("Formula: extraMonthly = (absGap / annuityFactor) / 12");
console.log("Where annuityFactor = (1+r)^yearsToRetire − 1) / r");
console.log("Future value of ordinary annuity: FV = PMT × ((1+r)^n − 1) / r");

const absGap = 1000000;
const r = 0.07; // 7%
const years = 20;
const annuityFactor = (Math.pow(1 + r, years) - 1) / r;
const extraAnnual = absGap / annuityFactor;
const extraMonthly = extraAnnual / 12;

console.log(`Test: absGap=${absGap}, r=${r*100}%, years=${years}`);
console.log(`Annuity factor: ${annuityFactor.toFixed(1)}`);
console.log(`Extra annual: ${extraAnnual.toFixed(0)}`);
console.log(`Extra monthly: ${extraMonthly.toFixed(0)}`);

console.log("✓ Formula mathematically correct");
console.log("Note: Monthly conversion assumes monthly compounding matches annual");
console.log("Tooltip says 'your current surplus can offset this'");
console.log("But displayed figure is TOTAL extra needed, not netted against existing surplus");

console.log("\n=== 5.2 'Retire Later' Lever ===");
console.log("Formula: Compound existing investments forward year-by-year");
console.log("extInv = retData.investments × (1+r)^yr");
console.log("Each year checks: extInv >= getRetNominalForYear(candidateCalYear) / (nestEggSwr/100)");

console.log("Test scenario: retirement investments=1,000,000, r=7%, required nest egg=2,000,000");
console.log("Year 1: 1,000,000 × 1.07 = 1,070,000 (still < 2,000,000)");
console.log("Year 2: 1,144,900");
console.log("Year 10: 1,967,151");
console.log("Year 11: 2,104,852 ✓ reaches target");

console.log("CRITICAL OMISSION:");
console.log("Doesn't account for extra salary income during delayed retirement years");
console.log("If you work 2 more years, you get 2 more years of salary to invest");
console.log("Lever UNDERSTATES benefit of retiring later");

console.log("\n=== 5.3 'Higher Return' Lever ===");
console.log("Formula: neededCagr = (requiredNestEgg / assets.investments)^(1/yearsToRetire) − 1");
console.log("FV = PV × (1+r)^n → r = (FV/PV)^(1/n) − 1");

const pv = 300000;
const fv = 2000000;
const n = 20;
const neededCagr = Math.pow(fv / pv, 1/n) - 1;

console.log(`Test: PV=${pv}, FV=${fv}, n=${n} years`);
console.log(`Needed CAGR: ${(neededCagr*100).toFixed(1)}%`);

console.log("✓ Formula mathematically correct");
console.log("But ignores existing savings contributions");
console.log("Asks 'what return would current investments need, with no new money added'");
console.log("May not be most useful framing for user who IS saving");

console.log("\n=== 5.4 Surplus Deployment Scenarios ===");

console.log("\nTile 1 — Invest all surplus:");
console.log("Each year: bal = bal × (1+r) + yearSurplus");
console.log("End-of-year contribution model");
console.log("FI Age detection: checks balance BEFORE adding surplus");
console.log("Timing question: should detection happen before or after surplus?");

console.log("\nTile 2 — Clear debt first, then invest:");
console.log("remainingDebt = totalDebtToday (today's total debt — NOT amortized)");
console.log("Models extra payments BEYOND scheduled amortization");
console.log("CRITICAL: Verify not double-counting with wealthProjection amortization");
console.log("Base wealthProjection already amortizes debt linearly");
console.log("Tile 2 models ACCELERATED payoff using surplus");

console.log("\nTile 3 — Custom split:");
console.log("effInvest + effDebt ≤ 100 cap logic");
console.log("splitCash = max(0, 100 − effInvest − effDebt)");
console.log("When debt paid off, surplus redirects to investment");

console.log("\n=== Edge Cases ===");
console.log("Negative surplus (expenses > income):");
console.log("debtPayment = max(0, min(yearSurplus, remainingDebt))");
console.log("If yearSurplus negative → debtPayment = 0");
console.log("No drawing from investments/savings to cover deficit");
console.log("Is this correct behavior?");

console.log("\n=== Summary ===");
console.log("1. Save More: Formula correct ✓, but doesn't net against existing surplus");
console.log("2. Retire Later: Understates benefit (ignores extra salary income)");
console.log("3. Higher Return: Mathematically clean ✓ but ignores existing savings");
console.log("4. Surplus deployment: Need to verify no double-counting with base amortization");
console.log("5. Negative surplus handling: May need review");