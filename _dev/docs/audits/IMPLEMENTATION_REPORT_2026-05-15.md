# Implementation Report — Net Worth Navigator
**Session 13 · 2026-05-15**
**Scope:** Independent assessment of GPT 5.5 recommendations + five rounds of implementation and QA

---

## Inputs Received

| Input | Purpose |
|---|---|
| `networth-navigator-master.zip` | Full codebase (8,301-line `src/App.jsx`) |
| `net-worth-navigator-2026-05-13.json` | User scenario: Age 37, retirement 62, AED 620K salary, IBKR AED 170K contrib |
| `NWN-Report-2026-05-13.html` | Exported report for the above scenario |
| `Assessment_Results_and_Messaging_Recommendation.md` | GPT 5.5 report on scenario correctness + messaging |
| `Feature_requests_and_Recomenndations.md` | GPT 5.5 recommendations on four user feature requests |
| `Agent_Coding_Principles.md` | Coding constraints: surgical changes, simplicity, goal-driven |
| QA screenshots (11 images across two QA rounds) | User-reported issues after 1st and 2nd delivery |

---

## Cascade / Regression Check

Before finalising, every changed area was checked for upstream/downstream effects:

| Area | Check | Result |
|---|---|---|
| JSON export | `assets` is serialised wholesale — `contribStartYear` included automatically | ✓ |
| JSON import | `runwaySchemaVersion` guard added; `assets.investmentItems` load as-is | ✓ |
| HTML report export | Uses `annualInvestmentContribution` scalar, not `investmentItems` iteration — no breakage | ✓ |
| Reset button | Uses `DEFAULT_STATE` which includes `contribStartYear: null`; runway uses `RUNWAY_DEFAULT_*` constants | ✓ |
| Delete fallback | Updated to include `contribStartYear: null` in single-item reset object | ✓ |
| Add Investment button | Default object includes `contribStartYear: null` | ✓ |
| `wealthProjection` memo order | `overSavingsItems` and its dependents placed after `wealthProjection` to avoid forward-reference crash | ✓ |
| `annualInvestmentContribution` | Reverted to sum all items (badge is informational); surplus warnings use `overSavingsItems` | ✓ |
| Runway slider range | `pessMin = -Math.floor(investmentReturn)` — integer, prevents off-centre thumb at 0 | ✓ |

---

## Finding 1 — MC Report Bullet: Caution Zone Showed as Red

**Type:** Bug · **Pass:** 1st

Single `else` branch emitted `{type:'bad'}` (red) for all `successProb < 80`. Split into two branches using `MC_CAUTION_THRESHOLD`:
- 60–79%: `{type:'warn'}` with caution-zone language
- <60%: `{type:'bad'}` with high-risk language

---

## Finding 2 — MC KPI Sub-label Ignores Caution Zone (GPT 5.5 Missed)

**Type:** Bug · **Pass:** 1st

KPI tile colored correctly (amber/red) but `kpi-sub` text always said "Only X% succeed." Extended ternary to emit three zone-specific sub-labels.

---

## Finding 3 — Runway Optimistic Slider Pre-Adjusted on Load

**Type:** Bug · **Pass:** 1st

`RUNWAY_DEFAULT_OPTIMISTIC_OFFSET` was 3, `RUNWAY_DEFAULT_OPT_SPEND` was 25. Fixed at 5 locations: constants, auto-restore clamp (`Math.max(1→0)`), import clamp, slider `min` (1→0), slider label (`+1pp→0pp`).

---

## Finding 4 — Pessimistic Slider: -1pp from Old Autosave + Offset Thumb + Red at Zero

**Type:** Bug · **Passes:** 3rd + 4th

### 4a — Autosave migration (3rd pass)
Old localStorage contained `runwayConservativeOffset: -1`. Added `runwaySchemaVersion: 2` to autosave payload. Auto-restore and JSON import now reset all four runway sliders to defaults if schema version is absent.

### 4b — Slider thumb offset at 0 (4th pass QA)
`pessMin = Math.max(-8, -assumptions.investmentReturn)` produced a float (e.g. `-5.5`) when `investmentReturn` is not a whole number. With `step={1}`, a float `min` prevents `max=0` from being exactly reachable, leaving the thumb visually offset.

**Fix:** `pessMin = -Math.min(8, Math.floor(assumptions.investmentReturn))` — always an integer.

### 4c — Red accent/color when offset = 0 (4th pass QA)
Slider accent and value label were unconditionally red. When offset = 0 (no pessimistic adjustment), they should be neutral — matching the optimistic card at `+0pp`.

**Fix:** `isAdjusted = runwayConservativeOffset < 0`. Accent = `#ef4444` when adjusted, `#6b7280` when not. Value label follows same conditional.

### 4d — Arrow display when offset = 0 (4th pass QA)
Rate line showed `5.5% → 5.5%/yr` when offset = 0 — nonsensical. Same fix applied to optimistic card.

