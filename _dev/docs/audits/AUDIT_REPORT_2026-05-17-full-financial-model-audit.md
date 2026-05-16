# Audit Report - 2026-05-17 Full Financial Model Audit

**Auditor:** Codex using vendored `_dev/skills/codebase-auditor` workflow  
**Scope:** Full codebase audit, financial-model verification, scenario coverage, chart/metric/tooltips review, import/export/reset review, and release verification.  
**Baseline at audit start:** `231d65c fix: unify phased finance badge styling`  
**Status:** PASS with resolved audit hardening items. No production calculation defects found.

---

## Executive Summary

The current app behavior is internally consistent across the primary calculation surfaces reviewed:

- current net worth and debt ratio use active current-year phased liability balances;
- salary phasing stops at retirement while passive and other income can continue through retirement;
- annual investment contributions respect inclusive From/To windows and appear in the following annual opening snapshot;
- liabilities affect net worth only and do not create cashflow payments unless entered separately as expenses;
- surplus deployment uses year-by-year projected savings and now respects multiple/future-start liability rows;
- recurring planned expenses and life-event ranges use inclusive start/end semantics;
- import/export/reset cover the current financial state fields touched by recent phasing changes.

The audit found no critical or high-severity regressions in the current committed app behavior. Two audit-hardening/documentation items were fixed during this audit:

1. added a deterministic scenario-matrix harness for phased real-world cases;
2. corrected core documentation drift for app size and retirement-budget inflation semantics.

---

## Work Performed

### Codebase Scan

Reviewed:

- `src/App.jsx` calculation, state, import/export, reset, chart, tooltip, and report-generation paths;
- `_dev/docs/core/FINANCIAL_MODEL.md`;
- `_dev/docs/core/ARCHITECTURE.md`;
- `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md`;
- recent git history from `cd43ad3` through `231d65c`;
- existing audit, advisory, formula, parity, edge, idempotency, full-element, and Playwright harnesses.

No `CLAUDE.md`, `AGENTS.md`, or `.cursor/rules` context file exists in this repo, so the audit used the established `_dev/docs` audit paths.

### Manual Calculation Review

Manually traced and cross-checked:

- net worth: assets minus active phased liabilities;
- current annual income: active salary, passive, and other income rows;
- salary retirement cutoff;
- passive/other retirement continuation;
- pre-retirement expense category inflation and phase-outs;
- retirement budget nominal inflation;
- planned expense recurring windows and post-retirement two-segment inflation;
- investment contribution windows, growth, and opening-snapshot timing;
- post-retirement drawdown, passive/other income offset, and exhaustion age;
- debt-free age after the final positive liability balance;
- FI age and required nest egg;
- retirement funding and income replacement tiles;
- save-more, retire-later, and higher-return gap levers;
- invest-all, clear-debt-first, and custom surplus-deployment paths;
- chart overlays for OTEs, life events, milestones, retirement, and exhaustion;
- JSON import/export, HTML report escaping, CSV import behavior, autosave, and reset coverage.

### New Scenario Coverage

Added `_dev/tests/audit_scenario_matrix.js` and wired it into `_dev/tests/run_all_audits.js` as a gating audit harness.

The new harness verifies:

- phased salary replacement and inclusive salary end years;
- salary stops at retirement;
- passive income continues through retirement and offsets drawdown;
- future-start mortgage and overlapping loan balances affect net worth correctly;
- payoff year means zero balance at the opening of that year;
- recurring OTEs are active through inclusive end year and stop after;
- investment contributions appear in the next annual opening balance;
- debt-free age waits until all future-start liabilities are cleared;
- deficit years produce negative current annual savings but no deployable projected surplus;
- debt-first surplus invests before future liabilities activate and pays debt once rows become active.

---

## Findings

### A10-01 - Scenario Coverage Gap for Combined Phased Finance Cases

