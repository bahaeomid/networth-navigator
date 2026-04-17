# NetWorth Navigator — Full Codebase Audit Plan
**Version:** 2.0 (Definitive — Pre-Production)  
**Prepared by:** Claude Sonnet 4.6 (Codebase Auditor Skill v2)  
**Codebase:** `networth-navigator-master/` — `src/App.jsx` (7,668 lines), React 18, Vite  
**App Version:** 2.0.0  
**Date:** April 2026  
**Basis:** Full independent scan of entire codebase + critical review of prior Auditor 1, 2, and 3 findings

---

## How to Use This Document

This is a **plan**, not a report. It tells the executing auditor exactly what to examine, how to verify it, and what pass criteria to meet. It does not pre-determine the findings — those are discovered during execution.

**Three stages, always in this order:**
1. This plan is approved → execution begins
2. Each phase is executed in sequence: investigate → document findings → next phase
3. After all phases: synthesis and go/no-go verdict

**Findings format during execution:**
```
[SEVERITY] FINDING-{N}: {Title}
File: {path}:{line}
Phase: {N}
Description: {what the problem is — factual}
Evidence: {specific code, formula trace, or test}
Before: {what user gets today — concrete example with real values}
After: {what they should get — same example}
Fix: {specific change: file, function, what to change}
Effort: Trivial / Moderate / Significant
```
**Severity levels:** CRITICAL (silent wrong results, data loss, security) · HIGH (user sees wrong output) · MEDIUM (fragile, breaks under plausible conditions) · LOW (code quality, docs, cosmetic)

---

## Prior Audit Assessment

Three auditor reports (Auditors 1, 2, 3 — all dated March 28, 2026) exist in `Final Audit/`. Before executing this plan, the following assessment of their findings guides what to independently re-verify vs. treat as settled:

### Credible findings — independently verify and incorporate if confirmed
| Prior ID | Source | Claim | My Assessment |
|----------|--------|-------|---------------|
| F-02/F-03 | A1, A2, A3 | `annualSavings = Math.max(0, ...)` floors negative savings at 0%, masking overspending | **Likely valid.** Independently verify the exact user-visible effect. |
| F-06/F-04 | A2, A3 (F-01) | Cash excluded from Monte Carlo — `portfolioAssets` only passes `investments` | **Likely valid.** Verify whether the tooltip discloses this. The fix may be documentation OR logic depending on intent. |
| F-04/F-02 | A1, A2, A3 | NW Multiple scorecard uses `income.salary` (top-level) while `annualIncome` uses sub-items sum when present | **Likely valid.** Verify via code trace. |
| F-09/F-06 | A1, A2, A3 | "Retire Later" lever computes compounding only — excludes additional salary income during extended working years | **Valid by design intention or limitation.** Verify whether tooltip discloses this. |

### Disputed findings — re-examine independently, do not trust either side
| Prior ID | Dispute | What to Re-examine |
|----------|---------|-------------------|
| A1 Sub-item Sync | A1 claims bug; A2/A3 claim false positive | Read `syncCategoryTotal` call sites. Verify whether a scenario exists where `currentNetWorth` and `annualIncome` use different data states simultaneously. |
| A1 Drawdown Timing | A1 claims one-year understatement; A2/A3 claim correct | Trace the exact loop execution at `age === retirementAge` vs `age === retirementAge + 1`. Determine which year receives its first drawdown deduction to the balance. |
| A1/A2/A3 IRR definition | A1 calls it a bug; A2/A3 call it conventional | Verify the actual formula. The real question is whether the tooltip accurately describes what the metric means and whether users can misinterpret it. |

### Prior findings confirmed as false positives — do not re-open
*(None confirmed as definitively false positive without independent verification — the above disputed items must be re-examined.)*

### Significant gaps in all three prior audits — new investigation required
The following areas were not substantively covered by any prior auditor and require fresh investigation:
- XSS/HTML injection in `exportHTMLReport` (user-controlled strings into HTML template)
- Currency conversion round-trip integrity and GBP partial-support gap
- `getRetNominalForYear` consistency across all call sites (fiAge, scorecard, gap levers, HTML export)
- `annualContribution = 0` hardcoded in Monte Carlo — surplus not in simulation
- Cash balance earning zero return over multi-decade projections (undisclosed)
- OTE (one-time expense) double-inflation risk
- CSV import edge cases (BOM, header not in first 5 lines, missing columns)
- All edge cases (zero income, zero SWR, retirementAge = currentAge, etc.)
- Documentation sync (README claims vs. code)
- Gap levers "Higher Return" using only current investments, not contributions

---

## Stage 0: Codebase Intelligence (Already Complete)

The full scan has been performed. Key findings that shape this plan:

**What this codebase does:**  
A single-file React application (7,668-line `App.jsx`) that takes a user's financial inputs and produces: net worth tracking, year-by-year wealth projections, Monte Carlo retirement survival odds, a financial independence (FI) age, 7-metric financial health scorecard, and 3 gap-closing lever calculations — all computed client-side in the browser with no backend.

**Critical paths (if wrong, everything downstream is wrong):**
1. `wealthProjection` useMemo — master year-by-year projection loop; feeds all charts and downstream metrics
2. `runMonteCarloSimulation` — 1,000 Box-Muller scenarios; produces the survival odds users use to judge retirement viability
3. `fiAge` useMemo — scans `wealthProjection` for first year `investments ≥ requiredPortfolio`; primary FI verdict
4. `getRetNominalForYear` / `getLifeStageExpense` — per-category expense inflation engine; feeds nest egg, scorecard, gap levers
5. Gap-closing levers (inline render, ~line 4959) — three independent solver formulas derived from the gap between projected and required portfolio

**Languages / stack:** JavaScript/JSX (React 18), Recharts, Vite. No backend. No test runner. No test files.

**Red flags from scan (will be investigated in phases below):**
- `portfolioAssets` passed to Monte Carlo contains only `investments`, not `cash` (~line 2587)
- `annualContribution = 0` hardcoded in the Monte Carlo call from `retirementMetrics` (~line 2604)
- `assets.cash` never compounds in `wealthProjection` — sits flat for entire projection horizon
- `annualSavings = Math.max(0, ...)` — negative savings floored at zero
- NW Multiple: `income.salary` (top-level field) used as denominator, not sub-items sum
- XSS candidate: user-supplied names (e.g., `i.name`) interpolated directly into `exportHTMLReport` HTML template strings
- GBP defined in `CURRENCIES` constant but README documents only 4 currencies; CSV import doesn't detect GBP
- `annuityFactor` in "Save More" lever uses nominal return — no real-return adjustment
- "Higher Return" lever: `neededCagr = (requiredNestEgg / assets.investments)^(1/N) - 1` — ignores any future contributions
- `getRetNominalForYear` called from multiple surfaces — parity risk
- OTE inflation in `retirementMetrics` pre-inflates into nominal, then Monte Carlo deducts from nominal balance — verify not double-applied
- `fiAge` uses `retirementBudget` for required portfolio even for pre-retirement years
- FX API: no validation that `data.rates.USD/CAD/EUR/GBP` are non-zero before `1 / data.rates.X` — Infinity propagation risk (lines 751-754)
- `formatCurrency` / `formatCurrencyDecimal` / `toDisplay`: no guard for `rate === 0` — Infinity if exchangeRates corrupted (lines 29, 45, 66)
- Falsy `|| 1` masking: `assets.investments || 1` (line 3962) silently changes 0→1 for chart scaling; `exchangeRates[csvCurrency] || 1` (line 2062) could corrupt CSV import conversion
- Growth rate validation inconsistency: `passiveGrowth` (line 7119) and `otherIncomeGrowth` (line 7160) accept any value with no bounds — other growth rates validate [0, 20-30]
- `getRetNominalForYear` returns `Infinity` when `nestEggSwr <= 0` (line 4514) — propagates into charts/projections
- `handleRemoveCat` fires 8 separate `setState` calls (lines 2274-2283) — React 18 batches but intermediate reads could see inconsistent state
- `getMilestoneEvents()` called multiple times per render without memoization — performance

---

## Phase 1: Documentation Sync

**Objective:** Every claim in every documentation file matches what the code actually does. Code is truth; docs are suspects.

