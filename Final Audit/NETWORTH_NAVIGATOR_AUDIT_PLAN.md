# NetWorth Navigator — Pre-Production Audit Plan

**Prepared after:** Full codebase read of `src/App.jsx` (7,642 lines), `README.md`, `package.json`, `vite.config.js`, `index.html`, `sample_csv_import.csv`, and the REF audit framework from SpendAnalyzer.

**Audit objective:** Verify that every calculation, projection, assumption, UI surface, and piece of user-facing text in NetWorth Navigator is correct, internally consistent, and genuinely useful for long-term personal financial planning. Do not assume anything currently in the app is right — challenge every formula and every design decision from first principles.

**App summary:** A single-file React SPA (`App.jsx`) with no backend. All state lives in browser memory. The app takes user inputs (assets, liabilities, income, expenses, assumptions) and produces: a year-by-year wealth projection, Monte Carlo retirement survival odds, a financial health scorecard (7 metrics), gap-closing levers, surplus deployment scenarios, a retirement runway chart, an expense sensitivity analyser, and a self-contained HTML report export.

---

## Severity Key

| Level | Meaning |
|---|---|
| **Critical** | Silent wrong result, or a formula that will produce materially incorrect output for the user's financial planning |
| **High** | Behaviorally incorrect in plausible scenarios; user sees wrong output or misleading guidance |
| **Medium** | Fragile or inconsistent; breaks under edge cases or produces confusing UX |
| **Low** | Code quality, dead code, minor UX improvement, or cosmetic text fix |

---

## Execution Order

The phases below are ordered for maximum efficiency — read everything first, then verify calculations in isolation, then verify them as a coherent system, then stress-test, then UX, then dead code.

```
Phase 0  — Full codebase read and mental model (already done for planning)
Phase 1  — Calculation verification (every formula in isolation)
Phase 2  — Projection engine audit (wealthProjection loop end-to-end)
Phase 3  — Monte Carlo engine audit
Phase 4  — Financial health scorecard audit (all 7 metrics in isolation)
Phase 5  — Gap-closing levers and surplus deployment audit
Phase 6  — Input/output integrity audit (import, export, CSV, reset)
Phase 7  — Edge cases and stress testing
Phase 8  — UX and user-facing text audit
Phase 9  — Metric system coherence audit (are the calculations collectively complete, consistent, and genuinely useful?)
Phase 10 — First-principles efficacy and industry benchmarking
Phase 11 — Dead code, consistency, and universality sweep
FINAL    — Compile findings report
```

> **On the two-layer verification philosophy:** Every calculation in this app must pass TWO independent checks. The first is correctness in isolation — does the formula compute what it claims? The second is coherence as a system — do all the metrics together, when a user reads them side by side, give a complete and non-contradictory picture of their financial situation? A metric that is mathematically correct but redundant, misleading in context, or missing the most important thing a user needs to know is still a finding. Phase 1–5 address the first check. Phase 9–10 address the second. Both are mandatory.

---

## Phase 0 — Pre-Audit Reading (Complete Before Any Testing)

### 0.1 Read the full codebase in order

- [ ] `README.md` — understand every documented claim, methodology, default, and limitation
- [ ] `package.json` — note dependencies (React 18, Recharts, Vite); check for outdated or vulnerable packages
- [ ] `vite.config.js` — build configuration
- [ ] `index.html` — entry point; check font loading, meta tags
- [ ] `src/main.jsx` — React entry; check StrictMode usage
- [ ] `src/App.jsx` — full 7,642 lines; read every `useMemo`, every calculation function, every constant
- [ ] `src/index.css` — global styles
- [ ] `sample_csv_import.csv` — understand the expected CSV format and what the importer consumes

### 0.2 Build a complete mental inventory

While reading, produce a running list of:
- Every calculation (formula, inputs, output)
- Every hardcoded constant or threshold
- Every assumption the app makes silently
- Every place where a formula appears in more than one location (duplication risk)
- Every place where state could be stale or out of sync
- Any dead code, unused state, or orphaned variables

### 0.3 Cross-reference README claims against actual code

The README makes specific claims about methodology and defaults. Verify each one:

- [ ] "1,000 Monte Carlo simulations with Box-Muller transform" — verify simulation count and Box-Muller implementation
- [ ] "Success = portfolio balance > 0 at life expectancy" — verify success condition in `runMonteCarloSimulation`
- [ ] "SWR-based FI Age: earliest age when investments ≥ Required Nest Egg" — verify `fiAge` useMemo
- [ ] "Real estate and other assets excluded from SWR drawdown" — verify Investments-only drawdown
- [ ] "Linear amortization of liabilities to end year" — verify `amortizeLiability` function
- [ ] "Salary stops at retirement age" — verify in `wealthProjection` loop
- [ ] "Passive/other income continues through retirement and nets against drawdown" — verify drawdown calc
- [ ] "Default 25-year mortgage term, 5-year loan term" — verify fallback constants
- [ ] "All monetary values stored in AED internally" — verify throughout

---

## Phase 1 — Calculation Verification (Every Formula in Isolation)

This is the most critical phase. Every calculation must be traced from inputs through to outputs and verified by hand with known test data. Do not trust any formula until you have independently verified it.

### 1.1 Net Worth

**Formula claimed:** `Total Assets − Total Liabilities`

- [ ] Verify `currentNetWorth` useMemo: `assets.cash + assets.investments + assets.realEstate + assets.other − liabilities.mortgage − liabilities.loans − liabilities.other`
- [ ] **Critical check — sub-item sync:** The app stores both a top-level rollup (e.g. `assets.investments`) AND sub-items (e.g. `investmentItems[]`). `annualIncome` re-sums from sub-items when present. `currentNetWorth` uses the top-level rollup. Verify: are the top-level rollups always in sync with sub-items? What happens if a user adds a sub-item and the rollup doesn't update? Is `syncCategoryTotal` always called?
- [ ] **Test:** Add two cash sub-items totaling 80,000. Verify `assets.cash` rollup = 80,000 and `currentNetWorth` uses 80,000.
- [ ] **Test:** Remove a sub-item. Verify the rollup decreases correctly.
- [ ] Verify `currentNetWorth` and the HTML export's net worth calculation use the same formula — the export re-computes `netWorth` inline; check for any divergence.

### 1.2 Annual Income

**Formula claimed:** Sum of salary + passive + other income sub-items (or top-level if no sub-items)

- [ ] Verify `annualIncome` useMemo: conditional logic preferring sub-item sum over `income.salary` when sub-items exist
- [ ] **Consistency check:** The NW Multiple scorecard uses `income.salary || 0` (line ~3418) — the raw top-level field, NOT the sub-item sum — as the denominator. `annualIncome` uses the sub-item sum. This means if a user has salary sub-items, NW Multiple and Savings Rate use different salary figures. **Is this intentional?** Document clearly; if not intentional, flag as a bug.
- [ ] **Test:** Set `income.salary = 300,000` with one sub-item of 300,000. Verify NW Multiple denominator = 300,000. Now add a second sub-item of 100,000 and update the rollup to 400,000. Verify whether `annualIncome` is 400,000 but NW Multiple denominator remains 300,000 (the old rollup value).
- [ ] Verify the HTML report's `totalSalary` calculation (line ~823) matches `annualIncome` for salary component.

### 1.3 Annual Savings and Savings Rate

**Formula claimed:** `annualSavings = max(0, annualIncome − expenses.current)` and `savingsRate = annualSavings / annualIncome × 100`

- [ ] Verify `annualSavings` useMemo: check that `expenses.current` is always in sync with `expenseCalculator` totals. `expenses.current` is a separate state field; it may diverge from `sum(expenseCalculator)` if categories are added/removed without updating it.
- [ ] **Critical check:** `expenses.current` is initialized from `buildDefaultExpenseState` but is there a mechanism to keep it live-synced? Search for all `setExpenses` calls — does every category change trigger a re-sync?
- [ ] **Test:** Start with default state. Add a new expense category of 50,000. Verify `expenses.current` increases by 50,000 and `savingsRate` decreases accordingly.
- [ ] Verify the savings rate formula uses gross income as the denominator. The tooltip says "% of gross income" — confirm the formula is `surplus / income × 100`, not `surplus / (income − expenses) × 100`.
- [ ] Note: `annualSavings = max(0, ...)` means negative savings are floored to zero. The savings rate can therefore never go below 0%, even when expenses exceed income. The scorecard shows the rate correctly as negative only if calculated differently elsewhere. **Verify whether the scorecard shows negative savings rate when overspending.**

### 1.4 Expense Projection — `getProjectedExpenses`

**Formula claimed:** Each category's base amount × (1 + rate/100)^yearsAhead, summing all non-phased-out categories.

- [ ] Verify every parameter: `lifestyleInflation` (added to discretionary rates only), `rateOverrideDelta` (added to ALL rates), `excludeOTEs` flag
- [ ] **Test:** Category with base 50,000, rate 3%, 10 years ahead. Expected: 50,000 × 1.03^10 = 67,196. Verify.
- [ ] **Test:** Same category marked discretionary with lifestyleInflation=2. Expected rate = 5%. Expected: 50,000 × 1.05^10 = 81,445. Verify.
- [ ] **Test:** Phase-out year set to current year + 5. At year 6, category should contribute 0. Verify.
- [ ] **Test:** `rateOverrideDelta = -3` on a category with rate 2%. Effective rate = max(0, -1) = 0 (floored). Verify the floor is applied.
- [ ] **OTE inflation in `getProjectedExpenses`:** OTEs inflate at the category's pre-ret growth rate from `currentYear`. Verify: an OTE of 80,000 in category 'autoFixed' (rate 2%) entered for year+1 should be 80,000 × 1.02^1 = 81,600 when counted in year+1. Verify.
- [ ] Verify OTE amounts are added on top of regular category spending — they're not supposed to replace the category total. Confirm in the chart data builder as well.

### 1.5 Retirement Nominal Expense — `getRetNominalForYear`

This function is the single source of truth for retirement spending across the entire app. Every error here propagates to: Required Nest Egg, FI Age, Monte Carlo withdrawals, Runway chart, Income Replacement Ratio, and the Notes to Financial Statements in the HTML report. **Audit with extreme care.**

**Formula claimed:** For each category: `base × (1 + rate)^(yearsToRetirement + yearsIntoRetirement)`, summed across non-phased-out categories.

- [ ] **Verify the exponent:** The total growth period is `yearsToRetirement + yearsIntoRetirement`. At the retirement year itself (yearsIntoRet = 0), the exponent equals `yearsToRetirement`. Confirm this matches the README's claim that expense amounts are "entered in today's terms and inflated forward."
- [ ] **Test (Year of retirement):** Base retirement expense 500,000/yr today. Rate 3%. Retire in 20 years. Expected nominal at retirement: 500,000 × 1.03^20 = 903,056. Verify `getRetNominalForYear(currentYear + 20)` returns this.
- [ ] **Test (5 years into retirement):** Same scenario, 5 years after retirement. Expected: 500,000 × 1.03^25 = 1,046,800. Verify `getRetNominalForYear(currentYear + 25)` returns this.
- [ ] **Test (phase-out):** School category phase-out year = retirementCalYear + 3. Verify it contributes to `getRetNominalForYear` in years 0, 1, 2 of retirement but NOT year 3+.
- [ ] **Verify consistency:** The `fiAge` useMemo uses a DIFFERENT formula for pre-retirement years — it inflates retirement budget amounts by `yearsAhead` (not `yearsToRetirement + yearsIntoRet`). This means for a year BEFORE retirement, the FI Age threshold is the nest egg needed if you retired at THAT age (inflated only to that year), not the threshold at your planned retirement age inflated further. **Is this the correct financial planning interpretation?** Evaluate carefully.
- [ ] **Critical:** `getRetNominalForYear` returns 0 when called with a year before retirement (`yearsIntoRet < 0`). This is used as a guard. Verify no surface accidentally calls it with a pre-retirement year and silently gets 0.

### 1.6 Liability Amortization — `amortizeLiability`