**Fix:** Pessimistic shows plain `5.5%/yr` when `offset === 0`; shows `5.5% → 4.5%/yr` when negative.
Optimistic shows plain `5.5%/yr` when `offset === 0`; shows `5.5% → 6.5%/yr` when positive.

---

## Finding 5 — Investment Future Start Year (Feature + Four Correction Passes)

### 5a — Core model (1st pass)
`contribStartYear` field added. Nominal-at-start-year convention: entered amount is the contribution in that year, `contribGrowthRate` compounds from `startYear` forward. GPT 5.5's inflation-proxy rejected.

Formula: `year < startYear → 0; year ≥ startYear → annualContrib × (1 + growthRate)^(year - startYear)`

### 5b — "from year" layout and editability (2nd + 3rd pass QA)
First sub-row below input → caused layout shift. Then moved to label line → overlap with Growth column. Final solution: `from [year]` renders **inline beside the amount input** on the same row, using `ContribStartYearInput` (local display state, commits on blur/Enter, arrow nudge).

### 5c — Column width rebalance (4th pass QA)
With the `from [year]` inline, Annual Contrib column needed more room. Grid adjusted from `minmax(180px,1fr) 130px 150px` to `minmax(155px,1fr) 110px 185px` — Name and Balance narrowed, Annual Contrib widened to accommodate `[amount] from [year]` on one line.

### 5d — Over-savings check anchored to start year (2nd pass)
New `overSavingsItems` useMemo checks each item's contribution against `wealthProjection` savings at that item's own `contribStartYear`. Tooltip: *"IBKR contribution (AED 170K/yr starting 2030) exceeds projected savings in 2030 by AED Y/yr."*

### 5e — Forward-reference crash (3rd pass)
`overSavingsItems` placed before `wealthProjection`. Fixed: moved to after `wealthProjection` at line 3030. Final order: `wealthProjection → clampedAssetAllocTargetYear → assetAllocData → overSavingsItems → investmentContributionExceedsCurrentSavings → investmentContributionSavingsShortfall`.

### 5f — Delete fallback missing contribStartYear (4th pass)
Single-item reset object on delete: `{ id:1, name:'Investment', amount:0, annualContrib:0, contribGrowthRate:0 }` — missing `contribStartYear: null`. Fixed.

### 5g — Tooltips, label rename, growth tooltip (1st–3rd passes)
- "Current value" → "Balance" (column header + row sub-label)
- Header tooltip clarified: Balance = today's current value; `from` year only governs when contributions begin
- Annual contrib tooltip: nominal in start year; growth from start year forward
- Growth tooltip: "compounding from the contribution start year forward"

---

## Finding 6 — Multiple Contribution Pill Misleading for Staged Start Years

**Type:** Feature · **Pass:** 3rd

Three-case smart badge:

| Condition | Badge shows |
|---|---|
| Single item, starts today | `+AED 170K/yr` |
| Single item, future start | `+AED 170K/yr from 2030` |
| Multiple items, same start year | `+AED 310K/yr` (sum is meaningful) |
| Multiple items, different start years | `staged contributions ℹ` with per-item tooltip |

Staged tooltip: *"Investment: +AED 100K/yr from 2026 · New Investment: +AED 210K/yr from 2036"*

**Calculation confirmed:** `yearInvestmentContribution` iterates all items; each is gated independently by its `contribStartYear`. Items are additive — before 2036: 100K/yr; from 2036: 310K/yr. All items end at `profile.retirementAge`. ✓

---

## Finding 7 — Asset Allocation Pie: Year Selector + Projected Tooltip

**Type:** Feature · **Passes:** 1st + 4th

### 7a — Year selector (1st pass)
`assetAllocTargetYear` state, `clampedAssetAllocTargetYear` useMemo, `assetAllocData` useMemo (reads from `wealthProjection`). Pie data, liquid/illiquid bar, and title subtitle all update with selected year.

### 7b — Zero-slice label overlap (3rd pass)
Recharts rendered labels for 0-value slices causing overlap. Fix: `label` returns `null` when `entry.value === 0`.

### 7c — Projected tooltip breakdown (4th pass)
Previously suppressed sub-item breakdown for future years. Now shows **proportional estimates** using each asset type's configured growth rate:
- `projectedValue = todayBalance × (1 + rate/100)^yearsAhead`
- Rates used: Investments → `investmentReturn`; Real Estate → `realEstateAppreciation`; Cash → 0; Other → `otherAssetGrowth`
- Tooltip header shows "Est. Breakdown" and `@X%/yr est.` note to distinguish from exact today values
- Values shown in slightly dimmer colour when projected

**Risk assessment:** Low risk — tooltip-only, no model change, explicit "est." labelling. Cash sub-items always show today's balance (model doesn't track cash changes over time, consistent with existing behaviour).

---

## Finding 8 — Chart Horizon Controls: Four Rounds of Iteration

**Type:** UI · **Passes:** 2nd–4th

