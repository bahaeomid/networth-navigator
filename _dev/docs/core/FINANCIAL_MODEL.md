# Financial Model — NetWorth Navigator v2.0.0

> All financial assumptions, formulas, and confirmed design decisions. For technical architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Table of Contents

1. [Core Assumptions](#1-core-assumptions)
2. [Wealth Projection Engine](#2-wealth-projection-engine)
3. [Monte Carlo Simulation](#3-monte-carlo-simulation)
4. [Scorecard Metrics](#4-scorecard-metrics)
5. [Gap-Closing Levers](#5-gap-closing-levers)
6. [Confirmed Design Decisions](#6-confirmed-design-decisions)
7. [Limitations & Disclosures](#7-limitations--disclosures)

---

## 1. Core Assumptions

### Default Parameters

| Parameter | Default | Range | Unit |
|-----------|---------|-------|------|
| Current age | 35 | 18–100 | years |
| Retirement age | 55 | currentAge+1 to lifeExpectancy-1 | years |
| Life expectancy | 85 | retirementAge+1 to 120 | years |
| Salary growth | 4.0% | 0–30% | annual |
| Passive income growth | 2.0% | 0–30% | annual |
| Other income growth | 2.0% | 0–30% | annual |
| Investment return | 7.0% | any | annual nominal |
| Investment std dev | 12.0% | any | annual |
| Real estate appreciation | 3.5% | any | annual |
| Inflation (per-category) | 3–5% | any | annual |
| Safe withdrawal rate | 4.0% | 0.1–6.0 | % of nest egg |

### Currency

- **Base currency:** AED (all internal storage)
- **Display currencies:** AED, USD, CAD, EUR, GBP
- **FX source:** open.er-api.com (live) with hardcoded fallback

---

## 2. Wealth Projection Engine

Year-by-year deterministic projection from current age to life expectancy.

### Income Model

```
Pre-retirement:
  salary(y)  = baseSalary × (1 + salaryGrowth)^y
  passive(y) = basePassive × (1 + passiveGrowth)^y     [respects sub-item endYear]
  other(y)   = baseOther × (1 + otherIncomeGrowth)^y    [respects sub-item endYear]
  totalIncome(y) = salary(y) + passive(y) + other(y)

Post-retirement:
  salary(y)  = 0
  passive(y) and other(y) continue (with endYear cutoffs)
```

### Expense Model

```
Pre-retirement (15 categories, each with own inflation rate):
  categoryExp(y) = baseAmount × (1 + categoryRate)^y
  If phaseOut year set and y ≥ phaseOut: categoryExp = 0
  totalPreRetExp(y) = Σ categoryExp(y)

Post-retirement (15 retirement budget categories):
  Two-segment inflation:
    Segment 1: base × (1 + preRate)^yearsToRetirement        [pre-ret inflation]
    Segment 2: segment1 × (1 + retRate)^yearsIntoRetirement   [post-ret inflation]
  totalRetExp(y) = Σ category two-segment values

One-time expenses:
  Same two-segment inflation applied per item
```

### Asset Growth

```
investmentContribution(y) =
  Σ item.annualContrib × (1 + item.contribGrowthRate)^(calendarYear - item.contribStartYear)
  only when item.contribStartYear <= calendarYear <= item.contribEndYear
  [pre-retirement only; defaults to 0]

investments(y+1) = max(0, investments(y) × (1 + investmentReturn) + investmentContribution(y) − drawdown(y))
realEstate(y+1)  = realEstate(y) × (1 + realEstateAppreciation)
otherAssets(y+1)  = otherAssets(y) × (1 + otherAssetGrowth)
cash(y)          = constant (earns 0%, not compounded)
```

Annual investment contributions are optional fields on investment sub-items. Each item can start in the current year or a future pre-retirement year and can optionally end before retirement. The entered contribution amount is nominal in the From year; contribution growth compounds from that From year forward, not from today, and applies only through the inclusive To year. If no To year is set, the contribution continues through the final pre-retirement contribution year. Projection charts are annual opening snapshots: a contribution made during calendar year 2030 is included in `investments(2031)`, not the opening 2030 plotted point. This is consistent with drawdown timing, where the retirement-age plotted point is the opening balance before that year's retirement drawdown is applied into the next plotted point. Contributions flow through the base projection, FI Age, Retirement Health, Monte Carlo starting portfolio, net worth milestones, asset-allocation projections, Assets Over Time drilldown overlays, and HTML report charts. The model does not cap these contributions to calculated savings capacity. The UI shows an informational warning when planned investment contributions exceed projected savings surplus in any pre-retirement year, summarizes the affected range and examples, and directs users to the Cash Flow Over Time chart for full year-by-year context.

### Income Phasing (Salary, Passive, Other)

Income sub-items use an inclusive From/To window:

```
start = startYear || currentYear
end   = max(start, endYear || fallbackEndYear)

active in year y when start ≤ y ≤ end
income(y) = baseAmount × (1 + growthRate)^(y - start)
```

- Salary fallback end year is the final pre-retirement calendar year and is always capped at retirement.
- Passive and Other income fallback end year is the life-expectancy calendar year, so they can continue through retirement unless a To year is set.
- Entered base amounts are nominal in the From year.

### Liability Amortization (Linear)

```
For each liability sub-item:
  start  = startYear || currentYear
  payoff = max(start + 1, endYear || (start + defaultTermYears))

  if calendarYear < start or calendarYear ≥ payoff: balance(y) = 0
  else:
    termYears = payoff − start
    balance(y) = max(0, originalAmount × (payoff − calendarYear) / termYears)

If no sub-items: total amortized linearly over default term (25yr mortgage, 5yr loans)
```

Liability balances are balance-sheet items only. They affect net worth and debt-free age, but they do **not** create cashflow expenses or reduce savings automatically. Until first-class debt-service fields are added, users should model scheduled payments for any liability type (mortgage, car loan, personal loan, credit card plan, other debt) as expense categories with a phase-out year matching the payoff year, while keeping the liability entry for net worth accuracy. For amortising loans, use the full principal + interest cash payment because both portions reduce investable cashflow. Avoid double-counting if the same payment is already included inside another expense category.

Debt Free Age is the first projected age after the final year in the horizon where any configured liability balance is positive. This prevents a temporary zero-liability gap before a future-start liability from being reported as permanently debt-free.

### Drawdown (Post-Retirement)

```
If enableDrawdown AND age ≥ retirementAge:
  postRetIncome = passive(y) + other(y)
  drawdown(y) = max(0, totalExpenses(y) − postRetIncome)
  Deducted from investments only
```

### Net Worth

```
netWorth(y) = cash + investments(y) + realEstate(y) + otherAssets(y) − totalLiabilities(y)
```

---

## 3. Monte Carlo Simulation

### Parameters

| Parameter | Value |
|-----------|-------|
| Simulations | 1,000 |
| Distribution | Normal (Box-Muller transform) |
| Mean return | `assumptions.investmentReturn` |
| Std deviation | `assumptions.investmentStdDev` |
| Portfolio | Liquid investments only (excludes cash, real estate, other) |
| Projection period | `lifeExpectancy − retirementAge` years |

### Algorithm

```
For each of 1,000 simulations:
  portfolio = starting investments at retirement

  For each year post-retirement:
    // Random return via Box-Muller
    u1 = Math.random() || 1e-10
    u2 = Math.random()
    z = sqrt(-2 × ln(u1)) × cos(2π × u2)
    yearReturn = mean + z × stdDev

    // Apply return and withdrawal
    portfolio = portfolio × (1 + yearReturn/100)
    portfolio -= yearWithdrawal[year]        // Net of passive income offset
    portfolio -= oneTimeExpenses[year]        // If any

    If portfolio ≤ 0: simulation FAILED, break

  If portfolio > 0 at end: SUCCESS

successProbability = successCount / 1000 × 100
```

### Key Properties

- **IID returns:** Each year's return drawn independently — no autocorrelation, momentum, or mean reversion modeled
- **Withdrawal:** Category-based with per-category inflation and phase-outs; passive/other income offsets drawdown
- **One-time expenses:** Deducted in their calendar year
- **No rebalancing:** Single-asset-class simulation

---

## 4. Scorecard Metrics

### 7 Financial Health Tiles

| # | Metric | Formula | Green | Amber | Red |
|---|--------|---------|-------|-------|-----|
| 1 | **Current-Year Savings Rate** | `(income − current expenses − current-year planned expenses) / income × 100` | ≥ 20% | 10–19% | < 10% |
| 2 | **NW Multiple** | `netWorth / salary` vs interpolated Fidelity target | ≥ 100% of target | 75–99% of target | < 75% of target |
| 3 | **Debt Ratio** | `liabilities / assets × 100` | < 30% | 30–49% | ≥ 50% |
| 4 | **Emergency Fund** | `cash / monthlyExpenses` (months) | ≥ 6 mo | 3–5 mo | < 3 mo |
| 5 | **Investment Mix** | `investments / assets × 100` | ≥ 40% | 20–39% | < 20% |
| 6 | **Retirement Funding** | `projectedWealth / nestEgg × 100` | ≥ 100% | 50–99% | < 50% |
| 7 | **Income Replacement** | `retExpenses / preRetIncome × 100` (today's terms) | 80–120% | 70–79% or >120% | < 70% |

### Retirement Health (Separate from the 7-Tile Scorecard)

The app also presents a retirement-health section that answers two separate questions:

- **Q1:** Is the portfolio large enough on retirement day? (`projectedWealth / nestEgg`)
- **Q2:** How often does the retirement portfolio survive in 1,000 Monte Carlo runs?

Monte Carlo success probability is part of this retirement-health section and the exported report KPI strip. It is **not** one of the seven Financial Health tiles shown in the main dashboard strip.

### Fidelity NW Multiple Targets

| Age | Target Multiple |
|-----|----------------|
| 30 | 1× salary |
| 40 | 3× salary |
| 55 | 7× salary |
| Retirement | 10× salary |

### Retirement Health Verdict

The retirement-health card combines Q1 and Q2 into a multi-state verdict, including "strong plan", funded-but-volatile cases, funding-gap cases with strong odds, and the worst-case combination of both a funding gap and weak survival odds.

### Required Nest Egg

```
nestEgg = retirementExpenses(atRetirement, nominal) / (SWR / 100)
```

Where `retirementExpenses(atRetirement)` is the sum of all 15 retirement budget categories inflated to the retirement year.

### Financial Independence Age

First age where `investments(y) ≥ retirementExpenses(y, nominal) / (SWR / 100)`.

---

## 5. Gap-Closing Levers

Triggered when projected wealth at retirement < required nest egg. The UI computes three independent levers.

### Lever 1: Save More

```
Solve extra annual contribution (binary search):
  projectedInvestments(retirementAge, returnAssumption, extraAnnual) >= requiredNestEgg(retirementAge)
extraMonthly = ceil(extraAnnual / 12)
```

Shows how much additional monthly investment closes the gap when added as a new investment contribution stream (0% contribution growth) on top of existing investment-item contributions. The monthly value is rounded up so applying it closes the gap instead of leaving a small shortfall. This is a flat gap-closing lever, not the dynamic full-surplus scenario shown in Surplus Deployment.

This lever is additional to the annual contributions entered on investment sub-items, because those contributions are already included in `projectedWealth`. Only undeployed surplus can offset the displayed monthly amount:

```
undeployedSurplus = currentYearSavings - currentYearActiveInvestmentContributions
```

Future-starting investment contributions do not reduce current-year undeployed surplus until their start year. Contributions with an end year stop reducing undeployed surplus after that inclusive end year. Gap-closing lever solvers also respect each item's configured contribution start year, end year, and growth rate. If planned contributions exceed projected savings surplus in any pre-retirement year, the base model still honors the entered contribution plan and shows an informational affordability warning; users should reduce the contribution input, shorten/delay the contribution window, or review Cash Flow Over Time if the plan is not affordable.

Surplus Deployment is separate: its tiles deploy each year's full dynamic surplus or a selected split of that surplus as standalone alternatives. They do not add full surplus on top of fixed investment-item contributions already in the base plan.

For debt-first/custom-debt surplus scenarios, debt allocation is applied only to liability balances active in that same pre-retirement year (respecting each liability row's From and payoff years). If no liability is active in a given year, that year's debt-allocation slice is redirected to investments.

### Lever 2: Retire Later

```
For each extra year (1–30):
  candidateAge = plannedRetirementAge + years
  if projectedInvestments(candidateAge, returnAssumption, extraAnnual=0)
     >= requiredNestEgg(candidateAge):
    return years
```

Shows how many additional working years close the gap when only retirement age changes. Existing investment-item annual contributions continue through the later retirement date unless their configured end year stops them sooner.

### Lever 3: Higher Return

```
Solve return assumption (binary search):
  projectedInvestments(retirementAge, returnAssumption, extraAnnual=0) >= requiredNestEgg(retirementAge)
displayedReturn = ceil(returnAssumption * 10) / 10
```

Shows the investment return assumption needed to close the gap with current balances and existing investment-item annual contributions unchanged.

### Combination Guidance

The UI also explains that a combination of levers will typically close the gap faster than changing a single variable in isolation. There is currently **no separate computed "Reduce Expenses" or "Combination" card** rendered in the app.

---

## 6. Confirmed Design Decisions

These items were reviewed during the audit and **confirmed as intentional** by the project owner:

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Cash excluded from Monte Carlo** | Cash is allocated annually as an emergency fund, not a growth asset | MC uses liquid investments only |
| **Only explicit investment contributions enter the base projection** | Planned annual contributions belong on investment sub-items and may use a future pre-retirement start year and optional inclusive end year; unallocated surplus remains a scenario input | Base projection includes entered contributions only within their configured contribution windows; Surplus Deployment remains useful for testing additional year-by-year surplus strategies |
| **Cash earns 0%** | Pragmatic — emergency fund, not income-generating | Cash balance is constant across projection |
| **Linear amortization** | Simplification accepted by owner | Slightly overestimates debt in early years vs actual amortization schedule |
| **Liability balances do not imply payments** | Balance sheet and cashflow are deliberately separate | Keep liabilities for net worth; enter full debt-service payments as expenses to affect savings |
| **Life Events are visual-only overlays** | Milestones provide timeline context, not cashflow drivers | Life-event start/end years render chart markers/bands only and do not alter financial calculations |
| **NW Multiple uses salary only** | Fidelity standard benchmark | Passive/other income excluded from denominator |
| **Higher Return lever keeps the base projection unchanged except return** | Solves required return after current balances and entered annual contributions are reflected in projected wealth | Gives an isolated return-lever estimate with actionable parity to changing the return assumption |
| **Drawdown timing: age >= retirementAge** | Drawdown starts in the retirement-age transition year, aligned across deterministic, runway, and Monte Carlo engines | Consistent cross-surface timing semantics |

---

## 7. Limitations & Disclosures

These are documented in the app's "Notes to Financial Statements" (HTML export Note 2):

1. **IID returns** — Monte Carlo draws are independent, identically distributed, normally distributed. No modeling of return correlation, momentum, autocorrelation, or regime changes.

2. **No tax modeling** — All figures are pre-tax. Actual after-tax returns will be lower depending on jurisdiction.

3. **No variable withdrawal** — Only constant SWR modeled. No guardrails, CAPE-based, or dynamic strategies.

4. **Single-asset-class MC** — No rebalancing, no multi-asset allocation within the simulation.

5. **Deterministic base projection** — The year-by-year view uses expected returns only. Use Monte Carlo for probabilistic assessment.

6. **4% SWR caveat** — For retirements exceeding 35 years, the app's tooltip recommends dropping to 3–3.5%.

7. **Currency risk** — FX rates are point-in-time. No modeling of future exchange rate volatility.

8. **No inflation-adjusted returns** — Returns are nominal. Real returns = nominal − inflation (not explicitly computed).
