# Audit Report - NetWorth Navigator v2.0.0

**Date:** 2026-05-12
**Scope:** User-reported savings/cashflow and investment-contribution planning gaps
**Codebase:** React 18 single-page app (`src/App.jsx`)
**Status:** Implemented and release-verified

---

## Executive Summary

This audit reviewed the user-reported planning caveats around liabilities, planned expenses, savings-rate reporting, and ongoing investment contributions.

The implementation deliberately keeps debt-service automation out of scope for this pass. Instead, it documents the current correct workflow: keep liabilities in the Finances tab for balance-sheet/net-worth accuracy, and enter full scheduled debt payments as expense categories when those payments should reduce savings and surplus.

The implemented product change is limited to the lower-risk A+B scope:

1. Add annual investment contributions and contribution growth to investment sub-items.
2. Include those contributions in the base wealth projection.
3. Rename/fix the savings-rate metric to current-year savings rate by including planned expenses active in the current calendar year.

---

## Findings

### NEW-41 - Ongoing investment contributions missing from base projection

**Severity:** HIGH
**Status:** FIXED

Prior behavior:
- Investment items represented today's balance only.
- The base projection compounded the current investment balance but assumed no new investment contributions.
- Surplus Deployment showed contribution-style scenarios, but those scenarios did not update base-projection surfaces such as Retirement Health, FI Age, Monte Carlo starting wealth, milestones, or HTML report charts.

Fix:
- Added `annualContrib` and `contribGrowthRate` fields to investment items.
- Contributions are added pre-retirement inside `wealthProjection`.
- Because downstream metrics read from `wealthProjection`, the change cascades into Retirement Health, FI Age, Monte Carlo starting portfolio, net worth chart, milestones, and report charts.

Caveat:
- Contributions are not capped to calculated surplus. Users must enter an affordable planned contribution.
- Surplus Deployment remains useful for testing additional year-by-year surplus beyond explicit investment contributions.

### NEW-42 - Savings-rate metric ignored current-year planned expenses

**Severity:** MEDIUM
**Status:** FIXED

Prior behavior:
- Dashboard savings rate used `annualIncome - expenses.current`.
- Planned expenses active in the current calendar year were excluded, creating a mismatch against the projection savings series.

Fix:
- Renamed the metric to "Current-year savings rate."
- Formula now subtracts current annual expenses plus any planned expenses active in the current calendar year.
- HTML report formula and explanatory notes were updated for parity.

### NEW-43 - Liability balances could be mistaken for debt-service cashflow

**Severity:** MEDIUM
**Status:** DOCUMENTED / DEFERRED

Current design:
- Liability entries are balance-sheet items. They affect net worth, debt ratio, debt-free age, and liability amortization.
- They do not automatically create expense cashflows.

Recommended workflow:
- Keep each liability in Finances for net worth accuracy.
- Add the full scheduled debt-service payment as an expense category when it should reduce savings. This applies to all liability types: mortgages, car loans, personal loans, credit card repayment plans, and other debts.
- For amortizing debt, use the full principal + interest cash payment because both portions reduce investable cashflow.
- Set expense growth to 0% for fixed payments and set phase-out year to the debt payoff year.
- Avoid double-counting if the payment is already embedded in another expense category.

Future option:
- Add first-class `annualPayment` or `monthlyPayment` fields to liability sub-items in a later phase. This is deliberately deferred because it touches cashflow, projections, savings chart, Surplus Deployment, import/export, report notes, and user education.

---

## Files Updated

- `src/App.jsx`
- `_dev/docs/core/FINANCIAL_MODEL.md`
- `_dev/docs/core/ARCHITECTURE.md`
- `README.md`
- `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md`
- `_dev/docs/audits/AUDIT_REGISTRY.md`

---

## Verification

Completed on 2026-05-12:

```bash
npm run lint        # PASS
npm run test:audits # PASS
npm run test:smoke  # PASS - 12 Playwright tests
```

Full release gate:

```bash
npm run test:release # PASS
```

The Vite build emitted the existing large-chunk warning for the single-file app bundle; it did not fail the build or tests.
