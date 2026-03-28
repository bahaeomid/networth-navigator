// Phase 4: Financial Health Scorecard Audit

console.log("=== Phase 4: Financial Health Scorecard Audit (7 Metrics) ===");

// Test data
const testData = {
  // For net worth multiple
  currentNetWorth: 1000000,
  incomeSalary: 300000,
  incomeSalaryItems: [{amount: 400000}], // Sub-item sum 400k
  
  // For debt ratio
  totalLiabilities: 500000,
  totalAssets: 2000000,
  
  // For emergency fund
  assetsCash: 150000,
  expensesCurrent: 360000,
  
  // For investment mix
  assetsInvestments: 800000,
  
  // For retirement funding
  projectedInvestmentsAtRetirement: 2000000,
  requiredNestEgg: 2500000,
  
  // For IRR
  annualIncome: 400000,
  getRetNominalForYear: (year) => 320000 // Nominal retirement expense at retirement
};

console.log("\n=== 4.1 Savings Rate ===");
console.log("Formula: max(0, annualIncome - expenses.current) / annualIncome × 100");
console.log(`Test: annualIncome=${testData.annualIncome}, expenses.current=${testData.expensesCurrent}`);
const savingsRate = Math.max(0, testData.annualIncome - testData.expensesCurrent) / testData.annualIncome * 100;
console.log(`Result: ${savingsRate.toFixed(1)}%`);
console.log("Issue: Math.max(0, ...) floors negative savings at 0");
console.log("When expenses > income: savings rate = 0% (not negative)");
console.log("Tooltip says 'expenses exceed income by X/yr' but rate shows 0%");

console.log("\n=== 4.2 Net Worth Multiple (Fidelity benchmark) ===");
console.log("Formula: currentNetWorth / income.salary");
console.log(`Test: currentNetWorth=${testData.currentNetWorth}, income.salary=${testData.incomeSalary}`);
const nwMultiple = testData.currentNetWorth / testData.incomeSalary;
console.log(`Result: ${nwMultiple.toFixed(2)}× salary`);

console.log("CRITICAL ISSUE: Denominator uses income.salary (top-level)");
console.log(`But annualIncome uses sub-item sum: ${testData.incomeSalaryItems.reduce((s,i)=>s+i.amount,0)}`);
console.log("If sub-items exist and rollup is stale, metrics diverge");

console.log("\n=== Age interpolation test ===");
console.log("Age < 30: target = 1 × (age / 30)");
console.log("Age 15: target = 0.5×, Age 29: target = 0.97×");
console.log("Retirement age bracket: {30:1×, 40:3×, 55:7×, retirementAge:10×}");
console.log("Test retirementAge=50, currentAge=52: target should use else branch (10×)");

console.log("\n=== 4.3 Debt Ratio ===");
console.log("Formula: totalLiabilities / totalAssets × 100");
console.log(`Test: liabilities=${testData.totalLiabilities}, assets=${testData.totalAssets}`);
const debtRatio = testData.totalLiabilities / testData.totalAssets * 100;
console.log(`Result: ${debtRatio.toFixed(1)}%`);
console.log("Target thresholds: <30% = green, 30-50% = amber, ≥50% = red");

console.log("\n=== 4.4 Emergency Fund ===");
console.log("Formula: assets.cash / (expenses.current / 12)");
console.log(`Test: cash=${testData.assetsCash}, monthly expenses=${testData.expensesCurrent/12}`);
const emergencyMonths = testData.assetsCash / (testData.expensesCurrent / 12);
console.log(`Result: ${emergencyMonths.toFixed(1)} months`);
console.log("Target thresholds: ≥6 months = green, 3-6 = amber, <3 = red");

console.log("\n=== 4.5 Investment Mix ===");
console.log("Formula: assets.investments / totalAssets × 100");
console.log(`Test: investments=${testData.assetsInvestments}, totalAssets=${testData.totalAssets}`);
const investmentMix = testData.assetsInvestments / testData.totalAssets * 100;
console.log(`Result: ${investmentMix.toFixed(1)}%`);
console.log("Target: ≥40% = green, 20-40% = amber, <20% = red");
console.log("NOTE: Label 'Investment Mix' could be confused with asset allocation");

console.log("\n=== 4.6 Retirement Funding ===");
console.log("Formula: projectedInvestmentsAtRetirement / requiredNestEgg × 100");
console.log(`Test: projected=${testData.projectedInvestmentsAtRetirement}, required=${testData.requiredNestEgg}`);
const fundingPercent = testData.projectedInvestmentsAtRetirement / testData.requiredNestEgg * 100;
console.log(`Result: ${fundingPercent.toFixed(1)}%`);
console.log("Thresholds: ≥100% = green, 85-100% = light green, 50-85% = amber, <50% = red");

console.log("\n=== 4.7 Income Replacement Ratio (IRR) ===");
console.log("Formula: getRetNominalForYear(retirementCalYear) / annualIncome × 100");
console.log(`Test: retirement expense=${testData.getRetNominalForYear()}, income=${testData.annualIncome}`);
const irr = testData.getRetNominalForYear() / testData.annualIncome * 100;
console.log(`Result: ${irr.toFixed(1)}%`);

console.log("\nCRITICAL ISSUE WITH IRR:");
console.log("Numerator: nominal retirement expense at retirement (inflated 20-30 years)");
console.log("Denominator: today's income (not inflated)");
console.log("Example: Today's income=400k, retirement expense today's terms=300k at 3%/yr");
console.log("Over 20 years: nominal expense = 300k × 1.03^20 = 541.8k");
console.log("IRR = 541.8k / 400k = 135% (shows amber 'retirement costs more')");
console.log("But in real terms, user plans to spend LESS than current income");
console.log("Recommendation: Both should be in same terms (today's or retirement-day)");

console.log("\n=== Summary of Scorecard Issues ===");
console.log("1. Savings Rate: Negative values masked by Math.max(0, ...)");
console.log("2. NW Multiple: Inconsistent denominator (top-level vs sub-item sum)");
console.log("3. Debt Ratio: Correct ✓");
console.log("4. Emergency Fund: Correct ✓ but depends on expenses.current sync");
console.log("5. Investment Mix: Formula correct ✓ but label potentially misleading");
console.log("6. Retirement Funding: Correct ✓");
console.log("7. IRR: Potentially misleading due to inflation mismatch");