### Evolution
1. **Original**: `Chart Through: [large year input] [Retirement btn] Age X` — loose elements, no container
2. **2nd pass**: Pill wrapper `[ Through year Retirement Age X ]` — better grouping, but too large
3. **3rd pass**: Stacked two-line layout — misaligned vertically, `TargetYearInput` hero-sized input clashed with tiny text
4. **4th pass (final)**: Single horizontal line with compact input prop

### Final design
Added `compact` boolean prop to `TargetYearInput`. When `compact=true`: 56px width, `0.82rem` font, neutral grey border/color — matching the ambient text scale of chart headers.

```
through  [2033]  Age 47  ret      ← all one line, compact year input, "ret" only when not at retirement
```

- `ret` / `today` links appear only when **not already** at the target value — zero visual noise at default state
- Age label uses same `0.72rem #4b5563` style as "through" label — one visual weight level
- Applied uniformly to all four controls: Cash Flow, Pre-ret Expenses, Project to Year, Asset Allocation

---

## Summary Table

| # | Finding | Type | Pass | GPT 5.5 | Our Action |
|---|---|---|---|---|---|
| 1 | MC report bullet caution=red | Bug | 1st | Over-engineered | 2-line fix |
| 2 | MC KPI sub-label ignores zone | Bug | 1st | Missed | Fixed |
| 3 | Runway optimistic pre-adjusted | Bug | 1st | Correct | Applied (5 locations) |
| 4a | Pessimistic -1pp from autosave | Bug | 3rd | N/A | `runwaySchemaVersion` migration |
| 4b | Pessimistic slider thumb offset | Bug | 4th | N/A | `Math.floor(investmentReturn)` for `pessMin` |
| 4c | Pessimistic red at offset=0 | Bug | 4th | N/A | Conditional `isAdjusted` for accent/color |
| 4d | Arrow shown at offset=0 | Bug | 4th | N/A | Conditional `→` for both pess and opt cards |
| 5a | Future start year model | Feature | 1st | Wrong inflation | Nominal-at-start-year |
| 5b | from-year layout + editability | Bug (QA) | 2nd–4th | N/A | `ContribStartYearInput`; inline beside amount |
| 5c | Column width rebalance | UI | 4th | N/A | `155/110/185px` grid |
| 5d | Over-savings at wrong year | Bug (QA) | 2nd | N/A | `overSavingsItems` per-item projected check |
| 5e | Forward-reference crash | Regression | 3rd | N/A | Memo reordering |
| 5f | Delete fallback missing field | Bug | 4th | N/A | Added `contribStartYear: null` |
| 5g | Tooltips + label rename | Polish | 1st–3rd | N/A | Balance label, 3 tooltips updated |
| 6 | Staged contrib pill misleading | Feature | 3rd | N/A | 3-case smart badge + staged tooltip |
| 7a | Pie year selector | Feature | 1st | Mostly correct | Applied + projected values |
| 7b | Zero-slice label overlap | Bug | 3rd | N/A | `null` label for zero slices |
| 7c | Projected tooltip breakdown | Feature | 4th | N/A | Proportional growth estimates per sub-item |
| 8 | Chart controls (4 iterations) | UI | 2nd–4th | N/A | `compact` TargetYearInput prop; single-line |

**Final build:** `npm run build` → ✓ 0 errors, 12.98s
**Regressions:** None
**Files changed:** `src/App.jsx` only

---

## Audit Checklist

- [ ] MC 73%: report bullet is amber warn; KPI sub-label reads "73% survive · caution zone"
- [ ] Runway: fresh state (clear localStorage) → all three cards show same values, all sliders at 0
- [ ] Runway pessimistic at 0pp: thumb is at right end of slider; accent is grey not red; rate shows `5.5%/yr` not `5.5% → 5.5%/yr`
- [ ] Runway pessimistic adjusted to -2pp: accent turns red; rate shows `5.5% → 3.5%/yr`
- [ ] Investment "from year": appears inline beside amount input when `annualContrib > 0`; hidden when 0
- [ ] Investment "from year": typing `2030` and pressing Enter commits correctly; arrow keys nudge
- [ ] Staged contributions: two items with different start years → badge reads `staged contributions ℹ` with per-item tooltip
- [ ] Over-savings badge: checks projected savings at item's start year, not current year
- [ ] Delete last investment item → reset fallback includes `contribStartYear: null`
- [ ] JSON export → re-import: `contribStartYear` preserved; runway sliders restore correctly (schema v2)
- [ ] HTML report export: generates without error; investment section references total contribution correctly
- [ ] Reset button: clears to DEFAULT_STATE; runway at 0pp; no `contribStartYear` carried over
- [ ] Pie chart: zero-value slices have no label, no connector
- [ ] Pie tooltip today: shows exact sub-item breakdown
- [ ] Pie tooltip future year: shows "Est. Breakdown @X%/yr est." with proportional estimates in dim colour
- [ ] All four chart controls: single horizontal line `through [year] Age X [ret]`; `ret` hidden when at retirement
- [ ] `TargetYearInput` without `compact`: unchanged hero size (used in Financial Independence section)
