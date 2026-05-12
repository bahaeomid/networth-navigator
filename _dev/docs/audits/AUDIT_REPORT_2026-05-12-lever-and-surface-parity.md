# Lever and Surface Parity Audit Report - 2026-05-12

**Auditor:** Codex  
**Trigger:** User-reported mismatch between Retirement Health lever recommendations and real outcomes after entering those recommendations in the app.

---

## Scope

1. Verify whether `Save More`, `Retire Later`, and `Higher Return` still match their tooltip/design intent after annual investment contribution support was added.
2. Add a contribution-activity cue in the collapsed Investments header when lump-sum is zero.
3. Re-verify connected calculation surfaces (runway, surplus deployment, future projection, dashboard cards/metrics) for regressions.

---

## Findings

### NEW-50 - Gap-closing levers were non-actionable under the updated contribution model

**Severity:** High  
**Status:** Fixed

**Observed behavior**
- `Higher Return` and `Retire Later` could overshoot when users applied the recommendation directly.
- `Save More` could fail to close the gap when users applied the recommendation as an annual contribution.

**Root cause**
- Legacy lever equations persisted:
  - `Higher Return` solved from current lump sum only.
  - `Retire Later` compounded retirement-year balance only.
  - `Save More` used closed-form annuity against gap without solving against the actual projection path.
- These no longer matched base projection behavior with investment-item annual contributions and contribution growth.

**Fix**
- Replaced lever calculations with actionable parity solvers in `src/App.jsx`:
  - `Save More`: binary search for extra annual contribution that closes the gap by planned retirement.
  - `Retire Later`: first later retirement age (within +30 years) where projected investments meet required nest egg, with current contribution streams continuing.
  - `Higher Return`: binary search on return assumption (capped at 30%/yr) with current balances and contributions unchanged.
- Updated in-app tooltips and HTML report methodology wording to match solver behavior.

### NEW-51 - Collapsed Investments header hid contribution activity when lump sum was zero

**Severity:** Medium  
**Status:** Fixed

**Observed behavior**
- Collapsed Investments header displayed only total lump-sum balance.
- Users with `0` lump sum but active annual contributions had no visible cue that contributions were configured.

**Fix**
- Added compact badge in collapsed header showing total annual contribution when positive:
  - `+<amount>/yr contrib`

---

## Cross-Surface Verification

Post-fix validation executed:

- `npm run test:release` -> PASS
- `npm run test:audits` -> PASS
- `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)

Surfaces covered by verification:

- Retirement Health card and lever block
- Surplus Deployment tiles and deltas
- Retirement Runway scenarios and slider/control parity
- Project to a Future Year and What-If scenarios
- Dashboard key metrics and Financial Health cards

---

## Files Changed

- `src/App.jsx`
- `_dev/docs/core/FINANCIAL_MODEL.md`
- `_dev/tests/auditor1_gap_levers.js`
- `_dev/tests/auditor2_gap_levers.js`