**Key targets:**
- `README.md` — "Calculations" section, "Features" section, "Key Assumptions & Methodology" table, "Limitations" section, all import/export documentation
- `TOOLTIPS` constant in `App.jsx` (~lines 78–110) — every tooltip text claim
- In-app informational paragraphs (the methodology notes visible in the app's documentation section, ~lines 1627–1690)

**Specific checks — verify each against code:**

| Claim to Check | Where It's Made | Code to Compare Against |
|---------------|-----------------|------------------------|
| "Monte Carlo: 1,000 simulations with normally distributed returns (Box-Muller transform)" | README | `runMonteCarloSimulation`, line ~383 |
| "Success = portfolio balance > 0 at life expectancy" | README | Line ~443 `if (investments > 0)` |
| "Safe Withdrawal Rate: 4%" | README defaults table | `useState(4)` for `nestEggSwr`, line ~687 |
| "AED, USD, CAD, or EUR with real-time conversion" | README | `CURRENCIES` constant — GBP is also defined; verify full list |
| "CSV: Monthly amounts multiplied by 12" | README | `importExpensesCSV`, line ~1962 |
| "Importing replaces all current data" | README | `importData` — verify full state overwrite |
| "Retirement amounts pre-filled with same annual figures" | README | CSV import handler — verify retirement budget is also populated |
| "Growth rates default to 3% per year" after CSV import | README | CSV import handler — find default growth rate assignment |
| "Salary income stops at retirement age" | TOOLTIPS.salary | `yearSalary_calc` condition: `age < profile.retirementAge` |
| "Other assets treated as illiquid — do not contribute to SWR drawdown" | TOOLTIPS.otherAssets | Drawdown code — verify `otherAssetValue` is never drawn |
| "Drawdown: net shortfall is withdrawn from portfolio" | TOOLTIPS.drawdown | Exact formula: `Math.max(0, inflationAdjustedExpense + oneTimeExpense - postRetIncome)` |
| "Mortgage: linear amortization to zero by end year" | TOOLTIPS.mortgage | `amortizeLiability` function |
| "Without end year: mortgages default to 25-year term" | TOOLTIPS.mortgage / TOOLTIPS.netWorth | `amortizeLiability` default term parameter |
| "Loans default to 5-year term" | TOOLTIPS.loans | `amortizeLiability` default term for loans |
| "FI Age: earliest age when investment portfolio ≥ Required Nest Egg" | README | `fiAge` useMemo — verify it scans `investments` not total assets |
| NW Multiple Fidelity brackets: 1× at 30, 3× at 40, 7× at 55, 10× at retirement | README doc section (~1688) | Brackets array in scorecard code (~line 3454) |
| "Savings Rate target: 20%+" | README features list | Scorecard threshold `>= 20` |
| "Investment Mix target: 40%+" | README | `imVal >= 40` threshold |
| "Emergency Fund target: 6+ months" | README | `efMonths >= 6` threshold |
| "Income Replacement Ratio target: 70-120%" | README | `irrVal >= 80 && irrVal <= 120` — note README says 70–120, code uses 80–120 |

**Output:** List of every documentation claim with verdict (✓ matches / ✗ contradicts / △ unclear). For each contradiction: document both the stated claim and the actual code behavior. Draft corrected tooltip/doc text.

**Pass criteria:** Zero claims in any doc that contradict code. All discrepancies either corrected in docs or flagged as HIGH findings if the code itself is wrong.

---

## Phase 2: Dead Code & Structure Audit

**Objective:** Every defined function, constant, and import is actually used. No commented-out code without rationale.

**Specific checks:**

- `TOOLTIPS.inflationRate` — explicitly marked in a comment as "removed — superseded by per-category retExpenseGrowthRates." Verify it is not referenced anywhere. If not referenced, it is dead and should be removed.
- `formatCurrencyDecimal` (line ~43) vs `formatCurrency` (line ~27) — both defined. Confirm both are actively used in distinct contexts and neither is a redundant duplicate.
- `millionaireYear` variable (~line 2751) — labeled "legacy support." Find all references. If only referenced in one place, verify that place isn't also reachable via `wealthMilestones`.
- `GBP` entry in `CURRENCIES` constant (line ~10) — README does not document GBP as supported. Find all references to `GBP` throughout the file. If it's in the currency selector UI, it is live. If not, it's dead.
- `buildDefaultExpenseState` function (~line 576) — find all call sites. Is it called only on reset, or also during initial render? Verify it's not duplicated inline elsewhere.
- `GROWTH_RATE_MAX` constant — find its definition and every reference. Verify the cap is consistently applied to all growth rate inputs.
- **Growth rate input inconsistency:** `passiveGrowth` (line 7119) and `otherIncomeGrowth` (line 7160) use `parseFloat(e.target.value) || 0` with NO bounds check. `salaryGrowth` validates [0, 30], `investmentReturn` validates [0, 30], `realEstateAppreciation` validates [0, 20]. Check: can a user enter `-100` or `999` for passive/other growth and silently corrupt projections?
- **Dead CSS classes in `src/index.css`:** Cross-reference every CSS class/selector in `index.css` against actual usage in `App.jsx`. Remove any unused selectors.
- Any `TODO`, `FIXME`, or `HACK` comments — enumerate and assess: still outstanding, or resolved?
- Any commented-out code blocks — assess: dead and safe to delete, or intentionally preserved?
- `_tooltipListeners` / `_tooltipBus` pub-sub pattern — verify this is the only tooltip mechanism in the file; no second tooltip system.

**Output:** Dead code inventory with recommendation (remove / keep with documented reason). List of all TODO/FIXME comments with status assessment.

**Pass criteria:** No dead code remains without explicit rationale. No duplicate function definitions. All TODO/FIXMEs assessed.

---

## Phase 3: Universality & Hardcoding Audit

**Objective:** The application is not silently tailored to a specific user, region, or locale. Every configurable value comes from config or user input.

**Specific checks:**

**Default values:**
- Enumerate all `useState` initial values in `NetWorthNavigator` (~line 589+). Which ones are AED-denominated hardcoded amounts (e.g., default salary, default assets, default expenses)? Are these disclosed as "example defaults" or presented as recommendations?
- `buildDefaultExpenseState`: what AED amounts are seeded as default expenses? Are they UAE-realistic only?
- Default `exchangeRates` state: USD 3.67, CAD 2.72, EUR 4.01, GBP 4.87. These are hardcoded. The AED/USD peg is fixed, but CAD/EUR/GBP float. Is there any mechanism to update rates, or are users expected to override manually?

**Hardcoded thresholds in logic:**
- Emergency fund: 6-month threshold — universal? Appropriate for UAE where no state safety net vs. countries with strong social security?
- Savings rate thresholds: 10%, 20% — universal?
- Fidelity NW Multiple brackets (1×/3×/7×/10×) — US benchmark, applied globally. Is this disclosed as US-derived?
- 4% SWR default — Trinity Study (1998), US market data, 30-year horizon. Disclosed as US-derived? Is a 40-50 year retirement horizon addressed?
- `WEALTH_MILESTONES_USD` thresholds ($1M, $5M, $10M, $25M) — hardcoded in USD. Verify these are displayed clearly as USD regardless of display currency, or converted at display time.

**Currency/locale hardcoding:**
- Any currency symbols (`$`, `AED`, `USD`) hardcoded in logic strings rather than derived from `CURRENCIES[currency]`?
- Any absolute file paths in source code or config?
- `GROWTH_RATE_MAX` — what is the cap? Is it appropriate globally (some markets have historically had very high nominal returns)?

**Output:** List of every hardcoded value found, classified as: (a) acceptable constant (b) should be config-driven (c) should be disclosed as assumption.

**Pass criteria:** No hardcoded user-specific identifiers. All hardcoded thresholds are either universal constants or explicitly disclosed as region/context-specific defaults.

---

## Phase 4: Logic & Formula Verification *(most critical phase)*

**Objective:** Every calculation produces the exact number a user would compute by hand. All prior auditors claimed core formulas are correct — this phase independently hand-verifies each one using computed expected values, not code output.

> **Protocol:** For each formula, choose a concrete dataset with known inputs. Compute the expected output BY HAND (not by running the code). Compare to what the code would produce by tracing the function with those inputs. Document the full trace.

---

### 4.1 — Net Worth (Basic Sanity)
**Formula:** `totalAssets - totalLiabilities`  
**Hand-verify:** With assets = {cash: 100K, investments: 500K, realEstate: 1M, other: 50K} and liabilities = {mortgage: 600K, loans: 50K, other: 10K}  
**Expected:** 1,650K - 660K = 990K AED  
**Code trace:** Confirm both `currentNetWorth` useMemo (line ~2294) and the inline recalculation in HTML export (line ~819) produce the same result.

---

### 4.2 — Annual Income (Sub-items vs. Top-Level)
**Critical check:** When `income.salaryItems` are present, `annualIncome` sums sub-items. When they are not, it uses `income.salary`. Are there any paths in the application that use `income.salary` directly when sub-items are present?  
**Enumerate every reference to `income.salary` in the file.** Classify each as: (a) correctly guarded by sub-items check (b) unguarded — potential staleness bug.  
**Specific surface to check:** NW Multiple scorecard (`sal = income.salary || 0`, ~line 3445) — this is unguarded. Verify the discrepancy with `annualIncome`.

---

### 4.3 — Wealth Projection Core (`wealthProjection` useMemo, ~line 2476)
Trace the loop for Years 0, 1, and the retirement transition year using a concrete scenario:

**Dataset:**
- currentAge: 40, retirementAge: 60, lifeExpectancy: 85
- investments: AED 500,000, cash: AED 100,000, realEstate: AED 800,000, other: AED 0
- salary: AED 300,000/yr, passive: AED 0, other income: AED 0
- annualExpenses (current): AED 200,000
- investmentReturn: 7%, realEstateAppreciation: 3.5%
- enableDrawdown: true, retirementBudget: AED 150,000/yr (today's terms)
- retExpenseGrowthRate: 3% per category

**Hand-verify Year 0 (i=0, age=40):**
- Push: investments=500K, cash=100K, realEstate=800K, netWorth=500+100+800-liabilities
- Growth applied after push: investmentBalance = 500K × 1.07 = 535K
- realEstateValue = 800K × 1.035 = 828K

**Hand-verify Year 1 (i=1, age=41):**
- Push: investments=535K (as computed above)
- Growth: 535K × 1.07 = 572.45K

**Hand-verify the retirement year (age=60, i=20):**
- Is drawdown applied? Condition is `age > retirementAge` (strictly greater), so: NO drawdown in the retirement year. Verify this is what the code produces.
- Is salary income zero? Condition is `age < retirementAge` (strictly less), so: salary IS zero in the retirement year.
- Verify: what income and expenses does the retirement-year data row show?

**Hand-verify Year after retirement (age=61, i=21):**
- retirementExpense at year 61 = 150,000 × 1.03^(20+1) = 150,000 × 1.03^21
- 1.03^21 ≈ 1.8603; nominal = ~279,045 AED
- drawdown = max(0, 279,045 - 0 passive income) = 279,045
- investmentBalance = max(0, prior_investments × 1.07 - 279,045)
- **Verify code produces this.**

**Cash balance check:**
- Cash stays constant at AED 100,000 throughout all 45 projection years. Is this what the code produces? Is it documented?

---

### 4.4 — Monte Carlo Simulation (`runMonteCarloSimulation`, line 383)

**4.4.1 — Box-Muller Transform**  
Formula: `z = sqrt(-2 × ln(u1)) × cos(2π × u2)`  
This is the standard Box-Muller transform. Verify: the result `z` is approximately N(0,1). Then:  
`investmentReturn = assumptions.investmentReturn + z × assumptions.investmentStdDev`  
This produces a normal distribution with mean=`investmentReturn` and std=`investmentStdDev`.  
**Verify correctness by inspection — the prior auditors confirmed this is correct, but independently confirm the formula against the standard Box-Muller definition.**

**4.4.2 — Operation Sequence per Year**  
Each simulation year:
```
investments = investments × (1 + investmentReturn/100)
investments += annualContribution                     [= 0 in production call]
investments -= yearlyWithdrawals[year]                [pre-computed withdrawal]
investments -= oneTimeHit.amount (if applicable)
if investments <= 0: break (failure)
```
**Hand-verify sequence matters:** Does applying growth before withdrawal vs. after produce a different result? At 7% return, 500K portfolio, 30K withdrawal:
- Growth first: 500K × 1.07 = 535K → 535K - 30K = 505K ✓
- Withdrawal first: 500K - 30K = 470K → 470K × 1.07 = 502.9K ✗
**Confirm code applies growth BEFORE withdrawal.** Check line ~431–436.

**4.4.3 — `annualContribution = 0` hardcoding**  
In `retirementMetrics` useMemo (line ~2604), the call to `runMonteCarloSimulation` passes `annualContribution = 0`. This means the Monte Carlo does not include any future savings contributions in the simulation.  
**Verify:** Is this disclosed to the user? Does any tooltip or label indicate that the survival odds assume no future contributions?  
**Assess impact:** If a user has a 20-year pre-retirement horizon and is saving AED 10,000/month, excluding this from the simulation may significantly understate survival odds.  
**Note:** The Monte Carlo is only called post-retirement (uses `retirementData.investments` as starting portfolio), so "contribution" during the retirement simulation itself is correctly 0. The question is whether pre-retirement contributions are included in the starting investment balance. They ARE included via `wealthProjection` — but only deterministic compounding. **Clarify this architecture and document whether the concern is valid or not.**

**4.4.4 — Passive Income Offset in Simulation**  
The phaseOutSchedule passive income offset formula:
```
passiveOffset = passive × (1 + passiveGrowth)^(ytr + year) + other × (1 + otherGrowth)^(ytr + year)
```
Compare this exactly against the drawdown formula in `wealthProjection`:
```
postRetIncome = yearPassive_calc + yearOtherIncome_calc
```
Where `yearPassive_calc = passive × (1 + growthRate)^i` (i = years since today).  
**Are these two formulas computing the same thing?** The exponents differ: simulation uses `ytr + year`, projection uses `i`. At retirement, `i = ytr`, and `year` in the simulation = years into retirement. So exponent in simulation = ytr + years_into_retirement, exponent in projection = ytr + i_into_retirement. **These should be equivalent — verify.**

**4.4.5 — One-Time Expense Double-Inflation**  
In `retirementMetrics`, OTEs are pre-inflated into nominal amounts before being passed to Monte Carlo. The Monte Carlo then deducts these nominal amounts from the (also nominal) investment balance.  
**Verify the pre-inflation formula matches wealthProjection's OTE inflation:**
- retirementMetrics OTE: `amount × (1 + preRate)^yearsToRet × (1 + retRate)^yearsIntoRet`  
- wealthProjection OTE: same two-segment formula  
**If they match, no double-inflation. If they differ, it is a finding.**

---

### 4.5 — FI Age (`fiAge` useMemo, ~line 2695)

**Formula:** For each year in `wealthProjection`, compute `nominalExpense = getRetNominalForYear(calYear)` (or a proxy pre-retirement). Then `requiredPortfolio = nominalExpense / swrDecimal`. First year where `d.investments >= requiredPortfolio` is FI Age.

**Issue to investigate:** Before retirement age, `fiAge` uses `retirementBudget` inflated forward — not `expenseCalculator` (current expenses). This means FI Age is always computed against the user's *retirement* spending plan, not their *current* spending. This is actually the correct behavior (FI = can fund retirement lifestyle), but verify the tooltip accurately conveys this.

**Hand-verify with scenario:**
- retirementBudget: AED 150,000/yr today's terms, retExpenseGrowthRate: 3%, SWR: 4%
- yearsToRetirement: 20, so at retirement: 150,000 × 1.03^20 ≈ 270,747 AED
- requiredNestEgg at retirement age = 270,747 / 0.04 = 6,768,675 AED
- Check: does `fiAge` find the year where investments ≥ this amount? Confirm via code trace.

**At age 40 (current age, year 0):**
- nominalExpense pre-retirement: 150,000 × 1.03^0 = 150,000 (0 years ahead)
- requiredPortfolio = 150,000 / 0.04 = 3,750,000
- If investments = 500,000, FI Age is NOT now.

---

### 4.6 — Gap-Closing Levers (~line 4959)

All three levers only activate when `yearsToRetire > 0 && !onTrack`. Trace each:

**Lever 1: Save More**
```
annuityFactor = (Math.pow(1 + r, N) - 1) / r
extraAnnual = absGap / annuityFactor
extraMonthly = extraAnnual / 12
```
Where `r = investmentReturn / 100`, `N = yearsToRetire`, `absGap = requiredNestEgg - retirementWealth`.

**Hand-verify with:**
- r = 0.07, N = 20, absGap = AED 2,000,000
- annuityFactor = (1.07^20 - 1) / 0.07 = (3.8697 - 1) / 0.07 = 2.8697 / 0.07 = 40.995
- extraAnnual = 2,000,000 / 40.995 = 48,786 AED/yr
- extraMonthly = 48,786 / 12 = 4,066 AED/month
- **Verify code produces ~4,066 AED/month for these inputs.**

**Methodology critique:** This annuity factor assumes contributions are invested at return `r` (nominal, e.g., 7%). This is correct for nominal savings. The question is whether the `absGap` is also in nominal terms — it should be, since `requiredNestEgg` is computed from nominal retirement expenses.

**Lever 2: Retire Later**
The lever takes `retData.investments` (portfolio at planned retirement age) and compounds it forward year by year at rate `r`, comparing to `candidateNestEgg = getRetNominalForYear(candidateCalYear) / (nestEggSwr / 100)` each year.

**Hand-verify:** If retData.investments = AED 2,000,000 and requiredNestEgg at age 60 = AED 4,000,000:
- Year 1 (age 61): 2,000,000 × 1.07 = 2,140,000. candidateNestEgg at age 61 = getRetNominalForYear(calYear_61) / 0.04 — this will be slightly higher than at age 60 due to one more year of inflation.
- Continue until extInv >= candidateNestEgg.

**Issue to verify:** The lever computes "how long for existing portfolio to compound to target" — it does NOT include continued contributions (salary savings) during the extra working years. Is this disclosed in the UI?

**Lever 3: Higher Return**
```
neededCagr = (requiredNestEgg / assets.investments)^(1/yearsToRetire) - 1
```
**Hand-verify:** requiredNestEgg = 6,000,000, assets.investments = 500,000, yearsToRetire = 20:
- ratio = 12.0
- neededCagr = 12.0^(1/20) - 1 = 12.0^0.05 - 1
- 12^0.05 = e^(0.05 × ln(12)) = e^(0.05 × 2.4849) = e^0.12424 ≈ 1.1323
- neededCagr ≈ 13.2%
- neededReturnPct = Math.round(0.132 × 1000) / 10 = 13.2%
- If > 30%, shown as N/A. **Verify code produces ~13.2% for these inputs.**

**Critical issue to verify:** This formula uses only `assets.investments` as the starting value — ignoring any savings that will be added over the 20 years. This means it solves "what single rate would grow today's portfolio alone to the target?" not "what return would make the overall plan work?" Verify whether this is documented or disclosed.

---

### 4.7 — Scorecard Metrics

For each metric, verify the formula is exactly as documented, has a zero-denominator guard, and the threshold brackets match the README:

| Metric | Formula | Zero-guard | Threshold bands | Notes to verify |
|--------|---------|------------|-----------------|-----------------|
| Savings Rate | `max(0, income - expenses) / income × 100` | `income > 0` | ≥20 green, ≥10 amber, <10 red | Verify `max(0,...)` — negative case |
| NW Multiple | `currentNetWorth / sal` | `sal > 0` | vs. interpolated Fidelity target | `sal = income.salary`, not sub-items |
| Debt Ratio | `totalLiabilities / totalAssets × 100` | `totalAssets > 0` | <30 green, <50 amber, ≥50 red | Uses today's snapshot only |
| Emergency Fund | `cash / (expenses.current / 12)` | `monthlyExp > 0` | ≥6 green, ≥3 amber, <3 red | What if expenses.current = 0? |
| Investment Mix | `investments / totalAssets × 100` | `totalAssets > 0` | ≥40 green, ≥20 amber, <20 red | README says 40%, verify |
| Retirement Funding | `retirementWealth / requiredNestEgg × 100` | `reqNestEgg > 0` | ≥100 green, ≥85 green, ≥50 amber, <50 red | Two green bands — verify intent |
| Income Replacement Ratio | `retNominalExp / annualIncome × 100` | `preRetIncome > 0` | 80–120 green, >120 amber, ≥70 amber, <70 red | README says 70–120; code uses 80–120 lower bound |

**IRR specific investigation:** This metric compares inflation-adjusted future retirement spending to today's income. A user spending AED 200K/yr today in retirement (in today's terms) will have a nominal figure of ~360K at 3% inflation over 20 years. Their current income is AED 400K. IRR = 360/400 = 90% — shown as green. But the user might perceive this as "I only need 90% of my current income" which in real terms is actually a ~55% replacement ratio (200K/400K). **Verify the tooltip fully explains this nominal vs. real distinction.**

---

### 4.8 — Liability Amortization

**Formula:** `amount × (endYr - year) / term`

**Hand-verify:** Mortgage of AED 1,200,000, end year = currentYear + 25, in year 5:
- term = 25, years elapsed = 5, endYr - year = 20
- balance = 1,200,000 × 20/25 = 960,000 AED

**Compare to real mortgage schedule:** On a 25-year mortgage at 0% interest, linear amortization is exact. At 5% interest, the actual balance after 5 years on a AED 1.2M loan would be ~AED 1,062,000 (much higher, because early payments are mostly interest). The linear model understates the early balance by ~10%.

**Assess and document:** Is this simplification disclosed? Is the magnitude of error material for users with large mortgages? Flag as LOW finding if undisclosed, or MEDIUM if the error is large enough to materially affect net worth projections.

---

**Phase 4 Output:** Complete formula verification table. Every formula either PASS (with hand-computed trace) or FINDING (with discrepancy documented).

**Pass criteria:** All critical formulas independently hand-verified against expected values. All division operations confirmed to have zero-denominator guards. All methodology choices assessed for appropriateness.

---

## Phase 5: Parity Audit

**Objective:** Identify every place where "the same" computation is done in more than one location. Verify they produce identical results for identical inputs.

**Known parity risks to check:**

**5.1 — Passive Income Offset: Projection vs. Monte Carlo**  
`wealthProjection` drawdown formula (post-retirement): `postRetIncome = yearPassive_calc + yearOtherIncome_calc`  
Monte Carlo phaseOutSchedule formula: `passiveOffset = passive × (1+passiveGrowth)^(ytr+year) + other × (1+otherGrowth)^(ytr+year)`  
**Check:** At `year=0` (first retirement year), `ytr+year = ytr`. In wealthProjection, `i = ytr`. Are the exponents identical?  
**Check:** Does one formula use `passiveGrowth/100` (decimal) and the other use the raw percentage? Trace exactly.

**5.2 — Net Worth: `currentNetWorth` useMemo vs. HTML Export vs. Dashboard Inline**  
`currentNetWorth`: lines ~2294–2296  
HTML export: lines ~819–821  
Dashboard inline `_ta` / `_tl`: lines ~3432–3433  
All three must sum to the same total assets and liabilities. Enumerate exactly which fields each path sums and verify they are identical.

**5.3 — `getRetNominalForYear` Call Sites**  
This function is the single source of truth for nominal retirement expenses. Find every call site:
- `fiAge` useMemo
- Scorecard: Retirement Funding tile
- Scorecard: Income Replacement Ratio tile
- Gap levers: `requiredNestEgg` in Retirement Health section
- HTML export: `requiredNestEgg` calculation
- Monte Carlo phaseOutSchedule (inline formula, not the function itself)  
**Verify:** Does each call site pass the correct `calYear`? Does each use the same `nestEggSwr` reference or a local copy? Are any using stale closure values?

**5.4 — Annual Income: Three Paths**  
`annualIncome` useMemo (sub-items-aware, used in savings rate)  
`totalSalary` in HTML export (line ~832, inline sum)  
`sal` in NW Multiple scorecard (`income.salary`, top-level only)  
**Document:** These three paths may produce different "salary" figures when sub-items are present. Is this intentional? Which is correct for each use case?

**5.5 — OTE Inflation: wealthProjection vs. retirementMetrics pre-inflation**  
Both apply a two-segment pre/post-retirement inflation to one-time expenses. Verify the exact formulas are identical, not similar-but-subtly-different.

**Output:** Parity table with MATCH / DIVERGE verdict for each pair. Divergences classified as intentional (documented) or bugs.

**Pass criteria:** All identical-purpose computations produce identical results. All intentional divergences documented with rationale.

---

## Phase 6: Edge Cases & Stress Testing

**Objective:** The application handles boundary conditions without crashes, NaN propagation, or silent wrong results.

**For each scenario below, trace what the code produces and verify it is either correct or a clear error:**

### 6.1 — Age Boundary Cases
| Scenario | What to check |
|----------|---------------|
| `currentAge === retirementAge` | `wealthProjection` has 0 pre-retirement years. Do gap levers (`yearsToRetire === 0`) show N/A or divide by zero? |
| `currentAge > retirementAge` | `yearsToRetire < 0` — do gap levers crash? Does `wealthProjection` project backward? |
| `lifeExpectancy === retirementAge` | `yearsInRetirement = 0`. Monte Carlo called with `yearsToProject = 0` — does it return 100% or 0%? |
| `lifeExpectancy < retirementAge` | Negative projection years — what happens? |

### 6.2 — Zero / Empty Input Cases
| Scenario | What to check |
|----------|---------------|
| `annualIncome = 0` | Savings rate denominator. Verify null guard. |
| `expenses.current = 0` | Emergency fund: `0 / 0` → NaN propagation? |
| `assets.investments = 0` | FI Age never found? Higher Return lever: `neededCagr = (X / 0)^Y` → NaN or Infinity? |
| `nestEggSwr = 0` | `requiredNestEgg = retNominal / 0` → Infinity. Does the UI handle this? |
| All expense categories phased out | `effectiveRetirementExpense = 0`. FI Age returned immediately (age 0)? |
| `assets.cash = 0` AND `assets.investments = 0` | Investment Mix: `0/0` → NaN. |
| All assets = 0 | Net worth = 0 - liabilities (negative). Chart renders negative values? |

### 6.3 — Extreme Value Cases
| Scenario | What to check |
|----------|---------------|
| Very large amounts (AED 100M+) | `formatCurrency` M/K display — test with 100,000,000,000 (100B AED). Does it show `AED 100,000M` or `AED 100B`? |
| `investmentReturn = 0` | Annuity factor: `(1^N - 1) / 0` → NaN. Gap lever Save More crashes? |
| `investmentReturn` very high (e.g., 50%) | Lever calculations plausible? |
| `nestEggSwr = 6` (maximum) | requiredNestEgg is smallest possible — verify FI Age behavior |
| `nestEggSwr = 0.1` (minimum) | requiredNestEgg is enormous — verify FI Age behavior |
| `nestEggSwr = 0` | `getRetNominalForYear` returns `Infinity` (line 4514). Does `Infinity` propagate to charts, gap levers, or display? Does the UI prevent setting SWR to 0? |
| `passiveGrowth = -100` or `999` | No validation on these inputs. Does a -100% growth rate produce NaN via `Math.pow`? Does 999% produce astronomical numbers that crash Recharts? |
| `exchangeRates.USD = 0` (corrupted FX) | All USD-displayed values become `Infinity`. Does the app handle this gracefully? |

### 6.4 — Sub-item Edge Cases
| Scenario | What to check |
|----------|---------------|
| Sub-items present, top-level total ≠ sum of sub-items | Which value is used in each calculation? Is `syncCategoryTotal` always called before the next render? |
| Sub-item with `endYear` in the past | Does income/liability calculation correctly treat it as zero? |
| Sub-item with `endYear` exactly equal to `currentYear` | Off-by-one: is the item active this year or not? |

### 6.5 — CSV Import Edge Cases
| Scenario | What to check |
|----------|---------------|
| CSV header in line 6 (beyond first 5) | App fails silently — no categories loaded? |
| CSV with BOM (byte-order mark) prefix | Does `\uFEFF` cause column name mismatch? |
| CSV with Windows line endings (`\r\n`) | Parsed correctly? |
| Amount column contains text or empty | `parseFloat("")` → NaN → is it treated as 0? |
| No currency code in header | Defaults to AED — verify |
| GBP in header | Not in supported list — what happens? |
| Category name matches existing but with different casing | `case-insensitive` matching claimed — verify |

### 6.6 — JSON Import Edge Cases
| Scenario | What to check |
|----------|---------------|
| Import JSON missing `nestEggSwr` field | `imported.nestEggSwr || 4` — correctly defaults |
| Import JSON with extra unknown fields | Silently ignored? |
| Import JSON from an older version without `retExpenseGrowthRates` | Does it crash or default? |
| Import malformed (not valid JSON) | Is `JSON.parse` wrapped in try/catch with user-visible error? |

### 6.7 — Idempotency Tests
- **JSON round-trip:** Export current state → Import → Export again → Compare both JSON files field-by-field. Are they identical (within rounding)?
- **Import twice:** Import the same JSON file twice in succession. Does state change on the second import, or is it idempotent?
- **CSV import then JSON export:** Import CSV → Export JSON → Import JSON → Verify state matches what was imported from CSV.

**Output:** Table of all scenarios with: input → expected behavior → actual behavior → PASS/FAIL. Any FAIL is a finding.

**Pass criteria:** All scenarios produce either the correct result or a clear, user-friendly error. Zero crashes. Zero NaN values displayed to users. Zero silent wrong results.

---

## Phase 7: Test Suite Audit

**Objective:** Establish what test coverage exists, verify it is correct, and write new tests to fill critical gaps.

### 7.1 — Prior Auditor Test Scripts Assessment

The following scripts now live in `_dev/tests/` and are not wired into a package-level test runner:

| File | Claimed Coverage | Assessment Required |
|------|-----------------|---------------------|
| `_dev/tests/auditor1_projection_test.js` | General calculations | Read and assess: do expected values appear hand-computed or code-derived? Are assertions meaningful? |
| `_dev/tests/auditor1_gap_levers.js` | Gap lever formulas | Same assessment |
| `_dev/tests/auditor1_monte_carlo.js` | Box-Muller, success rate | Same assessment |
| `_dev/tests/auditor1_scorecard.js` | 7 scorecard metrics | Same assessment |
| `_dev/tests/auditor2_monte_carlo.js` | Monte Carlo | Compare to Auditor 1 version — differences? |
| `_dev/tests/auditor2_projection.js` | Wealth projection | Assess validity |
| `_dev/tests/auditor2_gap_levers.js` | Gap levers | Assess validity |
| `_dev/tests/auditor2_scorecard.js` | Scorecard | Assess validity |

**For each script:** Does it produce a deterministic PASS/FAIL? Are expected values hand-computed or copied from code output (circular)? Would it catch the bugs identified in this audit?

**Decision rule:** If a script's expected values are derived from running the code, it is not a valid test — it confirms the code is self-consistent, not correct. Only tests with independently-computed expected values are incorporated.

### 7.2 — New Tests to Create

Create these test files as part of the audit (Node.js, runnable standalone, deterministic PASS/FAIL output):

**`audit_phase4_formula_verification.js`**  
Purpose: Hand-computed expected values for every formula in Phase 4.  
Tests: annuityFactor (Save More lever), Box-Muller distribution shape, fiAge crossover, retirement nominal inflation, amortizeLiability linear formula, IRR calculation.

**`audit_phase5_parity.js`**  
Purpose: Confirm identical computations across surfaces produce identical results.  
Tests: passive income offset in projection vs. simulation; OTE inflation two-segment; net worth across three calculation paths.

**`audit_phase6_edge_cases.js`**  
Purpose: All edge cases from Phase 6.  
Tests: zero denominators, extreme values, all-phased-out categories, empty datasets.

**`audit_phase6_idempotency.js`**  
Purpose: JSON export → import → re-export round-trip.  
Tests: state identity before and after full import cycle.

**Test quality standard:**  
- Every expected value must be computed BY HAND and documented in comments, not derived from the code.
- Every test must output `PASS` or `FAIL [details]`.
- No test should depend on external state, network, or a running React app.
- Extract pure calculation functions and test them in isolation.

**Pass criteria:** All prior auditor scripts assessed for validity. New tests created for all Phase 4–6 critical paths. All new tests produce deterministic, meaningful PASS/FAIL results.

---

## Phase 8: Security Baseline

**Objective:** No XSS vulnerabilities in HTML export. No hardcoded secrets. No path traversal risks. Safe error messages.

### 8.1 — XSS in HTML Export (Priority: HIGH)

`exportHTMLReport` (line ~811) generates a full HTML document using template literals. Multiple user-controlled values are interpolated directly.

**Specific strings to inspect:**
```javascript
// These user-entered values go directly into HTML — verify each is escaped:
i.name || 'Salary'          // salary sub-item name
i.name || 'Passive'         // passive sub-item name
i.name || 'Other'           // other income sub-item name
i.name || 'Mortgage'        // mortgage sub-item name
i.name || 'Loan'            // loan sub-item name
i.name || 'Other'           // other liability sub-item name
e.description (from OTEs)   // one-time expense description
expenseCategory labels      // user-renamed expense category names (handleRenameCat)
```

**Test payload:** Set a salary sub-item name to `<script>alert('XSS')</script>`. Export HTML report. Open the HTML file in a browser. Does the alert execute?

**If any user-supplied string is inserted without HTML escaping, this is a CRITICAL security finding.** The fix is to HTML-escape all user-supplied strings before interpolation: replace `<` with `&lt;`, `>` with `&gt;`, `&` with `&amp;`, `"` with `&quot;`, `'` with `&#x27;`.

### 8.2 — React XSS in UI
- Search for any `dangerouslySetInnerHTML` usage in the JSX. If found, verify the content it renders is never user-controlled.
- React's default JSX rendering escapes strings, so standard `{userValue}` in JSX is safe. The risk is only in: `dangerouslySetInnerHTML`, `innerHTML` assignments, and template literals concatenated into HTML (i.e., the `exportHTMLReport` path above).

### 8.3 — Secret Handling
- Search entire `App.jsx` for: `api_key`, `apiKey`, `api-key`, `secret`, `password`, `token`, `Bearer`.
- This is a client-side-only app, so there should be no secrets. Verify this is the case.
- Check `.gitignore` — are any `.env` files or sensitive paths excluded?

### 8.4 — Error Message Safety
- `importData` error handling: if JSON parse fails, what message is shown to the user? Does it expose internal paths or stack traces?
- `importExpensesCSV` error handling: same question.

### 8.5 — Dependency Audit
- Check `package.json` for known vulnerable versions of `react`, `react-dom`, `recharts`, `vite`, and `@vitejs/plugin-react`.
- Are dependencies pinned to specific versions or using loose ranges (e.g., `^18.2.0`)?
- Run or simulate `npm audit` against current dependency versions. Flag any HIGH/CRITICAL CVEs.

### 8.6 — FX API Response Validation (HIGH)
- Lines 751-754: `1 / data.rates.USD` — no guard for `data.rates.USD === 0` or `data.rates.USD === undefined`. If the API returns a malformed response (rate = 0, rate = null, or missing key), this produces `Infinity` or `NaN` which propagates into ALL monetary displays.
- Lines 29, 45, 66: `formatCurrency`, `formatCurrencyDecimal`, `toDisplay` — no guard for `rate === 0`. If exchangeRates state is corrupted from 8.6a above, every formatted currency value becomes `Infinity`.
- **Test:** Set `exchangeRates.USD = 0` in browser devtools. Navigate to all tabs. Does the app crash or display `Infinity`?
- **Fix:** Add rate validation in `fetchFxRates`: `if (data.rates.USD > 0 && data.rates.CAD > 0 && ...)` before updating state.

### 8.7 — Falsy Zero Masking (`|| 1` Pattern) (MEDIUM)
- Line 3962: `assets.investments || 1` — when investments = 0, this changes the denominator to 1 for chart sub-item scaling. The proportional allocation `subShare = sub.startAmount / 1` produces wrong chart data. Should use `Math.max(1, assets.investments)` with a comment, or handle the zero-investment case separately.
- Line 2062: `exchangeRates[csvCurrency] || 1` — if `csvCurrency` is valid but the rate happens to be 0 (from corrupted FX data), CSV amounts are imported at 1:1 with AED instead of failing gracefully.
- **Audit action:** Search for ALL instances of `|| 1` and `|| 0` in the file. For each: is the fallback correct when the value is legitimately 0?

**Output:** Security findings with exact file:line locations and specific exploit scenario for each XSS candidate.

**Pass criteria:** Zero XSS vulnerabilities confirmed (test with actual payload). No hardcoded secrets. Error messages are user-safe.

---

## Phase 9: Output Quality & Label Accuracy

**Objective:** Every label accurately describes the adjacent value. All monetary output is in the selected currency. No confusing or misleading presentation.

### 9.1 — Label Accuracy Checks

| Label | What It Claims | What Code Computes | Verify |
|-------|---------------|-------------------|--------|
| "FI Age" | "Earliest age investments can sustain retirement" | First age where `investments >= retirementBudget_nominal / SWR` | Is "investments" clearly defined as liquid only (not cash+investments)? |
| "Required Nest Egg" | Nest egg needed to sustain retirement | `retNominal / (SWR/100)` | Is it clear this is retirement-day nominal value? |
| "Survival Odds" / "Runway Survival Odds" | % of scenarios where money lasts | Monte Carlo success rate | Does any text suggest this includes savings contributions? |
| "SWR Needed Today" | "Withdrawal rate current portfolio requires" | `retirementExpense / currentInvestments × 100` (approx) | Verify exact formula used |
| "Income Replacement Ratio" | — | Nominal retirement expense / today's income | Is it clear this is comparing future nominal to current nominal? |
| "NW Multiple" | Net worth vs. salary multiple | `currentNetWorth / income.salary` | Is the Fidelity benchmark origin disclosed? Applicable to non-US users? |
| "Investment Mix" | — | `investments / totalAssets` | Could be confused with asset allocation (stocks/bonds mix) |
| Cash in charts | Should reflect current cash balance | `assets.cash` (flat, no growth) | Does any chart imply cash grows? |

### 9.2 — Currency Consistency Audit
- Select EUR as display currency. Navigate every section of the app (Dashboard, Finances, Pre-Retirement, Retirement tabs). Is every monetary value displayed in EUR? Are there any values still showing AED?
- Verify: wealth milestone thresholds ($1M, $5M, $10M, $25M) — are these displayed as USD always, or converted to selected currency?
- Verify: does the `exportHTMLReport` function use the selected currency, or default to AED?

### 9.3 — Zero-State Handling
| Zero-state scenario | Expected behavior |
|--------------------|--------------------|
| No data entered (all zeros) | Charts render without crash. "No data" or zero shown, not NaN |
| All expense categories deleted | `expenses.current = 0`. Savings rate, emergency fund — what shows? |
| wealthProjection returns empty array | Charts don't crash |
| `retirementMetrics = null` | Components that use `retirementMetrics?.successProbability` — verify null propagation is safe |

### 9.4 — Formatting Consistency
- Verify `formatCurrency` and `formatCurrencyDecimal` are used consistently for the same data types across sections — not mixed (one showing `AED 1.2M` and another showing `AED 1,200K` for the same value type).
- Verify percentage display: some show `1` decimal (e.g., `45.3%`), some show 0 decimals. Is this consistent by context?

**Pass criteria:** Every label is accurate. All monetary values display in selected currency consistently. Zero-states produce clear, friendly messages. Formatting is consistent within each data type.

---

## Phase 10: Efficacy Review (First-Principles)

**Objective:** Step back from mechanics. Is the app measuring the right things, in the right way, for its users?

This is a strategy phase, not a bug-hunt. Produce assessments and recommendations, not code changes.

### 10.1 — Core Purpose Alignment
The stated purpose: *"Help you track your current net worth, project your wealth over time, simulate retirement scenarios, and identify actionable steps to close any retirement gaps."*

For each major output, assess: does it directly serve this purpose, or does it exist because it was easy to compute?

- **7 scorecard tiles:** Are all 7 truly independent insights, or do some overlap? (e.g., Retirement Funding and FI Age both answer "am I on track for retirement")
- **Two retirement verdicts (Q1 Nest Egg, Q2 Survival Odds):** These can contradict each other (Q1 green, Q2 red, or vice versa). Is the hierarchy clear — which one should a user act on?
- **Gap-closing levers:** Three levers presented independently. Can a user combine them? Is it clear these are independent estimates, not additive?

### 10.2 — Methodology Appropriateness

| Choice | Standard Practice | Assessment |
|--------|-------------------|------------|
| 4% SWR default | US Trinity Study, 30-yr horizon | Appropriate for 60-65 retirement. Risky for FIRE (40-50 yr). Is there a warning? |
| Cash earns 0% | Conservative assumption | Over 30 years, even 2% cash interest on AED 200K = material. Undisclosed. |
| Linear mortgage amortization | Simplification | ~10% error in early years for typical mortgages. Disclosed? |
| Fixed exchange rates | Conservative assumption | For multi-year projections, EUR/AED drift could be significant. Disclosed? |
| Surplus not reinvested by default | Intentional, disclosed | Requires user to actively deploy via Surplus Deployment feature — is this prominent enough? |
| Monte Carlo uses no correlation between years | Simplification | Ignores autocorrelation in market returns. Industry standard for planning tools. |
| Fidelity NW Multiple for non-US users | US benchmark only | Should be disclosed as US-derived with caveat for non-US users |
| IRR compares nominal future spending to today's income | Unconventional | Standard IRR compares both in same terms. Needs clear tooltip. |

### 10.3 — User Friction Assessment
Walk through the primary user journey as a first-time user:
1. Default values are pre-filled. Is it clear they are examples, not recommendations?
2. Where is the first meaningful output? Is it visible without scrolling?
3. The "Surplus Deployment" feature (Dashboard tab) is the only way to model ongoing savings in the projection. Is this discoverable?
4. If a user has a retirement gap, the gap-closing levers show three independent options. Is there guidance on how to use them together?
5. The "Retirement Health" section has two questions (Q1/Q2). If they disagree, what should the user do?

### 10.4 — Prioritized Recommendations
Produce a recommendation list in 4 tiers:
1. **Must fix for GO** — produce wrong results or create false confidence
2. **Should fix soon** — mislead or confuse users
3. **Nice-to-have** — would improve tool without being blocking
4. **Future vision** — longer-term value additions

**Pass criteria:** Each major feature has a documented purpose assessment. All methodology choices are either industry-standard or explicitly caveated. Recommendation list is complete, prioritized, and actionable.

---

## Phase 11: Synthesis & Production Readiness

**Objective:** Compile all findings into a master report. Render a go/no-go verdict.

### Master Findings Register

Compile every finding from every phase into the standard format:

| ID | Phase | Severity | Short Title | Status | Effort | File:Line |
|----|-------|----------|-------------|--------|--------|-----------|
| FINDING-01 | ... | CRITICAL | ... | OPEN | Trivial/Moderate/Significant | ... |

### Before/After Examples
For every CRITICAL and HIGH finding: provide a concrete example showing:
- What the user experiences TODAY (with specific numbers)
- What they will experience AFTER the fix
- Use realistic data, not abstract descriptions

### Fix Sequencing
Group by severity, apply in order:
1. CRITICAL fixes first — verify each before moving to next
2. HIGH fixes second
3. MEDIUM fixes last
4. Re-run relevant tests after each fix group

### Deferred Items Log
For real issues that are not pre-production blockers: document each with risk level and suggested timeline.

### Go/No-Go Criteria
- **GO:** Zero CRITICAL, zero HIGH. All MEDIUM have documented fix plans.
- **CONDITIONAL GO:** Zero CRITICAL, ≤2 HIGH with clear plans. Ship with documented caveats.
- **NO-GO:** Any CRITICAL finding. Any HIGH finding that produces silently wrong financial results.

```
PRODUCTION READINESS VERDICT: [GO / CONDITIONAL GO / NO-GO]

Summary: {2-3 sentences}

To achieve GO status, resolve:
- [list any blockers]

Top 5 most impactful findings:
1. FINDING-{N}: {title}
...
```

---

## Domain-Specific Supplementary Phases

*These phases address failure modes specific to personal finance / retirement projection tools that generic code review misses.*

---

## SUP-1: Retirement Calculation Methodology Critique

**Objective:** Verify the primary retirement signals use defensible methodologies — not just correct implementations of potentially wrong choices.

**What domain-specific failure looks like here:**
A financial planning tool can implement every formula perfectly and still systematically mislead users if the *choice* of formula is inappropriate for their situation. This phase audits the choices, not the arithmetic.

**Specific checks:**

**SWR applicability:**
- The 4% SWR was derived from the Trinity Study (1998) for a 30-year US retirement. For a user retiring at 40 with a 50-year horizon, the appropriate SWR is closer to 3–3.5%.
- Does the app warn users with long retirement horizons (>30 years) that the 4% default may be too aggressive?
- The tooltip explains this risk — verify the explanation is accurate and prominent enough.

**Passive income in Monte Carlo:**
- Passive income (rental, dividends) is treated as growing at a fixed, certain rate in the Monte Carlo simulation. There is no volatility applied to passive income.
- For a user whose "passive income" is market-correlated (dividends, REITs), this understates risk.
- Assess: is this simplification disclosed? Should a warning be added when passive income is a large fraction of retirement funding?

**Expense growth compounding:**
- Category expenses compound indefinitely at their set rates. Over 40 years at 3%, a AED 100K expense becomes AED 326K. Over 50 years at 3%, it becomes AED 438K.
- Is there any guidance that users should review their rates over long horizons? Some expense categories (e.g., education) naturally end.
- Verify the phase-out feature is prominently discoverable as the mechanism to handle this.

**Sequence-of-returns risk:**
- The deterministic `wealthProjection` uses the expected return each year. The Monte Carlo addresses sequence-of-returns risk via random returns.
- However, the "Retire Later" and "Save More" levers are computed from the deterministic projection. Are they disclosed as estimates that don't account for sequence-of-returns risk?

**Pass criteria:** Each methodology choice has an assessed rationale. Any choice that could systematically mislead a user in a predictable scenario is flagged as at least a MEDIUM finding with a documentation fix.

---

## SUP-2: Double-Representation & Double-Counting Audit

**Objective:** No financial amount is counted twice in any aggregate displayed to users.

**What domain-specific failure looks like here:**
A user who adds two displayed figures to build a "total" must never get a wrong answer. If passive income reduces the drawdown amount in retirement AND also appears as a separate income line, users could reasonably think they have more money than they do.

**Specific checks:**

**Passive income in retirement:**
- In `wealthProjection` with drawdown enabled, post-retirement passive income reduces the drawdown amount: `drawdown = max(0, expenses - postRetIncome)`.
- This means passive income is NOT accumulated separately — it implicitly reduces portfolio depletion.
- Does the projection show a "passive income" line for post-retirement years in the charts? If so, does it clearly represent "this income offsets withdrawals" rather than "this income accumulates in addition to portfolio"?
- Could a user see the "passive income" bar AND think their portfolio is also growing as shown (both being additive)? If yes: double-representation.

**Salary stopping at retirement:**
- `yearSalary_calc` is zeroed post-retirement. The charts should show zero salary income after retirement age. Verify no salary line persists on charts post-retirement.

**Sub-items and parent totals:**
- When `income.passiveItems` are present, `annualIncome` sums the sub-items. The parent `income.passive` may still hold a value.
- Is `income.passive` (top-level) ever used in any calculation when sub-items are present? If so: double-counting risk.
- Specifically: `retirementMetrics` passiveIncomeSchedule uses `income.passive || 0` for Monte Carlo. Verify whether sub-items are handled here or only the top-level rollup.

**Cash in net worth vs. cash in retirement:**
- Cash appears in net worth calculation (total assets).
- Cash does NOT appear in the Monte Carlo portfolio.
- Cash is NOT drawn in the drawdown simulation.
- A user with AED 500K cash at retirement should understand: (a) it's in their net worth, (b) it's not in the Monte Carlo, (c) it won't be auto-drawn. Is this clearly communicated?

**Pass criteria:** No scenario where adding two displayed figures yields a misleading total. All "where does this money go" transitions are documented and verifiable.

---

## SUP-3: Multi-Currency Integrity Audit

**Objective:** All values are stored, computed, and displayed correctly regardless of currency selection. Round-trip conversion is lossless.

**Specific checks:**

**Round-trip conversion:**
- `toDisplay(aedVal, rate) = aedVal / rate` (rounded)
- `fromDisplay(displayVal, rate) = displayVal * rate` (rounded)
- These are not perfectly inverse due to rounding. Verify the maximum rounding error is acceptable (should be < 1 AED per conversion).
- Test: AED 100,000 → EUR (rate 4.01) → display = 24,938 → back to AED = 24,938 × 4.01 = 99,981 AED. Loss = 19 AED per round-trip.
- For large values: AED 1,000,000 → USD → back to AED. Quantify the rounding error.

**GBP support gap:**
- GBP is defined in `CURRENCIES` (rate: 4.87).
- Find all references to GBP throughout `App.jsx`.
- Is GBP in the currency selector UI? If yes: it is live and must be fully tested.
- Is GBP handled in `importExpensesCSV`? If not: a user whose CSV has `Monthly Planning Budget (GBP)` in the header will have amounts treated as AED (no conversion).
- **Verdict required:** Either GBP is fully supported (test all paths) or removed from the currency selector.

**HTML report currency:**
- `exportHTMLReport` calls `formatCurrency(v, currency, exchangeRates)` — verify `currency` is the currently selected display currency, not hardcoded to AED.
- Check: if user has EUR selected, does the exported HTML report show EUR values?

**Milestone amounts:**
- `WEALTH_MILESTONES_USD` = [$1M, $5M, $10M, $25M]. These are converted to AED for comparison: `thresholdAED = thresholdUSD × usdRate`.
- In the milestone display: are these shown as "$1M" (USD) or converted to the display currency? Verify the label matches the threshold used.

**Pass criteria:** Full round-trip conversion with documented maximum rounding error. GBP either fully supported or removed. HTML export respects selected currency. Milestone labels match the currency of comparison.

---

## SUP-4: Financial Data Integrity & Import/Export Round-Trip

**Objective:** Data survives all import/export cycles without silent loss, transformation, or corruption.

**Specific checks:**

**JSON export completeness:**
- Enumerate all `useState` variables in `NetWorthNavigator` (~line 589+).
- Find `exportData` function (~line 771).
- For each state variable: is it included in the export? If not, document which UI state is lost on re-import.
- Known gap reported by prior auditors: `lowDelta`, `highDelta`, `runwayConservativeOffset`, and other UI preference fields. Verify which are excluded and assess impact.
- Is the `exchangeRates` state exported? If not, user's custom exchange rates are lost.

**JSON import completeness:**
- `importData` function (~line 1917): for each field in the exported JSON, verify there is a corresponding `setState` call. Any field present in export but not in import is a silent loss.
- Verify: every `useState` that has a corresponding export entry also has a corresponding import entry.

**JSON schema migration:**
- What happens when importing a JSON from an older version of the app that is missing new fields?
- `imported.nestEggSwr || 4` — is this pattern consistently applied to all fields that may be missing in older exports?
- List all fields where this fallback pattern is present, and all fields where it is absent (potential crash on old import).

**CSV import accuracy:**
- Import `sample_csv_import.csv`. Verify:
  - Exact number of categories loaded matches the CSV rows
  - Monthly amounts are correctly multiplied by 12
  - Retirement budget is populated with the same annual amounts
  - Growth rates default to 3%
  - Display currency switches to match CSV header currency
- Test with a EUR-header CSV: verify amounts are converted to AED at the correct exchange rate at import time.

**Export HTML report completeness:**
- Open the HTML report and verify all major sections are present: net worth, income breakdown, expense breakdown, projection charts, scorecard, retirement health.
- Verify charts in the report render (they use inline SVG or Recharts — if Recharts requires a DOM, the export may produce empty chart placeholders).

**Pass criteria:** JSON round-trip produces state-identical result (within rounding). All state fields exported are re-imported. CSV import produces correct category mapping and amounts. HTML report renders correctly in a browser with no external dependencies.

---

## SUP-5: Projection Consistency at the Retirement Boundary

**Objective:** The year-by-year projection transitions cleanly from pre-retirement to post-retirement with no discontinuities, double-counting, or logic gaps at the exact boundary year.

**Specific checks:**

**The retirement year (age = retirementAge):**
- Income: `yearSalary_calc` uses `age < retirementAge` → salary is ZERO in retirement year
- Expenses: `getLifeStageExpense(year)` → uses `age >= retirementAge` to switch to `getRetNominalForYear` → retirement expenses apply FROM the retirement year
- Drawdown: `age > retirementAge` (strictly greater) → NO drawdown in retirement year
- Result: In the retirement year, user has zero salary, pays retirement expenses, but no investment drawdown.
- **Assess:** Is this the intended behavior? If retirement expenses in year 1 are not drawn from investments, where does the user "fund" them? From savings accumulated in that year? Or is this a one-year gap?
- **Verify the data pushed for the retirement year is internally consistent.**

**OTE straddling the retirement boundary:**
- A one-time expense starting pre-retirement and ending post-retirement uses two-segment inflation.
- Verify: for year = retirementCalYear (the boundary year itself), which segment is used?
- Code: `if (year < retCalYear)` → pre-ret rate. So `year === retCalYear` uses the POST-retirement rate (else branch). Is this correct?

**Passive income at retirement:**
- `yearPassive_calc` uses growth from `i=0` throughout. No transition at retirement — passive income continues growing through retirement.
- The drawdown formula subtracts passive income: `drawdown = max(0, retirementExpenses - passiveIncome)`.
- But passive income is also included in `yearIncome` pushed to the data array.
- Post-retirement: is `yearIncome` still shown on charts (including passive income)? If so, is it clear this income reduces drawdown rather than accumulating separately?

**Pass criteria:** At the exact retirement boundary year, all values are internally consistent. The transition is documented. Any one-year behavior that differs from the general rule is explicitly noted.

---

## Findings Registry

Initialize this table at the start of execution and update it live:

```
AUDIT FINDINGS REGISTRY
========================
Codebase: NetWorth Navigator v2.0.0
Audit Start: [date]
Auditor: [name]
Prior Audit Series: A1-F01–A1-F12, A2-F01–A2-F06, A3 cross-comparison
This Audit Series: FINDING-01, FINDING-02, ...
```

| ID | Phase | Severity | Short Title | Status | Effort | File:Line |
|----|-------|----------|-------------|--------|--------|-----------|
| FINDING-01 | — | — | — | OPEN | — | — |

*(Populate during execution)*

---

## Phase Execution Checklist

| Phase | Name | Status | Findings Count | Notes |
|-------|------|--------|----------------|-------|
| 1 | Documentation Sync | | | |
| 2 | Dead Code & Structure | | | |
| 3 | Universality & Hardcoding | | | |
| 4 | Logic & Formula Verification | | | |
| 5 | Parity Audit | | | |
| 6 | Edge Cases & Stress Testing | | | |
| 7 | Test Suite Audit | | | |
| 8 | Security Baseline | | | |
| 9 | Output Quality | | | |
| 10 | Efficacy Review | | | |
| 11 | Synthesis & Verdict | | | |
| SUP-1 | Methodology Critique | | | |
| SUP-2 | Double-Representation | | | |
| SUP-3 | Multi-Currency Integrity | | | |
| SUP-4 | Data Integrity & Round-Trip | | | |
| SUP-5 | Retirement Boundary | | | |

---

## The 12 Quality Principles (Reference Throughout All Phases)

Apply these as the standard by which every finding is assessed:

| # | Principle | What It Demands |
|---|-----------|-----------------|
| P1 | Math Correctness | Every formula produces the exact number a user would compute by hand |
| P2 | Cross-Environment Parity | All implementations of the same logic are identical |
| P3 | State Consistency | Every metric that should update when state changes does so |
| P4 | Denominator Correctness | Every division uses the precisely correct denominator |
| P5 | Universality | No hardcoded users, regions, currencies, or locales in logic |
| P6 | Documentation Alignment | Every doc claim matches current code (code is truth) |
| P7 | Label Accuracy | Every label accurately describes exactly what the adjacent value is |
| P8 | Graceful Degradation | Zero data / all-filtered / single-record produce valid output |
| P9 | No Double-Counting | Every financial amount belongs to exactly one aggregate |
| P10 | Security | No user-controlled strings inserted unsanitized into any output |
| P11 | Config Accuracy | Every config value description matches its actual behavior |
| P12 | Regression Integrity | No prior fix has been reverted by subsequent changes |

---

## Specialist Referral Register

The following areas are acknowledged as out-of-scope for this code audit and should be referred to specialists if the application is deployed beyond personal use:

| Area | Specialist Type | Why Referral Needed |
|------|----------------|---------------------|
| SWR validation for non-US markets | Financial planner / actuary | The 4% rule is US-market-derived; UAE/Gulf market return/inflation profiles differ |
| Tax modeling (UAE, US, EU) | Tax specialist | App explicitly excludes tax; for multi-jurisdiction users, tax drag is material |
| Actuarial life expectancy | Actuary | Fixed 85-year default may be incorrect for many users; longevity risk is significant |
| Full security penetration test | Security specialist | If app ever handles real credentials, server-side logic, or multi-user data |
| GDPR / data protection | Legal / privacy | If app is distributed publicly and collects any usage telemetry |

---

## ADDENDUM: Independent Review Findings & Audit Plan Enhancements

**Added by:** GitHub Copilot (Independent Review, April 17, 2026)
**Scope:** Full independent codebase scan of `src/App.jsx` + cross-reference with all three auditor reports + industry benchmarking against best-in-class financial planning tools (ProjectionLab, cFIREsim, Fidelity Planning, NewRetirement/Boldin)

This addendum adds findings, checks, and requirements that were **not covered** by the existing plan or any prior auditor. It also introduces a mandatory **User Confirmation Gate** and **Industry Benchmarking** phase.

---

## MANDATORY: User Confirmation Gate (Applies to ALL Phases)

**Requirement:** Before implementing any fix or change discovered during the audit, the executing auditor MUST classify the change as one of:

| Type | Action Required |
|------|----------------|
| **Bug Fix** — code provably produces wrong output vs. documented intent | Fix immediately. No confirmation needed. |
| **Behavior Change** — current behavior is internally consistent but may not match user intent | **STOP.** Present the current behavior and the proposed change to the user. Get explicit confirmation before implementing. The current behavior may be intentional. |
| **Enhancement** — adding new functionality, metrics, or UI elements not currently present | **STOP.** Present the proposal to the user. Only implement with explicit approval. |
| **Documentation Fix** — tooltip, README, or label text does not match code behavior | Present both the current text and the code behavior. Ask user: "Should the code change, or should the docs change?" |

**Rationale:** Prior auditors disagreed on several findings (sub-item sync, drawdown timing, IRR definition). Some behaviors flagged as "bugs" may be intentional design decisions. This gate prevents overriding the user's intent.

**Specific items requiring user confirmation before implementation:**

1. **Negative savings rate masking** (`Math.max(0, ...)`) — Should savings rate show negative values, or is clamping to 0% intentional UX?
2. **Cash exclusion from Monte Carlo** — Is this intentional (conservative: only liquid investments sustain retirement) or a bug? The tooltip says "liquid Investment portfolio only" — suggesting intentional.
3. **Surplus not reinvested by default** — Code comments say this is intentional. Confirm before changing.
4. **Drawdown timing** (`age > retirementAge` vs `age >= retirementAge`) — Auditors disagree. Confirm intended behavior.
5. **IRR metric** (nominal future vs. current income) — Is this the desired definition, or should it compare in real terms?
6. **Cash earning 0% return** — Is this intentional conservatism, or should cash have a configurable interest rate?
7. **Linear amortization** — Is this a known simplification the user accepts, or should proper amortization be implemented?
8. **Gap lever "Retire Later" excluding salary continuation** — Is this intentional (conservative estimate) or a gap?
9. **Gap lever "Higher Return" ignoring contributions** — Same question.
10. **NW Multiple using top-level salary** — Is this intentional (salary = primary earned income) or should it use total income?

---

## SUP-6: Independent Code Quality & Resilience Audit

**Objective:** Identify bugs, resilience gaps, and code quality issues missed by all three prior auditors and the existing plan.

### 6.1 — CONFIRMED BUG: Regex Input Validation (MEDIUM)

**Lines 5034 and 5241** in `App.jsx`:

```javascript
onChange={(e) => { const v = e.target.value; if (!/^\d*\.?\d*$/.test(v)) e.target.value = v.replace(/[^d.]/g,''); }}
```

The regex `/[^d.]/g` is **wrong** — it strips everything except the literal letter `d` and `.`. It should be `/[^\d.]/g` (with backslash for the digit character class). This affects the SWR input and the volatility input fields. Users can type the letter "d" and it will pass through validation.

**Action:** Fix both instances: `/[^d.]/g` → `/[^\d.]/g`
**Severity:** MEDIUM — input corruption vector, though the `onBlur` handler with `parseFloat` provides a secondary guard.

---

### 6.2 — CONFIRMED: Passive/Other Income Source Inconsistency Across Surfaces (HIGH)

Three code paths use **top-level** `income.passive` / `income.other` / `income.salary` instead of resolving from sub-items:

| Surface | Code | Uses | Should Use |
|---------|------|------|-----------|
| `retirementMetrics` passiveIncomeSchedule (~line 2643) | `income.passive \|\| 0` | Top-level | Sub-item sum (like `annualIncome`) |
| `simulateRunway` (~line 5301) | `income.passive \|\| 0` | Top-level | Sub-item sum |
| Scorecard NW Multiple (~line 3459) | `income.salary \|\| 0` | Top-level | Sub-item sum |

The `annualIncome` useMemo (line ~2305) and `wealthProjection` (line ~2487) both correctly resolve from sub-items. The three surfaces above do not. This means:

- Monte Carlo survival odds may use stale passive income values
- Runway projection may use stale passive/other values
- NW Multiple may use a stale salary figure

**Specific trace for `simulateRunway`:** Additionally, `simulateRunway` does NOT respect per-item `endYear` on passive/other income streams — a passive income that ends before retirement (e.g., a rental property sold at age 50) is still counted in the runway simulation.

**Verification step to add to Phase 5:** Enumerate every reference to `income.passive`, `income.other`, and `income.salary` in the file. For each: does it resolve sub-items? Does it respect `endYear`? Document in parity table.

---

### 6.3 — NO Error Boundary (HIGH)

**Confirmed:** Zero instances of `ErrorBoundary`, `componentDidCatch`, or `getDerivedStateFromError` in the codebase. If any calculation throws (e.g., unexpected `NaN` propagation, accessing a property of `undefined` after a malformed import), the entire app white-screens with no recovery path.

**Action:** Add to Phase 6 (Edge Cases) — verify that every edge case scenario either produces a valid result or a user-friendly message. Separately, add an `ErrorBoundary` component wrapping the app as a safety net. This is a **new test** not covered by any prior auditor.

---

### 6.4 — NO Auto-Save / No localStorage Persistence (HIGH)

**Confirmed:** Zero usage of `localStorage` or `sessionStorage`. All user data exists only in React state. If the browser crashes, the tab is accidentally closed, or the page is refreshed, **all data is lost**. Users must manually export to JSON to preserve their work.

For a financial planning tool where users enter extensive personal financial data, this is a significant usability gap. Best-in-class tools (ProjectionLab, Boldin/NewRetirement, cFIREsim) all provide automatic persistence.

**Action:** Flag as HIGH finding. Recommend `localStorage` auto-save on state change with debouncing. **Requires user confirmation** — this is an enhancement, not a bug fix.

---

### 6.5 — Components Defined Inside Render Body (HIGH — Performance)

**Confirmed:** `NumberInput`, `CustomLegend`, `MilestoneLegend`, and `SubItemAmountInput` are defined inside the `NetWorthNavigator` component body. React treats these as new component types on every render, causing:

- Unnecessary unmount/remount cycles
- Loss of internal state (focus, cursor position) during input
- Performance degradation

**Also confirmed:** Zero instances of `useCallback` or `React.memo` in the entire file.

**Action:** Add to Phase 2 (Dead Code & Structure) — enumerate all inner component definitions and assess whether they cause user-visible input issues (lost focus, cursor jumps). If so, hoist them outside the component body.

---

### 6.6 — Console Statements in Production Code (LOW)

**Three confirmed instances:**

| Line | Statement |
|------|-----------|
| 760 | `console.log('FX fetch failed, using cached rates')` |
| 1953 | `console.error('Error importing data:', error)` |
| 2126 | `console.error('CSV import error:', err)` |

**Action:** Add to Phase 2 (Dead Code & Structure) — enumerate and decide: remove, or replace with user-visible error notifications.

---

### 6.7 — `fetchFxRates` Has No Timeout or AbortController (LOW)

Line ~741: `fetch('https://open.er-api.com/v6/latest/AED')` has no timeout. On dead/slow networks, the fetch could hang indefinitely. The `useEffect` cleanup does not abort the fetch.

**Action:** Add to Phase 8 (Security) — verify the fetch has appropriate timeout handling. A 5-second `AbortController` timeout with fallback to cached rates is prudent.

---

### 6.8 — `syncCategoryTotal` Potentially Dead Code (LOW)

**Confirmed:** `syncCategoryTotal` is defined at line 2275 but only 1 reference found in the file (the definition itself). The inline handlers in JSX already manually sync totals when sub-items change. If this function is never called, it is dead code.

**Action:** Add to Phase 2 — search for all call sites of `syncCategoryTotal`. If zero, remove it. If called via `useEffect`, verify the effect dependency array.

---

### 6.9 — Monte Carlo Runs Synchronously on Main Thread (MEDIUM)

`runMonteCarloSimulation` runs 1,000 simulations × N years synchronously. For long projection horizons (40+ years × 1,000 simulations = 40,000+ iterations), this could freeze the UI.

**Action:** Add to Phase 6.3 (Extreme Values) — test with `lifeExpectancy = 100`, `currentAge = 20` (80-year projection). Measure UI responsiveness during computation. If perceptible freeze (>100ms), flag as MEDIUM finding with Web Worker recommendation.

---

### 6.10 — Import Version Handling Gap (LOW)

`importData` (line ~1912) only handles versions `'1.0'` and `'2.0'`. Unknown versions show an alert but the content is silently ignored. No forward-compatibility strategy exists.

**Action:** Add to SUP-4 (Data Integrity) — test importing JSON with `version: '3.0'` or `version: undefined`. Verify behavior is clearly communicated to user.

---

### 6.11 — No Type System (MEDIUM — Audit Scope Note)

No TypeScript, PropTypes, or JSDoc annotations. For a 7,668-line financial calculator with complex arithmetic, the absence of type safety means entire classes of bugs (wrong argument order, missing fields, NaN propagation through implicit `undefined`) cannot be caught statically.

**Action:** Note as a finding in Phase 11 (Synthesis). Not fixable within audit scope, but should be a P2 recommendation for post-audit hardening.

---

### 6.12 — Surplus Flow in wealthProjection — Explicit Trace Required (Phase 4.3 Addition)

**Confirmed:** In pre-retirement years, surplus (income − expenses) is calculated as `yearSavings` and stored in the projection data but is **never added to `investmentBalance`**. The code comment explicitly states this is intentional.

**Add this hand-verification step to Phase 4.3:**
> "In pre-retirement Year 1: salary = 300K, expenses = 200K, surplus = 100K. Trace: is surplus added to `investmentBalance`? Code at line ~2596 shows investments compound at return rate only — surplus is NOT reinvested. Verify the 'Surplus Deployment' feature on the Dashboard tab correctly addresses this, and that the tooltip/label makes this limitation clear to users."

---

## SUP-7: Industry Benchmarking & Best Practices Comparison

**Objective:** Compare NetWorth Navigator against features and practices found in best-in-class financial planning tools to identify gaps that could materially mislead users or fall short of reasonable user expectations.

**Benchmark tools:** ProjectionLab, cFIREsim, FIRECalc, Fidelity Retirement Planning, Boldin/NewRetirement, Mad Fientist FI Laboratory

### 7.1 — Variable Withdrawal Strategies

**Industry standard:** Best-in-class tools (cFIREsim, ProjectionLab) support multiple withdrawal strategies:
- Fixed amount (inflation-adjusted) — the current app's approach
- Constant percentage of portfolio
- Guyton-Klinger guardrails (spend more in good years, less in bad years)
- Variable Percentage Withdrawal (VPW)
- CAPE-based withdrawal adjustment

**Current app:** Only supports fixed SWR. No dynamic spending rules.

**Assessment:** The fixed SWR is the most common starting point, and the app's implementation is correct. However, the app should **disclose** that it uses a fixed withdrawal strategy and that dynamic strategies may produce different (often better) outcomes. This is a Phase 1 (Documentation Sync) and Phase 10 (Efficacy) check.

**Action:** Verify whether any tooltip or documentation mentions that the Monte Carlo uses a fixed withdrawal strategy. If not, flag as MEDIUM documentation gap.

---

### 7.2 — SWR Floor for Long Retirements

**Industry research (Kitces, ERN/Big ERN, Mad Fientist):** For retirement horizons exceeding 30 years, the 4% rule's historical success rate drops. Research suggests:
- 30-year horizon: 4% is robust (95%+ success)
- 40-45 year horizon: 3.5% is the floor
- 50+ year horizon: 3.25-3.5% with flexibility

**Current app:** Default SWR is 4%. The SWR tooltip does mention "drop to 3–3.5% for 35+ year retirements" — this is good. 

**Action:** Add to Phase 1 — verify the SWR tooltip text accurately reflects current research. Also verify: when `lifeExpectancy - retirementAge > 35`, does the app display any warning about the 4% default being potentially aggressive? If not, recommend adding one.

---

### 7.3 — Historical vs. Monte Carlo Simulation

**Industry standard:** Best-in-class tools (cFIREsim, FIRECalc) offer **historical backtesting** (using actual year-by-year market returns from 1871-present) in addition to Monte Carlo. Historical backtesting captures autocorrelation and non-normal return distributions that Monte Carlo misses.

**Current app:** Monte Carlo only (Box-Muller normal distribution). This is a valid approach but has limitations:
- Assumes returns are independently and identically distributed (IID)
- Normal distribution may understate tail risk (fat tails in real markets)
- No serial correlation (real markets exhibit momentum and mean reversion)

**Assessment:** Monte Carlo is the more commonly used approach in consumer tools and is reasonable. However, the app should **disclose** that returns are modeled as IID normal, which may understate the probability of prolonged poor sequences.

**Action:** Add to Phase 1 — verify whether any documentation or tooltip discloses the IID normal assumption. Add to SUP-1 — assess whether the normal distribution assumption materially affects survival odds vs. historical backtesting.

---

### 7.4 — Inflation Modeling

**Industry standard:** Best tools allow:
- Separate inflation rates for different expense categories (healthcare inflates faster than general CPI)
- Historical inflation data for backtesting
- Variable inflation over time (higher in early retirement, lower later)

**Current app:** Per-category `retExpenseGrowthRates` — this is actually **better than most** consumer tools. The app allows each expense category to have its own growth rate, effectively modeling differentiated inflation.

**Assessment:** This is a strength. Verify it works correctly in Phase 4.

---

### 7.5 — Sequence-of-Returns Risk Disclosure

**Industry best practice (Kitces research):** The first decade of retirement is the most critical. Tools should help users understand and mitigate sequence risk.

**Current app:** Monte Carlo inherently models sequence risk through random return ordering. However:
- Gap-closing levers (Save More, Retire Later, Higher Return) are computed deterministically and do NOT account for sequence risk
- No explicit disclosure that lever estimates are "average case" not "worst case"

**Action:** Add to Phase 9 (Output Quality) — verify whether gap lever labels/tooltips indicate they are deterministic estimates. If not, flag as MEDIUM label accuracy issue.

---

### 7.6 — Data Persistence & Recovery

**Industry standard:** Every major financial planning tool provides automatic data persistence:
- ProjectionLab: cloud-based, auto-save
- cFIREsim: URL-encoded state
- Fidelity: account-based persistence
- Boldin: cloud-based, auto-save

**Current app:** No auto-save. Data lost on page refresh. Manual JSON export only.

**Assessment:** This is a significant gap for a tool where users enter extensive personal financial data. See SUP-6.4 above.

---

### 7.7 — Sensitivity Analysis / What-If Scenarios

**Industry standard:** Best tools allow users to compare multiple scenarios side-by-side:
- "What if I retire at 55 vs 60?"
- "What if returns are 5% instead of 7%?"
- "What if I live to 95?"

**Current app:** Single scenario only. Users must manually change inputs and mentally compare.

**Assessment:** Flag as a P3 enhancement recommendation in Phase 10 (Efficacy). Not a bug or pre-production blocker, but a significant usability gap vs. peers. The "Runway" section partially addresses this with conservative/optimistic offsets — verify this is discoverable and clearly explained.

---

### 7.8 — Guardrails / Dynamic Spending Warning

**Industry best practice:** When a user's Monte Carlo survival odds are below a threshold (e.g., 60%), best tools suggest specific actions ordered by impact.

**Current app:** Gap-closing levers partially address this, but only activate when `!onTrack`. There is no "Next Best Action" prioritization or composite recommendation (e.g., "Save $500/month more AND retire 2 years later").

**Assessment:** Flag as P3 enhancement recommendation. Already noted by Auditor 2.

---

## SUP-8: Regression Safety & Testing Infrastructure

**Objective:** Ensure the audit itself does not introduce regressions, and that a minimal safety net exists for future changes.

### 8.1 — Pre-Audit State Snapshot

Before any fixes are applied, the executing auditor MUST:
1. Export a reference JSON from the app with the default state
2. Export a reference JSON with a realistic test dataset (the one used for Phase 4 hand-verification)
3. Record the exact outputs: net worth, FI age, Monte Carlo survival odds, all 7 scorecard values, all 3 gap lever values
4. After each batch of fixes, re-check these outputs against the pre-fix values
5. Any unexpected change in output is a regression and must be investigated

### 8.2 — Minimum Viable Test Suite

The audit MUST produce, at minimum, these runnable test files:

| File | Purpose | Phase Source |
|------|---------|-------------|
| `audit_formula_verification.js` | Hand-computed expected values for ALL Phase 4 formulas | Phase 4 |
| `audit_parity_checks.js` | All Phase 5 parity pairs with MATCH/DIVERGE verdicts | Phase 5 |
| `audit_edge_cases.js` | All Phase 6 scenarios with expected behavior | Phase 6 |
| `audit_idempotency.js` | JSON export → import → re-export round-trip identity | Phase 6.7 |
| `audit_regression_snapshot.js` | Pre-fix output values as regression anchors | SUP-8.1 |

All tests must:
- Run standalone via `node <file>.js` (no test framework required)
- Have hand-computed expected values documented in comments
- Output deterministic PASS/FAIL (Monte Carlo tests use seeded RNG or statistical bounds)

---

## SUP-9: Audit Deliverables & Compliance with Codebase Auditor Skill v2.1

**Objective:** Ensure the audit execution produces all required deliverables per the codebase-auditor skill specification.

**Required by the skill but not yet in the plan:**

### 9.1 — Audit Report File Output

The audit MUST produce a saved `AUDIT_REPORT_YYYY-MM-DD.md` file (not just chat findings). Follow path resolution:
- Default: `_dev/docs/audits/AUDIT_REPORT_YYYY-MM-DD.md`
- If report exceeds ~800 lines, split into per-phase supplementary files with an index

The report must follow the standard structure:
```markdown
# Audit Report — NetWorth Navigator
**Date:** [YYYY-MM-DD]
**Command:** codebase-auditor full
**Auditor:** [agent name]
**Codebase:** NetWorth Navigator v2.0.0 — single-file React SPA
**Location:** networth-navigator-master/

## Executive Summary
## Production Readiness Verdict
## Finding Counts
## Findings (grouped by severity: CRITICAL first)
## Phases Executed
## Top 5 Most Impactful Findings
```

### 9.2 — Audit Registry

After saving the report, create or update `_dev/docs/audits/AUDIT_REGISTRY.md` using the schema in `_dev/skills/codebase-auditor/references/audit-registry-schema.md`. Add a row for this audit. If prior audit entries exist from the 3 auditors, mark them as `SUPERSEDED`.

### 9.3 — Agent Context File Update

After delivering the report, offer to append an Audit History row to the project's agent context file (CLAUDE.md / AGENTS.md or equivalent). If no agent context file exists, offer to scaffold one from `_dev/skills/codebase-auditor/CLAUDE.md.template`.

### 9.4 — Before/After Examples for All CRITICAL + HIGH Findings

Phase 11 (Synthesis) MUST include concrete before/after examples for every CRITICAL and HIGH finding using realistic financial data, not abstract descriptions.

### 9.5 — Specialist Referral Register

Phase 11 MUST include a specialist referral register for items that exceed the audit's scope (already present in the existing plan — verify it's populated during execution).

