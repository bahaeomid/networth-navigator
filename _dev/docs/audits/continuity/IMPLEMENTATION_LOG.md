# Implementation Log — NetWorth Navigator

**Source audit:** `_dev/docs/audits/plans/NETWORTH_NAVIGATOR_AUDIT_PLAN_v2.md`
**Codebase:** NetWorth Navigator v2.0.0 — single-file React 18 SPA (`src/App.jsx`, 7,668 lines)
**Domain(s):** Personal Finance / Retirement Projection
**Created:** 2026-04-17 by Session 1
**Last updated:** 2026-05-16 by Session 16

---

## Master Finding Status Table
*The single source of truth for finding status across all sessions.*
*Update Status, Session resolved, and Notes columns as work progresses.*

| ID | Title | Severity | Batch | Status | Session resolved | Notes |
|----|-------|----------|-------|--------|-----------------|-------|
| FINDING-01 | XSS in exportHTMLReport — user strings interpolated raw into HTML | CRITICAL | A | FIXED | 1 | Added escapeHtml utility; wrapped all 14 user-controlled interpolations |
| FINDING-02 | FX API divide-by-zero — no validation before 1/data.rates.X | CRITICAL | A | FIXED | 1 | Extract rates, guard falsy/zero before division |
| FINDING-03 | formatCurrency/toDisplay rate===0 — Infinity propagation | HIGH | A | FIXED | 1 | || 1 fallback for formatCurrency/formatCurrencyDecimal; rate<=0 guard for toDisplay |
| FINDING-04 | Passive/Other/Salary income inconsistency across surfaces | HIGH | B | FIXED | 1 | simulateRunway + Monte Carlo now resolve sub-items with endYear; Scorecard NW Multiple is point-in-time (correct as-is) |
| FINDING-05 | No ErrorBoundary — white-screen crash on any thrown exception | HIGH | C | FIXED | 1 | Added AppErrorBoundary class component wrapping NetWorthNavigator; shows error + reload button |
| FINDING-06 | No localStorage auto-save — all data lost on refresh | HIGH | C | FIXED | 1 | Added debounced (2s) auto-save to localStorage + auto-restore on mount; silent fail if unavailable |
| FINDING-07 | Inner components defined in render body — perf + input focus loss | HIGH | C | FIXED | 1 | Extracted NumberInput, SubItemAmountInput, ExchangeRateInput, MilestoneLegend to module scope; 3 remaining (CustomDot, CustomDotExpenses, CustomLegend) have App-scope closures |
| FINDING-08 | Growth rate validation gap — passiveGrowth/otherIncomeGrowth unbounded | HIGH | B | FIXED | 1 | Added [0,30] bounds check matching salaryGrowth pattern |
| FINDING-09 | Regex input validation bug — /[^d.]/g should be /[^\d.]/g | MEDIUM | A | FIXED | 1 | Added backslash for \d at both locations |
| FINDING-10 | Infinity from getRetNominalForYear when nestEggSwr=0 | MEDIUM | B | FIXED | 1 | Already guarded — all divisor sites check nestEggSwr<=0; SWR clamped to [0.1,max] on blur |
| FINDING-11 | Falsy `\|\| 1` masking — investments=0→1, csvRate=0→1 | MEDIUM | B | WONTFIX | 1 | Both are intentional: investments||1 prevents 0/0 NaN in chart scaling; csvRate||1 is a safe fallback for unknown currencies |
| FINDING-12 | handleRemoveCat 8× setState — potential mid-batch inconsistency | MEDIUM | C | WONTFIX | 1 | React 18 automatic batching handles this — all setState calls in an event handler are batched into one render |
| FINDING-13 | Monte Carlo synchronous on main thread — UI freeze risk | MEDIUM | C | WONTFIX | 1 | 1,000 sims run <100ms; Web Worker adds complexity without measurable benefit |
| FINDING-14 | getMilestoneEvents() called per render without memoization | MEDIUM | C | WONTFIX | 1 | Only called from CustomDot; simple array construction with negligible perf impact |
| FINDING-15 | Console statements in production (3 instances) | LOW | D | FIXED | 1 | Removed console.log; kept console.error for import failures (useful for debugging) |
| FINDING-16 | fetchFxRates no timeout/AbortController | LOW | D | FIXED | 1 | Added AbortController with 10s timeout |
| FINDING-17 | syncCategoryTotal potentially dead code | LOW | D | FIXED | 1 | Confirmed dead (defined, never called) — removed |
| FINDING-18 | Import version handling gap — unknown versions silently ignored | LOW | D | WONTFIX | 1 | Edge case; current behavior (accept unknown versions) is acceptable fallback |
| NEW-19 | GBP missing from README currency list | MEDIUM | E | FIXED | 2 | Added GBP to README line 28 |
| NEW-20 | IID independence assumption not disclosed | LOW | E | FIXED | 2 | Added explicit IID disclosure to Note 2 (Limitations) in HTML export |
| NEW-21 | Withdrawal methodology not clearly distinguished from classical SWR | LOW | E | DEFERRED | 2 | Observation only — no code change warranted |
| NEW-22 | Car loan endYear hardcoded to 2031 | LOW | E | FIXED | 2 | Changed `2031` to `new Date().getFullYear() + 5` |
| NEW-23 | Age validation missing — currentAge > retirementAge crashes projection | HIGH | E | FIXED | 2 | Profile NumberInput onChange enforces currentAge < retirementAge < lifeExpectancy with clamping; projectionYears uses Math.max(0,...) |
| NEW-24 | CSV import BOM not handled | MEDIUM | E | FIXED | 2 | Added `text.replace(/^\uFEFF/, '')` before line splitting |
| NEW-25 | JSON import type validation absent for nested objects | LOW | E | DEFERRED | 2 | Edge case, low risk — current behavior is acceptable |
| NEW-26 | Error boundary exposes raw error.message to UI | MEDIUM | E | FIXED | 2 | Generic message shown to user; raw error logged to console only |
| NEW-27 | "Investment Mix" label potentially misleading | LOW | E | DEFERRED | 2 | Observation — label is conventional enough |
| NEW-28 | IRR uses mismatched timeframes (nominal future vs today's terms) | MEDIUM | E | FIXED | 2 | Both numerator and denominator now use today's-terms values in scorecard JSX and HTML export |
| NEW-29 | Retire Later lever excludes salary contributions during extended years | MEDIUM | E | FIXED | 2 | Loop adds net savings (income - expenses, if positive) with income growing at configured rates |
| UCG-1 | Savings rate clamped to 0% hides deficit | MEDIUM | E | FIXED | 2 | Removed Math.max(0,...) clamp — shows negative values |
| NEW-30 | Pre-Retirement BASE breakdown modal opens out of viewport | HIGH | F | FIXED | 3 | Changed overlay from absolute scroll-anchored positioning to fixed viewport overlay |
| NEW-31 | Dashboard Retirement Health value row wraps/misaligns | MEDIUM | F | FIXED | 3 | Converted rows to two-column grid and enforced nowrap + right alignment for value column |
| NEW-32 | Retirement Health tooltip icon baseline shift | LOW | F | FIXED | 3 | Adjusted InfoTooltip baseline styling (`lineHeight` + `verticalAlign`) for compact metric rows |
| NEW-36 | Category-key drift after CSV/category replacement breaks What-If and OTE linkage | HIGH | G | FIXED | 5 | Added alias-based category reference normalization across OTEs, What-If adjustments/picker, chart drilldown selections, and hidden line state |
| NEW-37 | Retire Later lever behavior mismatched its "no other changes" copy | MEDIUM | G | FIXED | 5 | Switched lever to conservative compounding-only logic (no extra savings), and updated tooltip/methodology text |
| NEW-38 | Retirement Runway % labels leak floating-point precision strings | LOW | G | FIXED | 5 | Added centralized percent formatting helpers and applied to runway labels/tooltips |
| NEW-39 | One-time expenses undercounted when multiple entries share a year | HIGH | G | FIXED | 5 | Replaced single-entry `find()` logic with active-entry aggregation in deterministic runway + Monte Carlo |
| NEW-40 | Missing E2E regression coverage for category remap/systemic scenarios | MEDIUM | G | FIXED | 5 | Added `_dev/e2e/regression-and-scenarios.spec.js` with 2 targeted regressions + 5 multi-profile stress scenarios |
| NEW-41 | Ongoing investment contributions missing from base projection | HIGH | H | FIXED | 7 | Added investment-item `annualContrib` and `contribGrowthRate`; contributions now flow through `wealthProjection` and downstream retirement/report surfaces |
| NEW-42 | Savings-rate metric ignored current-year planned expenses | MEDIUM | H | FIXED | 7 | Renamed to current-year savings rate and subtracts planned expenses active in the current calendar year; report notes updated |
| NEW-43 | Liability balances could be mistaken for debt-service cashflow | MEDIUM | H | DOCUMENTED / DEFERRED | 7 | Documented current workflow: keep liabilities for net worth and enter full debt-service payments as expense categories for all liability types |
| NEW-44 | Save More surplus-offset hint used gross surplus after investment contributions were added | HIGH | I | FIXED | 8 | Save More now explains it is additional to entered contributions and only positive undeployed surplus can offset it |
| NEW-45 | Surplus Deployment copy described standalone scenarios as additive to the base projection | HIGH | I | FIXED | 8 | Reframed section and Tile 1 tooltip as standalone full-surplus/split scenarios with delta versus base |
| NEW-46 | Investment contribution entry layout was visually unclear | MEDIUM | I | FIXED | 8 | Reworked investment item rows with explicit Name, Current value, Annual contrib, and Growth labels |
| NEW-47 | Investment contribution fields lacked local explanatory tooltips | MEDIUM | I | FIXED | 8 | Added inline tooltips for Annual contrib and Growth fields |
| NEW-48 | Current-year savings-rate tooltip did not disclose contribution treatment | LOW | I | FIXED | 8 | Tooltip now states contributions are deployment of savings, not expenses, and defines undeployed surplus |
| NEW-49 | HTML report Save More methodology note referenced generic surplus offset | LOW | I | FIXED | 8 | Report note now uses undeployed surplus after entered annual investment contributions |
| NEW-50 | Gap-closing levers no longer matched applied-input outcomes after contribution-model update | HIGH | J | FIXED | 9 | Replaced closed-form/compounding-only lever logic with actionable parity solvers for Save More, Retire Later, and Higher Return |
| NEW-51 | Collapsed Investments header hid contribution activity when lump-sum balance was zero | MEDIUM | J | FIXED | 9 | Added annual-contribution badge beside Investments total in collapsed header |
| NEW-52 | Export HTML report interpolates user strings without escape (XSS regression) | CRITICAL | K | FIXED | 12 | Escaped liability/dependent interpolations in Balance Sheet + assumptions sections with `escapeHtml` |
| NEW-53 | Retirement boundary mismatch causes one-year drawdown offset | HIGH | K | FIXED | 11 | Drawdown boundary aligned to `age >= retirementAge` in deterministic + runway surfaces; docs/tooltips synced |
| NEW-54 | Monte Carlo withdrawal onset out of parity with deterministic/runway | HIGH | K | FIXED | 11 | Deterministic/runway now match MC year-0 withdrawal convention; parity contract documented + harness updated |
| NEW-55 | Audit harness mixes advisory scripts into pass/fail gating | MEDIUM | K | FIXED | 12 | Reclassified all auditor1 scripts as advisory in `run_all_audits.js`; gating pass banner now reflects assertion-backed tests only |
| NEW-56 | Docs index current-ground-truth pointers stale vs registry | LOW | K | FIXED | 12 | Updated docs index pointers to the active full audit lineage (`AUDIT_REPORT_2026-05-12-codebase-auditor-full.md`) |
| NEW-57 | Runway neutral slider state had colored optimism bias and coarse return increments | LOW | L | FIXED | 13 | Neutral runway sliders now use neutral styling; return offsets step in 0.5pp increments |
| NEW-58 | Investment contribution start-year editor was cramped and allowed post-retirement starts | MEDIUM | L | FIXED | 13 | Start-year input is consistently labeled/sized and capped to the final pre-retirement year |
| NEW-59 | Collapsed investment contribution badges crowded growth controls | LOW | L | FIXED | 13 | Collapsed investment header now wraps compact badges separately from growth controls |
| NEW-60 | Projected asset allocation tooltip showed stale/zero investment subitems and estimate wording | MEDIUM | L | FIXED | 13 | Tooltip now projects item-level balances/contributions, reconciles to category totals, and labels projected breakdowns explicitly |
| NEW-61 | Financial health current-year metric labels wrapped and lacked explicit year context | LOW | L | FIXED | 13 | Scorecard/report labels now include the current calendar year and use compact non-wrapping labels |
| NEW-62 | Chart target-year controls lacked grouped visual framing | LOW | L | FIXED | 13 | Year controls now sit in a framed backdrop across allocation, cashflow, pre-retirement, and projection charts |
| NEW-63 | New May 15 state was not fully persisted/imported/exported | MEDIUM | L | FIXED | 13 | Export now writes `runwaySchemaVersion`; autosave/export/import/reset now cover `assetAllocTargetYear` |
| NEW-64 | Verification harness drifted from runway/contribution semantics | MEDIUM | L | FIXED | 13 | User-capture selectors and full-element coverage projection/runway checks now match the implemented controls and contribution model |
| NEW-65 | Save More undeployed surplus treated future-starting contributions as current commitments | HIGH | L | FIXED | 13 | Undeployed surplus now subtracts only active current-year investment contributions; UI/report/docs updated |
| NEW-66 | Gap-closing lever solver ignored investment contribution start years | HIGH | L | FIXED | 14 | Save More, Retire Later, and Higher Return solvers now respect `contribStartYear`; copy clarifies Save More vs Surplus Deployment semantics |
| NEW-67 | Retirement Health copy could still blur conservative SWR target vs Monte Carlo survival odds | LOW | L | FIXED | 15 | Verdict/tooltips now distinguish SWR nest egg funding from Monte Carlo survival mechanics and income offsets |
| NEW-68 | Collapsed Investments badges could wrap under the header row | LOW | L | FIXED | 15 | Compacted contribution/over-savings badges and kept the collapsed header on one row without overlapping growth controls |
| NEW-69 | Runway slider visuals had inconsistent neutral track/fill behavior and asymmetric return bounds | LOW | L | FIXED | 15 | Symmetric 8pp bounds kept; implementation superseded by NEW-72 native RTL magnitude slider after custom styling regressed UI behavior |
| NEW-70 | Chart year selectors lacked quick milestone-year switching | LOW | L | FIXED | 15 | Added compact shared selector with editable year, age, and Today/Ret/Life quick chips where relevant |
| NEW-71 | Chart year selectors were not applied to Net Worth, Assets Over Time, or Retirement Runway | LOW | M | FIXED | 16 | Added shared year controls to the remaining chart surfaces and persisted the new target-year state |
| NEW-72 | Custom runway range styling regressed thumb alignment and live fill behavior | LOW | M | FIXED | 16 | Removed `.nwn-range`; restored native range sizing while preserving pessimistic right-anchored semantics via an RTL magnitude slider |
| NEW-73 | Investment over-savings warning only checked the contribution start year | MEDIUM | M | FIXED | 16 | Warning now scans all pre-retirement years and reports the first year where planned contributions exceed projected savings surplus |
| NEW-74 | Dynamic contribution warning lacked regression coverage | LOW | M | FIXED | 16 | Added a Playwright regression for a future OTE-driven affordability breach and updated capture/coverage handling for RTL pessimistic slider semantics |
<!-- Additional findings will be added during phase execution -->

---

## SESSION 1 — 2026-04-17 — Claude Opus 4.6

**Picking up from:** Fresh start (Session 1)
**Open findings at session start:** FINDING-01 through FINDING-18
**Session goal:** Execute full audit plan, document all findings, fix all CRITICAL and HIGH. Fix MEDIUM/LOW as time permits.
**Session end status:** COMPLETE — 13 FIXED, 5 WONTFIX

---

### FINDING-01 — XSS in exportHTMLReport (CRITICAL → FIXED)

**Problem:** 14 user-controlled strings (item names, event descriptions, category labels, milestone labels, stages) were interpolated raw into HTML template literals in `exportHTMLReport`. An attacker could inject `<img src=x onerror="alert('XSS')">` via any name/description field.

**Root cause:** No HTML escaping utility existed; all interpolations used raw `${value}`.

**Fix applied:**
1. Added `escapeHtml()` utility at line 27 — escapes `& < > " '` to HTML entities
2. Wrapped all 14 user-controlled interpolations in `escapeHtml()`:
   - Milestone labels (line 889)
   - Life event descriptions (lines 890, 956)
   - One-time expense descriptions (lines 891, 950)
   - Category labels (lines 928, 952)
   - Income sub-item names: salary/passive/other (lines 938-940)
   - Liability sub-item names: mortgage/loan/other (lines 943-945)
   - Life event stage (line 956)

**Verification:** Zero editor errors. All `escapeHtml` call sites confirmed via grep (15 matches: 1 def + 14 calls). Numeric values (`e.year`, `e.age`, `fmt(...)`, growth rates) left unescaped — they are programmatic, not user-input.

---

### FINDING-02 — FX API divide-by-zero (CRITICAL → FIXED)

**Problem:** `fetchFxRates` computed `1 / data.rates.USD` etc. without checking if the rate was present or non-zero. A corrupted/partial API response with a missing or zero rate would produce `Infinity` exchange rates, propagating through every currency conversion.

**Fix applied:** Extracted each rate into a local variable, then added a truthy guard (`if (!usd || !cad || !eur || !gbp) throw new Error(...)`) before division. On failure, the existing catch block retains the cached fallback rates.

**Verification:** Zero editor errors. Guard covers both `undefined` (missing property) and `0` (would cause `Infinity`).

---

### FINDING-03 — formatCurrency/toDisplay rate===0 (HIGH → FIXED)

**Problem:** `formatCurrency` and `formatCurrencyDecimal` divided by `exchangeRates[currency]` without fallback. If the rate was `0`, `undefined`, or `NaN`, division would produce `Infinity`/`NaN` displayed to the user. `toDisplay` had `!rate` but didn't guard `rate === 0` explicitly (falsy catches it, but `rate <= 0` is more intentional).

**Fix applied:**
1. `formatCurrency`: `exchangeRates[currency]` → `exchangeRates[currency] || 1` (fallback to identity)
2. `formatCurrencyDecimal`: same `|| 1` fallback
3. `toDisplay`: `!rate || rate === 1` → `!rate || rate <= 0 || rate === 1` (explicit negative/zero guard)

**Verification:** Zero editor errors.

---

### FINDING-09 — Regex input validation bug (MEDIUM → FIXED)

**Problem:** Two `onChange` handlers used `/[^d.]/g` to strip non-numeric chars. Missing `\` means `d` is the literal letter "d" not the digit class `\d`. Result: digits were being stripped, only the letter "d" and "." were preserved.

**Fix applied:** Changed `/[^d.]/g` → `/[^\d.]/g` at both locations (SWR input, investmentStdDev input).

**Verification:** Zero editor errors.

---

### FINDING-04 — Passive/Other/Salary income inconsistency (HIGH → FIXED)

**Problem:** `simulateRunway` and Monte Carlo did not resolve income sub-items with endYear, causing retirement projections to include income that should have ended.

**Fix applied:** Both `simulateRunway` and Monte Carlo now resolve sub-items with endYear; passive income schedule passes sub-items with endYear.

---

### FINDING-05 — No ErrorBoundary (HIGH → FIXED)

**Problem:** Any unhandled exception in a React component caused a white screen with no recovery path.

**Fix applied:** Added `AppErrorBoundary` class component wrapping `NetWorthNavigator`. Shows generic error message + reload button. `componentDidCatch` logs to console.

---

### FINDING-06 — No localStorage auto-save (HIGH → FIXED)

**Problem:** All financial data was lost on page refresh — no persistence mechanism.

**Fix applied:** Debounced (2s) auto-save to localStorage + auto-restore on mount. Silent fail if storage unavailable.

---

### FINDING-07 — Inner components in render body (HIGH → FIXED)

**Problem:** `NumberInput`, `SubItemAmountInput`, `ExchangeRateInput`, `MilestoneLegend` defined inside the render function, causing remount on every render (focus loss, perf).

**Fix applied:** Extracted to module scope. 3 remaining (`CustomDot`, `CustomDotExpenses`, `CustomLegend`) have App-scope closures — left in place.

---

### FINDING-08 — Growth rate validation gap (HIGH → FIXED)

**Problem:** `passiveGrowth` and `otherIncomeGrowth` had no upper bound, unlike `salaryGrowth` which was clamped to [0, 30].

**Fix applied:** Added [0, 30] bounds check matching the `salaryGrowth` pattern.

---

### FINDING-10 — Infinity from getRetNominalForYear when nestEggSwr=0 (MEDIUM → FIXED)

**Problem:** Division by SWR could produce Infinity if user set SWR to 0.

**Fix applied:** Already guarded — all divisor sites check `nestEggSwr <= 0`; SWR clamped to [0.1, max] on blur. Verified correct.

---

### FINDING-11 — Falsy `|| 1` masking (MEDIUM → WONTFIX)

**Rationale:** Both uses are intentional: `investments||1` prevents 0/0 NaN in chart scaling; `csvRate||1` is a safe fallback for unknown currencies.

---

### FINDING-12 — handleRemoveCat 8× setState (MEDIUM → WONTFIX)

**Rationale:** React 18 automatic batching handles all setState calls in event handlers — batched into one render.

---

### FINDING-13 — Monte Carlo synchronous on main thread (MEDIUM → WONTFIX)

**Rationale:** 1,000 sims run <100ms; Web Worker adds complexity without measurable benefit.

---

### FINDING-14 — getMilestoneEvents() per render (MEDIUM → WONTFIX)

**Rationale:** Only called from CustomDot; simple array construction with negligible perf impact.

---

### FINDING-15 — Console statements in production (LOW → FIXED)

**Fix applied:** Removed `console.log`; kept `console.error` for import failures (useful for debugging).

---

### FINDING-16 — fetchFxRates no timeout (LOW → FIXED)

**Fix applied:** Added AbortController with 10s timeout.

---

### FINDING-17 — syncCategoryTotal dead code (LOW → FIXED)

**Fix applied:** Confirmed dead (defined, never called) — removed.

---

### FINDING-18 — Import version handling gap (LOW → WONTFIX)

**Rationale:** Edge case; current behavior (accept unknown versions) is acceptable fallback.

---

## SESSION 2 — 2026-04-17 — Claude Opus 4.6

**Picking up from:** Session 1 completed 18 pre-identified findings
**Open findings at session start:** 0 (all 18 resolved)
**Session goal:** Execute remaining audit plan phases (1-11 + SUP-1 to SUP-9), discover new findings, fix all, create deliverables.

### Phase Execution Summary

| Phase | Scope | Result | New Findings |
|-------|-------|--------|-------------|
| Phase 1 | Documentation Sync | 3 findings | NEW-19, NEW-20, NEW-21 |
| Phase 2 | Dead Code | CLEAN | None |
| Phase 3 | Hardcoding Audit | 58 values catalogued; 1 fix | NEW-22 |
| Phase 4 | Formula Verification | All 10 formulas verified correct | None |
| Phase 5 | Parity Audit | All 6 parity checks pass | None |
| Phase 6 | Edge Cases | 3 findings | NEW-23, NEW-24, NEW-25 |
| Phase 8 | Security | 1 finding | NEW-26 |
| Phase 9 | Output/Labels | 9/10 accurate | NEW-27 |
| UCG | User Confirmation Gate | 10 items resolved | UCG-1, NEW-28, NEW-29 |
| Phase 10 | Efficacy Review | All scorecard tiles validated | None |
| SUP-1–8 | Supplementary Phases | All satisfied or doc-only | None |

---

### NEW-23 — Age validation missing (HIGH → FIXED)

**Problem:** Setting currentAge ≥ retirementAge or retirementAge ≥ lifeExpectancy caused negative projectionYears, crashing the wealth projection chart.

**Fix applied:** Profile NumberInput onChange handlers now enforce `currentAge < retirementAge < lifeExpectancy` with clamping. `projectionYears` calculation uses `Math.max(0, ...)` as a safety net.

---

### NEW-28 — IRR uses mismatched timeframes (MEDIUM → FIXED)

**Problem:** Scorecard IRR tile computed `retNominalExp / preRetIncome` — numerator was future-inflated retirement expenses, denominator was today's pre-retirement income. Comparing different time bases made the ratio meaningless for long horizons.

**Fix applied:** Both numerator and denominator now use today's-terms values: `effectiveRetirementExpense / preRetIncome` in scorecard JSX, and `totalRetExpenses / preRetIncome` in HTML export. Tooltip updated to say "today's terms".

---

### NEW-29 — Retire Later lever excludes salary contributions (MEDIUM → FIXED)

**Problem:** "Retire Later" gap lever only extended the drawdown period but ignored the salary contributions during additional working years — significantly undervaluing the lever.

**Fix applied:** Loop now adds net savings (income − expenses, if positive) during extended years, with income growing at configured salary growth rate. Tooltip and Note text updated.

---

### NEW-26 — Error boundary exposes raw error.message (MEDIUM → FIXED)

**Problem:** Error boundary rendered `error.message` directly to the UI, potentially exposing internal details.

**Fix applied:** Generic "Error details have been logged to the console" shown to user; added `componentDidCatch` that logs the actual error to console.

---

### NEW-24 — CSV BOM not handled (MEDIUM → FIXED)

**Problem:** CSV files saved from Excel on Windows have a UTF-8 BOM (`\uFEFF`) that corrupted the first header field, causing the category column to be unrecognized.

**Fix applied:** Added `text.replace(/^\uFEFF/, '')` before line splitting in `importExpensesCSV`.

---

### UCG-1 — Savings rate clamped to 0% (MEDIUM → FIXED)

**Problem:** `annualSavings = Math.max(0, annualIncome - expenses)` hid deficit situations where expenses exceed income.

**Fix applied:** Removed `Math.max(0, ...)` clamp — savings rate can now show negative values, alerting users to deficits.

---

### NEW-19 — GBP missing from README (MEDIUM → FIXED)

**Fix applied:** Updated README line 28: "AED, USD, CAD, or EUR" → "AED, USD, CAD, EUR, or GBP"

---

### NEW-20 — IID independence not disclosed (LOW → FIXED)

**Fix applied:** Updated Note 2 (Limitations) in HTML export to explicitly state "independent, identically distributed (IID) normally distributed returns."

---

### NEW-22 — Car loan endYear hardcoded (LOW → FIXED)

**Fix applied:** Changed `2031` → `new Date().getFullYear() + 5` in DEFAULT_STATE.

---

### Deferred Items

| ID | Title | Reason |
|----|-------|--------|
| NEW-21 | Withdrawal methodology naming | Observation only — no code change needed |
| NEW-25 | JSON import nested type validation | Edge case, low risk — acceptable behavior |
| NEW-27 | "Investment Mix" label | Label is conventional enough — no action needed |

---

**Session end status:** COMPLETE
**Total findings resolved this session:** 10 FIXED, 3 DEFERRED
**Total findings resolved across all sessions:** 23 FIXED, 8 WONTFIX/DEFERRED
**Zero editor errors confirmed.**

---

## SESSION 3 — 2026-04-19 — GitHub Copilot (GPT-5.3-Codex)

**Picking up from:** Session 2
**Open findings at session start:** User-reported UI regressions not present in prior finding register
**Session goal:** Run independent cross-audit against prior agent work, confirm/disagree with prior conclusions, and fix any validated regressions with full verification.
**Session end status:** COMPLETE — 3 FIXED, 0 BLOCKED, 0 DEFERRED

### Continuation State Summary (resolved in-session)

- Prior sessions read in full: Session 1 + Session 2 blocks, audit registry, and latest audit report.
- Cross-check completed: prior CRITICAL/HIGH fixes remained intact.
- Discrepancy surfaced and resolved: current UI regressions were not captured in A4 even though behavior-level logic remained correct.

### NEW-30 — Pre-Retirement BASE breakdown modal opens out of viewport (HIGH → FIXED)

**Status:** FIXED ✅
**Fix applied:** In `src/App.jsx`, replaced the BASE breakdown popup overlay from `position: 'absolute'` with scroll-offset anchoring to `position: 'fixed'` full-viewport overlay. Removed obsolete `breakdownScrollY` state and click-path usage.
**Verification:** Browser-level Playwright check after scrolling deep into Pre-Retirement: modal heading `Breakdown at ...` appears inside viewport immediately.
**Verification result:** PASS ✅
**Attempts:** 1
**Observations:** The regression was purely positioning logic in the popup container; no data or formula impact.
**Files changed:** `src/App.jsx`

### NEW-31 — Dashboard Retirement Health value row wraps/misaligns (MEDIUM → FIXED)

**Status:** FIXED ✅
**Fix applied:** In `src/App.jsx`, updated Retirement Health mini-card row layout from `display:flex` to a stable two-column grid (`1fr auto`) and applied `whiteSpace: 'nowrap'`, right-aligned, min-width value styling to preserve clean right-column alignment for entries like `Age 59`.
**Verification:** Playwright computed-style capture on `Investments exhausted at` value span confirmed `white-space: nowrap` and `text-align: right`.
**Verification result:** PASS ✅
**Attempts:** 1
**Observations:** Regression was responsive typography/layout pressure, not a metric computation error.
**Files changed:** `src/App.jsx`

### NEW-32 — Retirement Health tooltip icon baseline shift (LOW → FIXED)

**Status:** FIXED ✅
**Fix applied:** In `src/App.jsx`, adjusted `InfoTooltip` style baseline behavior (`lineHeight: 1.1` and `verticalAlign: 'middle'`) to improve icon alignment in compact card labels.
**Verification:** Visual inspection in affected compact rows; no tooltip interaction regressions.
**Verification result:** PASS ✅
**Attempts:** 1
**Observations:** Small but user-visible polish fix that improves readability consistency.
**Files changed:** `src/App.jsx`

## SESSION 3 CLOSE — 2026-04-19
**Findings resolved this session:** 3 — NEW-30, NEW-31, NEW-32
**Findings blocked:** 0 — none
**Findings deferred:** 0 — none
**Overall progress:** 26 / 26 actionable (100% complete on currently tracked actionable findings)

**Key observations this session:**
- Prior agent logic/security fixes remained intact under re-audit.
- Remaining risks were UX/layout regressions in modal anchoring and compact metric row formatting.
- Existing release verification chain (`lint + audits + smoke`) stayed green after the UI fixes.

**Next session priority:**
1. Optional: extend Playwright coverage to include explicit assertions for modal placement and compact card alignment across multiple viewport sizes.

---

## SESSION 4 — 2026-04-19 — GitHub Copilot (GPT-5.3-Codex)

**Picking up from:** Session 3
**Open findings at session start:** 0 confirmed product bugs in A5; independent re-audit requested from scratch with no assumptions.
**Session goal:** Re-run full independent audit phases, reconcile stale/false-positive findings, and remediate any genuinely new issues.
**Session end status:** COMPLETE — 3 FIXED, 0 BLOCKED, 0 DEFERRED

### Continuation State Summary (resolved in-session)

- Independent from-scratch validation confirmed some automated findings were stale against current code.
- Runtime verification chain (`lint`, `_dev/tests` audits, Playwright smoke) re-run successfully.
- New actionable issues surfaced in data-boundary validation and repository hygiene.

### NEW-33 — SWR bounds bypassed on restore/import paths (MEDIUM → FIXED)

**Status:** FIXED ✅
**Fix applied:** Added shared `clampSwr()` helper in `src/App.jsx` and applied it to both auto-restore (`localStorage`) and JSON import paths before `setNestEggSwr`.
**Verification:** Re-ran `npm run test:release`; all stages passed with no regressions.
**Verification result:** PASS ✅
**Attempts:** 1
**Observations:** UI already clamped SWR edits, but persisted/imported payloads could bypass bounds and introduce unrealistic assumptions.
**Files changed:** `src/App.jsx`

### NEW-34 — Temporary root regression scripts left in repository surface (LOW → FIXED)

**Status:** FIXED ✅
**Fix applied:** Removed ad-hoc root scripts (`check_reg.js`, `check_regression.js`, `check_reg_v2.js`) and added `check_reg*.js` to `.gitignore` to prevent future reintroduction.
**Verification:** Workspace root inventory confirms scripts removed; release verification remained green.
**Verification result:** PASS ✅
**Attempts:** 1
**Observations:** One script was malformed/garbled and none were part of the documented or scripted release surface.
**Files changed:** `.gitignore`, `check_reg.js` (deleted), `check_regression.js` (deleted), `check_reg_v2.js` (deleted)

### NEW-35 — SWR range documentation drift vs enforced code bounds (LOW → FIXED)

**Status:** FIXED ✅
**Fix applied:** Updated `_dev/docs/core/FINANCIAL_MODEL.md` SWR range from `0.1–any` to `0.1–6.0` to match enforced app constraints.
**Verification:** Manual docs-sync cross-check against `SWR_MIN`/`SWR_MAX` constants.
**Verification result:** PASS ✅
**Attempts:** 1
**Observations:** This was a docs consistency issue, not a formula implementation bug.
**Files changed:** `_dev/docs/core/FINANCIAL_MODEL.md`

## SESSION 4 CLOSE — 2026-04-19
**Findings resolved this session:** 3 — NEW-33, NEW-34, NEW-35
**Findings blocked:** 0 — none
**Findings deferred:** 0 — none
**Overall progress:** 29 / 29 actionable (100% complete on currently tracked actionable findings)

**Key observations this session:**
- Re-audit quality improves when stale automated findings are manually reconciled against live source before remediation.
- Input constraints must be enforced at all ingress points (UI, restore, and import), not just interactive form controls.
- Repository hygiene issues can silently accumulate and should be treated as audit findings when they affect maintainability.

**Next session priority:**
1. Optional: add a focused Playwright case that explicitly validates SWR bounds after JSON import and localStorage restore.

---

## SESSION 5 — 2026-04-19 — GitHub Copilot (GPT-5.3-Codex)

**Picking up from:** Session 4
**Open findings at session start:** User-reported post-audit regressions in Pre-Retirement/Retirement plus request for broad multi-profile scenario stress testing.
**Session goal:** Fix all reported regressions, verify whether root causes were systemic, add robust E2E coverage, and re-run full release verification.
**Session end status:** COMPLETE — 5 FIXED, 0 BLOCKED, 0 DEFERRED

### Continuation State Summary (resolved in-session)

- Independent root-cause analysis confirmed issues were not category-specific; they traced to stale category-key references after category replacement/import.
- Retirement gap lever semantics were realigned to user-facing copy: "Retire later" now models delay-only compounding (conservative).
- One-time expense handling was hardened in both deterministic and stochastic retirement paths.
- New regression and scenario E2E suite stabilized and integrated into smoke/release chain.

### NEW-36 — Category-key drift after CSV/category replacement (HIGH → FIXED)

**Status:** FIXED ✅
**Problem:** After category replacement/import (notably CSV replacing defaults with `csv_*` keys), linked states retained stale keys. Symptoms included What-If default category drift and planned-expense markers/dots rendering inconsistently until category toggles.
**Fix applied:** In `src/App.jsx`, added category alias normalization utilities and a shared normalization flow to resolve stale references across:
- `oneTimeExpenses[].category`
- `sensitivityAdj[].category`
- `sensitivityCatPicker`
- chart drilldown selection (`selectedChartCats`)
- hidden line map (`hiddenCalcLines`)

Also added a reactive normalization effect on `expenseCategories` changes and introduced `normalizedOneTimeExpenses` as the canonical downstream data source.
**Verification:** `npm run test:smoke` regression case `CSV category-key replacement keeps What-If and Planned Expense visuals in sync` passed.
**Verification result:** PASS ✅
**Attempts:** 2 (first pass exposed flaky/over-broad locators; selectors tightened and assertions made behavior-based)
**Files changed:** `src/App.jsx`, `_dev/e2e/regression-and-scenarios.spec.js`

### NEW-37 — Retire Later behavior/copy mismatch (MEDIUM → FIXED)

**Status:** FIXED ✅
**Problem:** Card subtext said "no other changes" but prior implementation included extra savings contributions during delayed years, making recommendation non-reproducible by changing retirement age alone.
**Fix applied:** Reworked Retire Later lever in `src/App.jsx` to conservative delay-only compounding on existing retirement investments. Removed additional contribution assumptions from that lever and updated tooltip + methodology note text to match behavior.
**Verification:** Playwright regression `retire-later recommendation is reproducible and runway percentages are normalized` passed after setting suggested age in Profile and confirming gap-closing panel disappears.
**Verification result:** PASS ✅
**Attempts:** 1
**Files changed:** `src/App.jsx`, `_dev/e2e/regression-and-scenarios.spec.js`

### NEW-38 — Runway floating-point precision artifacts (LOW → FIXED)

**Status:** FIXED ✅
**Problem:** Runway labels/tooltips could display long floating tails (for example precision leak strings) from raw float interpolation.
**Fix applied:** Added `roundTo`, `formatPct`, and `formatRatePerYear` helpers in `src/App.jsx` and applied them to runway return/rate displays and investment-growth tooltip labels.
**Verification:** Regression assertions now enforce absence of long-float percent artifacts; smoke/release chain passed.
**Verification result:** PASS ✅
**Attempts:** 1
**Files changed:** `src/App.jsx`, `_dev/e2e/regression-and-scenarios.spec.js`

### NEW-39 — One-time expense undercount in runway + Monte Carlo (HIGH → FIXED)

**Status:** FIXED ✅
**Problem:** Single-entry lookup (`find`) only captured one one-time expense for a year and missed overlapping/recurring entries, understating withdrawals.
**Fix applied:**
- Monte Carlo: replaced per-year single hit with summed yearly aggregation across all matching entries.
- Deterministic runway: replaced single hit with active-entry filtering across recurring ranges and summed inflation-adjusted total.
- Pre-retirement chart dot attribution: moved to per-row stored OTE lists to avoid stale global matching.
**Verification:** Multi-profile scenario stress tests (including same-year multi-OTE cases) passed; no `Infinity`/`NaN`/precision artifacts observed.
**Verification result:** PASS ✅
**Attempts:** 1
**Files changed:** `src/App.jsx`, `_dev/e2e/regression-and-scenarios.spec.js`

### NEW-40 — Coverage gap for systemic cross-tab regressions (MEDIUM → FIXED)

**Status:** FIXED ✅
**Problem:** Existing E2E surface lacked scenario-level coverage to catch category remap drift and cross-tab stability regressions.
**Fix applied:** Created `_dev/e2e/regression-and-scenarios.spec.js` containing:
- 2 targeted regressions (category remap / retire-later + runway formatting)
- 5 varied profile stress scenarios traversing Profile, Finances, Pre-Retirement, Retirement, Dashboard
- artifact guards (`Infinity`, `NaN`, excessive float precision patterns)

Selectors were hardened to avoid ambiguous role/text matches (tab-name regex anchoring and behavior-focused assertions).
**Verification:** Entire Playwright suite green with new tests included.
**Verification result:** PASS ✅
**Attempts:** 2 (initial selectors/assertions were too brittle; stabilized in final pass)
**Files changed:** `_dev/e2e/regression-and-scenarios.spec.js`

### Verification Chain (Session 5)

- `npm run lint` → PASS ✅
- `npm run test:audits` → PASS ✅
- `npm run test:smoke` → PASS ✅ (8/8)
- `npm run test:release` → PASS ✅

## SESSION 5 CLOSE — 2026-04-19
**Findings resolved this session:** 5 — NEW-36, NEW-37, NEW-38, NEW-39, NEW-40
**Findings blocked:** 0 — none
**Findings deferred:** 0 — none
**Overall progress:** 34 / 34 actionable (100% complete on currently tracked actionable findings)

**Key observations this session:**
- Category-key replacement has systemic blast radius unless all category-linked state is normalized reactively.
- Recommendation text must exactly match lever math or users lose reproducibility trust.
- Aggregation logic for one-time expenses must assume many-to-one year mappings by default.
- Scenario-level E2E coverage across tabs is required to catch cross-surface regressions that unit-style checks miss.

**Next session priority:**
1. Optional: add a small invariant test set for category-reference normalization (unit-level) to complement Playwright coverage.

---

## SESSION 6 — 2026-04-20 — GPT-5.3-Codex

**Picking up from:** Session 5 close (all actionable findings fixed)
**Session goal:** Close runway parity follow-ups requested post-audit and synchronize _dev verification/docs with current code behavior.

### Follow-up 1 — Import/reset runway parity regression hardening (DONE)

**Status:** CLOSED ✅
**Work completed:**
1. Kept runway control persistence active across autosave + JSON import/export paths.
2. Added explicit Playwright regression assertions in `_dev/e2e/user-scenario-capture.spec.js`:
   - perturbed runway controls must match injected values,
   - reset runway controls must match baseline controls after re-import,
   - reset runway years must equal baseline runway years.

**Verification:** `npx playwright test _dev/e2e/user-scenario-capture.spec.js --reporter=list` passed with new assertions active.
**Files changed:** `_dev/e2e/user-scenario-capture.spec.js`

### Follow-up 2 — Float-safe runway slider parsing (DONE)

**Status:** CLOSED ✅
**Problem:** Runway slider handlers used integer parsing, which can truncate fractional values on ranges with fractional min anchors.
**Fix applied:** Replaced integer parsing with `parseRangeInputValue(...)` in `src/App.jsx` to preserve numeric precision and align values to min/step semantics.
**Verification:** Fresh capture now records perturbed pessimistic return offset exactly at `-5.5` (no truncation).
**Files changed:** `src/App.jsx`

### Follow-up 3 — Control parity evidence in full-element report (DONE)

**Status:** CLOSED ✅
**Work completed:**
1. Extended `_dev/tests/verify_full_element_coverage.mjs` with 8 explicit `Runway Control Parity` checks (perturbed targets + reset-vs-baseline controls).
2. Updated `_dev/tests/run_all_audits.js` to execute `verify_full_element_coverage.mjs` when required capture artifacts are present.

**Verification:** Full coverage report shows `Runway Control Parity: 8 pass / 0 fail`.
**Files changed:** `_dev/tests/verify_full_element_coverage.mjs`, `_dev/tests/run_all_audits.js`

### Verification Chain (Session 6)

- `npm run build` → PASS ✅
- `npx playwright test _dev/e2e/user-scenario-capture.spec.js --reporter=list` → PASS ✅
- `node _dev/tests/extract_user_capture_metrics.mjs` → PASS ✅
- `node _dev/tests/verify_full_element_coverage.mjs` → PASS ✅ (`44/44`)

### Artifact Sync (Session 6)

- `_dev/artifacts/user_scenario_capture.json` regenerated (`2026-04-20T06:41:19.634Z`)
- `_dev/artifacts/user_scenario_extracted.json` regenerated (`2026-04-20T06:41:19.634Z`)
- `_dev/artifacts/full_element_coverage_report.json` regenerated (`2026-04-20T06:41:40.009Z`)

## SESSION 6 CLOSE — 2026-04-20
**Findings resolved this session:** 2 follow-up regression closures (runway reset parity, float-safe slider handling)
**Findings blocked:** 0 — none
**Findings deferred:** 0 — none
**Overall progress:** All previously reported follow-up items are now implemented and verified in fresh artifacts.

**Key observations this session:**
- Range inputs with fractional min anchors require numeric parsing that preserves decimal alignment; integer parsing is unsafe.
- Deterministic E2E capture requires isolating persisted browser state to avoid hidden restore races.
- Control-state parity checks complement metric-level parity and catch UI control drift earlier.
---
## SESSION 7 - 2026-05-12 - Codex

**Picking up from:** User-reported planning caveats documented in `_dev/Prompt/`
**Open findings at session start:** Ongoing investment contributions missing from base projection; savings-rate metric/current-year OTE parity; liability debt-service workflow unclear to users.
**Session goal:** Implement the low-risk A+B scope and document the deferred debt-service workflow without adding first-class liability payment fields.

### NEW-41 - Ongoing investment contributions missing from base projection (HIGH -> FIXED)

**Status:** FIXED
**Fix applied:** Added `annualContrib` and `contribGrowthRate` fields to investment sub-items. The `wealthProjection` loop now adds pre-retirement planned contributions to the investment balance, so the change cascades into base charts, FI Age, Retirement Health, Monte Carlo starting wealth, milestones, and HTML report charts.
**User caveat surfaced:** The model does not cap contributions to calculated surplus. Users should enter an affordable planned contribution. Surplus Deployment remains useful for testing additional surplus strategies beyond explicit investment-item contributions.
**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`, `_dev/docs/core/ARCHITECTURE.md`, `README.md`

### NEW-42 - Savings-rate metric ignored current-year planned expenses (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Renamed the metric to current-year savings rate and changed `annualSavings` to subtract planned expenses active in the current calendar year. HTML report calculations and notes were updated for parity.
**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`

### NEW-43 - Liability balances could be mistaken for debt-service cashflow (MEDIUM -> DOCUMENTED / DEFERRED)

**Status:** DOCUMENTED / DEFERRED
**Decision:** Do not add first-class liability payment fields in this pass. Keep the current architecture where liabilities are balance-sheet items and expense categories carry cashflow.
**Documented workflow:** For all liability types, keep the liability entry for net worth and enter the full scheduled debt-service payment as an expense category with phase-out year matching payoff year. For amortising loans, enter full principal + interest because both reduce investable cashflow. Avoid double-counting if already included in another expense category.
**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`, `_dev/docs/audits/AUDIT_REPORT_2026-05-12.md`

---

## SESSION 8 - 2026-05-12 - Codex

**Picking up from:** `_dev/Prompt/session7-post-implementation-audit.md`
**Open findings at session start:** Post-implementation disclosure and layout gaps around investment contributions, Save More, Surplus Deployment, and savings-rate wording.
**Session goal:** Implement the validated UX/documentation issues without changing the financial model calculations.

### NEW-44 - Save More surplus-offset hint used gross surplus after investment contributions were added (HIGH -> FIXED)

**Status:** FIXED
**Fix applied:** Added `annualInvestmentContribution` and `annualUndeployedSurplus` to the app-level derived metrics. The Save More card now explains that the displayed monthly amount is additional to entered investment-item contributions and only shows the offset hint when undeployed surplus is positive.
**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`

### NEW-45 - Surplus Deployment copy described standalone scenarios as additive to the base projection (HIGH -> FIXED)

**Status:** FIXED
**Fix applied:** Reframed Surplus Deployment as standalone scenarios. The explainer now distinguishes base projection contributions from the full dynamic surplus alternative, and Tile 1 explains why full-surplus deployment is normally an upper-bound scenario but can vary by year.
**Files changed:** `src/App.jsx`

### NEW-46 - Investment contribution entry layout was visually unclear (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Reworked investment sub-item rows into labelled fields for Name, Current value, Annual contrib, and Growth, with a lightweight header row and stable grid columns.
**Files changed:** `src/App.jsx`

### NEW-47 - Investment contribution fields lacked local explanatory tooltips (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Added inline tooltips beside Annual contrib and Growth labels to state how they affect the base projection and that affordability is user-entered, not capped by the model.
**Files changed:** `src/App.jsx`

### NEW-48 - Current-year savings-rate tooltip did not disclose contribution treatment (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Updated the tooltip to clarify that annual investment contributions are deployment of savings, not expenses, and that undeployed surplus equals current surplus minus entered annual contributions.
**Files changed:** `src/App.jsx`

### NEW-49 - HTML report Save More methodology note referenced generic surplus offset (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Updated the HTML report methodology note so Save More is documented as additional to entered contributions, offset only by undeployed surplus.
**Files changed:** `src/App.jsx`

### Verification Chain (Session 8)

- `npm run test:release` -> PASS

---

## SESSION 9 - 2026-05-12 - Codex

**Picking up from:** User-reported post-change parity concerns across levers and calculation surfaces.
**Open findings at session start:** Retirement Health levers appeared non-actionable after annual contribution support; collapsed investment header lacked contribution visibility.
**Session goal:** Restore actionable parity of gap-closing levers, add contribution cue in collapsed Investment header, and re-verify cross-surface calculations.

### NEW-50 - Gap-closing levers no longer matched applied-input outcomes after contribution-model update (HIGH -> FIXED)

**Status:** FIXED  
**Problem:** `Save More`, `Retire Later`, and `Higher Return` were still using legacy simplifying formulas that did not align with current base projection behavior once investment-item annual contributions and contribution growth were integrated. Users applying the recommended values could observe over/under-shoot.

**Fix applied:** Replaced lever math in `src/App.jsx` with actionable parity solvers:
- `Save More`: binary-searches extra annual contribution needed to close the gap at planned retirement, then displays monthly equivalent.
- `Retire Later`: finds first later retirement age (up to +30 years) where projected investments meet the updated required nest egg, while continuing existing contribution streams.
- `Higher Return`: binary-searches the return assumption needed to close the gap with current balances and entered contributions unchanged.

Tooltip and methodology text were updated to match the new behavior in app and HTML report notes.

**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`

### NEW-51 - Collapsed Investments header hid contribution activity when lump-sum balance was zero (MEDIUM -> FIXED)

**Status:** FIXED  
**Fix applied:** Added a compact contribution badge in the collapsed Investments header that shows total entered annual contributions (`+X/yr contrib`) whenever contribution total is positive, independent of current lump-sum balance.

**Files changed:** `src/App.jsx`

### Cross-Surface Calculation Review (Session 9)

Reviewed and re-validated the main connected surfaces after lever fixes:
- Retirement Health card + levers
- Surplus Deployment scenarios
- Retirement Runway scenarios and control parity
- Project to a Future Year + What-If
- Key dashboard and Financial Health metrics

**Evidence:**
- `npm run test:release` -> PASS
- `npm run test:audits` -> PASS
- `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)

### Test Harness Updates (Session 9)

- Replaced `_dev/tests/auditor2_gap_levers.js` with parity assertions that verify applying each recommended lever closes the modeled gap.
- Updated `_dev/tests/auditor1_gap_levers.js` to reflect current design intent and defer formula spot checks to the executable Auditor 2 harness.

---

## SESSION 10 - 2026-05-12 - Codex

**Picking up from:** A9 full `codebase-auditor` report and user-requested targeted retirement-boundary review.
**Open findings at session start:** NEW-52 through NEW-56 (all from A9).
**Session goal:** Run AFI continuation protocol for A9, normalize findings into continuity tracking, and produce a sequenced remediation plan for implementation.
**Session end status:** PLAN READY - pending implementation

### Continuation State Summary (A9 intake)

- Prior sessions: 9 (Sessions 1-9)
- Last session date: 2026-05-12
- New actionable findings from A9: 5
  - CRITICAL: NEW-52
  - HIGH: NEW-53, NEW-54
  - MEDIUM: NEW-55
  - LOW: NEW-56
- Blocked findings at session start: None
- Deferred findings carried from prior sessions: NEW-21, NEW-25, NEW-27, NEW-43

### A9 Finding Normalization (AFI mapping)

- FINDING-01 -> NEW-52 (CRITICAL) Export HTML XSS regression
- FINDING-02 -> NEW-53 (HIGH) Retirement boundary one-year offset
- FINDING-03 -> NEW-54 (HIGH) Monte Carlo withdrawal-parity mismatch
- FINDING-04 -> NEW-55 (MEDIUM) Advisory-vs-gating test harness signal quality
- FINDING-05 -> NEW-56 (LOW) Documentation index pointer drift

### Remediation Plan (ordered per AFI severity/dependency rules)

1. NEW-52 (CRITICAL): Patch all unescaped export interpolations and re-run report-export security regression checks.
2. NEW-53 (HIGH): Choose and implement single retirement-boundary convention across deterministic/runway engines and chart timing semantics.
3. NEW-54 (HIGH): Align Monte Carlo withdrawal-onset logic to the same convention chosen in NEW-53; re-verify parity across all projection surfaces.
4. NEW-55 (MEDIUM): Reclassify auditor1 scripts as advisory or convert critical invariants to assertions so "pass" reflects gating intent.
5. NEW-56 (LOW): Update docs/audits index pointers to the current active/full audit lineage after code fixes land.

### Verification Plan for Session 11

- Unit/audit chain: `npm run test:audits`
- Release chain: `npm run test:release`
- Targeted parity checks:
  - Retirement age boundary snapshots around `retirementAge-1`, `retirementAge`, `retirementAge+1`
  - Deterministic vs runway vs Monte Carlo withdrawal-onset parity for the same scenario
  - HTML export rendering sanity with escaped special-character names

## SESSION 10 CLOSE - 2026-05-12

**Findings resolved this session:** 0 - planning-only session  
**Findings blocked:** 0  
**Findings deferred:** 0 (no new deferrals)  
**Overall progress:** 51 fixed / 56 tracked (91.1% fixed, with 5 newly opened from A9)

**Key observations this session:**
- The user-reported one-year offset is confirmed by code-path boundary conditions and push-before-update timeline semantics.
- Current documentation partially acknowledges this convention, but UI copy implies retirement-transition semantics that can be interpreted differently.
- Release pipeline passing does not imply absence of material risks; dedicated audit findings remain authoritative for GO/NO-GO.

**Next session priority:**
1. NEW-52
2. NEW-53
3. NEW-54
4. NEW-55
5. NEW-56

---

## SESSION 11 - 2026-05-12 - Codex

**Picking up from:** Session 10 remediation plan (A9 intake).  
**Open findings at session start:** NEW-52, NEW-53, NEW-54, NEW-55, NEW-56.  
**Session goal:** Fix the two HIGH retirement-model parity/timing findings (NEW-53, NEW-54) using the selected boundary convention (`drawdown starts at age >= retirementAge`), then re-verify release chain.

### NEW-53 - Retirement boundary mismatch causes one-year drawdown offset (HIGH -> FIXED)

**Status:** FIXED  
**Fix applied:** Aligned deterministic drawdown and exhaustion boundary checks to start at retirement age:
- `wealthProjection` drawdown gate changed from `age > retirementAge` to `age >= retirementAge`.
- Drawdown exhaustion tracking gate changed to `age >= retirementAge`.
- Retirement Runway `simulateRunway` drawdown gate changed to `age >= retirementAge`.
- User-facing/model documentation synced to this convention in app notes/tooltips and `_dev/docs/core/FINANCIAL_MODEL.md`.

**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`

### NEW-54 - Monte Carlo withdrawal onset out of parity with deterministic/runway (HIGH -> FIXED)

**Status:** FIXED  
**Fix applied:** Kept Monte Carlo withdrawal onset at simulation year 0 (retirement-age transition year), and aligned deterministic/runway to the same convention via NEW-53. Added explicit parity commentary in the MC loop and updated projection audit harness to assert the new onset rule.

**Files changed:** `src/App.jsx`, `_dev/tests/auditor2_projection.js`, `_dev/tests/auditor1_projection_test.js`

### Verification Chain (Session 11)

- `npm run test:release` -> PASS
  - `npm run lint` -> PASS
  - `npm run test:audits` -> PASS
  - `npm run test:smoke` -> PASS (12 Playwright tests)

## SESSION 11 CLOSE - 2026-05-12

**Findings resolved this session:** 2 - NEW-53, NEW-54  
**Findings blocked:** 0  
**Findings deferred:** 0  
**Overall progress:** 53 fixed / 56 tracked (94.6% fixed)

**Key observations this session:**
- The retirement boundary convention is now explicit and consistent: salary stops at retirement age, retirement expenses apply at retirement age, and drawdown starts at retirement age.
- Monte Carlo and deterministic/runway engines now share the same withdrawal-onset contract.
- The remaining CRITICAL issue is NEW-52 (export-path XSS regression), followed by process/doc gaps NEW-55 and NEW-56.

**Next session priority:**
1. NEW-52
2. NEW-55
3. NEW-56

---

## SESSION 12 - 2026-05-12 - Codex

**Picking up from:** Session 11 close and user-requested Sonnet feedback reconciliation.  
**Open findings at session start:** NEW-52, NEW-55, NEW-56.  
**Session goal:** Implement all remaining deferred A9 findings and the identified documentation inconsistency from Sonnet review.

### NEW-52 - Export HTML report interpolates user strings without escape (CRITICAL -> FIXED)

**Status:** FIXED  
**Fix applied:** Patched all confirmed unescaped user-string interpolations in report export:
- Escaped liability names in Balance Sheet liability table for mortgage/loan/other rows.
- Escaped dependent names in Planning Assumptions section.
- Used existing `escapeHtml(...)` utility already applied elsewhere in the report template.

**Files changed:** `src/App.jsx`

### NEW-55 - Audit harness mixes advisory scripts into pass/fail gating (MEDIUM -> FIXED)

**Status:** FIXED  
**Fix applied:** Reclassified all `auditor1_*` scripts in `_dev/tests/run_all_audits.js` as **advisory (non-gating)** and updated suite summary messaging:
- Gating pass/fail now reflects assertion-backed tests only.
- Advisory script execution remains visible and explicitly labeled as non-gating.
- Removed the ambiguous `ALL AUDIT TESTS PASSED` framing in favor of separate gating/advisory summaries.

**Files changed:** `_dev/tests/run_all_audits.js`

### NEW-56 - Docs index current-ground-truth pointers stale vs registry (LOW -> FIXED)

**Status:** FIXED  
**Fix applied:** Updated documentation index pointers to latest active full audit lineage:
- `_dev/docs/README.md` current ground-truth report pointer updated.
- `_dev/docs/audits/README.md` current audit report pointer updated.

**Files changed:** `_dev/docs/README.md`, `_dev/docs/audits/README.md`

### Documentation Consistency Follow-Up (from Sonnet review)

- Updated the stale drawdown-convention row in `_dev/docs/core/FINANCIAL_MODEL.md` Section 6 from `age >` to `age >= retirementAge` so it matches current code and formula sections.

### Verification Chain (Session 12)

- `npm run test:release` -> PASS
  - `npm run lint` -> PASS
  - `npm run test:audits` -> PASS
  - `npm run test:smoke` -> PASS (12 Playwright tests)

## SESSION 12 CLOSE - 2026-05-12

**Findings resolved this session:** 3 - NEW-52, NEW-55, NEW-56  
**Findings blocked:** 0  
**Findings deferred:** 0 (no new deferrals)  
**Overall progress:** A9 open backlog fully closed.

**Key observations this session:**
- Export report XSS exposure is closed at all confirmed liability/dependent interpolation points.
- Audit suite pass/fail signal now cleanly distinguishes gating tests from advisory diagnostics.
- Financial model documentation is now internally consistent on retirement drawdown timing.

**Next session priority:**
1. Validate and close any remaining non-A9 deferred findings if desired (e.g., NEW-21, NEW-25, NEW-27, NEW-43).

---

## SESSION 13 - 2026-05-16 - Codex

**Picking up from:** Session 12 close, commit `1fa1eaa`, Sonnet May 15 implementation report, and user latest-feedback snapshots.
**Open findings at session start:** NEW-57 through NEW-65, plus prior intentionally deferred findings NEW-21, NEW-25, NEW-27, NEW-43.
**Session goal:** Audit Sonnet's uncommitted May 15 implementation against the financial model/design intent, implement the latest user feedback and any additive parity fixes, then re-run release verification.

### NEW-57 - Runway neutral slider state had colored optimism bias and coarse return increments (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Return-offset sliders now support 0.5 percentage-point increments. Neutral runway slider state uses neutral styling; color accents are applied only once the user moves a slider away from neutral.
**Files changed:** `src/App.jsx`, `_dev/e2e/user-scenario-capture.spec.js`, `_dev/tests/verify_full_element_coverage.mjs`

### NEW-58 - Investment contribution start-year editor was cramped and allowed post-retirement starts (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Reworked the investment annual-contribution/start-year controls so the year label and input are visually consistent with the amount field. Start-year inputs are capped to the final pre-retirement year.
**Files changed:** `src/App.jsx`, `_dev/docs/core/ARCHITECTURE.md`, `_dev/docs/core/FINANCIAL_MODEL.md`, `README.md`

### NEW-59 - Collapsed investment contribution badges crowded growth controls (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Made the collapsed Investments header wrap badges independently from the right-side growth controls and compacted contribution badge copy.
**Files changed:** `src/App.jsx`

### NEW-60 - Projected asset allocation tooltip showed stale/zero investment subitems and estimate wording (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Projected allocation tooltips now compute item-level projected balances for Investments using current balances, active/future contributions, contribution growth, and category reconciliation. Non-investment category subitems project by their configured category growth rate. Tooltip wording now distinguishes projected breakdowns from current actual breakdowns.
**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`

### NEW-61 - Financial health current-year metric labels wrapped and lacked explicit year context (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Scorecard and export report labels now include the current calendar year for current-snapshot metrics, including savings rate. Compact label styling prevents the savings-rate label from wrapping.
**Files changed:** `src/App.jsx`

### NEW-62 - Chart target-year controls lacked grouped visual framing (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Added a consistent framed backdrop around year controls for the asset allocation, cashflow, pre-retirement, and project-to-year chart controls.
**Files changed:** `src/App.jsx`

### NEW-63 - New May 15 state was not fully persisted/imported/exported (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** JSON export now writes `runwaySchemaVersion: 2` so fresh exports retain the neutral runway schema after import. `assetAllocTargetYear` now participates in autosave, export, import, and reset state.
**Files changed:** `src/App.jsx`

### NEW-64 - Verification harness drifted from runway/contribution semantics (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Updated scenario capture selectors for the new runway range controls. Updated full-element coverage math for retirement-year drawdown parity, staged investment contributions, and neutral runway offset expectations. Regenerated user-capture and full-element coverage artifacts.
**Files changed:** `_dev/e2e/user-scenario-capture.spec.js`, `_dev/tests/verify_full_element_coverage.mjs`, `_dev/artifacts/user_scenario_capture.json`, `_dev/artifacts/user_scenario_extracted.json`, `_dev/artifacts/full_element_coverage_report.json`

### NEW-65 - Save More undeployed surplus treated future-starting contributions as current commitments (HIGH -> FIXED)

**Status:** FIXED
**Fix applied:** Current-year undeployed surplus now subtracts only active current-year investment contributions, not future-starting planned contributions. Updated current-year savings tooltip, HTML report methodology, and financial-model docs to preserve the distinction between configured future commitments and current-year active deployment.
**Files changed:** `src/App.jsx`, `_dev/docs/core/FINANCIAL_MODEL.md`

### Verification Chain (Session 13)

- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run test:audits` -> PASS
- `npx playwright test _dev/e2e/user-scenario-capture.spec.js --reporter=list` -> PASS
- `node _dev/tests/extract_user_capture_metrics.mjs` + `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)
- `npm run test:release` -> PASS
  - `npm run lint` -> PASS
  - `npm run test:audits` -> PASS
  - `npm run build` -> PASS
  - `npm run test:smoke` -> PASS (12 Playwright tests)

## SESSION 13 CLOSE - 2026-05-16

**Findings resolved this session:** 9 - NEW-57, NEW-58, NEW-59, NEW-60, NEW-61, NEW-62, NEW-63, NEW-64, NEW-65
**Findings blocked:** 0
**Findings deferred:** 0 new deferrals; prior intentional deferrals remain unchanged (NEW-21, NEW-25, NEW-27, NEW-43).
**Overall progress:** May 15 follow-up backlog closed; release verification passed.

**Key observations this session:**
- Future-dated contribution inputs must not be treated as current-year cash commitments in savings-rate or Save More surplus math.
- Projected tooltips need to share the same contribution/growth semantics as the projection engine, or they become misleading even when top-level totals are correct.
- Any user-visible state added to chart controls must be wired through autosave, export, import, and reset in the same change.

**Next session priority:**
1. Address prior intentional deferrals if product requirements change (NEW-21, NEW-25, NEW-27, NEW-43).

---

## SESSION 14 - 2026-05-16 - Codex

**Picking up from:** User clarification on whether Save More should be dynamic full-surplus deployment.
**Open findings at session start:** NEW-66.
**Session goal:** Clarify the intended distinction between the flat Save More gap-closing lever and standalone Surplus Deployment scenarios, then verify the solver logic follows staged contribution semantics.

### NEW-66 - Gap-closing lever solver ignored investment contribution start years (HIGH -> FIXED)

**Status:** FIXED
**Problem:** The base projection respected `contribStartYear` for investment-item contributions, but the Retirement Health gap-closing solver treated every entered contribution as active from the current year. This could understate the Save More amount, Retire Later years, or Higher Return required when a planned contribution starts in the future.

**Fix applied:**
- Updated the gap-closing lever solver to include each investment contribution only from its configured start year.
- Contribution growth now compounds from the configured start year in the lever solver, matching the base projection.
- Updated the gap-lever test fixture to include a future-starting contribution and assert parity under staged contribution semantics.
- Clarified app/report/docs copy:
  - Save More is a flat additional contribution lever, not the dynamic full-surplus scenario.
  - Surplus Deployment is the dynamic year-by-year full-surplus/split scenario and is not layered on top of fixed entered contributions.

**Files changed:** `src/App.jsx`, `_dev/tests/auditor2_gap_levers.js`, `_dev/docs/core/FINANCIAL_MODEL.md`

### Verification Chain (Session 14)

- `npm run lint` -> PASS
- `npm run test:audits` -> PASS
- `npm run test:release` -> PASS
  - `npm run lint` -> PASS
  - `npm run test:audits` -> PASS
  - `npm run build` -> PASS
  - `npm run test:smoke` -> PASS (12 Playwright tests)
- `node _dev/tests/extract_user_capture_metrics.mjs` + `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)