**Severity:** Medium  
**Status:** Fixed  
**Files changed:** `_dev/tests/audit_scenario_matrix.js`, `_dev/tests/run_all_audits.js`

Existing smoke and audit tests covered many individual formulas and UI-extracted outputs, but they did not provide a compact deterministic gating matrix for combined phased income, investment contributions, OTEs, multiple liabilities, future-start liabilities, drawdown offsets, and surplus-deployment behavior.

The new scenario matrix closes that gap and now runs under `npm run test:audits` and `npm run test:release`.

### A10-02 - Core Documentation Drift

**Severity:** Low  
**Status:** Fixed  
**Files changed:** `_dev/docs/core/ARCHITECTURE.md`, `_dev/docs/core/FINANCIAL_MODEL.md`

The architecture document still described `src/App.jsx` as roughly 7,800 lines while the current file is 9,000+ lines. The financial model document also described regular retirement budget categories as using a two-segment pre/post-retirement inflation path. The implementation inflates retirement budget categories from today using each category's retirement growth rate for the total years to the target retirement year. Planned expenses use the two-segment pre/post-retirement path.

The docs were updated to match the current implementation.

---

## Confirmed Behaviors

- **Start/end year inclusivity:** Income, investment contribution, OTE, and life-event ranges are inclusive. Liability payoff years are intentionally different: the liability balance is zero at the opening of the payoff year.
- **Investment timing:** Contributions are added after the annual opening snapshot, so they first appear in the next plotted year.
- **Drawdown timing:** Drawdown starts when `age >= retirementAge`, aligned with deterministic projection, runway, and Monte Carlo semantics.
- **Liabilities:** Liability balances affect net worth, debt ratio, debt-free age, and debt-first surplus scenarios. They do not reduce cashflow automatically.
- **Debt servicing:** Users must model debt-service payments through expense categories or planned expenses if they should affect savings, retirement drawdown, or nest-egg sizing.
- **Surplus deployment:** Uses projected year-by-year pre-retirement savings. In years with no active liability, debt-allocation surplus is invested. Future-start liabilities receive allocation only once active.
- **Passive/other income:** Passive and other income continue through retirement unless the user sets a To year.
- **Life events:** Life events are visual overlays only; they do not affect calculations.
- **Import/export/reset:** Current phasing fields are state data and are preserved by JSON export/import, autosave, and reset defaults.

---

## Residual Risks and Design Notes

- `src/App.jsx` remains a large single-file application. This is workable but increases review burden and formula-parity risk.
- Vite still reports the existing large-bundle warning during production build. This is not a correctness failure.
- Projected `wealthProjection.savings` is deliberately floored at zero for deployment scenarios. Current-year savings rate can still be negative. This is sensible for "deployable surplus" semantics but should remain clearly described in tooltips and docs.
- Monte Carlo remains stochastic by design. Existing advisory scripts validate distribution shape and the deterministic zero-variance case, but exact success probability is not deterministic unless the engine is seeded.

---

## Verification

Baseline before audit changes:

- `npm run test:release` -> PASS
  - lint -> PASS
  - audit harnesses -> PASS
  - full element coverage -> PASS (`44/44`)
  - production build -> PASS with existing Vite chunk-size warning
  - Playwright smoke/regression/scenario tests -> PASS (`16/16`)

After audit hardening changes:

- `node _dev/tests/audit_scenario_matrix.js` -> PASS
- `npm run test:release` -> PASS
  - lint -> PASS
  - audit harnesses -> PASS (`10` gating harnesses run)
  - full element coverage -> PASS (`44/44`)
  - production build -> PASS with existing Vite chunk-size warning
  - Playwright smoke/regression/scenario tests -> PASS (`16/16`)

---

## Conclusion

The app's current financial outputs are sensible and internally consistent for the audited scenarios and core calculations. No production code remediation was required. The audit improved future regression protection with a new deterministic scenario matrix and corrected stale core documentation.