**Formula claimed:** Linear amortization: `amount × (endYear − currentYear) / term` remaining at each year, floored at 0.

- [ ] **Verify formula for sub-item path:** `(item.amount || 0) × ((endYr − year) / term)` where `term = endYear − currentYear` (or defaultTerm). At year=currentYear, this should equal `item.amount`. At year=endYear, this should equal 0. **Verify both endpoints.**
- [ ] **Test:** Mortgage of 600,000, endYear = currentYear + 25. At year 0: expected 600,000. At year 12: expected 600,000 × (25−12)/25 = 312,000. At year 25: expected 0. Verify all three.
- [ ] **Test (no-sub-item path):** Fallback uses `Math.max(0, fallbackTotal − (fallbackTotal / defaultTerm) × i)`. This is equivalent. Verify numerically with: mortgage 600,000, 25-year default. At i=0: 600,000. At i=12: 600,000 − 600,000/25 × 12 = 312,000. At i=25: 0. **Confirm the two paths produce identical results for the same inputs.**
- [ ] **Edge case:** endYear in the past (user entered end year before current year). `term = endYear − currentYear` is negative. Code checks `term <= 0 → return sum` which skips the item (treated as paid off). **Verify this is the right behavior and that no negative balance appears.**
- [ ] **Edge case:** endYear = currentYear (paid off this year). `term = 0 → skip`. Verify.
- [ ] **Critical — interest not modeled:** The amortization is purely linear (balance decreases by 1/term per year, not by actual mortgage payments). This understates early-year liability reduction (real mortgages pay mostly interest early), and overstates the rate of balance decline for the first half of the term. This is a deliberate simplification — **document it as a known limitation and assess whether it materially misleads users about debt-free age or net worth trajectory.**

### 1.7 Income Growth in `wealthProjection`

- [ ] **Salary:** `items.reduce(... × Math.pow(1 + salaryGrowth/100, i))` where i = years from today. Verify: salary items with `endYear` stop contributing when `year >= item.endYear`. **Test:** salary item 300,000 with endYear = currentYear + 5. At i=5, salary should be 0. At i=4, salary should be 300,000 × 1.04^4.
- [ ] **Passive and other income:** Same structure — `i` is years from today, NOT years from retirement. Verify passive income continues to grow post-retirement using the SAME index `i` (which continues counting past retirement). This is correct behavior — confirm it.
- [ ] **Consistent `i` across salary/passive/other:** All three income streams use the same loop variable `i`. Salary stops at retirement (guarded by `age < profile.retirementAge`). Passive and other do not stop. Verify this is correctly implemented and there's no off-by-one.

### 1.8 Investment Balance Growth in `wealthProjection`

**The core compounding engine. Every year's investment balance is:**
`investmentBalance × (1 + investmentReturn/100) − drawdownAmount`

- [ ] **Verify order of operations:** Balance is pushed to `data[]` FIRST, THEN growth is applied for next year. This means year 0 data shows today's balance (no growth yet). Year 1 shows the balance after one year of growth. **Confirm this is correctly implemented and that the chart/tables represent the start-of-year balance or end-of-year balance consistently.**
- [ ] **Drawdown condition:** `if (assumptions.enableDrawdown && age > profile.retirementAge)`. Note: `age > retirementAge` (strict greater-than) means the retirement year itself has NO drawdown. Is this intentional? In the retirement year, you've just retired — should you be drawing down expenses for that year? This may understate the drawdown by one year.
- [ ] **Drawdown formula:** `drawdownAmount = max(0, inflationAdjustedExpense + oneTimeExpense − postRetIncome)` where `postRetIncome = yearPassive_calc + yearOtherIncome_calc`. Verify this correctly nets passive income against expenses before drawing from investments. **Test:** Retirement expense 500,000/yr, passive income 200,000/yr, other 50,000/yr → drawdown = max(0, 500,000 − 250,000) = 250,000. Verify.
- [ ] **Surplus NOT reinvested:** `yearSavings` is computed but only subtracted from expenses — it is NOT added to `investmentBalance`. This is a design choice (documented in tooltips). **Verify this is clearly communicated and that no surface accidentally implies surplus IS being invested in the base projection.**
- [ ] **Real estate and other assets:** They compound purely by their growth rates with no drawdown. Verify `otherAssetGrowth` default (2%) is applied. Verify real estate value is NOT drawn down during retirement even if investments run out.
- [ ] **Exhaustion detection:** `if (age > profile.retirementAge && investmentBalance === 0 && exhaustionAge === null) → exhaustionAge = age`. Since `investmentBalance` is set to `max(0, ...)`, it exactly hits 0 when depleted. Verify this detection fires in the year the balance goes negative (caught by the floor), not a subsequent year.

### 1.9 OTE Two-Segment Inflation in `wealthProjection`

OTEs (one-time expenses) entered in today's terms inflate at two rates: the pre-retirement category rate until retirement, then the retirement category rate afterwards.