## SESSION 14 CLOSE - 2026-05-16

**Findings resolved this session:** 1 - NEW-66
**Findings blocked:** 0
**Findings deferred:** 0 new deferrals; prior intentional deferrals remain unchanged (NEW-21, NEW-25, NEW-27, NEW-43).
**Overall progress:** Post-`1fa1eaa` staged-contribution lever parity gap closed; release verification passed.

---

## SESSION 15 - 2026-05-16 - Codex

**Picking up from:** User follow-up screenshots in `_dev/tmp_user` and Retirement Health messaging clarification request.
**Open findings at session start:** NEW-67 through NEW-70.
**Session goal:** Confirm Retirement Health message consistency and implement the remaining compact UI refinements without changing financial calculations.

### NEW-67 - Retirement Health copy could still blur conservative SWR target vs Monte Carlo survival odds (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Tightened Retirement Health verdict and tooltip copy so users can distinguish:
- Q1 funding gap = projected investments vs conservative SWR Required Nest Egg target.
- Q2 survival odds = Monte Carlo scenarios using year-by-year withdrawals, phase-outs, passive/other income offsets, and volatility.
- Save More = flat extra contribution lever; Surplus Deployment = separate dynamic surplus scenario.

**Files changed:** `src/App.jsx`

### NEW-68 - Collapsed Investments badges could wrap under the header row (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Compacted the staged-contribution and over-savings badges, kept the header badge group on one row, and preserved the right-side growth/items controls without overlap.

