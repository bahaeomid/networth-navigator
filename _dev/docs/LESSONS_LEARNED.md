# Lessons Learned — NetWorth Navigator

**Project:** NetWorth Navigator v2.0.0
**Domain:** Personal Finance / Retirement Projection
**Created:** 2026-04-17 by Session 1
**Last updated:** 2026-04-17

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
- Prior auditor reports (Auditor 1–3) in `_dev/docs/audits/` are SUPERSEDED by this audit.
- The IMPLEMENTATION_LOG.md has complete entries for all 30 findings.

---