- [ ] **Test (pre-retirement OTE):** OTE of 80,000 in autoFixed (rate 2%) in year currentYear+3. Inflated value at year+3 = 80,000 × 1.02^3 = 84,897. Verify.
- [ ] **Test (post-retirement OTE):** OTE of 100,000 in travel (pre-rate 5%, ret-rate 5%) planned for retirement year+2. Expected inflated value = 100,000 × 1.05^yearsToRet × 1.05^2. Verify.
- [ ] **Test (recurring OTE straddles retirement):** OTE with year=currentYear+3 and endYear=currentYear+8, where retirement is at year+5. Years 3,4 use pre-rate; years 5,6,7,8 use two-segment. Verify each year's amount individually.
- [ ] **Verify OTEs are NOT double-counted:** In `wealthProjection`, OTEs contribute to `yearExpenses`. In `getProjectedExpenses`, OTEs are also added (unless `excludeOTEs: true`). `getLifeStageExpense` calls `getProjectedExpenses(year, {excludeOTEs: true})` pre-retirement and `getRetNominalForYear` post-retirement. Then `wealthProjection` adds OTEs separately. **Confirm there is no double-counting.**
- [ ] **Verify OTEs in `getRetNominalForYear`:** This function does NOT include OTEs. OTEs are handled separately in both `wealthProjection` and in `retirementMetrics` (where they're pre-inflated and passed to Monte Carlo). **Confirm that every surface that uses `getRetNominalForYear` is consistent about handling OTEs separately.**

---

## Phase 2 — Projection Engine Audit (End-to-End)

### 2.1 Full projection walkthrough

Build a hand-computed 5-year projection with known inputs and verify every field in `wealthProjection[]` data entries against hand calculations:

**Test inputs:**
- Age 35, retirement 55, life expectancy 85
- Cash 50,000, Investments 300,000, Real Estate 800,000, Other 50,000
- Mortgage 600,000 (end year +25), loans 20,000 (end year +6)
- Salary 300,000, passive 40,000, other 60,000
- Total expenses 728,000 (default categories)
- investmentReturn 7%, RE appreciation 3.5%, otherAssetGrowth 2%
- salaryGrowth 4%, passiveGrowth 2%, otherIncomeGrowth 2%

For each of the first 5 years, compute by hand and verify:

- [ ] `investments` balance (compounded, no drawdown pre-retirement)
- [ ] `realEstate` value (compounded at 3.5%)
- [ ] `mortgageBalance` (linear amortization)
- [ ] `loansBalance` (linear amortization)
- [ ] `totalLiabilities` (sum)
- [ ] `netWorth` (totalAssets − totalLiabilities)
- [ ] `income` (salary + passive + other, each growing at respective rates)
- [ ] `expenses` (per-category inflation)
- [ ] `savings` (income − expenses, floored at 0)

### 2.2 Projection chart data consistency

- [ ] Verify that the projection chart (Net Worth line chart) uses `wealthProjection[].netWorth` and that the Y-axis values match the hand-computed figures from 2.1.
- [ ] Verify that "Retirement" reference line on the chart falls at the correct age.
- [ ] Verify milestone dots appear at the correct ages on the chart.
- [ ] Verify the "Investments Exhausted" flag on data points fires at the correct age.

### 2.3 Key-year data in HTML export

The export's projection table filters `wealthProjection` to key years (every 5 ages + special events). Verify:

- [ ] At retirement age, the row is highlighted and tagged "Retirement"
- [ ] FI Age row (if exists) is tagged "FI Age"
- [ ] Debt-free age row (if exists) is tagged "Debt Free"
- [ ] The `savings` column shows income − expenses (positive or negative) — note the export code computes this as `(d.income||0)−(d.expenses||0)` WITHOUT the `max(0,...)` floor used in `wealthProjection`. Verify these are consistent or flag the discrepancy.

---

## Phase 3 — Monte Carlo Engine Audit

### 3.1 Box-Muller transform correctness

```
u1 = Math.random() || 1e-10   (avoid log(0))
u2 = Math.random()
z = sqrt(-2 × ln(u1)) × cos(2π × u2)
investmentReturn = meanReturn + z × stdDev
```

- [ ] **Verify the formula:** The Box-Muller transform produces standard normal variates. Multiplied by stdDev and added to mean, this gives normally distributed returns. **This is mathematically correct.** Verify code matches this formula exactly.
- [ ] **Statistical validation:** Run the simulation 10,000 times with known mean=7, stdDev=12. Verify the distribution of generated returns has mean ≈ 7 and stdDev ≈ 12 (sample mean within ±0.5, stdDev within ±1).
- [ ] **u1 floor:** `Math.random() || 1e-10` prevents `log(0)`. Verify this floor doesn't bias the distribution materially (1e-10 maps to a z of ~6.6 — an extreme outlier. Frequency is negligible. Flag as acceptable.)

### 3.2 Simulation structure

- [ ] **1,000 simulations:** Verify `simulations = 1000` constant. Verify the outer loop runs exactly 1,000 times.
- [ ] **Investment-only:** Simulation uses only `portfolioAssets.investments`, not real estate or cash. Verify `portfolioAssets = { investments: retirementData.investments }`.
- [ ] **Annual contribution = 0:** Monte Carlo runs from retirement with no new savings. Verify `annualContribution = 0` is passed.
- [ ] **Success condition:** `if (investments > 0) successCount++`. This checks the balance AT life expectancy (after the last year's loop iteration). Verify the loop runs exactly `yearsInRetirement` iterations and that the final `investments` value represents the balance at life expectancy.
- [ ] **OTE handling in Monte Carlo:** Post-retirement OTEs are expanded into per-year entries in `retirementMetrics` and passed to `runMonteCarloSimulation`. Verify the expansion correctly handles recurring OTEs (year to endYear) and inflates them using two-segment logic.

### 3.3 Phase-out schedule in Monte Carlo

The Monte Carlo withdrawal uses a `phaseOutSchedule` to compute per-year withdrawals:

```
grossWithdrawal = sum over categories:
  base × (1 + rate)^(yearsToRetirement + year)
  where year = simulation year index (0 = first year of retirement)
  phase-outs respected
netWithdrawal = max(0, grossWithdrawal − passiveOffset)
```

- [ ] **Verify the exponent:** `yearsToRetirement + year`. At simulation year 0 (first year of retirement), exponent = `yearsToRetirement`. This matches `getRetNominalForYear(retirementCalYear)`. **Verify this is consistent.**
- [ ] **Verify passive offset:** `passiveOffset = (passive × (1+passiveGrowth)^(yearsToRetirement+year)) + (other × (1+otherGrowth)^(yearsToRetirement+year))`. Verify this is the same formula as the drawdown offset in `wealthProjection`. **Critical: if the passive income formulas differ between Monte Carlo and `wealthProjection`, the two will give inconsistent results.**
- [ ] **Pre-compute vs per-simulation:** Withdrawals are pre-computed ONCE before the simulation loop (`yearlyWithdrawals[]`). This is correct since withdrawals are deterministic per-year (only returns are random). Verify the array has length `yearsInRetirement`.

### 3.4 Monte Carlo numerical verification

- [ ] **Deterministic test:** With stdDev=0 (no volatility), every simulation is identical. With deterministic returns = investmentReturn, the Monte Carlo success rate should be either 100% or 0% (depending on whether the deterministic projection exhausts funds). **Test: set stdDev=0, verify MC result is 0% or 100% and matches the deterministic `wealthProjection` exhaustion age.**
- [ ] **Known-failure test:** Set investments at retirement = 1, annual withdrawal = 1,000,000. Expected success rate ≈ 0%. Verify.
- [ ] **Known-success test:** Set investments at retirement = 100,000,000, annual withdrawal = 100,000. Expected success rate ≈ 100%. Verify.
- [ ] **Volatility sensitivity:** With mean 7%, stdDev 12%, 30-year retirement, starting with Required Nest Egg (at 4% SWR), historical data suggests success rate ≈ 95%. Verify the app produces a result in the range 85–98% for these inputs (the exact value varies with random seed, so run multiple times and assess the distribution).

---

## Phase 4 — Financial Health Scorecard Audit (All 7 Metrics)

### 4.1 Savings Rate

**Formula claimed:** `max(0, annualIncome − expenses.current) / annualIncome × 100`

- [ ] Verify formula matches description: `(income − expenses) / income`, NOT `savings / expenses`
- [ ] **Negative savings rate:** When `expenses.current > annualIncome`, `annualSavings = max(0, ...) = 0`, making the savings rate always ≥ 0. BUT the scorecard tooltip says "expenses exceed income by X/yr." **Verify how a negative cash-flow situation is displayed in the scorecard.** If `savingsRate` is always ≥ 0 via `max(0, ...)`, the "below 10% = red" threshold may not reflect actual overspending. The tooltip in the scorecard correctly references `annualSavings` as "undeployed surplus" suggesting it's the surplus figure. Confirm the display is unambiguous when the user is overspending.
- [ ] **Income basis:** The README says "savings rate as % of gross income" but the tooltip says the same. Confirm `annualIncome` = gross (pre-tax) income, since the app has no tax modelling. Note to user: if they enter after-tax income (as recommended for investments), the savings rate uses after-tax figures — this is actually the more useful number for financial planning. Verify the tooltip explains this correctly.

### 4.2 Net Worth Multiple (Fidelity benchmark)

**Formula claimed:** `currentNetWorth / income.salary`, benchmarked against Fidelity age-based targets via linear interpolation.

- [ ] **Denominator discrepancy:** Scorecard uses `income.salary || 0` (top-level field), while `annualIncome` uses sub-item sum. If the user has entered salary sub-items and the rollup is stale, the two figures diverge. **This is a real bug risk.** Verify and flag.
- [ ] **Interpolation correctness for age < 30:** Code uses `target = 1 × (age / 30)`. This means at age 0, target = 0×; at age 15, target = 0.5×; at age 29, target = 0.97×. Is this the right behavior? Fidelity's guidance starts at 1× at age 30. For users under 30, the interpolation seems reasonable. **Verify and document.**
- [ ] **Interpolation for retirement age not in bracket set:** The brackets are `{30:1×, 40:3×, 55:7×, retirementAge:10×}`. If `profile.retirementAge < 55` (e.g. early retirement at 50), the bracket order is `{30:1×, 40:3×, 50:10×, 55:7×}`. The loop finds surrounding brackets for any age between 40 and 50 correctly. But for age 55 (now AFTER retirementAge in the bracket list), it would use the final `else` branch returning 10×. **Test with retirementAge = 50, currentAge = 52 — what target is used?**
- [ ] **Verify interpolation math:** At age 40: target = 3×. At age 47.5 (midpoint 40–55): target = 3 + 0.5 × (7−3) = 5×. Verify with `profile.currentAge = 47, retirementAge = 65`.
- [ ] **N/A when salary = 0:** When `income.salary = 0`, `nwMultiple = null` and the tile shows `—`. **Verify this graceful null handling.**

### 4.3 Debt Ratio

**Formula claimed:** `totalLiabilities / totalAssets × 100`

- [ ] Verify uses today's snapshot values, not projected
- [ ] **N/A when totalAssets = 0:** Code checks `_ta > 0`; if zero, `drVal = null`. Verify tile shows gracefully.
- [ ] **Target thresholds:** <30% = green, 30-50% = amber, ≥50% = red. These are reasonable for personal finance. Verify the display is "debt ratio" (liabilities/assets) NOT "leverage ratio" (debt/equity). The tooltip should clarify which formula is used.

### 4.4 Emergency Fund

**Formula claimed:** `assets.cash / (expenses.current / 12)`

- [ ] Verify uses today's cash snapshot and today's expense total
- [ ] **Expenses sync risk:** Same `expenses.current` sync issue as in 1.3 — verify it reflects the actual sum of `expenseCalculator` entries
- [ ] **N/A when monthlyExpenses = 0:** Verify handled gracefully
- [ ] **Target thresholds:** ≥6 months = green, 3-6 = amber, <3 = red. Standard guidance. Verify displayed correctly.

### 4.5 Investment Mix

**Formula claimed:** `assets.investments / totalAssets × 100`

- [ ] Verify uses today's `assets.investments` (top-level rollup) — same sync risk as net worth
- [ ] **Target:** ≥40% = green, 20-40% = amber, <20% = red. Verify these align with stated targets in README and any in-app tooltip.
- [ ] **Semantic accuracy:** This metric measures the fraction of total assets that is liquid investments. The label "Investment Mix" could be confused with asset allocation (e.g. stocks vs bonds split). **Verify the tooltip makes the actual definition clear.**

### 4.6 Retirement Funding

**Formula claimed:** `projectedInvestmentsAtRetirement / requiredNestEgg × 100`

- [ ] `projectedWealth` = `retirementMetrics.retirementWealth` = `wealthProjection.find(d => d.age === retirementAge).investments`. Verify this is the pre-drawdown balance at retirement entry (the year BEFORE drawdown starts, since drawdown begins `age > retirementAge`).
- [ ] `requiredNestEgg` = `getRetNominalForYear(retirementCalYear) / (nestEggSwr / 100)`. Verify this re-calls the function (not a cached value from elsewhere) and uses the correct retirement calendar year.
- [ ] **Test:** With 7% return, 20-year horizon, 300,000 starting investments, no drawdown, no contributions → expected at retirement = 300,000 × 1.07^20 = 1,160,906. If retirement budget = 50,000/yr at 3% inflation, 20 years → nominal = 50,000 × 1.03^20 = 90,306. Required nest egg at 4% SWR = 90,306 / 0.04 = 2,257,650. Funding % = 1,160,906 / 2,257,650 = 51.4%. Verify app produces ~51%.
- [ ] **Thresholds:** ≥100% = green, 85-100% = also green (light green), 50-85% = amber, <50% = red. Verify these exactly match code.

### 4.7 Income Replacement Ratio (IRR)

**Formula claimed:** `getRetNominalForYear(retirementCalYear) / annualIncome × 100`

- [ ] This uses the **nominal retirement expense on day 1 of retirement** as the numerator, divided by **today's income** as denominator. **This is a potentially misleading metric.** The numerator is inflated to retirement day (20–30 years of inflation baked in) while the denominator is today's income. A user with 3% expense inflation over 20 years will show an IRR 80% higher than if both sides were in the same year's terms. **Evaluate whether this is the correct interpretation and whether the tooltip makes this clear enough.**
- [ ] **Conventional IRR definition:** The standard income replacement ratio in financial planning is `retirement income / pre-retirement income`, both in the same terms. If the intent is to compare retirement spending power vs current income, both should be in today's terms (divide nominal expense by inflation factor) or both in retirement-day terms (multiply today's income by salary growth factor). **Flag this as a first-principles concern.**
- [ ] **Test:** Today's income = 400,000, retirement expenses today's terms = 300,000 at 3%/yr, retire in 20 years. Nominal expense at retirement = 300,000 × 1.03^20 = 541,833. IRR = 541,833 / 400,000 = 135%. The scorecard would show this as amber (>120% = "retirement costs more than current income"). But in real terms, the user is planning to spend LESS than their current income — the metric is misleading due to inflation mismatch. **Verify and flag.**
- [ ] **Alternative:** The most useful version of IRR for planning is: retirement budget in today's terms / current income. Flag this as a recommendation.

---

## Phase 5 — Gap-Closing Levers and Surplus Deployment Audit

### 5.1 "Save More" Lever

**Formula claimed:** `extraMonthly = (absGap / annuityFactor) / 12` where `annuityFactor = (1+r)^yearsToRetire − 1) / r`

This is the future value of an ordinary annuity: how much monthly savings, compounded at `r`, accumulates to `absGap` over `yearsToRetire` years.

- [ ] **Verify the formula:** `FV = PMT × ((1+r)^n − 1) / r` → `PMT = FV × r / ((1+r)^n − 1)`. The code computes `annuityFactor = (1+r)^n − 1) / r` and then `extraAnnual = absGap / annuityFactor`. This is correct. Verify the annual-to-monthly conversion `extraAnnual / 12` is correct (assumes monthly compounding matches annual — a simplification).
- [ ] **Test:** `absGap = 1,000,000`, `r = 7%`, `years = 20`. Annuity factor = (1.07^20 − 1)/0.07 = (3.870 − 1)/0.07 = 41.0. extraAnnual = 1,000,000 / 41.0 = 24,390. extraMonthly = 2,032. Verify app produces approximately this.
- [ ] **N/A condition:** When `r = 0`, `annuityFactor = yearsToRetire`. Verify the code handles this case (it does: `r > 0 ? ... : yearsToRetire`).
- [ ] **Trigger condition:** Levers only compute when `!onTrack` (gap exists). When on track, they show "N/A." **Verify: if the user has a nest egg gap but high Monte Carlo success (isGapStrong case), the levers still show. Verify and confirm this is correct behavior — even if Monte Carlo is fine, showing levers for an unfunded nest egg is informative.**
- [ ] **Does "Save More" account for existing surplus?** The tooltip says "your current surplus can offset this." The displayed figure is the TOTAL extra savings needed, not netted against existing surplus. The surplus offset note is purely informational. **Verify this is clearly stated — a user might think the figure already accounts for their current savings rate.**

### 5.2 "Retire Later" Lever

**Formula claimed:** Compound existing investments forward year-by-year from retirement date, checking each year if the grown balance meets that year's new nest egg target.

- [ ] **Verify the compounding:** `extInv = retData.investments × (1+r)^yr`. Note: `retData.investments` is the balance AT retirement (from wealthProjection). This means the lever models ONLY investment compounding — no new savings, no drawdown, no income. **Verify this is clearly communicated.**
- [ ] **Verify the target:** Each year uses `candidateNestEgg = getRetNominalForYear(candidateCalYear) / (nestEggSwr/100)`. This is the nest egg needed if retiring at THAT year (with expenses inflated to that year). This is the correct approach — a later retirement year requires a larger nest egg because expenses are more inflated. Verify.
- [ ] **30-year cap:** If investments can't reach the nest egg within 30 extra years, shows "N/A." **Test:** Very large gap. Verify "N/A" appears.
- [ ] **Critical omission:** The "retire later" lever doesn't account for the fact that delaying retirement also means MORE years of salary income (which the user could invest). This makes the lever UNDERSTATE the benefit of retiring later. **Flag as a first-principles concern and assess whether this should be stated clearly.**

### 5.3 "Higher Return" Lever

**Formula claimed:** `neededCagr = (requiredNestEgg / assets.investments)^(1/yearsToRetire) − 1`

This is the CAGR needed for current investments alone to reach the required nest egg, with no additional contributions.

- [ ] **Verify formula:** `FV = PV × (1+r)^n → r = (FV/PV)^(1/n) − 1`. With `FV = requiredNestEgg`, `PV = assets.investments`, `n = yearsToRetire`. This is correct. Verify.
- [ ] **Test:** `assets.investments = 300,000`, `requiredNestEgg = 2,000,000`, `yearsToRetire = 20`. `neededCagr = (2,000,000/300,000)^(1/20) − 1 = 6.667^0.05 − 1 = 1.1003 − 1 = 10.0%`. Verify app shows ≈10%.
- [ ] **>30% N/A condition:** If `neededReturnPct > 30`, shows "N/A." **Verify the threshold is reasonable and documented.** A 30% required CAGR is unrealistic, so N/A is appropriate.
- [ ] **Critical omission:** This lever ignores existing savings contributions entirely. It asks "what return would my current investments need, with no new money added, to reach the goal." This is mathematically clean but may not be the most useful framing for a user who IS saving. **Flag and assess.**

### 5.4 Surplus Deployment Scenarios (Tiles 1, 2, 3)

These are the most complex calculations in the app. Each tile simulates a different strategy for deploying the pre-retirement savings surplus.

**Tile 1 — Invest all surplus:**
- [ ] Verify: Each year's `wp.savings` (from `wealthProjection`) is added to the investment balance AFTER compounding: `bal = bal × (1+r) + yearSurplus`. **Note the order:** compounding happens first, then surplus is added. This is an end-of-year contribution model. Verify this is consistent with the base projection.
- [ ] **FI Age detection in Tile 1:** `if (fiAgeResult === null && bal >= getFiThresholdForWpEntry(wp)) → fiAgeResult = wp.age`. This checks the balance BEFORE adding this year's surplus. **Verify the timing:** should FI Age detection happen before or after adding the surplus for the year? Current: balance grows, then check, then add surplus. If the check happens mid-year, the reported FI age may be off by one year.
- [ ] **Test:** Today: investments 300,000, surplus 72,000/yr (constant for simplicity), return 7%. Expected balance after year 1: 300,000 × 1.07 + 72,000 = 393,000. Year 2: 393,000 × 1.07 + 72,000 = 492,510. Verify.
- [ ] **Tile 1 FI Age vs base FI Age:** The delta chip shows `currentFiAge − t1FiAge`. A positive delta means deploying surplus accelerates FI. If `currentFiAge = null` but `t1FiAge` exists, `t1HasBaseline = false` and a different display is shown. Verify this edge case is handled.

**Tile 2 — Clear debt first, then invest:**
- [ ] Verify: `remainingDebt = totalDebtToday` (today's total debt — NOT amortized). This models extra payments BEYOND the scheduled amortization. **Is this correct?** The base wealthProjection already amortizes debt linearly. Tile 2 models ACCELERATED payoff using surplus. The surplus goes entirely to debt until paid, then to investments. Verify `remainingDebt` is separate from the liabilities in `wealthProjection` (it is — it's an independent tracking variable). **However: verify that the amortization in `wealthProjection` and the surplus debt-payment in Tile 2 are not double-counted.** If the base already reduces debt by 1/term per year, and Tile 2 also uses surplus to pay debt, the user's actual debt payoff is the SUM of both. Is the "debt free age" in Tile 2 the date when the SURPLUS-based tracker hits zero, or the date when the combined payoff completes? Clarify and flag.
- [ ] **Test:** Debt = 500,000, surplus = 100,000/yr, return 7%. Year 1: pay 100,000 debt → remaining = 400,000, invest 0. Year 2: pay 100,000 → 300,000. Year 3: 200,000. Year 4: 100,000. Year 5: 0, start investing. Year 5 bal = 100,000 × 1.07 = 107,000. Verify.
- [ ] **Degenerate case:** Negative surplus (expenses > income). `yearSurplus < 0`. Code: `debtPayment = max(0, min(yearSurplus, remainingDebt)) = max(0, min(negative, remaining)) = 0`. So negative surplus results in zero debt payment AND zero investment — the negative doesn't draw from savings. **Is this the correct behavior? A user with a deficit should arguably draw from investments or savings.** Flag.

**Tile 3 — Custom split:**
- [ ] Verify `effInvest + effDebt ≤ 100` cap logic. `splitCash = max(0, 100 − effInvest − effDebt)`. Verify: if user sets invest=60%, debt=50%, effDebt is capped to 40%. Verify the display shows the effective values, not the raw inputs.
- [ ] Verify: when remainingDebt hits 0, `toDebt` redirects to investment: `bal += (toDebt − debtPayment)`. Since `debtPayment = min(toDebt, 0) = 0` when debt is gone, `bal += toDebt`. Verify.

---

## Phase 6 — Input/Output Integrity Audit

### 6.1 JSON Export/Import round-trip

- [ ] **Export:** Verify `exportData()` captures all stateful variables: `currency`, `exchangeRates`, `profile`, `assets`, `liabilities`, `income`, `expenses`, `expenseCategories`, `expenseCalculator`, `retirementBudget`, `expenseGrowthRates`, `expenseTags`, `expensePhaseOutYears`, `retExpensePhaseOutYears`, `retExpenseGrowthRates`, `lifeEvents`, `assumptions`, `oneTimeExpenses`, `nestEggSwr`, `surplusSplitInvest`, `surplusSplitDebt`. **Check for any state variable NOT included in the export.**
- [ ] **Missing from export check:** `lowDelta`, `highDelta`, `runwayConservativeOffset`, `runwayOptimisticOffset`, `runwayPessSpend`, `runwayOptSpend`, `projectionTargetYear`, `sensitivityAdj`, `hiddenLines`, `hiddenCalcLines`, `hiddenAssetLines`, `expenseViewMode`. These are UI preferences — document intentionally excluded vs accidentally omitted.
- [ ] **Import:** Verify the import handler correctly restores ALL exported fields. Check for fields that export but are silently ignored on import (causing silent state loss).
- [ ] **Round-trip test:** Export with non-default values for every major field. Import the exported file. Verify every field is restored exactly. Run the projection and compare output metrics before and after import — they must be identical.
- [ ] **Version handling:** The export includes `"version": "2.0"`. Verify the import handler reads or ignores this. If future versions change the data structure, is there a migration path?
- [ ] **Invalid JSON import:** Verify: import a malformed JSON file → app shows error, does not crash, state is unchanged.
- [ ] **Partial JSON:** Import a JSON file missing some fields (e.g. no `retExpenseGrowthRates`). Verify: missing fields fall back to defaults rather than crashing or producing undefined behavior.

### 6.2 CSV Import

The CSV importer reads expense categories from a user-supplied file.

- [ ] **Header detection:** Code searches for header in first 5 lines, case-insensitive. Verify: header on line 1, 3, 5 all work. Header on line 6 — should fail gracefully.
- [ ] **Required columns:** `Category` and `Monthly Estimate (BASE CURRENCY)`. Verify: missing `Category` column → error. Missing amount column → error. Extra columns → silently ignored.
- [ ] **Amount parsing:** Values parsed as float. Verify: amounts with commas (`1,000`) → should parse as 1,000 or fail gracefully (not silently as 1). Amounts with currency symbols → should fail gracefully. Empty amounts → treated as 0 or skipped.
- [ ] **Monthly-to-annual conversion:** Imported monthly amounts multiplied by 12. Verify: 5,000/mo → 60,000/yr in `expenseCalculator`. Verify: retirement budget pre-filled with same value (60,000). Verify: growth rates default to 3%.
- [ ] **Category replacement:** "All existing expense categories are replaced." Verify: import wipes `expenseCategories` state and replaces with imported list. Verify: the replacement includes new category keys that don't exist in `DEFAULT_EXPENSE_CATEGORIES` — do these work throughout the app (charts, scorecard, projections)?
- [ ] **Key generation for new categories:** When a CSV category name is new (e.g. "Pet Expenses"), what key is assigned? Verify the key generation is deterministic and collision-free.
- [ ] **Sample CSV:** Verify `sample_csv_import.csv` parses correctly and produces the expected category list and amounts.

### 6.3 FX Rate Fetching

- [ ] **Live fetch:** Verify `fetchFxRates()` calls `open.er-api.com/v6/latest/AED` and correctly parses the response. Note: the response gives rates as `{USD: 0.2725, ...}` (how many USD per AED), and the code stores `USD: 1 / data.rates.USD` (how many AED per USD). **Verify this inversion is correct.** `formatCurrency` divides by the rate: `amountInAED / rate`. If `rate = 3.67` (AED per USD), then 3,670 AED / 3.67 = 1,000 USD. Verify this is correct.
- [ ] **Failure handling:** Verify: fetch fails → rates stay at hardcoded defaults → `fxStatus` stays 'cached'. No crash, no alert.
- [ ] **Rate persistence:** Rates are NOT persisted to localStorage or file. Each session starts with hardcoded defaults and tries to fetch live. **Verify rates are included in JSON export** (they are) so imported files use the rates from when they were exported.
- [ ] **Currency display:** All monetary values stored in AED. Display conversion: `amountInAED / exchangeRates[currency]`. Verify for each of AED (rate=1), USD (rate=3.67), CAD (rate=2.72), EUR (rate=4.01).

### 6.4 HTML Report Export

- [ ] **Self-contained:** Verify the generated HTML has no external dependencies except the Chart.js CDN script tag. Verify it renders offline once Chart.js is cached.
- [ ] **Data consistency:** Verify all figures in the HTML report match the live app values at export time. Key checks:
  - Net worth on cover matches app dashboard
  - Required Nest Egg matches Retirement tab
  - Monte Carlo % matches Retirement tab
  - All expense category rows match the Expense tab
  - Projection table values match the wealthProjection data
- [ ] **Notes to Financial Statements:** The HTML report includes a detailed methodology section. Verify every formula described matches the actual code implementation. Cross-reference with Phase 1 findings.
- [ ] **Chart rendering:** The HTML report includes Chart.js charts. Verify chart data is correctly embedded as JSON in `<script>` blocks and matches the in-app chart data.

### 6.5 Reset Functionality

- [ ] Verify `Reset` sets ALL state variables back to `DEFAULT_STATE` values. List every `setState` call in the reset handler and verify completeness — specifically check `lowDelta`, `highDelta`, runway offsets, `sensitivityAdj`, `projectionTargetYear`, `surplusSplitInvest`, `surplusSplitDebt`, `expenseViewMode`.
- [ ] **Verify no state is missed:** After reset, the app should be indistinguishable from a fresh load. Test by: load app, modify every input, reset, compare to fresh app state.

---

## Phase 7 — Edge Cases and Stress Testing

### 7.1 Age and timeline edge cases

- [ ] **Already retired:** `profile.currentAge >= profile.retirementAge`. What happens to the projection? Salary should be 0 from year 0. Drawdown should start immediately (since `age > retirementAge` fires from the first iteration with `i=0` giving age=currentAge). **Verify the app handles this gracefully.** FI Age logic may produce strange results.
- [ ] **Retirement age = life expectancy:** `profile.retirementAge = profile.lifeExpectancy`. Zero years in retirement. Monte Carlo runs 0 iterations. What is the success probability? `successCount/1000 × 100`. If 0 iterations, every sim has `investments > 0` (unchanged), so success = 100%. **Is this correct behavior? Document.**
- [ ] **currentAge = 0:** Projection runs for 85 years (default life expectancy). Should not crash. NW Multiple interpolation at age 0 = `1 × (0/30) = 0×`.
- [ ] **Very early retirement (age 20, retire at 30):** Retirement horizon = 55 years. Monte Carlo runs 55 iterations. Verify no overflow or performance issue.
- [ ] **FI Age not reached:** `fiAge = null`. Verify all surfaces that use `fiAge` handle `null` gracefully (no crashes, shows `—` or appropriate message).
- [ ] **Retirement age before current age:** User inputs `retirementAge = 30, currentAge = 40`. `yearsToRetirement = 30 − 40 = −10`. Verify: is this clamped? Does `getRetNominalForYear` return 0 (since `yearsIntoRet < 0`)? Does `wealthProjection` handle a negative projection horizon?

### 7.2 Financial edge cases

- [ ] **Zero investments:** `assets.investments = 0`. `getProjectedExpenses` and `wealthProjection` handle this (0 × anything = 0). Monte Carlo starts with 0. FI Age = null (investments never reach nest egg). Verify no division by zero anywhere.
- [ ] **Zero income:** `annualIncome = 0`. `savingsRate = 0 / 0 → 0` (guarded by `annualIncome > 0`). NW Multiple `sal = 0 → nwMultiple = null`. IRR `preRetIncome = 0 → irrVal = null`. Verify all null cases render as `—` not `NaN` or crash.
- [ ] **Zero expenses:** `effectiveRetirementExpense = 0`. `fiAge` check: `effectiveRetirementExpense <= 0 → return null`. `getRetNominalForYear = 0` (all bases are 0). Required nest egg = 0. Funding % = undefined (0/0). Verify.
- [ ] **Expenses exceed assets:** Net worth is negative. Verify negative net worth displays correctly (with minus sign, red color).
- [ ] **Very large numbers:** AED 100,000,000 investments. Does `formatCurrency` handle correctly? Verify M/K suffixes and number formatting for 9+ digit amounts.
- [ ] **SWR = 0:** Clamped to `SWR_MIN = 0.1`. Verify clamping fires and the field reverts. Verify no division by zero when `nestEggSwr = 0` before clamping.
- [ ] **SWR = 6 (maximum):** Verify required nest egg is very small, funding % is very high. FI Age comes sooner. Verify no mathematical issues.
- [ ] **Growth rate = 0:** A category with 0% growth stays flat at its base amount. Verify `Math.pow(1+0, n) = 1`. Verify correctly.
- [ ] **Growth rate = 20% (maximum):** `GROWTH_RATE_MAX = 20`. Verify clamping fires for inputs above 20. Verify 20% over 30 years doesn't produce JavaScript `Infinity` (300,000 × 1.20^30 = 7,174,453 — well within safe range).
- [ ] **Life expectancy < retirement age:** Negative years in retirement. Monte Carlo runs negative iterations (loop doesn't execute). What is success rate? Verify.

### 7.3 Currency edge cases

- [ ] **Switch currency mid-session:** Change from AED to USD while viewing projections. Verify all displayed values update correctly. Verify no values are double-converted.
- [ ] **Input in non-AED currency:** User enters an amount in USD mode. `fromDisplay(displayVal, rate)` converts to AED for storage. Verify: enter 100 USD (rate 3.67) → stored as 367 AED. Switch to AED → shows 367. Switch back to USD → shows 100. Verify round-trip.
- [ ] **Rounding:** `fromDisplay` uses `Math.round(parseFloat(val) × rate)`. For small USD amounts, rounding to the nearest AED introduces up to 0.5 AED error. For large amounts, this is negligible. **Document this rounding behavior.**
- [ ] **Custom exchange rate:** User manually edits exchange rate. Verify all downstream calculations use the updated rate.

### 7.4 OTE stress tests

- [ ] **OTE in the past:** Year before currentYear. `wealthProjection` filter: `year >= e.year && year <= (e.endYear || e.year)`. A past OTE with no endYear would only match its specific year (which is in the past) — it's effectively ignored. **Verify and document.**
- [ ] **OTE with endYear before year:** `endYear < year`. The filter `year <= endYear` never fires. OTE is ignored. Verify.
- [ ] **All categories removed:** User deletes all expense categories. `expenseCategories = []`. `getProjectedExpenses = 0`. `getRetNominalForYear = 0`. `fiAge = null`. Monte Carlo: no withdrawals, all simulations succeed = 100%. Verify graceful behavior throughout.
- [ ] **Maximum OTEs:** Add 20+ one-time expenses. Verify the projection, expense chart, and HTML export handle all of them without layout breaks or performance issues.

### 7.5 Performance stress test

- [ ] **Long horizon:** Profile with currentAge=18, lifeExpectancy=100 → 82-year projection loop. Verify `wealthProjection` computes in < 200ms. Verify chart renders without lag.
- [ ] **Monte Carlo performance:** 1,000 simulations × 55 years = 55,000 iterations. Verify completes in < 500ms on a modern browser.
- [ ] **Rapid state changes:** Click through tabs rapidly while modifying inputs. Verify no race conditions, no stale `useMemo` results, no console errors.
- [ ] **Many expense categories (30+):** Add 20 custom categories. Verify the expense chart legend, the projection, and the HTML export all remain readable and functional.

---

## Phase 8 — UX and User-Facing Text Audit

### 8.1 Tooltip accuracy audit

Every `InfoTooltip` in the app describes a field or concept. Each tooltip must be verified against the actual code behavior.

- [ ] **`otherAssets` tooltip:** Says "does not contribute to SWR drawdown capacity. Only Investments and Cash are considered liquid." But the Monte Carlo and Required Nest Egg ONLY use Investments (not Cash). **Verify: Cash is not included in the SWR calculation. If the tooltip says cash is liquid for retirement, but the simulation doesn't include it, the user is misled.** Check whether cash is ever drawn from during retirement or Monte Carlo.
- [ ] **`mortgage` tooltip:** "balance amortizes linearly to zero by then. Without an end year, the balance amortizes linearly over a default 25-year term from today." Verify the default 25-year term applies from `currentYear`, not from when the mortgage originated.
- [ ] **`drawdown` tooltip:** Claims "annual withdrawal equals your inflation-adjusted retirement expenses, reduced by any passive or other income." Verify this exactly matches the `drawdownAmount` formula.
- [ ] **`retirementReadiness` tooltip:** "Above 80% = strong plan. Below 60% = review." Verify these thresholds match `MC_STRONG_THRESHOLD = 80` and `MC_CAUTION_THRESHOLD = 60`.
- [ ] **SWR tooltip:** Claims "The 4% rule (Trinity Study, 1998) sustains a balanced portfolio across 95%+ of 30-year windows — drop to 3–3.5% for 35+ year retirements." **Verify this claim is accurate for the context.** For UAE-based investors with no US Social Security and no tax-advantaged accounts, the 4% rule may be too optimistic. Flag if the tooltip should carry more nuance.
- [ ] **Gap-closing lever tooltip (Save More):** Claims monthly contribution figure. Verify this matches the displayed value.
- [ ] **All other tooltips in `TOOLTIPS` object and inline:** Read each one and flag any that are inconsistent with actual behavior.

### 8.2 Label and terminology consistency

- [ ] Audit for inconsistent terminology across tabs:
  - "Nest Egg" vs "Required Portfolio" vs "Required Nest Egg" — are these used interchangeably? Should they be consistent?
  - "Survival Odds" vs "Monte Carlo" vs "Success Probability" — verify consistent usage
  - "Passive Income" vs "Rental Income" — README mentions "Renamed from rental" — verify all surfaces use "Passive Income"
  - "FI Age" vs "Financial Independence Age" — consistent?
- [ ] **Monthly vs annual display:** The `expenseViewMode` toggle shows expenses monthly or annually. Verify the toggle correctly converts display (÷12 for monthly) without modifying the underlying AED storage.
- [ ] **Formatting consistency:** Currency amounts — are thousands separators always present? Are negative amounts always shown with minus sign in correct position?

### 8.3 Error states and edge-case messages

- [ ] Verify every `if (!data)` and `if (data === null)` guard shows a sensible fallback, not a blank space or `undefined`
- [ ] Verify the "Not calculable" states for gap-closing levers are clearly explained (WHY not calculable)
- [ ] Verify the "No surplus — expenses meet or exceed income" message for Surplus Deployment is triggered correctly and is actionable
- [ ] Verify the `fiAge = null` case renders appropriately in: the scorecard, the Retirement tab, the HTML report, milestone timeline

### 8.4 HTML report text accuracy

The HTML report's "Notes to Financial Statements" section describes every formula. Audit each note against the actual code:

- [ ] **Note on Savings Rate** — verify formula matches code
- [ ] **Note on NW Multiple / Fidelity benchmark** — verify interpolation description and bracket values
- [ ] **Note on Debt Ratio** — verify formula
- [ ] **Note on Emergency Fund** — verify formula and cash definition
- [ ] **Note on Investment Mix** — verify definition (investments / total assets)
- [ ] **Note on Retirement Funding** — verify projected investments formula and nest egg formula
- [ ] **Note on IRR** — verify formula and note the inflation-mismatch issue identified in Phase 4.7
- [ ] **Note on wealthProjection / Projected Investments** — verify "surplus not auto-deployed" claim
- [ ] **Note on Monte Carlo** — verify Box-Muller description and success condition
- [ ] **Note on FI Age** — verify per-year threshold description
- [ ] **Note on Gap-Closing Levers** — verify all three lever formulas
- [ ] **Note on Surplus Deployment** — verify three tile descriptions
- [ ] **Note on Liability Amortization** — verify linear amortization description

---

## Phase 9 — Metric System Coherence Audit

> **Purpose of this phase:** Each metric has already been verified in isolation in Phases 1–5. This phase asks a completely different question: *do all the metrics, together, form a coherent, complete, and non-contradictory system that genuinely serves the user's financial planning needs?* A metric can be mathematically correct and still be harmful — if it conflicts with another metric, duplicates one, crowds out a more important one, or creates a false sense of security. This phase treats the app's entire output as a single instrument and audits the instrument, not just its parts.

### 9.1 Map every metric the app produces

Before evaluating coherence, produce a complete inventory. List every number, percentage, label, or conclusion the app surfaces to the user — across every tab, every chart, the dashboard, the scorecard, the retirement tab, the outlook tab, and the HTML report. For each metric, document:

- What it measures (stated definition)
- How it is calculated (inputs, formula)
- Where it appears (which surfaces)
- What decision it is intended to inform

This map is the foundation for the coherence analysis that follows. Any metric that cannot be mapped to a clear user decision it informs is a candidate for removal or redesign.

**Expected inventory (non-exhaustive — auditor must verify completeness):**

| Metric | Surfaces | Decision it informs |
|---|---|---|
| Net Worth (snapshot) | Dashboard, Scorecard, HTML report | Am I building wealth overall? |
| Savings Rate | Scorecard, Dashboard | Am I saving enough today? |
| NW Multiple (Fidelity) | Scorecard | Am I on track vs peers my age? |
| Debt Ratio | Scorecard | Is my leverage healthy? |
| Emergency Fund (months) | Scorecard | Am I protected against a short-term shock? |
| Investment Mix % | Scorecard | Is enough of my wealth working for me? |
| Retirement Funding % | Scorecard, Retirement tab | Will I have enough to retire? |
| Monte Carlo success % | Retirement tab, Scorecard | Will my money last through retirement? |
| FI Age | Dashboard, Retirement tab | When could I retire if I wanted to? |
| Required Nest Egg | Retirement tab | What lump sum do I need at retirement? |
| Projected Investments at retirement | Retirement tab | What will I actually have? |
| Income Replacement Ratio | Scorecard, Retirement tab | Does my retirement budget fit my current lifestyle? |
| Retirement Runway (3 scenarios) | Retirement tab | How long does my money last under different conditions? |
| Debt-free age | Dashboard, Scorecard | When will I be debt-free? |
| Wealth milestones ($1M, $5M…) | Dashboard | When do I cross major wealth thresholds? |
| Gap-closing levers (3) | Retirement tab | How do I fix a retirement gap? |
| Surplus Deployment (3 tiles) | Outlook tab | What should I do with my savings? |
| Expense sensitivity (low/high) | Pre-Retirement tab | What happens if my costs grow faster/slower? |
| Essential vs discretionary split | Pre-Retirement tab | Which expenses are fixed vs cuttable? |
| Cashflow chart (income vs expenses) | Outlook tab | Am I running a surplus or deficit each year? |

### 9.2 Completeness check — what questions does a user naturally ask, and does the app answer them?

A well-designed personal financial planning tool should answer the user's most important questions clearly and directly. Map every natural user question to the metric that answers it, and identify any question that goes unanswered or is answered ambiguously.

**The core questions for long-term financial planning (from financial planning literature and best-in-class tools):**

- [ ] **"Am I building wealth fast enough?"** → Savings rate + NW trajectory. Does the app clearly answer this in one place, or does the user have to mentally combine multiple metrics?
- [ ] **"Will I have enough to retire?"** → Retirement Funding % + Monte Carlo. These two metrics answer slightly different versions of this question. Verify they are presented together and that the user understands the difference between them. A user might see "102% funded" (green) and "58% Monte Carlo" (red) simultaneously — this is jarring. **Is the apparent contradiction explained?**
- [ ] **"When can I retire?"** → FI Age. Verify this is prominent and unambiguous. Does it account for the user's full budget (including phase-outs and passive income offsets)? Does it update clearly when the user changes savings assumptions?
- [ ] **"How long will my money last?"** → Retirement Runway. Is this the answer to a different question than Monte Carlo? (Monte Carlo: % of scenarios that survive; Runway: how many years under three deterministic scenarios.) **Are these distinguished clearly, or do they appear to be saying the same thing?**
- [ ] **"What should I do differently?"** → Gap-closing levers + Surplus Deployment. Do these together give a complete action plan? What if the gap is in both the nest egg AND Monte Carlo? Are the recommended actions consistent (e.g. does "save more" in the gap-closing lever align with "invest all surplus" in Surplus Deployment, or do they conflict)?
- [ ] **"Am I protected against short-term shocks?"** → Emergency Fund. Is this the only liquidity metric? Is cash included in retirement planning or only counted here?
- [ ] **"Is my debt level healthy?"** → Debt Ratio + Debt-free age. Do these together give a complete debt picture? The debt ratio is a snapshot; the debt-free age is a trajectory. Verify they are in harmony — a user with a 20% debt ratio might have a debt-free age of 60, which together imply they are overleveraged relative to their timeline.
- [ ] **"How does my spending compare to my income?"** → Cashflow chart. Is this easily findable? Is the annual surplus/deficit prominently displayed in one place, or scattered?
- [ ] **"What if my investments perform worse than expected?"** → Monte Carlo + Runway pessimistic scenario. Are these saying the same thing? Is there overlap that confuses rather than clarifies?
- [ ] **"What's my biggest financial risk right now?"** → There is no single "biggest risk" metric or summary. Is this a gap? Best-in-class tools (e.g. Betterment, Personal Capital, Vanguard Digital Advisor) often surface a priority alert system. Assess whether the app's verdict banners fulfill this role adequately.

**Unanswered questions to flag if found:**
- [ ] What is my real purchasing power in retirement (inflation-adjusted)?
- [ ] What is my actual monthly budget shortfall or surplus today?
- [ ] What is the total cost of my debt (interest not modeled)?
- [ ] What is my savings rate trajectory (is it improving or declining)?
- [ ] What happens if I live to 95 or 100 instead of 85?
- [ ] What is my concentration risk (all savings in one employer/fund)?

### 9.3 Conflict and contradiction check

When multiple metrics address the same underlying question, they must be consistent with each other. A user who sees two numbers that should be related but differ — without explanation — loses trust in the tool and may make worse decisions.

- [ ] **Retirement Funding % vs Monte Carlo success %:** These can diverge significantly. A user can be "100% funded" (nest egg target met) but have 55% Monte Carlo success. Or 60% funded but 85% Monte Carlo success (possible if passive income is large relative to the portfolio). **Map the six verdict states in the code (`isStrong`, `isOnTrackMod`, `isOnTrackWeak`, `isGapStrong`, `isGapMod`, worst case) and verify each has a clear, non-contradictory narrative.** In particular: the `isGapStrong` case (you haven't hit the nest egg target, but Monte Carlo is strong) needs very clear explanation — why is Monte Carlo fine if you're underfunded? (Because Monte Carlo models actual year-by-year drawdown, not just a static SWR target. This is a feature, not a bug — but it must be explained.)
- [ ] **FI Age vs Retirement Funding %:** FI Age answers "when does your portfolio reach the required nest egg?" while Retirement Funding % answers "what % of the required nest egg will you have at your planned retirement date?" These should be consistent: if FI Age ≤ planned retirement age, Retirement Funding should be ≥ 100%. **Verify this invariant holds.** Any case where FI Age is before retirement but funding % < 100% (or vice versa) is a logical contradiction.
- [ ] **Gap-closing levers vs Surplus Deployment:** The "Save More" lever tells the user how much extra monthly saving is needed to close the nest egg gap. The "Invest All Surplus" tile in Surplus Deployment shows what happens to FI Age if they invest existing surplus. These two tools can give apparently conflicting guidance: the lever might say "save an extra 10,000/mo" while surplus deployment shows that investing existing 8,000/mo surplus would close the gap. **Verify that these two surfaces are explicitly linked in the UI, or flag the potential for the user to follow one and ignore the other.**
- [ ] **Debt-free age vs Net Worth projection:** The net worth projection amortizes liabilities linearly. The Surplus Deployment Tile 2 uses surplus to accelerate debt payoff. These two models of debt payoff can produce different debt-free ages (the wealthProjection `debtFreeAge` vs `t2Sim.debtFreeAge`). **Verify these are labeled clearly as different scenarios (base case vs accelerated payoff), not presented as two statements of the same fact.**
- [ ] **Savings Rate vs Surplus Deployment:** The savings rate shows % of income saved, but explicitly notes "surplus is undeployed." The Surplus Deployment section shows what happens if you deploy it. A user with a 25% savings rate might feel financially healthy — but the app is telling them that 25% is sitting idle, doing nothing. **Is this the right default framing? Does the UI make it sufficiently clear that a high savings rate is a potential — not an achievement — unless the surplus is actively deployed?**
- [ ] **Required Nest Egg vs Retirement Budget:** The Required Nest Egg is computed from `getRetNominalForYear` at retirement day — the Day 1 expense figure before any phase-outs. Phase-outs (e.g. school fees ending, mortgage paid off) reduce actual spending in later retirement years. This means the Required Nest Egg is intentionally conservative — it assumes Day 1 spending continues forever, which is the SWR model. **But this creates a conflict with the retirement runway chart**, which DOES model phase-outs. So the Runway chart will show longer survival (because spending decreases) than the Required Nest Egg implies (which assumes fixed spending). These two answers to "will my money last" can give different impressions. **Flag and verify the tooltips explain this explicitly.**

### 9.4 Redundancy check

Some metrics may answer the same question, crowding the interface without adding information. Redundant metrics increase cognitive load and can cause the user to anchor on whichever one they happen to look at first.

- [ ] **Monte Carlo success % vs Retirement Runway:** Both address "how long does money last?" Monte Carlo gives a probability over 1,000 random paths. Runway gives three deterministic scenarios. **Assess whether a user needs both.** Could the runway chart replace Monte Carlo, or vice versa? Or do they serve genuinely different purposes that a non-technical user would understand and find valuable in combination?
- [ ] **FI Age vs Retirement Funding %:** Both address "am I on track for retirement?" FI Age shows the EARLIEST possible retirement date. Retirement Funding % shows how close you are to the target at YOUR planned date. **Are these complementary or redundant?** A case could be made that FI Age is the more actionable metric (it gives a concrete target date) while Funding % is a progress bar. Assess whether both are needed and clearly distinguished.
- [ ] **NW Multiple vs Retirement Funding %:** Both are "am I on track" metrics. NW Multiple benchmarks against a peer/age-based milestone (Fidelity). Retirement Funding % benchmarks against the user's own target. **These are complementary, not redundant** — but verify they are not placed so close together in the UI that a user reads them as saying the same thing.
- [ ] **Savings Rate vs Annual Surplus:** Both appear in the UI. Savings rate is a %; annual surplus is a dollar figure. **Are both necessary?** For financial planning, the dollar figure (how much is available to invest) is more actionable than the percentage. The percentage is useful for benchmarking. Assess whether both are positioned clearly as serving different purposes.
- [ ] **Debt Ratio vs Debt-Free Age:** Debt ratio is a snapshot of leverage. Debt-free age is a forward projection. **Both are needed** — but assess whether the scorecard placement creates confusion (debt ratio is a health score tile; debt-free age is a milestone). Verify the user understands the difference without reading the tooltip.

### 9.5 Completeness check — the "full picture" test

Imagine handing the app's output to a qualified financial planner. Would they have everything they need to give meaningful advice? If not, what's missing? This is the definitive test of completeness.

- [ ] **Income picture:** Does the app capture all meaningful income streams? Verify: salary (with growth and end year), passive income, other income. **Missing:** business income, rental income from multiple properties individually (only one passive bucket), Social Security / pension income starting at a specific age, End of Service Gratuity (lump sum at retirement). **Assess whether each gap is material and how it should be addressed (new field vs workaround vs documented limitation).**
- [ ] **Expense picture:** Does the app capture all meaningful expenses? **Missing explicitly:** debt interest (only principal is modeled, not the ongoing interest cost), insurance premiums beyond health (life, disability, property), childcare for dependents, education savings (e.g. 529/Junior ISA equivalent). **Assess materiality.**
- [ ] **Asset picture:** Assets captured: investments, real estate, cash, other. **Missing:** specific retirement account types (401k, IRA, pension fund — relevant for tax-advantaged growth modeling), business equity valued separately from "other," art/collectibles distinguishable from vehicles, stock options / RSUs (often a major asset for professionals). **Assess materiality.**
- [ ] **Risk picture:** Does the app give the user a clear picture of their key financial risks? The scorecard addresses: insufficient savings rate, insufficient wealth vs peers, excessive debt, insufficient emergency fund, insufficient investment allocation, insufficient retirement funding, insufficient income replacement. **What risks are NOT addressed?** Concentration risk (all investments in one employer stock or one fund), longevity risk beyond the stated life expectancy (the user might live to 100), sequence-of-returns risk at the point of retirement (the Monte Carlo addresses this partially), inflation risk beyond historical norms, healthcare cost risk in retirement (captured only via the health expense growth rate).
- [ ] **The "what if" picture:** Does the app give the user enough tools to stress-test their plan? Available: sensitivity analysis (expense growth deltas), runway chart (3 return/spend scenarios), surplus deployment (3 strategies). **Missing:** income shock scenario (what if salary stops in 5 years?), major unexpected expense scenario (medical emergency, job loss), interest rate change impact on debt, early death / premature retirement (disability), legacy / estate planning goals.
- [ ] **The action picture:** After seeing all the metrics, does the user know what to DO? The gap-closing levers and surplus deployment tiles provide some guidance. **But:** there is no prioritization of actions (e.g. "build emergency fund first, then pay high-interest debt, then invest"). There is no explicit "if you only do one thing" recommendation. There is no comparison of the impact of each available action. **Assess whether the app should surface a ranked action list based on the user's specific situation.**

### 9.6 Industry benchmarking — how does this metric set compare to best-in-class?

Research and compare the metric set against leading financial planning tools. The goal is not to copy competitors but to identify any standard, well-validated metric that NetWorth Navigator is missing, or any metric NetWorth Navigator has that industry experience suggests is more confusing than helpful.

**Tools to benchmark against:**
- **Vanguard Digital Advisor / Vanguard's Retirement Income Calculator** — focuses on probability-based planning, spending sustainability, income sources
- **Personal Capital (Empower) Retirement Planner** — comprehensive wealth tracking, Monte Carlo, spending analysis, fee analyzer
- **Betterment Retirement Planning** — goal-based, scenario modeling, tax-loss harvesting integration (tax-adjacent)
- **Projection Lab** — advanced FI/FIRE planning tool used by serious planners; very detailed scenario modeling
- **cFIREsim** — community FIRE simulation tool; pure Monte Carlo with historical sequences
- **NewRetirement** — comprehensive retirement planning; Social Security, healthcare, tax estimation

**For each tool, assess:**
- [ ] What is the single most prominent metric on their main dashboard? Does NetWorth Navigator surface an equivalent metric as prominently?
- [ ] How do they present retirement readiness — as a probability, a funding %, a dollar gap, or all three?
- [ ] How do they handle the relationship between the "required nest egg" concept and Monte Carlo survivability — do they present both, or choose one?
- [ ] What do they consider "actionable insights" and how do they surface them?
- [ ] What categories of risk do they explicitly flag that NetWorth Navigator does not?
- [ ] Which of their metrics are considered industry standard (appear in 3+ tools) vs differentiators?

**Industry-standard metrics to verify are present or explicitly acknowledged as out-of-scope:**
- [ ] **Real rate of return** (nominal return minus inflation) — not shown; all returns are nominal
- [ ] **Total projected lifetime income** — not shown
- [ ] **Total projected lifetime expenses** — not shown
- [ ] **Present value of future expenses** — not shown (related to Required Nest Egg but different)
- [ ] **Portfolio withdrawal rate at retirement** (actual %, not just the SWR target) — shown implicitly via Required Nest Egg but not as a standalone metric
- [ ] **Years of savings** (how many years of current expenses are in the portfolio today) — a simpler version of the Required Nest Egg concept; widely used because it's intuitive. Currently the emergency fund metric shows months of expenses covered by cash — a similar concept but only for cash. **Assess whether "years of total expenses covered by total liquid assets" would be a more intuitive metric than the SWR-based Required Nest Egg for non-technical users.**
- [ ] **Sustainable monthly income from portfolio** (current portfolio × SWR / 12) — a very intuitive metric: "if you retired today, how much could you safely spend per month from your investments?" Not currently shown. **Assess.**

### 9.7 The coherence verdict

After completing 9.1–9.6, render a structured verdict on the metric system as a whole:

- [ ] **Is the set complete?** List any material gaps — questions the user naturally has that the app does not answer.
- [ ] **Is the set consistent?** List any metric pairs that can produce contradictory impressions without adequate explanation.
- [ ] **Is the set parsimonious?** List any metrics that appear redundant — that another metric already answers the same question more clearly.
- [ ] **Is the set actionable?** Does each metric lead the user toward a concrete decision or action? List any metrics that inform but do not guide.
- [ ] **Is the set appropriately ordered?** Is the most important information (retirement readiness, current trajectory) the most prominent? Or are secondary metrics (wealth milestones, NW Multiple) competing for attention?
- [ ] **Overall verdict:** Is this a complete, coherent, non-contradictory financial planning instrument? Or does it present a collection of calculations that the user must mentally integrate themselves, with the risk of misinterpretation?

---

## Phase 10 — First-Principles Efficacy Evaluation

> **Purpose:** Now that the metric system has been audited for coherence (Phase 9), step back further and ask the deepest question: is the underlying methodology — not just the metrics, but the financial planning framework and assumptions baked into the model — actually well-founded? Do the formulas reflect how wealth, retirement, and financial risk actually work? Are the defaults, thresholds, and benchmarks grounded in financial planning best practice, or have they been chosen for convenience?

### 10.1 Is the wealth projection model financially sound?

- [ ] **The "surplus sits idle" default:** The base projection does not reinvest the pre-retirement savings surplus into investments. This is safe and conservative. But it means the projection is not modeling any specific real-world behavior — most users ARE doing something with their surplus (spending it, saving it, investing it). The projection is actually modeling a strange edge case (surplus earned and then literally buried). **Assess whether this should remain the default, or whether the app should prompt the user to specify surplus deployment from the first session.** A user who never visits the Surplus Deployment section has a projection that understates their future wealth by a potentially enormous amount.
- [ ] **Cash earns no return:** Over a 20-year horizon, cash in a savings account at even 2% grows significantly. The model treats cash as static. For UAE users, this is partially valid (high inflation erodes real value anyway). But nominally, cash at a bank does earn something. **Assess whether a "cash return" assumption should be added, with a default of 0-2%.**
- [ ] **Single nominal return rate for investments:** The model uses one return rate for all investments (stocks, bonds, ETFs, funds — all bucketed together). A user with a 60/40 stock/bond portfolio has different expected return and volatility than one with 100% equity. The model cannot distinguish. **This is a fundamental limitation. Assess whether a blended return approach (user specifies equity %, bond %, respective returns) would be material for planning accuracy, particularly for risk management near retirement.**
- [ ] **Real estate appreciation without rental income modeling:** Real estate is appreciated at a flat rate, but rental income is modeled under "passive income" separately. This creates an inconsistency: if the user has a rental property worth 800,000 AED generating 40,000 AED/yr income, both the appreciation (in assets) and the rental income (in income) are captured — but they're not linked. If the user sells the property, the income should stop; if the income stops, it should reflect in the assets. **The model treats these as independent, which is correct for simplicity but should be documented as a limitation.**
- [ ] **Sequence-of-returns risk:** Monte Carlo with independent annual draws underestimates sequence-of-returns risk. The most dangerous scenario for retirees is not average bad luck but specifically bad returns in the first years of retirement. Historical sequence-of-returns analysis (as used in cFIREsim) would give a more accurate failure probability than normal distribution draws. **Assess whether the current Monte Carlo, while mathematically defensible, systematically understates true retirement failure risk — and if so, whether the app should communicate this.**
- [ ] **Life expectancy as a fixed endpoint:** The app plans to exactly `profile.lifeExpectancy`. If the user lives longer, their plan fails silently — the model just stops. There is no "longevity buffer" concept. **Assess whether the app should recommend or default to planning to 90–95 rather than 85, or at minimum should show a simple sensitivity: "what if you live to X+10 years?"**

### 10.2 Is the SWR framework the right retirement model for this user base?

The SWR framework (4% rule, Trinity Study) is the most widely used retirement planning heuristic. But it has specific origins and specific limitations.

- [ ] **Origins and validity:** The 4% rule is derived from US stock/bond portfolio data from 1926–1995. It was designed for a 30-year US retirement with no state pension, no Social Security, and tax-advantaged accounts. **For UAE-based expat users:** (1) no state pension is accurate, (2) no tax-advantaged accounts is accurate, (3) 30-year retirement from age 65 is often inapplicable — UAE expats targeting age 55 have a 45-year horizon where historical 4% success rates drop to ~80% even in the US dataset.
- [ ] **For very long horizons (40+ years):** Research (Bengen, Pfau, ERN blog) consistently shows the SWR drops to approximately 3.0–3.5% for 40–50 year horizons. The app's default SWR of 4% may be systematically too aggressive for users who target retirement at 50–55. **Assess whether the app should dynamically suggest a SWR based on the user's expected retirement horizon** (e.g. show a warning when years-in-retirement > 35 and SWR > 3.5%).
- [ ] **Variable withdrawal strategies:** The 4% rule assumes fixed inflation-adjusted withdrawals. Many retirees actually spend less as they age (the "retirement spending smile" — higher early, lower mid-retirement, higher in late retirement due to healthcare). The model's per-category growth rates partially capture this (school fees phasing out, travel phasing out). **But the overall withdrawal model is a fixed-budget approach.** Assess whether guardrail strategies (Kitces, Pfau) or variable percentage withdrawal would give more accurate planning outcomes.
- [ ] **The Required Nest Egg is a SWR target, not a spending-sustainability model:** The Required Nest Egg formula (`spending / SWR`) tells the user how big a portfolio they need so that a fixed SWR withdrawal covers their expenses. This is a planning target, not a guarantee. The Monte Carlo is the actual sustainability model. **Verify that the app's framing does not mislead the user into thinking "100% funded" means they are guaranteed to be fine.** The Required Nest Egg is met → plan is on track by the SWR heuristic; Monte Carlo > 80% → plan is likely to survive under historical volatility. These are different statements and should be presented as complementary, not synonymous.

### 10.3 Are the scorecard thresholds and benchmarks well-founded?

Every colored threshold in the financial health scorecard implies a standard of "good" vs "needs attention." These standards must be grounded in financial planning research, not arbitrary.

- [ ] **Savings rate: 20% threshold.** This is widely cited (CFPB, many financial advisors). BUT: a user in their 20s saving 15% is on track if they started early; a user at 45 saving 15% with a small portfolio is behind. The 20% threshold is context-free. **Assess whether the scorecard should contextualize the savings rate relative to the user's age and current portfolio level, rather than applying a universal threshold.**
- [ ] **Emergency fund: 3–6 months threshold.** This is standard (CFPB, Dave Ramsey, most planners). For UAE expats, the recommended threshold may be higher (6–12 months) because: no unemployment insurance, visa linked to employment (potential forced repatriation on job loss), healthcare not automatically continued. **Assess whether the threshold is appropriate for the target user.**
- [ ] **Debt ratio: <30% threshold.** This is a reasonable heuristic for financial health, but its meaning varies by debt type. A mortgage (low-interest, appreciating collateral) at 50% of assets is very different from consumer debt at 50% of assets. The blended debt ratio does not distinguish. **Flag as a limitation and assess whether the benchmark should be adjusted or the metric should be broken out by debt type.**
- [ ] **Investment mix: 40% threshold.** The claim that 40% of total assets should be in liquid investments is a reasonable rule of thumb for wealth accumulation. But it penalizes users who own property outright (which is real estate wealth, not investment wealth). A user who has paid off a home and has 35% of their assets in investments may be in excellent financial health — the metric would show amber. **Assess whether the benchmark is appropriate or whether it should be conditioned on total asset level or property ownership.**
- [ ] **Fidelity NW Multiple benchmarks.** These are US-centric benchmarks derived from US median salary and retirement patterns. **Cross-reference against any Gulf region or expat-specific benchmarks from financial planning firms operating in the UAE** (e.g. deVere Group, Holborn Assets, or UAE Central Bank guidelines). If no better benchmarks exist, document the US origin prominently so users can contextualize.
- [ ] **Income Replacement Ratio: 70–120% target range.** This range (retirement spending ≈ 70–100% of pre-retirement income) is widely cited. But as noted in Phase 4.7, the formula computes nominal retirement expenses vs today's income — an apples-to-oranges comparison inflated by years of expense growth. **The benchmark range may need adjustment if the formula is not in the same time-period terms.** This is both a calculation error (Phase 4.7) and a benchmark calibration issue — both must be fixed together.
- [ ] **Monte Carlo thresholds: 80% = strong, 60% = caution.** These are reasonable and align with common industry practice. But they depend entirely on the assumptions — a 12% volatility assumption with normal distribution may systematically under- or over-state true risk. **Assess whether these thresholds are appropriate given the model's assumptions and known limitations.**

### 10.4 Does the app produce a plan, or just a dashboard?

The distinction matters. A dashboard shows the user where they are. A plan shows them where to go and what to do. The best financial planning tools do both.

- [ ] **Does the app tell the user what to do next?** The gap-closing levers and surplus deployment tiles provide specific numeric recommendations. But they are buried in tabs, not surfaced as a priority action list. **Assess whether the most important action available to the user — based on their specific financial situation — is surfaced prominently on the main screen or requires navigation to find.**
- [ ] **Is the app reactive or proactive?** Currently the app displays metrics and the user must interpret them. It does not say "based on your inputs, your highest-leverage action is X." **Assess whether a simple priority-ordered recommendation engine (e.g. "Step 1: build emergency fund. Step 2: invest your annual surplus. Step 3: consider retiring at 57 instead of 55.") would meaningfully improve the tool's planning value.**
- [ ] **Does the app guide the user toward the right inputs?** A user might enter unrealistically high investment returns (10%), too short a life expectancy (75), or too low expenses (forgetting major categories). The app has no input validation or reasonableness checks beyond basic clamping. **Assess whether key inputs should carry benchmark context** (e.g. "7% is the historical equity market average; your input of 12% is aggressive — consider whether this is realistic for your portfolio").
- [ ] **Does the app help the user update regularly?** Personal financial planning requires periodic re-assessment (annually at minimum). The app has no session concept, no prompting to update, no comparison to previous snapshots. **Assess whether periodic-review guidance should be built in** (e.g. "Last exported: X months ago. Key things to update: income, expenses, account balances").

### 10.5 Prioritized recommendations

Based on all findings across Phases 1–10, produce a final structured list:

- [ ] **Critical fixes** — formulas that produce wrong numbers (examples: IRR formula mismatch, any confirmed double-counting, metric that conflicts with another with no explanation)
- [ ] **High priority** — metrics or framing that mislead the user, even if mathematically defensible (examples: SWR threshold inappropriate for long horizons without warning, Required Nest Egg vs Monte Carlo contradiction unexplained)
- [ ] **Medium priority** — important gaps in the metric system (examples: no longevity sensitivity, no income shock scenario, no prioritized action list)
- [ ] **Low priority** — code quality, minor improvements, cosmetic
- [ ] **Strategic enhancements** — features or reframings that would significantly improve planning value for the target user (examples: variable SWR recommendation based on retirement horizon, "years of expenses covered" metric, sustainable monthly income metric)

For each item in this list, include: what the issue is, why it matters for the user's financial planning, what the fix or enhancement would look like, and estimated implementation complexity.

---

## Phase 11 — Dead Code, Consistency, and Universality Sweep

### 11.1 Dead code inventory

Search the codebase for:

- [ ] **Unused `useState` variables:** Any `const [x, setX] = useState(...)` where `x` and `setX` are never read in JSX or calculations. Check: `expandedCategories` keys that are never toggled; any scroll/position state that's unused.
- [ ] **Unused `useMemo` values:** Any `const x = useMemo(...)` where `x` is never referenced in the render tree or passed to other functions.
- [ ] **Dead constants:** Any constant defined at the top level but never referenced (check `MILESTONE_COLORS`, `ASSET_TYPES`, `WEALTH_MILESTONES_USD`, `SWR_MIN`, `SWR_MAX`, `GROWTH_RATE_MAX` for actual usage).
- [ ] **Commented-out code blocks:** Search for `//` blocks longer than 2 lines that appear to be deactivated code rather than explanatory comments.
- [ ] **`TODO` and `FIXME` markers:** Search for any outstanding development notes.

### 11.2 Hardcoding and universality violations

The app should work for any user, any currency, any age, any financial situation. Search for violations:

- [ ] **Hardcoded AED amounts:** All defaults (assets, liabilities, income, expenses) are in AED. These are labeled as "UAE-based defaults" in the README. Verify the user can easily override all defaults and that no calculation is anchored to AED amounts.
- [ ] **Hardcoded exchange rates:** `CURRENCIES` has static rates `{AED:1, USD:3.67, CAD:2.72, EUR:4.01}` as fallback defaults. These are clearly labeled as cached defaults. Verify they are not treated as authoritative if the live fetch fails AND the user has entered different rates manually.
- [ ] **Hardcoded Fidelity brackets:** `{30:1×, 40:3×, 55:7×}` are US-centric benchmarks. Document as US-sourced. Verify the tooltip says "Fidelity" (an American company) so users can contextualize.
- [ ] **UAE-centric defaults:** School fees of 80,000 AED/yr, maid service 36,000 AED/yr — these are specifically UAE expat patterns. Verify these are presented as examples the user should replace, not universal norms.
- [ ] **Hardcoded SWR default = 4:** The 4% default is standard but may not be appropriate for all users (see Phase 10.2). It is user-adjustable. Verify the default is not treated as authoritative in any hard-coded way.
- [ ] **Hardcoded wealth milestones in USD:** `WEALTH_MILESTONES_USD = [1,000,000, 5,000,000, 10,000,000, 25,000,000]`. Converted to AED at current rate. **Is showing USD milestones appropriate for all users?** A EUR-based user or CNY-based user would prefer different thresholds. Flag as a UX concern.

### 11.3 Calculation duplication check

Several formulas appear in multiple places. Any divergence between duplicates is a bug.

- [ ] **Net worth calculation:** Appears in `currentNetWorth` useMemo AND inline in `exportHTMLReport`. Verify identical.
- [ ] **Required Nest Egg:** Appears in `retirementMetrics`, `fiAge` useMemo, inline in Retirement tab render, inline in Scorecard render, inline in Surplus Deployment, AND in `exportHTMLReport`. All must use `getRetNominalForYear(retirementCalYear) / (nestEggSwr / 100)`. Verify every instance.
- [ ] **Passive income at retirement (nominal):** The HTML export shows `totalPassive × (1+passiveGrowth)^yearsToRet`. The drawdown formula in `wealthProjection` uses `yearPassive_calc` which compounds from i=0. At i=yearsToRet (the retirement year), `yearPassive_calc = passive × (1+passiveGrowth)^yearsToRet`. **Verify these are the same.**
- [ ] **getRetNominalForYear vs simulateRunway expense calc:** The Runway chart's `simulateRunway` function re-implements the category expense inflation inline rather than calling `getRetNominalForYear`. Verify the inline implementation is mathematically identical.
- [ ] **Monte Carlo withdrawal vs wealthProjection drawdown:** Both compute: `sum(base × (1+rate)^(yearsToRet+year)) − passive − other`. Verify the implementations are identical. Any divergence means Monte Carlo is testing a different scenario than what the projection shows.

---

## Deliverables

At the end of the audit, produce the following:

### Required files

1. **`FINDINGS_AND_RECOMMENDATIONS.md`** — Master findings document listing every issue found, organized by severity (Critical → High → Medium → Low). Each finding must include:
   - Finding ID (F-01, F-02, etc.)
   - Severity level
   - File and line reference (e.g. `src/App.jsx:4938`)
   - What the issue is — both in isolation and in planning context
   - Why it matters (impact on the user's financial planning decisions)
   - What the fix or improvement looks like
   - Estimated fix complexity (trivial / moderate / significant)

2. **`CALCULATION_VERIFICATION_RESULTS.md`** — For every calculation tested in Phases 1–5, record:
   - Formula (from code)
   - Test inputs
   - Expected result (hand-calculated)
   - Actual result (from app)
   - Pass / Fail / Discrepancy
   - Planning context note: does the formula, even if correct in isolation, serve the user's planning needs?

3. **`METRIC_SYSTEM_AUDIT.md`** — The coherence and completeness verdict from Phase 9:
   - Full metric inventory table (every number the app produces, its definition, its decision-purpose)
   - Completeness verdict: what user questions are answered, what are not
   - Conflict map: which metrics can produce contradictory impressions and how this is (or should be) handled
   - Redundancy analysis: which metrics overlap, which are genuinely complementary
   - Industry benchmarking results: how the metric set compares to best-in-class tools
   - Recommended additions, removals, or reframings

4. **`METHODOLOGY_NOTES.md`** — Complete documentation of every formula in the app:
   - Full derivation of each formula
   - All assumptions (explicit and implicit)
   - All known limitations
   - Cross-references to any industry standard the formula is based on (or deviates from)

5. **`FIRST_PRINCIPLES_ASSESSMENT.md`** — Strategic assessment from Phase 10:
   - Is the underlying financial planning framework (SWR model, projection methodology, benchmarks) well-founded for the target user?
   - What's missing or misleading at the framework level (not just the calculation level)
   - Prioritized enhancement list: what would most improve the tool's value for real financial planning
   - Overall verdict: is this a useful financial planning instrument, or a collection of calculations that could mislead as much as they inform?

### Verification summary (in `FINDINGS_AND_RECOMMENDATIONS.md`)

The final section of the findings document must state:
- Total items audited (broken out: calculation checks, coherence checks, edge case tests, UX items, code quality items)
- Total issues found (by severity)
- Top 5 most important findings
- Metric system verdict: Complete / Incomplete / Contradictory / Redundant — with specifics
- Overall production readiness assessment: **Ready / Ready with caveats / Not ready**
- If "Ready with caveats": explicit list of what the user must understand before relying on this tool for real financial decisions

---

## Pre-Identified Audit Flags (To Investigate First)

Based on the codebase read during audit planning, these specific items were flagged as the highest-risk areas. Prioritize these in Phase 1–5:

| # | Area | Risk | Phase |
|---|------|------|-------|
| 1 | `income.salary` vs sub-item sum in NW Multiple scorecard | High — NW Multiple may use stale/wrong denominator | 1.2, 4.2 |
| 2 | `expenses.current` sync with `expenseCalculator` state | High — savings rate / emergency fund may use stale expense figure | 1.3, 4.4 |
| 3 | IRR formula uses nominal retirement expense vs today's income — inflation mismatch | High — metric may be misleading for users | 4.7, 9.1 |
| 4 | `drawdown` condition is `age > retirementAge` not `age >= retirementAge` | Medium — first year of retirement has no drawdown, may understate depletion | 1.8 |
| 5 | Retirement Runway `simulateRunway` re-implements expense inflation inline instead of calling `getRetNominalForYear` | Medium — divergence risk if one is updated without the other | 10.3 |
| 6 | Monte Carlo success condition checks `investments > 0` at end of life expectancy — but exhaustion can happen mid-retirement. Verify the simulation detects EARLY exhaustion not just final balance | Medium | 3.2 |
| 7 | "Save More" lever shows TOTAL extra savings needed, not netted against existing surplus — may be confusing | Medium — user may think they need to INCREASE savings by extraMonthly, not knowing their existing surplus already partially covers it | 5.1 |
| 8 | Gap-closing levers only fire when `!onTrack` (nest egg gap). What about users who are ON TRACK for the nest egg but have low Monte Carlo success? The `isOnTrackWeak` case. | Medium — levers not shown but improvement is needed | 5.1 |
| 9 | `fiAge` useMemo has a different inflation formula for pre-retirement years than `getRetNominalForYear` — intentional design, but verify correctness | High — FI Age and Required Nest Egg may be calculated on different bases | 1.5 |
| 10 | Surplus Deployment Tile 2 uses `totalDebtToday` (today's full debt) but base projection also amortizes debt — potential double-counting confusion | Medium | 5.4 |
| 11 | Cash not included in SWR nest egg or Monte Carlo, but tooltip for `otherAssets` implies "only Investments and Cash are liquid" — creates user expectation mismatch | High | 9.3 |
| 12 | OTE amounts are added both in `getProjectedExpenses` (for pre-ret calc) and separately in `wealthProjection` — verify no double-counting via `excludeOTEs` flag | Critical | 1.9 |
| 13 | Retirement Funding % (nest egg coverage) and Monte Carlo success % (simulation survival) can simultaneously show contradictory signals (green + red) — verify the verdict system explains this and guides the user correctly | High — risk of confusion and wrong conclusions | 9.3 |
| 14 | Required Nest Egg is computed from Day 1 retirement budget (no phase-outs); Runway chart DOES model phase-outs — two answers to "will my money last" that will diverge for users with significant phase-outs | High — apparent contradiction with no explanation | 9.3 |
| 15 | Income Replacement Ratio uses nominal retirement expenses (inflated forward) vs today's income — inflation mismatch makes the metric systematically misleading; the 70–120% benchmark also becomes uncalibrated | High — methodology and benchmark both wrong | 4.7, 10.3 |
| 16 | The base projection shows surplus as idle — a user who never visits Surplus Deployment gets a materially understated wealth projection with no prominent signal that the number is the worst-case, not the base case | High — default framing misrepresents typical user situation | 10.1 |
| 17 | No metric directly answers "what is my highest-leverage action right now?" — gap-closing levers and surplus deployment give components but no ranked synthesis | Medium — app informs but does not guide | 9.2, 10.4 |

---

## What NOT To Do During the Audit

- **Do not fix code during the audit.** Document issues only; let the user decide what to fix and when.
- **Do not assume any formula is correct because it has been in the app for a long time.** Every formula must be independently verified.
- **Do not skip edge cases because they seem unlikely.** Financial planning tools are trusted with real decisions. A bug that triggers only at age 30 or with zero investments can cause genuine harm.
- **Do not mark a calculation as "probably correct" without a numerical verification.** Use actual numbers. Show your work.
- **Do not conflate documentation errors with code errors.** They are separate findings. A tooltip that says the wrong thing is a High finding even if the underlying code is correct — users make decisions based on what they read.
- **Do not ignore first-principles concerns just because the app is internally consistent.** A mathematically consistent but conceptually wrong metric (like the IRR mismatch) is a High finding.

---

*NetWorth Navigator Audit Plan — Drafted March 2026*
*Reference framework adapted from SpendAnalyzer Pre-Production Audit Instructions*