### 9.6 — `getMilestoneEvents()` Memoization Check (LOW)

`getMilestoneEvents()` is called multiple times per render without memoization. Add to Phase 2 (Dead Code & Structure) — assess whether wrapping in `useMemo` would reduce chart re-render cost.

### 9.7 — `handleRemoveCat` State Sync Check (MEDIUM)

`handleRemoveCat` (lines 2274-2283) fires 8 separate `setState` calls to remove a category from all maps. While React 18 batches these within the same event handler, verify:
- Are there any `useEffect` or `useMemo` hooks that depend on a subset of these state variables and could run between batched updates?
- Could a user trigger a rapid series of deletions that causes a render between batches?

Add to Phase 6 (Edge Cases) — test: delete 3 categories rapidly. Does the app remain consistent?

---

## Phase Execution Checklist (Updated)

| Phase | Name | Status | Findings Count | Notes |
|-------|------|--------|----------------|-------|
| 1 | Documentation Sync | | | + SWR long-horizon warning, IID normal disclosure, variable withdrawal strategy note |
| 2 | Dead Code & Structure | | | + syncCategoryTotal, console.log, inner components, dead CSS, getMilestoneEvents memoization, growth rate validation inconsistency |
| 3 | Universality & Hardcoding | | | |
| 4 | Logic & Formula Verification | | | + surplus flow trace (4.3 addition) |
| 5 | Parity Audit | | | + income.passive/other/salary sub-item resolution across ALL surfaces |
| 6 | Edge Cases & Stress Testing | | | + performance under scale (80-year horizon, 50+ sub-items), nestEggSwr=0 Infinity, unvalidated growth rates, corrupted FX rates, rapid category deletion |
| 7 | Test Suite Audit | | | |
| 8 | Security Baseline | | | + fetch timeout, regex bug, dependency audit, FX API response validation, falsy `\|\| 1` masking |
| 9 | Output Quality | | | + Nest Egg vs Runway hierarchy, gap lever deterministic disclaimer |
| 10 | Efficacy Review | | | + industry benchmark comparison |
| 11 | Synthesis & Verdict | | | + before/after examples for all CRITICAL/HIGH, specialist referrals |
| SUP-1 | Methodology Critique | | | + IID normal vs historical backtesting |
| SUP-2 | Double-Representation | | | + passive income sub-items in retirementMetrics/simulateRunway |
| SUP-3 | Multi-Currency Integrity | | | |
| SUP-4 | Data Integrity & Round-Trip | | | + version forward-compat |
| SUP-5 | Retirement Boundary | | | |
| SUP-6 | Code Quality & Resilience | | | **NEW** — regex bug, ErrorBoundary, auto-save, inner components |
| SUP-7 | Industry Benchmarking | | | **NEW** — vs ProjectionLab/cFIREsim/Boldin |
| SUP-8 | Regression Safety | | | **NEW** — pre-audit snapshot, minimum test suite |
| SUP-9 | Audit Deliverables | | | **NEW** — report file, registry, agent context, before/after examples |
| — | User Confirmation Gate | | | **NEW** — applies to ALL phases |

---

## Updated Quality Principles (Additions)

| # | Principle | What It Demands |
|---|-----------|-----------------|
| P13 | User Intent Preservation | No behavior change is implemented without confirming it does not override an intentional design decision |
| P14 | Data Resilience | User data survives page refresh, browser crash, and accidental navigation |
| P15 | Input Validation Correctness | All input sanitization regexes correctly match their intended character classes |
| P16 | Divide-by-Zero Safety | Every division in the codebase has a guard; no path produces Infinity or NaN from plausible user input |
| P17 | Falsy-Value Correctness | No `\|\| default` pattern treats a legitimate 0 as missing/falsy |

---

*End of Audit Plan (with Addendum). This document is the complete specification for the pre-production audit of NetWorth Navigator v2.0.0.*
