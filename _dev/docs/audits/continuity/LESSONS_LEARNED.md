# Lessons Learned — NetWorth Navigator

**Project:** NetWorth Navigator v2.0.0
**Domain:** Personal Finance / Retirement Projection
**Created:** 2026-04-17 by Session 1
**Last updated:** 2026-04-19

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
