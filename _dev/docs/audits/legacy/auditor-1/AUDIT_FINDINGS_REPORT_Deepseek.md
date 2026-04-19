# NetWorth Navigator Audit Findings Report

**Audit Date:** March 28, 2026  
**Auditor:** opencode AI  
**App Version:** 2.0.0  
**Codebase:** `src/App.jsx` (7,642 lines)  
**Audit Files:** Located in `Final Audit/Audit Files/` directory

## Executive Summary

A comprehensive audit of the NetWorth Navigator financial planning application has been conducted according to the detailed audit plan. The audit followed 12 phases of systematic verification, from pre-audit reading through calculation verification, projection engine analysis, Monte Carlo validation, and final recommendations.

### Overall Assessment

The NetWorth Navigator application demonstrates **solid mathematical foundation** with correct implementation of core financial formulas. However, several **critical issues** were identified that could lead to misleading user guidance, particularly around state synchronization, metric interpretation, and financial assumptions.

**Overall Score:** 7.5/10  
**Recommendation:** Critical fixes needed before production release.

---

## Critical Findings (Must Fix)

### 1. **Sub-item Synchronization Bug** (High Severity)
**Location:** `App.jsx:2267-2271` (currentNetWorth) vs `App.jsx:2273-2285` (annualIncome)

**Issue:** The app stores both top-level rollups (e.g., `assets.investments`) AND sub-items (e.g., `investmentItems[]`). `annualIncome` re-sums from sub-items when present, but `currentNetWorth` uses the top-level rollups. If a user adds/removes sub-items and the rollup doesn't update, calculations diverge.

**Impact:** Net worth calculations become inaccurate when using detailed sub-item tracking.

**Fix:** Ensure `syncCategoryTotal` is always called when sub-items change, or consistently use sub-item sums throughout.

### 2. **Net Worth Multiple Denominator Inconsistency** (High Severity)
**Location:** `App.jsx:3425` (NW Multiple calculation)

**Issue:** Net Worth Multiple scorecard uses `income.salary || 0` (top-level field) as denominator, while `annualIncome` uses sub-item sum. This creates inconsistent benchmarking.

**Impact:** Users with salary sub-items see different salary figures in different parts of the app.

**Fix:** Use consistent salary source (preferably sub-item sum) throughout the application.

### 3. **Negative Savings Rate Masked** (Medium Severity)
**Location:** `App.jsx:2287-2289` (annualSavings calculation)

**Issue:** `annualSavings = Math.max(0, annualIncome - expenses.current)` floors negative savings at 0. The savings rate therefore never goes below 0%, even when expenses exceed income.

**Impact:** Users overspending see "0% savings rate" instead of negative rate, missing critical financial warning.

**Fix:** Allow negative savings rate or provide clearer indication of overspending.

### 4. **Drawdown Timing Issue** (Medium Severity)
**Location:** `App.jsx:2561` (drawdown condition)

**Issue:** `if (assumptions.enableDrawdown && age > profile.retirementAge)` uses strict greater-than, meaning the retirement year itself has NO drawdown.

**Impact:** Understates retirement drawdown by one year, potentially making retirement appear more sustainable than it is.

**Fix:** Consider `age >= profile.retirementAge` or clearly document this timing assumption.

---

## Important Findings (Should Fix)

### 5. **Income Replacement Ratio Inflation Mismatch** (Medium Severity)
**Issue:** IRR uses nominal retirement expense at retirement (inflated 20-30 years) divided by today's income. This creates misleading comparisons.

**Example:** Today's income = 400k, retirement expense today's terms = 300k at 3%/yr over 20 years → nominal expense = 541.8k → IRR = 135% → shows "retirement costs more than current income" when actually planning to spend LESS in real terms.

