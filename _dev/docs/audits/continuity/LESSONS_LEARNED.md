# Lessons Learned — NetWorth Navigator

**Project:** NetWorth Navigator v2.0.0
**Domain:** Personal Finance / Retirement Projection
**Created:** 2026-04-17 by Session 1
**Last updated:** 2026-05-16 (Session 15)

---

*This document accumulates knowledge across all fix sessions. Append only — never rewrite prior blocks.*

---

## Quick Reference

- **Build:** `npm run dev` (Vite, port 3000). Release verification now runs via `npm run test:release` when Node.js and Playwright Chromium are installed.
- **Architecture:** Single-file React 18 SPA (`src/App.jsx`, ~7,800 lines), no component splitting
- **Currency:** AED base, converted via open.er-api.com. 5 currencies: AED/USD/CAD/EUR/GBP.
- **Monte Carlo:** 1,000 sims, Box-Muller normal, IID returns. <100ms — no Web Worker needed.
- **Persistence:** localStorage with 2s debounced auto-save.

---

## Session 1+2 — Batch Synthesis (2026-04-17)

### Patterns Found

1. **HTML interpolation without escaping is the #1 risk in template-literal HTML generation.** All 14 user-controlled strings were raw. Always add an `escapeHtml` utility at project start.

2. **Division-by-zero is endemic in financial apps.** FX rates, SWR, investment totals — any user-configurable denominator needs a guard. Pattern: `divisor || 1` for display, `if (divisor <= 0) throw` for computation.

3. **Age/year ordering assumptions break silently.** `currentAge < retirementAge < lifeExpectancy` must be enforced at input, not assumed downstream. `Math.max(0, ...)` is a safety net, not a fix.

