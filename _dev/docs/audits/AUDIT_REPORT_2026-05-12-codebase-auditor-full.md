# Audit Report — NetWorth Navigator
**Date:** 2026-05-12  
**Command:** `codebase-auditor full`  
**Auditor:** Codex (GPT-5)  
**Codebase:** React 18 SPA for personal finance and retirement planning (`src/App.jsx`)  
**Location:** `C:\Users\AI_Lab\Desktop\AI Projects\00 Published Repositories\NetWorth Navigator`

---

## Executive Summary

A full multi-phase audit was executed across source, config, docs, tests, audit continuity artifacts, and release verification surfaces.  

Regression verification passed at the pipeline level (`npm run test:release`), but the audit found one CRITICAL security regression and two HIGH retirement-model parity/logic concerns, including the targeted one-year retirement-boundary behavior raised by the user.

---

## Production Readiness Verdict

**NO-GO**

Rationale: A CRITICAL export-path XSS regression is present in current code, and retirement withdrawal timing is inconsistent across core projection surfaces. These are fixable, but they should be resolved before claiming production-ready audit closure.

Blockers (must fix for GO):
1. FINDING-01: Export HTML XSS regression in unescaped user strings
2. FINDING-02: Retirement boundary timing causes one-year drawdown offset and optimistic asset path
3. FINDING-03: Monte Carlo withdrawal onset is out of parity with deterministic/runway engines

---

## Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH | 2 |
| MEDIUM | 1 |
| LOW | 1 |
| **Total** | **5** |

---

## CODEBASE SCAN SUMMARY

```
CODEBASE SCAN SUMMARY
=====================
What it does:
  Single-page personal-finance planner that computes net worth, retirement readiness,
  FI age, runway, and Monte Carlo survival odds from user-entered assumptions.

Languages:
  JavaScript/JSX, CSS, Markdown, JSON

Critical paths:
  1) wealthProjection lifecycle engine (income/expense/asset/liability timeline)
  2) retirementMetrics + Monte Carlo simulation
  3) gap-closing lever solvers (Save More / Retire Later / Higher Return)
  4) exportHTMLReport generation
  5) CSV/JSON import + autosave/restore state pipelines

Test coverage:
  Present via `_dev/tests` harnesses and `_dev/e2e` Playwright smoke/regression suite.
  Executed in this audit via `npm run test:release` with PASS result.

Domains identified:
  Financial / Retirement planning / Analytics UI

Red flags elevated to findings:
  [src/App.jsx:1860-1862,2134] Unescaped user strings in HTML export
  [src/App.jsx:3032,3154,3069,5787] Retirement boundary timing mismatch (salary stop vs drawdown onset)
  [src/App.jsx:470-523 vs 3154/5787] Monte Carlo vs deterministic drawdown onset parity gap
  [_dev/tests/auditor1_*.js] Non-gating scripts report critical issues while suite still passes
  [_dev/docs/README.md:14, _dev/docs/audits/README.md:8] Stale "current ground truth" pointers
```

---

## Findings

[CRITICAL] FINDING-01: Export HTML XSS regression (unescaped user strings)
File: `src/App.jsx:1860`  
Phase: 8 (Security Baseline)  
Description: User-controlled liability names and dependent names are interpolated into export HTML without escaping.  
Evidence:
- Unescaped liability names in report rows: `src/App.jsx:1860-1862`
- Unescaped dependent names in assumptions block: `src/App.jsx:2134`
- Existing safe pattern exists elsewhere using `escapeHtml(...)`: `src/App.jsx:1477-1484`
Before: A crafted liability/dependent name like `<img src=x onerror=alert(1)>` can execute in the generated report.  
After: User strings are HTML-escaped before interpolation; report renders text only.  
Fix: Wrap all user-controlled interpolations in export template with `escapeHtml(...)` (same approach already used in other report sections).  
Effort: Trivial

[HIGH] FINDING-02: Retirement boundary logic creates a one-year drawdown offset
File: `src/App.jsx:3032,3069,3154,5787`  
Phase: 4 (Logic & Formula Verification)  
Description: Salary stops at `age < retirementAge`, but drawdown begins only at `age > retirementAge`, and balances are pushed before annual updates. This defers visible drawdown impact by one year and causes net worth/assets to peak one year after retirement in common cases.  
Evidence:
- Salary cutoff: `src/App.jsx:3032`
- Push-then-grow timeline: `src/App.jsx:3069`
- Drawdown starts after retirement entry year: `src/App.jsx:3151-3155`
- Runway applies same post-retirement strict bound: `src/App.jsx:5787`
- Design doc confirms current assumption: `_dev/docs/core/FINANCIAL_MODEL.md:111` and `:285`
Before: Net worth/assets often rise through age `retirementAge + 1` while cash-flow income already collapses at retirement age.  
After: A single explicit boundary convention is enforced across salary stop, expense transition, drawdown start, and chart labeling.  
Fix: Choose and implement one convention across all surfaces:
- Option A: Start drawdown at `age >= retirementAge` (align with “income stops and retirement expenses begin at this age” copy).
- Option B: Keep `age >` but shift salary and retirement semantics to end-of-year retirement (explicitly document and relabel chart semantics).
Effort: Moderate