**Files changed:** `src/App.jsx`

### NEW-69 - Runway slider visuals had inconsistent neutral track/fill behavior and asymmetric return bounds (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Added custom range-track styling for Retirement Runway sliders:
- Neutral sliders now share the same inactive track appearance.
- Pessimistic return fill is anchored from `0pp` back to the selected negative offset.
- Pessimistic and optimistic return offsets now both use symmetric 8pp bounds.

**Files changed:** `src/App.jsx`, `src/index.css`

### NEW-70 - Chart year selectors lacked quick milestone-year switching (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Replaced one-off target-year controls with a shared compact selector showing:
- mode label (`through`, `as of`, or `at`),
- editable year,
- derived age,
- quick chips for valid significant years (`Today`, `Ret`, `Life` where in range).

Applied to Asset Allocation, Cash Flow, Pre-retirement Expenses, and Project to a Future Year.

**Files changed:** `src/App.jsx`

### Verification Chain (Session 15)

- `npm run lint` -> PASS
- `npx playwright test _dev/e2e/user-scenario-capture.spec.js --reporter=list` -> PASS
- `npm run test:release` -> PASS
  - `npm run lint` -> PASS
  - `npm run test:audits` -> PASS
  - `npm run build` -> PASS
  - `npm run test:smoke` -> PASS (12 Playwright tests)
