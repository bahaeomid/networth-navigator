# Architecture — NetWorth Navigator v2.0.0

> Technical reference for developers. For financial assumptions and formulas, see [FINANCIAL_MODEL.md](FINANCIAL_MODEL.md).

---

## Overview

Single-file React 18 SPA (`src/App.jsx`, ~7,800 lines). No routing, no backend, no database. All computation runs client-side. Built with Vite, charts via Recharts.

**Stack:** React 18 · Vite · Recharts · open.er-api.com (FX rates)

---

## Application Structure

### Entry Points

| File | Purpose |
|------|---------|
| `index.html` | Vite entry — mounts `#root` |
| `src/main.jsx` | React root render — imports `App` from App.jsx |
| `src/App.jsx` | Entire application (components, state, logic, UI) |
| `src/index.css` | Global styles |

### Component Hierarchy

```
<AppErrorBoundary>           ← Class component, catches unhandled exceptions
  <NetWorthNavigator>         ← Main function component (~7,500 lines)
    Tab: Profile              ← Age, retirement, life expectancy, dependents
    Tab: Finances             ← Assets, liabilities, income (with sub-items)
    Tab: Pre-Retirement       ← 15 pre-retirement categories + growth settings
    Tab: Retirement           ← Retirement budget, SWR, runway, retirement health
    Tab: Dashboard            ← Projection charts, financial health strip, import/export
```

### Module-Scope Components

These are defined outside the main component for stable references (no re-mount on re-render):

| Component | Purpose |
|-----------|---------|
| `escapeHtml(str)` | HTML entity escaping for XSS prevention |
| `TooltipLayer` | Fixed-position tooltip container |
| `InfoTooltip` | Help icon with hover text |
| `CalcInput` | Currency-aware input field |
| `ExchangeRateInput` | FX rate editor |
| `MilestoneLegend` | Chart legend for wealth milestones |
| `NumberInput` | Generic numeric input |
| `SubItemAmountInput` | Sub-item amount with currency conversion |

### In-Component Components (closure-dependent)

| Component | Why Not Extracted |
|-----------|-------------------|
| `CustomDot` | Reads `wealthProjection` from parent scope |
| `CustomDotExpenses` | Reads expense chart data from parent scope |
| `CustomLegend` | Reads chart config from parent scope |

---

## State Management

All state lives in the `NetWorthNavigator` function component via 50+ `useState` hooks. No Redux, no context, no state management library.

### Core Financial State

| State Variable | Type | Default | Description |
|----------------|------|---------|-------------|
| `currency` | string | `'AED'` | Display currency |
| `exchangeRates` | object | `{AED:1, USD:3.67, ...}` | Live or cached FX rates |
| `profile` | object | `{currentAge:35, retirementAge:55, lifeExpectancy:85}` | Life stage |
| `assets` | object | `{cash:50K, investments:300K, realEstate:800K, ...}` | Balances + sub-items |
| `liabilities` | object | `{mortgage:600K, loans:20K, ...}` | Debts + sub-items with endYear |
| `income` | object | `{salary:300K, passive:40K, other:60K, ...}` | Income + sub-items with endYear |
| `expenseCalculator` | object | 15 categories | Pre-retirement monthly amounts |
| `expenseCategories` | array | `DEFAULT_EXPENSE_CATEGORIES` | Category metadata, ordering, labels, colours |
| `retirementBudget` | object | 15 categories | Retirement-day monthly amounts |
| `expenseGrowthRates` | object | Per-category % | Pre-retirement inflation rates |
| `retExpenseGrowthRates` | object | Per-category % | Post-retirement inflation rates |
| `expenseTags` | object | essential/discretionary | Category grouping used in UI and totals |
| `expensePhaseOutYears` | object | per-category year | Pre-retirement category phase-outs |
| `retExpensePhaseOutYears` | object | per-category year | Retirement category phase-outs |
| `assumptions` | object | See below | Growth rates and MC parameters |
| `oneTimeExpenses` | array | Planned costs | Future one-time or recurring expenses |
| `lifeEvents` | array | Milestones | Timeline events with stages |
| `nestEggSwr` | number | `4` | Safe withdrawal rate (%) |
| `surplusSplitInvest` | number | `100` | % of surplus to investments |
| `surplusSplitDebt` | number | `0` | % of surplus to debt reduction |

The table above covers the main financial state only. Additional UI state controls panel collapse, scenario sliders, chart filters, active tab, and annual/monthly expense view toggles.

### Assumptions Object