**Fix:** Compare in same terms (both today's or both retirement-day).

### 6. **"Retire Later" Lever Understates Benefit** (Medium Severity)
**Issue:** The "retire later" lever models only investment compounding, ignoring extra salary income during delayed retirement years.

**Impact:** Understates the benefit of working longer, potentially discouraging a viable gap-closing strategy.

**Fix:** Include salary continuation in the lever calculation or add explanatory note.

### 7. **"Higher Return" Lever Ignores Existing Savings** (Low Severity)
**Issue:** Asks "what return would current investments need, with no new money added" but users may already be saving.

**Impact:** May present unrealistic required returns when regular contributions exist.

**Fix:** Include existing savings rate in calculation or add contextual note.

---

## Design Limitations (Document)

### 8. **Linear Amortization Simplification**
**Location:** `App.jsx:2481-2493` (amortizeLiability function)

**Issue:** Models debt payoff as linear (balance decreases by 1/term per year), not actual mortgage payments (mostly interest early).

**Impact:** Understates early-year liability reduction, overstates later-year reduction.

**Status:** Documented limitation - acceptable simplification but should be clearly communicated.

### 9. **Tax Modeling Absent**
**Issue:** No tax modeling (income, capital gains, inheritance taxes).

**Impact:** After-tax returns and income may differ significantly from user inputs.

**Status:** Documented limitation - appropriate for basic planning tool.

---

## Minor Issues & UX Improvements

### 10. **Investment Mix Label Potentially Misleading**
**Issue:** Label "Investment Mix" could be confused with asset allocation (stocks vs bonds).

**Fix:** Clarify tooltip or rename to "Investment Allocation %".

### 11. **Currency Rounding**
**Issue:** `fromDisplay` uses `Math.round(parseFloat(val) × rate)` causing up to 0.5 AED error per conversion.

**Impact:** Negligible for large amounts but creates rounding discrepancies.

**Fix:** Acceptable but document rounding behavior.

### 12. **Missing State in JSON Export**
**Issue:** Several UI preference fields (`lowDelta`, `highDelta`, `runwayConservativeOffset`, etc.) not included in export.

**Impact:** Imported sessions lose UI customization.

**Fix:** Include all state or clearly document exclusions.

---

## Positive Findings

### 13. **Mathematical Correctness** ✓
All core formulas verified correct:
- Net worth calculation ✓
- Compound growth formulas ✓  
- Monte Carlo Box-Muller transform ✓
- Annuity calculations (gap levers) ✓
- Expense inflation logic ✓

### 14. **Code Organization** ✓
Single-file React app surprisingly well-organized given size.
Clear separation of concerns through `useMemo` hooks.

### 15. **Documentation** ✓
README provides comprehensive methodology explanation.
Tooltips throughout app explain assumptions.

### 16. **Error Handling** ✓
Graceful handling of edge cases (zero income, zero expenses).
JSON import validation with version checking.

---

## Recommendations by Priority

### **P1 (Critical - Fix Before Release)**
1. Fix sub-item synchronization bug
2. Standardize salary source across all calculations
3. Address negative savings rate masking
4. Review drawdown timing assumption

### **P2 (Important - Next Release)**
5. Fix IRR inflation mismatch
6. Enhance "retire later" lever to include salary continuation
7. Improve "higher return" lever context
8. Add missing state to JSON export

### **P3 (Enhancements - Future)**
9. Consider enhanced amortization model (optional)
10. Clarify "Investment Mix" label
11. Add tax modeling (stretch goal)
12. Implement more sophisticated currency rounding

---

## Technical Debt Assessment

### **High Risk Areas**
1. **State Synchronization:** Mix of top-level rollups and sub-item sums creates maintenance burden.
2. **Single File Architecture:** 7,642-line `App.jsx` difficult to maintain, test, and reason about.
3. **Calculation Duplication:** Some formulas appear in multiple places (e.g., net worth in `currentNetWorth` and HTML export).

### **Refactoring Opportunities**
1. Extract calculation functions into separate module
2. Implement consistent state management pattern
3. Add unit tests for all calculation functions
4. Consider splitting into multiple components

---

## Verification Methodology

The audit followed the 12-phase methodology:

1. **Phase 0:** Full codebase reading ✓
2. **Phase 1:** Every formula verified in isolation ✓
3. **Phase 2:** Projection engine end-to-end test ✓
4. **Phase 3:** Monte Carlo engine validation ✓
5. **Phase 4:** 7 scorecard metrics analyzed ✓
6. **Phase 5:** Gap-closing levers reviewed ✓
7. **Phase 6:** Input/output integrity checked ✓
8. **Phase 7:** Edge cases examined ✓
9. **Phase 8:** UX/text review (partial)
10. **Phase 9:** Metric coherence assessed ✓
11. **Phase 10:** First-principles evaluation ✓
12. **Phase 11:** Dead code sweep (partial)

---

## Conclusion

NetWorth Navigator is a **capable financial planning tool** with solid mathematical foundations. The critical issues identified relate primarily to **state consistency** and **metric interpretation** rather than mathematical errors.

**With the recommended fixes**, particularly around sub-item synchronization and calculation consistency, this application can provide reliable, actionable financial guidance to users.

**Next Steps:** Implement P1 fixes, conduct user testing of corrected calculations, then proceed to production release.

---

## Appendix: File References

All calculations in `src/App.jsx`:

- `currentNetWorth`: Line 2267
- `annualIncome`: Line 2273
- `annualSavings`/`savingsRate`: Lines 2287-2293
- `getProjectedExpenses`: Line 2296
- `getRetNominalForYear`: Line 2374
- `wealthProjection`: Line 2397
- `amortizeLiability`: Line 2481 (inside wealthProjection)
- `runMonteCarloSimulation`: Line 382
- `exportData`: Line 769
- `importData`: Line 1915
- `importExpensesCSV`: Line 1960