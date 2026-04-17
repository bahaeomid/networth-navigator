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
| Safe withdrawal rate | 4.0% | 0.1–any | % of nest egg |

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
investments(y+1) = max(0, investments(y) × (1 + investmentReturn) − drawdown(y))
realEstate(y+1)  = realEstate(y) × (1 + realEstateAppreciation)
otherAssets(y+1)  = otherAssets(y) × (1 + otherAssetGrowth)
cash(y)          = constant (earns 0%, not compounded)
```

### Liability Amortization (Linear)

```
For each liability sub-item with endYear:
  term = endYear − currentYear
  balance(y) = max(0, originalAmount × (endYear − calendarYear) / term)

If no sub-items: total amortized linearly over default term (25yr mortgage, 5yr loans)
```

### Drawdown (Post-Retirement)

```
If enableDrawdown AND age > retirementAge:
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
| 1 | **Savings Rate** | `(income − expenses) / income × 100` | ≥ 20% | 10–19% | < 10% |
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
gap = nestEgg − projectedWealth
annuityFactor = ((1 + r)^years − 1) / r        where r = investmentReturn/100
extraMonthly = (gap / annuityFactor) / 12
```

Shows how much additional monthly investment closes the gap.

### Lever 2: Retire Later

```
Starting from retirement-year investments:
  For each extra year (1–30):
    investments = investments × (1 + r)
    netSavings = max(0, (salary + passive + other) − preRetExpenses)
    investments += netSavings            [salary/income grow at configured rates]
    
    If investments ≥ updated nest egg: return extra years needed
```

Shows how many additional working years close the gap, including continued salary contributions.

### Lever 3: Higher Return

```
neededReturn = (nestEgg / currentInvestments)^(1/years) − 1
```

Shows what CAGR is needed to close the gap through returns alone (no additional savings).

### Combination Guidance

The UI also explains that a combination of levers will typically close the gap faster than changing a single variable in isolation. There is currently **no separate computed "Reduce Expenses" or "Combination" card** rendered in the app.

---

## 6. Confirmed Design Decisions

These items were reviewed during the audit and **confirmed as intentional** by the project owner:

| Decision | Rationale | Impact |
|----------|-----------|--------|
| **Cash excluded from Monte Carlo** | Cash is allocated annually as an emergency fund, not a growth asset | MC uses liquid investments only |
| **Surplus not auto-reinvested** | Conservative assumption — shows what happens without action | User can adjust via surplus deployment |
| **Cash earns 0%** | Pragmatic — emergency fund, not income-generating | Cash balance is constant across projection |
| **Linear amortization** | Simplification accepted by owner | Slightly overestimates debt in early years vs actual amortization schedule |
| **NW Multiple uses salary only** | Fidelity standard benchmark | Passive/other income excluded from denominator |
| **Higher Return lever ignores contributions** | Conservative — shows required return from existing assets alone | Gives a floor estimate |
| **Drawdown timing: age > (not >=)** | Conservative — retirement-year expenses paid from final salary year | Standard practice |

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
