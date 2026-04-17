# NetWorth Navigator Audit Findings - Auditor 2

**Audit Date:** March 28, 2026  
**Auditor:** opencode AI (Auditor 2)  
**App Version:** 2.0.0  
**Codebase:** src/App.jsx (7,642 lines)

## Executive Summary

**Overall Score:** 7/10  
**Recommendation:** Critical fixes needed before production release.

**Key Findings:**
- Solid mathematical foundations
- Critical issue: Cash excluded from retirement planning
- Critical issue: Negative savings rate masked
- Critical issue: Surplus deployment not prominently communicated
- 3 false positives identified in Auditor 1 report

---

## Critical Findings (P1 - Fix Before Release)

### F-01: Cash Excluded from Retirement Planning ❌

**Location:** App.jsx:2587-2589  
**Severity:** Critical

**Issue:** Monte Carlo only uses investments, not cash.

**Code:**
```javascript
const portfolioAssets = {
  investments: retirementData.investments,
};
```

**Impact:** Users with large cash balances see artificially low success rates.

**Fix:** Add cash to portfolio OR change tooltip.

---

### F-02: Negative Savings Rate Masked ❌

**Location:** App.jsx:2287-2289  
**Severity:** High

**Issue:** Math.max(0, ...) floors negative savings at 0.

**Impact:** Users overspending see 0% rate, not negative.

**Fix:** Remove Math.max() wrapper.

---

### F-03: Surplus Not Invested - Misleading ❌

**Location:** App.jsx:2568-2570  
**Severity:** High

**Issue:** Base projection shows surplus as idle.

**Impact:** Users see understated wealth trajectory.

**Fix:** Add prominent warning banner.

---

## Important Findings (P2 - Next Release)

### F-04: NW Multiple Denominator

**Location:** App.jsx:3418  
**Severity:** Medium

Uses top-level salary, not sub-item sum.

---

### F-05: Required Nest Egg vs Runway

**Severity:** Medium

Two different answers to "will my money last".

---

### F-06: Retire Later Lever

**Severity:** Medium

Omits salary continuation benefit.

---

## Disagreements with Auditor 1

### D-01: Sub-item Sync - NOT A BUG ❌

**Auditor 1:** Claimed sync issue.  
**Auditor 2:** syncCategoryTotal works correctly. False positive.

---

### D-02: Drawdown Timing - CORRECT ❌

**Auditor 1:** Claimed understates by one year.  
**Auditor 2:** Loop structure is correct. False positive.

---

### D-03: IRR Metric - CONVENTIONAL DEFINITION ❌

**Auditor 1:** Claimed inflation mismatch is bug.  
**Auditor 2:** This is standard IRR definition. Tooltip needs clarity.

---

## Additional Findings

### A-01: Missing "Years Covered" Metric

Add: (investments + cash) / annual expenses

---

### A-02: Missing Monthly Income Metric

Add: investments × SWR / 12

---

### A-03: No Longevity Sensitivity

Add: "What if you live to 95/100?"

---

## Recommendations Summary

**P1 Critical:**
1. Fix cash exclusion (F-01)
2. Fix negative savings (F-02)
3. Add surplus warning (F-03)

**P2 High:**
4. Fix NW Multiple (F-04)
5. Clarify Nest Egg vs Runway (F-05)
6. Enhance Retire Later lever (F-06)

**P3 Medium:**
7. Add years covered metric (A-01)
8. Add monthly income metric (A-02)
9. Add longevity sensitivity (A-03)

---

## Conclusion

Solid tool with critical omissions. Fix P1 items before release.