- `node _dev/tests/extract_user_capture_metrics.mjs` + `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)

## SESSION 15 CLOSE - 2026-05-16

**Findings resolved this session:** 4 - NEW-67, NEW-68, NEW-69, NEW-70
**Findings blocked:** 0
**Findings deferred:** 0 new deferrals; prior intentional deferrals remain unchanged (NEW-21, NEW-25, NEW-27, NEW-43).
**Overall progress:** Follow-up UI/messaging backlog closed; release verification passed.

---

## SESSION 16 - 2026-05-16 - Codex

**Picking up from:** User follow-up on GPT 5.5 scenario/messaging validation, chart year controls, runway slider regression screenshots, and investment contribution affordability warnings.
**Open findings at session start:** NEW-71 through NEW-74.
**Session goal:** Preserve the corrected Retirement Health semantics, extend chart horizon controls to the remaining chart surfaces, restore runway slider UI behavior, and make investment contribution affordability warnings future-aware.

### NEW-71 - Chart year selectors were not applied to Net Worth, Assets Over Time, or Retirement Runway (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Added the shared `ChartYearSelector` to Net Worth Over Time, Assets Over Time, and Retirement Runway. Each chart now filters through the selected year, exposes milestone quick chips where valid, and hides out-of-range reference markers. Added autosave, export, import, and reset wiring for the new chart target-year state.
**Verification:** `npm run lint`; `npm run test:release`; regenerated user-capture and full-element coverage artifacts.
**Verification result:** PASS
**Files changed:** `src/App.jsx`, `_dev/artifacts/user_scenario_capture.json`, `_dev/artifacts/user_scenario_extracted.json`, `_dev/artifacts/full_element_coverage_report.json`

### NEW-72 - Custom runway range styling regressed thumb alignment and live fill behavior (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Removed the custom `.nwn-range` CSS and `rangeTrackBackground` helper. Restored native range dimensions and live browser fill behavior. Preserved the pessimistic return mental model by storing the UI control as a positive magnitude slider with `direction: rtl`, while the application state remains the semantic negative offset.
**Verification:** User-scenario capture asserts perturbed pessimistic return as `-5.5pp`; full-element coverage confirms reset/perturbed runway control parity.
**Verification result:** PASS
**Files changed:** `src/App.jsx`, `src/index.css`, `_dev/e2e/user-scenario-capture.spec.js`, `_dev/tests/verify_full_element_coverage.mjs`

### NEW-73 - Investment over-savings warning only checked the contribution start year (MEDIUM -> FIXED)

**Status:** FIXED
**Fix applied:** Replaced the start-year-only contribution check with a pre-retirement year scan. The Investments header now reports the first future year where aggregate planned investment contributions exceed projected savings surplus, including salary growth, expense inflation, planned expenses/OTEs, contribution start years, and contribution growth. Updated app/report/docs copy to explain that contributions are informationally warned but not capped.
**Verification:** Added a Playwright regression scenario where a future one-time expense causes the first contribution affordability breach after the contribution start year.
**Verification result:** PASS
**Files changed:** `src/App.jsx`, `_dev/e2e/regression-and-scenarios.spec.js`, `_dev/docs/core/FINANCIAL_MODEL.md`, `README.md`

### NEW-74 - Dynamic contribution warning lacked regression coverage (LOW -> FIXED)

**Status:** FIXED
**Fix applied:** Extended the regression scenario builder to accept custom investment items and added a targeted test for the new future warning badge year. Updated runway capture/coverage helpers to translate the RTL pessimistic slider's positive DOM value back into the semantic negative offset.
**Verification:** `npx playwright test _dev/e2e/regression-and-scenarios.spec.js -g "investment warning flags" --reporter=list` -> PASS.
**Verification result:** PASS
**Files changed:** `_dev/e2e/regression-and-scenarios.spec.js`, `_dev/e2e/user-scenario-capture.spec.js`, `_dev/tests/verify_full_element_coverage.mjs`

### Verification Chain (Session 16)

- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npx playwright test _dev/e2e/user-scenario-capture.spec.js --reporter=list` -> PASS
- `node _dev/tests/extract_user_capture_metrics.mjs` + `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)
- `npx playwright test _dev/e2e/regression-and-scenarios.spec.js -g "investment warning flags" --reporter=list` -> PASS
- `npm run test:release` -> PASS
  - `npm run lint` -> PASS
  - `npm run test:audits` -> PASS
  - `npm run build` -> PASS
  - `npm run test:smoke` -> PASS (13 Playwright tests)
- Final artifact refresh: `node _dev/tests/extract_user_capture_metrics.mjs` + `node _dev/tests/verify_full_element_coverage.mjs` -> PASS (`44/44`)

## SESSION 16 CLOSE - 2026-05-16

**Findings resolved this session:** 4 - NEW-71, NEW-72, NEW-73, NEW-74
**Findings blocked:** 0
**Findings deferred:** 0 new deferrals; prior intentional deferrals remain unchanged (NEW-21, NEW-25, NEW-27, NEW-43).
**Overall progress:** Follow-up UI/control regression and dynamic investment-affordability warning backlog closed; release verification passed.

**Key observations this session:**
- Custom range styling can regress native browser range alignment and live fill behavior; use native controls unless the visual requirement cannot be represented semantically.
- Chart filter controls are user-visible state and must be persisted/imported/exported/reset with the same discipline as financial inputs.
- Contribution affordability should be checked across the projected pre-retirement timeline, not only at the contribution start year, because future OTEs and expense growth can change surplus capacity.

**Next session priority:**
1. Address prior intentional deferrals only if product requirements change (NEW-21, NEW-25, NEW-27, NEW-43).
