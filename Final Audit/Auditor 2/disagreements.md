# Disagreements with Auditor 1

## D-01: Sub-item Synchronization

**Auditor 1 Claim:** "If user adds/removes sub-items and rollup doesn't update, calculations diverge."

**Auditor 2 Finding:** NOT A BUG - False Positive

**Evidence:**
- Lines 2249-2265: syncCategoryTotal function exists
- Called immediately after every sub-item modification
- currentNetWorth uses rollups (correct)
- annualIncome re-sums from sub-items when present (correct)

**Verdict:** Remove from findings. Working as designed.

---

## D-02: Drawdown Timing

**Auditor 1 Claim:** "Understates retirement drawdown by one year"

**Auditor 2 Finding:** CORRECT - False Positive

**Evidence:**
- Line 2561: age > retirementAge (strict greater-than)
- Line 2570: Growth/drawdown applied AFTER pushing data
- Year 0 = today's snapshot (no growth yet)
- Retirement year shows balance at START of year
- Drawdown happens at END of each retirement year

**Verdict:** Remove from findings. Loop structure is correct.

---

## D-03: Income Replacement Ratio

**Auditor 1 Claim:** "Uses nominal retirement expense vs today's income - misleading"

**Auditor 2 Finding:** CONVENTIONAL DEFINITION - Partial Agreement

**Evidence:**
- Standard IRR = Retirement Spending Need / Pre-Retirement Income
- Answers: "What % of current income needed in retirement?"
- Inflation mismatch is INTENTIONAL and INFORMATIVE

**Real Issue:** Benchmark thresholds (70-120%) don't explain inflation effect

**Fix:** Add tooltip clarity, not formula change

**Verdict:** Keep as documentation issue, not calculation bug.

---

## Summary

| Finding | Auditor 1 | Auditor 2 | Resolution |
|---------|-----------|-----------|------------|
| Sub-item Sync | Bug | Not a bug | Remove |
| Drawdown Timing | Bug | Correct | Remove |
| IRR Metric | Bug | Conventional | Document |
