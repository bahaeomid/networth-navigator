# Auditor 3 — Phase 4: Recommendations, Risk Register, and Mitigations

## Recommendations
- **Critical:**
    - Update Monte Carlo logic to include cash as a valid portfolio component or clarify the UI/reporting to ensure users with significant cash holdings are not misled.
    - Add visual/dashboard warning and optional automated reinvestment for unused annual surplus to ensure realistic projection of user financial trajectory.
- **High:**
    - Standardize all scorecard and report benchmarking calculations (e.g., NW Multiple denominator) to use sub-item sums consistently, to avoid divergent results across the interface.
    - Add clear tooltips and inline documentation for confusing metrics, especially Income Replacement Ratio (IRR), to distinguish between nominal/inflated and real spending comparisons.
    - Implement explicit version tags in JSON exports/imports and report outputs for forward/backward compatibility.
    - Add regression/unit tests for all major calculation branches (especially projection and Monte Carlo routines) to catch future accidental formula modification.
- **Medium:**
    - Enforce edge-case validation on CSV imports—detect and warn on missing required columns or impossible totals before state mutation.
    - Consider adding missing standard industry metrics: "years of expenses covered by assets/cash", "monthly income from current assets", "survival odds at age 95/100" (longevity sensitivity).
- **General:**
    - Enhance documentation in-app and in the README to clarify calculation assumptions and common sources of projection confusion.

## Risk Register
- **Critical risk:** Monte Carlo and runway projections can dramatically understate or mislead long-horizon users with large cash balances. Mitigation: logic fix or prominent warnings.
- **Critical risk:** User surplus not highlighted or reinvested, risking 'false negatives' for users with high unallocated income. Mitigation: UI/logic update and warning system.
- **High risk:** State/denominator inconsistency in scorecard metrics leads to user confusion and credibility risks; standardize benchmarking logic throughout.
- **Medium risk:** Missing explanatory metrics (years covered, monthly income, longevity) may give some users a false sense of security or inadequacy; mitigation: metric and documentation updates.
- **Schema drift:** Data exports/imports may fail if future versions alter key names or logic. Mitigation: add versioning and migration handlers.
- **User data loss:** Stress to users to export backups before importing or upgrading data files.
- **Edge-case logic:** Phase-out/endYear handling and one-time/recurring events need regular review as new features added.

## Proposed Actions
- Prioritize updating Monte Carlo logic to include cash in the evaluated portfolio, or add deeming logic and warnings. Regression-test all possible allocations (pure-cash to pure-investment).
- Implement dashboard warning/automation for user surplus.
- Fully harmonize denominators and formulas for all peer-comparison metrics.
- Add metric coverage for years of coverage, monthly income in retirement, and longevity sensitivity.
- Strengthen documentation and in-app tooltips for complex metrics.
- Make scheduled audit/test cycles standard after all major updates or when financial logic changes.
- Prioritize versioning and migration infrastructure for all persisted data flows.

**Result:** The app's core logic is robust for typical scenarios, but new cross-auditor consensus shows critical and high risks around projection validity for some user types (large cash, high surplus), and for peer metrics. Addressing these issues, along with standardization and expanded metrics, will bring the product to true production-ready state with minimal risk of user-facing surprises.