[HIGH] FINDING-03: Monte Carlo withdrawal onset is out of parity with deterministic/runway engines
File: `src/App.jsx:470-523`  
Phase: 5 (Parity Audit)  
Description: Monte Carlo applies withdrawal from simulation year 0, while deterministic `wealthProjection` and `simulateRunway` defer drawdown until `age > retirementAge`.  
Evidence:
- MC withdrawal loop applies `yearlyWithdrawals[0]` immediately: `src/App.jsx:470-523`
- Deterministic drawdown gate: `src/App.jsx:3154`
- Runway drawdown gate: `src/App.jsx:5787`
Before: Survival odds and deterministic/runway surfaces are based on different withdrawal-onset assumptions.  
After: Retirement withdrawal onset is aligned across all risk/projection engines.  
Fix: Align Monte Carlo start-year withdrawal rule with chosen deterministic boundary convention, then update docs/tests accordingly.  
Effort: Moderate

[MEDIUM] FINDING-04: Audit harness includes non-gating “issue report” scripts that can mask signal quality
File: `_dev/tests/auditor1_projection_test.js:113-118`  
Phase: 7 (Test Suite Audit)  
Description: Some scripts emit “critical issues found” summaries but exit successfully, so `run_all_audits.js` marks them as passed.  
Evidence:
- Issue list logged without failing assertions: `_dev/tests/auditor1_projection_test.js:113-118`
- Similar issue-summary-only pattern: `_dev/tests/auditor1_scorecard.js:101-108`
- Runner treats exit code 0 as pass: `_dev/tests/run_all_audits.js:55-61`
Before: `ALL AUDIT TESTS PASSED` can coexist with unresolved diagnostic warnings in output.  
After: Scripts are explicitly classified as advisory, or converted to assertions for intended invariants.  
Fix: Split advisory reporters from gating tests, or add strict assertions + expected-baseline files where appropriate.  
Effort: Moderate

[LOW] FINDING-05: Documentation index pointers are stale relative to active audit ground truth
File: `_dev/docs/README.md:14`  
Phase: 1 (Documentation Sync)  
Description: Docs index still points to `AUDIT_REPORT_2026-04-19.md` as current ground truth while registry includes newer active addendum audits on 2026-05-12.  
Evidence:
- Stale pointer in docs index: `_dev/docs/README.md:14`
- Stale pointer in audits index: `_dev/docs/audits/README.md:8`
- Newer active/addendum entries in registry: `_dev/docs/audits/AUDIT_REGISTRY.md:14-16`
Before: Navigation docs can send readers to superseded reports first.  
After: Index links align with latest active audit lineage.  
Fix: Update docs index pointers after each new active audit.  
Effort: Trivial

---

## Targeted Check — One-Year Offset (Requested)

Conclusion: The observed behavior is real, reproducible from current code, and partially documented. It is not a random regression; it is a boundary-convention consequence. However, the current “conservative” rationale is debatable because the implementation effectively delays portfolio withdrawals by one retirement year while salary already stops at retirement age.

What is happening in code:
1. Salary stops when `age < retirementAge` is false (`src/App.jsx:3032`), so salary is zero at retirement age.
2. Retirement expenses switch on at `age >= retirementAge` (`src/App.jsx:2986`).
3. Drawdown starts only when `age > retirementAge` (`src/App.jsx:3154` and runway `:5787`).
4. Each row is pushed before annual growth/withdrawal update (`src/App.jsx:3069`), so first visible drawdown impact appears one year later.

Why charts look different:
- Net Worth / Assets: can peak at `retirementAge + 1` before drawdown effects show.
- Cash Flow: salary drops immediately at retirement age, so income lines peak pre-retirement and collapse at retirement.
- Runway: uses same delayed drawdown gate as deterministic projection.
- Monte Carlo: does **not** share this gate (it withdraws from year 0), which creates additional parity inconsistency.

Recommendation:
- Choose one explicit retirement boundary convention and enforce it across all surfaces.
- Preferred for consistency with current copy: start drawdown at `age >= retirementAge`.
- If the current behavior is intentionally retained, docs/tooltips should explicitly describe the transition-year assumption and all surfaces should use the same withdrawal onset logic.

---

## Phases Executed

| Phase | Status | Findings |
|-------|--------|----------|
| 1. Documentation Sync | Complete | 1 |
| 2. Dead Code & Structure | Complete | 0 |
| 3. Universality & Hardcoding | Complete | 0 |
| 4. Logic & Formula Verification | Complete | 1 |
| 5. Parity Audit | Complete | 1 |
| 6. Edge Cases & Stress Testing | Complete | 0 |
| 7. Test Suite Audit | Complete | 1 |
| 8. Security Baseline | Complete | 1 |
| 9. Output Quality | Complete | 1 |
| 10. Efficacy Review | Complete | 0 |
| 11. Synthesis | Complete | Included |

---

## Verification Evidence

Executed during this audit:

```bash
npm run test:release
```

Observed:
- `npm run lint` PASS
- `npm run test:audits` PASS
- `npm run test:smoke` PASS (12 Playwright tests)
- Build completes; expected large bundle warning remains non-blocking

---

## Top 5 Most Impactful Findings

1. FINDING-01: Export HTML XSS regression in unescaped liability/dependent strings  
2. FINDING-02: Retirement boundary one-year drawdown offset affecting net worth/assets timeline semantics  
3. FINDING-03: Monte Carlo withdrawal onset parity mismatch vs deterministic/runway  
4. FINDING-04: Audit test suite mixes advisory scripts into pass/fail gating path  
5. FINDING-05: Documentation ground-truth pointers stale vs active audit registry

