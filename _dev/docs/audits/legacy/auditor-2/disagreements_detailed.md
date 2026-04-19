# Detailed Disagreements with Auditor 1

## Executive Summary

This document details three specific findings where Auditor 2 disagrees with Auditor 1's conclusions. Each disagreement includes code evidence and resolution recommendation.

---

## Disagreement D-01: Sub-item Synchronization

### Auditor 1's Claim
> "If a user adds/removes sub-items and the rollup doesn't update, calculations diverge."
> **Severity:** High
> **Recommendation:** Fix sub-item synchronization bug

### Auditor 2's Analysis

**Code Review:**
```javascript
// Lines 2249-2265: syncCategoryTotal function
const syncCategoryTotal = (category, mainKey, itemsKey) => {
  const items = category === 'assets' ? assets[itemsKey] :
                category === 'liabilities' ? liabilities[itemsKey] :
                income[itemsKey];
  
  if (!items || items.length === 0) return;
  
  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  if (category === 'assets') {
    setAssets({ ...assets, [mainKey]: total });
  } else if (category === 'liabilities') {
    setLiabilities({ ...liabilities, [mainKey]: total });
  } else if (category === 'income') {
    setIncome({ ...income, [mainKey]: total });
  }
};
```

**Findings:**
1. Function exists and is correctly implemented
2. Called via `useEffect` hooks after every sub-item modification
3. `currentNetWorth` (line 2267) correctly uses top-level rollups
4. `annualIncome` (line 2273) correctly re-sums from sub-items when present

**Verdict:** **FALSE POSITIVE** - Remove from findings. System working as designed.

---

## Disagreement D-02: Drawdown Timing

### Auditor 1's Claim
> "Understates retirement drawdown by one year"
> **Severity:** Medium
> **Recommendation:** Consider changing to age >= retirementAge

### Auditor 2's Analysis

**Code Review:**
```javascript
// Line 2561: Drawdown condition
if (assumptions.enableDrawdown && age > profile.retirementAge) {
  const postRetIncome = yearPassive_calc + yearOtherIncome_calc;
  drawdownAmount = Math.max(0, inflationAdjustedExpense + oneTimeExpense - postRetIncome);
}

// Line 2570: Growth applied AFTER push
investmentBalance = Math.max(0, investmentBalance * (1 + assumptions.investmentReturn / 100) - drawdownAmount);
```

**Timeline:**
- Year 0 (i=0): Push today's snapshot → Apply growth
- Year 1 (i=1): Push balance after 1 year → Apply growth
- ...
- Retirement year: Push balance at START → No drawdown (correct)
- Retirement + 1: Push balance after 1 year of drawdown

**Verdict:** **FALSE POSITIVE** - Remove from findings. Loop structure is correct.

**Explanation:** Auditor 1 misunderstood that data is pushed BEFORE growth/drawdown is applied. The retirement year shows the portfolio value at the BEGINNING of that year (before any retirement withdrawals).

---

## Disagreement D-03: Income Replacement Ratio

### Auditor 1's Claim
> "Uses nominal retirement expense at retirement (inflated 20-30 years) divided by today's income. This creates misleading comparisons."
> **Severity:** Medium
> **Recommendation:** Compare in same terms

### Auditor 2's Analysis

**Code Review:**
```javascript
// Lines 3490-3493
const yearsToRet = profile.retirementAge - profile.currentAge;
const retNominalExp = getRetNominalForYear(new Date().getFullYear() + yearsToRet);
const preRetIncome = annualIncome;
const irrVal = preRetIncome > 0 && retNominalExp > 0 
  ? (retNominalExp / preRetIncome) * 100 
  : null;
```

**Financial Planning Standard:**
The Income Replacement Ratio conventionally answers:
> "What percentage of my current income will I need to replace in retirement to maintain my planned lifestyle?"

**Example:**
- Current income: 400K
- Planned retirement expense (today's terms): 300K
- Years to retirement: 20
- Inflation: 3%

Nominal expense at retirement: 300K × 1.03²⁰ = 542K
IRR = 542K / 400K = 135%

**Interpretation:** "You will need 135% of your current income to fund your planned retirement lifestyle."

**Verdict:** **PARTIAL AGREEMENT** - The formula is correct and conventional. However, the tooltip should clarify the inflation effect.

**Recommended Fix:**
Add tooltip text:
> "Compares your inflation-adjusted retirement budget to today's income. A value >100% means your planned retirement spending exceeds your current income. This is normal due to inflation over time."

---

## Summary Table

| Finding | Auditor 1 | Auditor 2 | Action Required |
|---------|-----------|-----------|-----------------|
| D-01 Sub-item Sync | Bug | Not a bug | Remove from findings |
| D-02 Drawdown Timing | Bug | Correct | Remove from findings |
| D-03 IRR Metric | Bug | Conventional | Add tooltip clarity |

**Impact on Audit:**
- 2 false positives should be removed
- 1 finding should be reclassified as documentation issue
- Overall severity unchanged (critical issues remain)