```
salaryGrowth: 4.0       investmentReturn: 7.0     investmentStdDev: 12.0
passiveGrowth: 2.0       realEstateAppreciation: 3.5
otherIncomeGrowth: 2.0   otherAssetGrowth: 2.0     enableDrawdown: true
```

### Key Derived Values (useMemo)

| Computed | Depends On | Purpose |
|----------|-----------|---------|
| `wealthProjection` | All financial state | Year-by-year projection array |
| `retirementMetrics` | Projection + profile | MC success probability at retirement |
| `fiAge` | Projection + SWR | First age where investments ≥ nest egg |
| `debtFreeAge` | Projection + liabilities | First age where total liabilities = 0 |
| `wealthMilestones` | Projection + FX rates | Ages crossing $1M/$5M/$10M/$25M USD |
| `effectiveRetirementExpense` | Retirement budget + growth | Today's-terms retirement cost |

---

## Data Persistence

### localStorage Auto-Save

- **Key:** `'nwn_autosave'`
- **Trigger:** useEffect with 2-second debounce on any state change
- **Scope:** All 25+ financial state variables; UI-only state excluded
- **Format:** JSON with `version: '2.0'` marker

### Auto-Restore on Mount

- Reads `localStorage.getItem('nwn_autosave')` once at mount
- Parses, validates version, restores each field via setState
- Silent fail if corrupted, missing, or localStorage unavailable

---

## Currency System

### Internal Representation

**All monetary values are stored in AED**, regardless of display currency. Conversion happens only at the display/input boundary.

### Conversion Helpers

| Function | Direction | Notes |
|----------|-----------|-------|
| `toDisplay(aedVal, rate)` | AED → display | Divides by rate; guards `rate ≤ 0` |
| `fromDisplay(displayVal, rate)` | Display → AED | Multiplies by rate |
| `formatCurrency(aed, currency, rates)` | AED → formatted string | `$1.2M`, `$45.6K` etc. |
| `formatCurrencyDecimal(...)` | AED → 1-decimal string | More precise variant |

### FX Rate Fetching

- **API:** `https://open.er-api.com/v6/latest/AED`
- **Timeout:** 10s via AbortController
- **Fallback:** Hardcoded rates if API unavailable
- **Validation:** Guards falsy/zero rates before `1/rate` division
- **Supported:** AED, USD, CAD, EUR, GBP

---

## Import/Export

### JSON Export/Import

- Exports all financial state as a single JSON file
- Includes `version: '2.0'` and `note` about AED storage
- Import accepts v1.0 and v2.0; missing fields fall back to defaults
- Round-trip verified: export → import → export produces identical output

### CSV Import (Expenses)

- Imports expense categories from CSV (Excel-compatible)
- Handles UTF-8 BOM (`\uFEFF` stripped)
- Requires `Category` and `Monthly Planning Budget (XXX)` columns
- Optionally uses `Description` and `Expense Type` columns
- Replaces pre-retirement categories, pre-fills retirement budget with the same annualized values, and switches display currency to the detected CSV currency

### HTML Export

- Self-contained HTML report with embedded Chart.js
- 12 sections: cover, summary, scorecard, balance sheet, income, expenses, retirement plan, milestones, charts, projection table, assumptions, notes
- All user-controlled strings escaped via `escapeHtml()` (XSS prevention)

---

## Error Handling

| Layer | Mechanism |
|-------|-----------|
| React errors | `AppErrorBoundary` class component — generic message + reload button |
| Network errors | AbortController timeout + fallback rates |
| Division by zero | `|| 1` fallback (display) or `≤ 0` guard (computation) |
| Invalid ages | Input clamping: `currentAge < retirementAge < lifeExpectancy` |
| Import errors | Version validation + field-level defaults |

---

## Build & Development

```bash
npm install          # Install dependencies
npm run dev          # Vite dev server (port 3000)
npm run build        # Production build to dist/
npm run test:release # Lint + audit harnesses + Playwright smoke test
```

### Verification Layout

- `_dev/tests/` contains formula/parity/audit harnesses used to validate financial logic and prior audit findings.
- `_dev/e2e/` contains browser-level Playwright smoke tests for release readiness.
- `playwright.config.js` stays at the repo root so `npm run test:smoke` works conventionally.
- Generated artifacts such as `dist/`, `test-results/`, `playwright-report/`, and `test-output.txt` are disposable and should not be treated as source assets.

### Dependencies (from package.json)

- `react` / `react-dom` — UI framework
- `recharts` — Chart components
- `vite` — Build tool
- No backend dependencies, no routing library, no state management library
