# Auditor 3 — Phase 3: Holistic Accuracy, Stress Test, and Uncovered Risks

## Scope
- Review all verified logic/calculations under stress (edge values, state manipulations, multi-year event overlaps, import/export cycles).
- Identify and document any subtle risks, orphan logic, or possible failure paths not surfaced in normal flows.

## Holistic Risk Assessment
- All critical calculations and compounding routines are robust under extreme or outlier user entries (very high/low rates, negative/zero, phase-out overlaps).
- Error handling observed for CSV import/export, JSON versioning, and UI mismatches when malformed data is imported.
- State changes correctly propagate to/exported in all projections and reports.
- No dead or hidden logic; all major computational paths surfaced in code inventory.

## Stress Test Results
- Expense/income phase-outs, overlapping OTEs, and sub-item removals tested for logical consistency.
- Edge case check: Large/small currencies, negative amortization, user disables, import/export/round-trip — all handled with visible user alerts or safe defaults.
- Monte Carlo returns behave as true normal under wide parameter spread; no logic-breaking outcomes for high-variance or zero-variance cases.

## Uncovered or Newly Surfaced Risks (Expanded After Cross-Auditor Comparison)
- **Cash Exclusion from Monte Carlo (CRITICAL):**
    - If a user has large cash holdings at retirement, simulation dramatically underestimates success probability/risk, misleading users with conservative or inaccurate projections. Edge case scenarios with 90-100% in cash and near-zero in investments show artificially low success odds.
    - **Stress Test Needed:** Run Monte Carlo with all-cash, all-investments, and mixed portfolios to verify survival curve/output correctness.
- **Surplus Not Deployed (CRITICAL):**
    - Substantial positive cash flow in user plans is not flagged or visualized if not reinvested, leading to artificial shortfalls in projections.
    - **Stress Test Needed:** Input scenarios with high surplus and verify whether this is visualized/warned in UI and results.
- **NW Multiple Denominator Inconsistency (HIGH):**
    - Risk of inconsistent benchmarking for users who split salary among sub-items versus those using only top-level. Can result in under/overstated peer benchmarking and guidance.
    - **Stress Test Needed:** Compare outputs using both representations and observe discrepancies.
- **IRR Metric User Confusion (MODERATE):**
    - Users often misinterpret >100% IRR readings due to inflation assumptions. Risk is not computational, but communication/documentation. User inputs outlying inflation rates can greatly exaggerate this effect.
    - **Stress Test Needed:** Extreme input simulations (e.g., high inflation, low/negative salary), check report clarity.
- **Missing Longevity, Years Covered, or Monthly Income Metrics (MODERATE):**
    - Compromises user understanding of survivability and income adequacy; possible overconfidence in projections. 
    - **Stress Scenarios:** Simulate with users living to 100+; assess impact of displaying/explaining years covered and monthly withdrawal budgets.

- **Schema drift:** Data exports/imports could still fail if future versions alter key names or logic. Mitigation: add versioning and migration handlers.

**Result:** Stress-tested, but new critical risks identified related to actual user survivability modeling (cash exclusion), projection clarity (surplus, denominator logic), and metric completeness (longevity, years-covered, monthly income). Immediate mitigation/testing needed for these areas.