4. **Regex character classes need careful escaping.** `/[^d.]/g` vs `/[^\d.]/g` — missing `\` inverts behavior entirely. Always test with actual digits.

5. **CSV BOM from Excel is invisible but breaks parsing.** Always `text.replace(/^\uFEFF/, '')` before processing CSV.

6. **Error boundaries should never expose raw error messages.** Log to console; show generic message to user.

### Strategies That Worked

- **Hand-computing expected values** for formula verification — caught 0 bugs but proved correctness definitively.
- **Parity checks** (comparing same quantity across surfaces) — efficient for finding divergences.
- **User Confirmation Gate** for ambiguous findings — prevents wasted work on intentional design choices.

### What Would Change Next Time

- **Run the app first.** Having a running instance would catch UX issues impossible to find via code review.
- **Schema validation for imports.** JSON import accepts anything — a Zod/Yup schema would prevent corruption.
- **Component splitting.** 7,800 lines in one file is auditable but hard to maintain.

---

## Generalizable Principles

1. Every user-facing number that involves division needs a zero/falsy guard.
2. Every user-facing string that enters HTML needs escaping.
3. Every ordering assumption (age < retirement < death) needs enforcement at the input boundary.
4. Financial disclosure notes (IID, SWR caveats) are as important as the calculations.
5. `|| 1` is acceptable for display-only divisors but not for financial computations.

---

## Next Agent Guidance

- All CRITICAL/HIGH findings are resolved. Focus future work on: component splitting, TypeScript migration, tax modeling, variable withdrawal strategies.
- `_dev/tests/` contains the reusable audit harnesses, and `_dev/e2e/` contains the Playwright smoke test used for release verification.
- Prior auditor reports (Auditor 1–3) in `_dev/docs/audits/legacy/` are SUPERSEDED by this audit.
- `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md` contains the full append-only implementation history.

---

## Batch Synthesis — Session 3 — 2026-04-19
Findings in batch: NEW-30, NEW-31, NEW-32

### Patterns observed

1. Modal regressions can survive logic-heavy audits when viewport anchoring uses container-relative positioning.
2. Compact metric cards are sensitive to typography + flex interactions; value columns need explicit anti-wrap rules.
3. Existing functional tests can pass while layout quality regresses; dedicated UI placement checks are needed.

### Principles extracted

- **Modal overlays should be viewport-rooted by default:** For in-page popups expected to appear immediately, prefer fixed full-viewport overlays over absolute positioning tied to scrolled containers.
- **Metric cards need deterministic value columns:** In dense cards, enforce right-aligned nowrap value cells to prevent responsive wrapping artifacts.
- **Treat UI polish regressions as audit findings:** Visual misalignment can materially degrade trust in financial dashboards even when formulas are correct.

### Codebase-specific observations

- The BASE scenario breakdown popup in Pre-Retirement and the nest-egg popup in Retirement used different overlay strategies; aligning them to fixed viewport overlays restored consistent behavior.
- Retirement Health mini-card row alignment is now stabilized with a two-column grid and nowrap value styling.

---

## Batch Synthesis — Session 4 — 2026-04-19
Findings in batch: NEW-33, NEW-34, NEW-35

### Patterns observed

1. Validation drift commonly appears at persistence boundaries: UI constraints can be correct while restore/import paths still accept out-of-range values.
2. Ad-hoc debug scripts can leak into the repository root and blur the official verification surface.
3. Documentation drift often follows rapid fixes unless formula ranges and guardrails are re-synced explicitly.

### Principles extracted

- **Enforce constraints at every ingress path:** If a variable has bounded business rules (for example SWR), clamp at UI input, local restore, and file import.
- **Keep the root surface intentional:** Temporary one-off scripts should either live under a dedicated dev folder or be removed and ignored.
- **Treat docs sync as a release gate:** When code introduces hard limits, update model documentation in the same change set.

### Codebase-specific observations

- `nestEggSwr` is now normalized through a shared clamp helper before state restoration/import application, reducing invalid-plan-state risk.
- Removing `check_reg*.js` clarified that release verification is officially `lint + _dev/tests + _dev/e2e`.
- Financial model documentation now matches the enforced SWR range (`0.1–6.0`).

---

## Batch Synthesis — Session 5 — 2026-04-19
Findings in batch: NEW-36, NEW-37, NEW-38, NEW-39, NEW-40

### Patterns observed

1. Category identity drift (label/key/`csv_*` renames) creates multi-surface regressions unless every dependent state path is normalized.
2. Behavioral trust breaks quickly when decision-lever copy and computation diverge, even if both are individually defensible.
3. One-time-expense logic tends to be implemented as one-per-year by accident (`find`) but real data needs many-per-year aggregation.
4. E2E tests that assert exact display strings are fragile when the app intentionally rounds/changes formatting; behavior-focused assertions are more resilient.

### Principles extracted

- **Normalize reference data at boundaries and on schema mutation:** When categories are replaced/imported, immediately repair all cross-linked state (pickers, adjustments, chart filters, hidden keys, tagged records).
- **Use alias resolution for human-entered/imported keys:** Map both category key and label aliases to canonical keys to survive migrations without data loss.
- **Prefer aggregate-by-default for financial events:** For year-bucketed costs, always sum all active events and handle recurring ranges explicitly.
- **Keep explanatory text mathematically isomorphic to implementation:** If a lever says “no other changes,” the model must enforce exactly that.
- **In UI tests, assert outcome deltas not brittle snapshots:** Example: verify a slider changes its displayed delta from +1.0% to +2.0% rather than assuming an absolute fixed string appears in one node.

### Codebase-specific observations

- A single canonical derived list (`normalizedOneTimeExpenses`) simplified consistency across export, projections, charts, and retirement simulations.
- Applying percentage formatting through helpers (`formatPct`, `formatRatePerYear`) removed floating-point artifacts and improved display parity.
- The new `_dev/e2e/regression-and-scenarios.spec.js` meaningfully extends coverage with both targeted regressions and 5 cross-tab scenario traversals.

---

## Batch Synthesis — Session 6 — 2026-04-20
Findings in batch: Post-audit runway follow-up closures

### Patterns observed

1. UI controls with fractional range anchors can silently drift if handlers parse values as integers.
2. State-restoration pathways (autosave/import) require dedicated parity assertions, not only formula-level checks.
3. E2E capture pipelines can produce false negatives when persisted browser state leaks between runs.

### Principles extracted

- **Range controls must use numeric parsing aligned to min/step:** For HTML range inputs, parse as Number and snap to step relative to min when needed; never use integer truncation on potentially fractional domains.
- **Assert both metric parity and control parity:** A model can still output expected high-level values while controls drift; include checks for slider/control states in addition to chart/card totals.
- **Reset browser persistence before deterministic audits:** Clear persisted app state before load when the test is intended to validate imported payloads as the sole source of truth.

### Codebase-specific observations

- `parseRangeInputValue(...)` in `src/App.jsx` now provides float-safe runway slider parsing across all runway controls.
- `_dev/e2e/user-scenario-capture.spec.js` now includes explicit regression assertions for:
	- perturbed runway control values,
	- reset-vs-baseline runway control parity,
	- reset-vs-baseline runway years parity after re-import.
- `_dev/tests/verify_full_element_coverage.mjs` now includes 8 `Runway Control Parity` checks in the generated report, and `_dev/tests/run_all_audits.js` executes that verifier when artifacts exist.

---

## Batch Synthesis - Session 10 - 2026-05-12
Findings in batch: NEW-52, NEW-53, NEW-54, NEW-55, NEW-56 (planning intake)

### Patterns observed

1. High-confidence regressions can reappear in adjacent output paths when escaping/safety patterns are applied inconsistently across template sections.
2. Boundary-condition assumptions in financial timelines must be encoded once and reused across engines; local condition drift creates cross-surface story breaks.
3. "All tests passed" messaging can be misleading when advisory analyzers share the same runner surface as gating checks.

### Principles extracted

- **Treat timeline boundaries as a shared contract:** Retirement transition semantics (start-of-year vs end-of-year) must be explicit and implemented identically in deterministic, stochastic, and charting surfaces.
- **Security fixes need path-complete coverage:** When one output template section escapes user data, all sibling sections that interpolate user input must follow the same pattern.
- **Separate advisory diagnostics from pass/fail tests:** Non-gating checks should be clearly labeled and should not dilute release-gate interpretation.

### Codebase-specific observations

- `wealthProjection` and `simulateRunway` currently delay drawdown until `age > retirementAge`, while cashflow income and expense transitions trigger at retirement age.
- Monte Carlo withdrawal onset currently follows a different retirement-year boundary behavior than deterministic/runway projections.
- Export report assumptions/dependent/liability sections should be re-reviewed as a group whenever template logic changes.

---

## Batch Synthesis - Session 11 - 2026-05-12
Findings in batch: NEW-53, NEW-54

### Patterns observed

1. Timing/parity issues often come from small boundary operators (`>` vs `>=`) rather than major algorithm errors.
2. Retirement model trust depends on all engines sharing one boundary contract, not just matching formulas in isolation.
3. Advisory test scripts can stay useful, but core parity assumptions should be codified in assertion-based harnesses.

### Principles extracted

- **Encode boundary conventions as executable checks:** If retirement starts at a specific boundary, enforce it in tests so future refactors cannot silently drift.
- **Align docs/tooltips in the same change as logic fixes:** Financial timing assumptions should never rely on implicit code behavior.

### Codebase-specific observations

- `wealthProjection` and `simulateRunway` now start drawdown at `age >= retirementAge`.
- Monte Carlo year-0 withdrawal now explicitly documents the same retirement-age transition convention.
- Projection harness `_dev/tests/auditor2_projection.js` now asserts retirement-year drawdown onset.

---

## Batch Synthesis - Session 12 - 2026-05-12
Findings in batch: NEW-52, NEW-55, NEW-56

### Patterns observed

1. Security regressions often hide in duplicated template blocks where one section is hardened and another is not.
2. Test-suite trust degrades when advisory diagnostics share the same pass/fail channel as assertions.
3. Documentation drift can persist even after correct code fixes when summary/design tables are updated separately from formula sections.

### Principles extracted

- **Harden by pattern, not by spot fix:** When escaping user input in templates, sweep all sibling interpolation blocks in the same commit.
- **Keep gating signals binary and explicit:** Advisory scripts should stay visible but must not influence a gating "all green" message.
- **Treat docs consistency as part of defect closure:** A finding is not fully closed until code, formula docs, and decision tables agree.

### Codebase-specific observations

- Export report liability/dependent interpolations now consistently use `escapeHtml(...)`.
- `_dev/tests/run_all_audits.js` now reports gating and advisory outcomes separately.
- Docs index pointers now reference `AUDIT_REPORT_2026-05-12-codebase-auditor-full.md` as current ground truth.

---

## Batch Synthesis - Session 13 - 2026-05-16
Findings in batch: NEW-57, NEW-58, NEW-59, NEW-60, NEW-61, NEW-62, NEW-63, NEW-64, NEW-65

### Patterns observed

1. Future-dated configuration can accidentally leak into current-year metrics when code sums all configured values instead of only active values.
2. Tooltip/detail surfaces can diverge from projection logic even when top-level charts remain correct.
3. UI-control changes are incomplete unless persistence, import/export, reset, tests, and generated verification artifacts are updated together.
4. Small visual regressions in dense financial cards often come from label wrapping, badge crowding, or ungrouped controls rather than calculation defects.

### Principles extracted

- **Separate configured commitments from active commitments:** For current-year savings and surplus math, gate annual investment contributions by their start year before subtracting them from undeployed surplus.
- **Make projected breakdowns reconcile to projected totals:** Detail tooltips should use the same balance, contribution, growth, and reconciliation assumptions as the chart category total.
- **Treat new user-visible state as schema:** Any new chart state must be included in autosave, JSON export, JSON import, and reset behavior before the feature is complete.
- **Update verification harnesses when selectors or semantics change:** Range-control step/min/max changes and staged-contribution math must be reflected in Playwright capture and full-element coverage checks.

### Codebase-specific observations

- `assetAllocTargetYear` is now persisted across autosave, export, import, and reset.
- JSON export now writes `runwaySchemaVersion: 2`, preventing freshly exported scenarios from importing through the legacy runway migration path.
- `_dev/tests/verify_full_element_coverage.mjs` now models retirement-year drawdown and staged investment contributions consistently with `src/App.jsx`.
- `_dev/e2e/user-scenario-capture.spec.js` should select runway controls by their current step/min/max semantics, not by legacy optimistic/pessimistic bounds.

---

## Batch Synthesis - Session 14 - 2026-05-16
Findings in batch: NEW-66

### Patterns observed

1. When a staged-input feature is added, every solver that reimplements projection math must be updated, not only the main projection engine.
2. Similar user-facing concepts need explicit labels: a flat gap-closing contribution and a dynamic full-surplus deployment scenario are not interchangeable.

### Principles extracted

- **Search for duplicate financial engines after model changes:** If `wealthProjection` changes, inspect lever solvers, report calculations, test fixtures, and tooltip formulas for equivalent assumptions.
- **Name scenario semantics in the UI:** Tooltips should say whether a scenario is additive to the base plan, replaces a base behavior for comparison, or changes a single variable in isolation.

### Codebase-specific observations

- The Retirement Health gap-closing solver now gates investment-item contributions by `contribStartYear`, matching the base projection.
- The Surplus Deployment tiles use full year-by-year surplus as standalone alternatives; they are not full surplus plus entered fixed contributions.

---

## Batch Synthesis - Session 15 - 2026-05-16
Findings in batch: NEW-67, NEW-68, NEW-69, NEW-70

### Patterns observed

1. Correct financial logic still needs careful wording when two metrics answer different questions, especially SWR nest egg funding versus Monte Carlo survival.
2. Dense financial headers should reserve space for controls first, then compress advisory badges rather than allowing multi-line wrapping.
3. Native range inputs are not expressive enough for reversed negative-offset fills; custom track styling is safer when the visual anchor matters.
4. Year filters become easier to use when they expose financial milestones directly instead of forcing users to calculate calendar years.

### Principles extracted

- **Name the question each metric answers:** Funding target, survival probability, and gap-closing levers should not sound interchangeable.
- **Make scenario controls match the mental model:** A negative-offset slider should fill from neutral to the selected negative value, not from the minimum bound.
- **Promote significant years to first-class controls:** Today, retirement, and life expectancy are domain anchors and should be direct actions where valid.

### Codebase-specific observations

- `ChartYearSelector` now centralizes compact year/age/milestone controls for chart surfaces.
- Retirement Runway sliders now use `.nwn-range` with explicit track backgrounds rather than relying on browser `accent-color` behavior.

---

## Batch Synthesis - Session 16 - 2026-05-16
Findings in batch: NEW-71, NEW-72, NEW-73, NEW-74

### Patterns observed

1. UI fixes that bypass native browser control behavior can create visual regressions even when calculation semantics are correct.
2. Chart-horizon controls are not decorative; they introduce user-visible state that must participate in autosave, export, import, reset, and verification artifacts.
3. Affordability warnings need to scan the same year-by-year projection horizon as the cashflow chart because future planned expenses and OTEs can change surplus capacity after a contribution starts.
4. Capture/coverage harnesses should preserve semantic values when DOM controls use transformed representations for UX reasons.

### Principles extracted

- **Prefer semantic native controls before custom paint:** Use native range inputs when possible; if a visual direction differs from the financial value, transform the UI value while keeping application state semantic.
- **Persist every chart horizon control:** Chart filters affect what users see and should round-trip through autosave, JSON export/import, reset, and generated capture artifacts.
- **Warn on first projected breach, not first configured date:** When a fixed plan interacts with year-by-year cashflow, scan the whole relevant horizon and report the first actionable breach year.
- **Test transformed control semantics:** If a DOM value is intentionally different from the model value, encode the translation in Playwright capture and coverage checks.

### Codebase-specific observations

- Retirement Runway now uses a positive RTL magnitude range for the pessimistic return control while keeping `runwayConservativeOffset` negative in app state.
- Net Worth, Assets Over Time, and Retirement Runway now share `ChartYearSelector` behavior with persisted target-year state.
- The Investments warning now compares aggregate planned investment contributions against `wealthProjection` yearly savings for all pre-retirement years.
- `_dev/e2e/regression-and-scenarios.spec.js` includes a targeted future-OTE affordability breach test for the contribution warning badge.
