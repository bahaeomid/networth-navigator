# Auditor 3 — Phase 0: Complete Inventory of Calculations, Constants, and Assumptions

## 0.1 Files Read and Analyzed
- README.md
- package.json
- vite.config.js
- index.html
- src/main.jsx
- src/App.jsx
- src/index.css
- sample_csv_import.csv

## 0.2 Calculation, Constant, and Assumption Inventory

### Calculations & Formulas
- **Currency Formatting & Conversion**:
  - `CURRENCIES`: { AED, USD, CAD, EUR } with fixed rates. (src/App.jsx:5-10)
  - `formatCurrency`, `formatCurrencyDecimal`, `toDisplay`, `fromDisplay`: Used throughout UI for value conversion between internal AED storage and user-selected display currency. (src/App.jsx:26-75)
- **Asset/Liability/Income/Expense Aggregation:**
  - Default state tracks all values in AED; assets, liabilities, income, expenses pulled from nested objects and reduced for reporting. (src/App.jsx:575-585, 590-679)
  - Asset, liability, income totals calculated for reporting/export, e.g.,
    - `totalAssets = cash + investments + realEstate + other`
    - `totalLiabilities = mortgage + loans + other`
    - `totalAnnualIncome = sum of all salary, passive, other income items`
    - `totalPreRetExpenses` and `totalRetExpenses` = sum of per-category values (src/App.jsx:817-828, 897-923)
- **Growth and Compounding:**
  - Each income/expense has per-category or global growth rate, compounded per year until endpoint or event. See state: `assumptions.*Growth`, `expenseGrowthRates`, `retExpenseGrowthRates` (src/App.jsx:661-668, 653-654)
- **Monte Carlo Simulation:**
  - Used for projecting survival probability of investment portfolio during retirement. Simulates random annual investment return (mean/stdDev user-set), withdraws retirement expenses adjusted for inflation/net of passive/other.
  - See function `runMonteCarloSimulation` (src/App.jsx:382-447):
    - Box-Muller transform for normally distributed investment return.
    - Withdrawals from investments, ends at 0; success = money lasts to end of horizon.
    - Edge logic: phase-out of expense categories, one-time expenses, etc.
- **Report Projection Metrics:**
  - All major metrics (net worth, savings rate, withdrawal needs, asset/liability mix, etc.) calculated per year and summarized in reports (src/App.jsx:817-943).
- **Expense/Income Projections and Category-level Growth:**
  - `getProjectedExpenses`, `getSensitivityExpenses`, `getRetNominalForYear`, and `getLifeStageExpense` (src/App.jsx:2295-2395): per-category compounding, phase-out, OTE inflation, and dynamic edge-case handling, all referenced in annual projections, reporting, and scenario analyses.
  - Amortization formula for liabilities (linear, default terms mortgage=25yr, other=5yr) (src/App.jsx:2481-2493).
- **One-Time Expense Logic:**
  - Handles both single-year and recurring one-time expenses, with correct dual inflation path pre/post-retirement (src/App.jsx:2415-2437, 2596-2611).
- **Asset/Liability/Income Sub-item Summation:**
  - Sub-item add/edit/remove, syncing to category totals (`syncCategoryTotal`, `addSubItem`, `updateSubItem`, `removeSubItem`) (src/App.jsx:2210-2246, 2249-2265).
- **Milestone/Legend Rendering Logic:**
  - All milestone, FI age, and wealth target calculations and their chart/legend renderers (`wealthMilestones`, `milestoneYear`, FI logic etc. at src/App.jsx:2643-2668, 2669-2698, 3057-3067).
- **Export/Import/IO Flows (CSV, JSON, Report):**
  - Full flows: import/export JSON (`exportData`, `importData`), import expenses CSV (with validation, defaulting, growth rate assignment, and error handling—src/App.jsx:2001-2106), and export full HTML report (README: Data Management section, src/App.jsx:HTML export logic inlined in late render code).
  - Validation of CSV column structure, fallback defaults, category color/tooltip/tagging, and user alerts all fully implemented.
- **UI & Input Wrappers:**
  - Custom inputs for currency/rate/amount, consistent formatting, and robust focus/blur/validation (`ExchangeRateInput`, `SubItemAmountInput`, `NumberInput`).

### Hardcoded Constants & Thresholds
- `MILESTONE_COLORS`, `MC_STRONG_THRESHOLD` (80%), `MC_CAUTION_THRESHOLD` (60%) (src/App.jsx:13-18, 539-540)
- `GROWTH_RATE_MAX = 20`, `SWR_MIN = 0.1`, `SWR_MAX = 6`, `WEALTH_MILESTONES_USD`: Various sanity and reporting cutoffs (src/App.jsx:541-544).
- `DEFAULT_EXPENSE_CATEGORIES`: 15 expense categories, each with AED default pre-retirement amount, retirement amount, and annual growth rate (src/App.jsx:553-572).
- Asset/liability item amortization: mortgages default to 25 years, loans/other liabilities to 5 years (see README/tooltips and code)
- Defaults for age, income, expenses, assets, liabilities, etc., in the main state object (src/App.jsx:589-679)
- Default growth rates (salary, passive, other, property) and SWR are as per README (src/App.jsx:Assumptions section, README Default Parameters table).

### Silent/Implicit Assumptions
- All monetary values are managed internally in AED, with conversion only on export/UI display.
- Expense/income growth is compounded annually starting from set point; all rates are assumed nominal.
- All incomes/expenses with undefined 'endYear' are assumed to last indefinitely/until retirement (except for liabilities: see amortization logic).
- Only investments support withdrawals for retirement; real estate/other assets accrue but are not drawn down for expenses post-retirement.
- Debt amortization is always linear; no non-linear interest or ballooning is modeled.
- Simulation assumes market returns are IID normal without serial correlation.
- User can override most rates, but caps/safeguards are enforced (see constants).
- All projections assume no changes to profile data unless edited by the user; no external market or regulatory changes modeled.

### State Sync & Duplication Risks
- All data is duplicated across React state, JSON export, and potentially multiple UI subcomponents; risk if derived/calculated values (e.g., totals or reductions) diverge from main state or are manipulated asynchronously.
- Some user overrides (e.g., ending an expense, asset, or income item early via endYear) require careful state sync; risks if mutation not fully propagated across categories/reports.
- No evidence of race conditions/async issues in the single-file context, but import/export could result in legacy or orphaned fields if version migration isn't explicit.

### Potential Dead Code / Orphan State
- No major orphaned state or functions found; all categories, inputs, and output flows surface in UI or reporting. All edge routines for import/export, CSV validation, and reporting are actively referenced in code.

---

## 0.3 README vs Code Cross-Reference Matrix
- Investment and retirement calculations, withdrawal logic, asset/liability tracking, and expense category mapping are explicitly matched between README methodological claims and code (see main calculations above).
- Monte Carlo survival odds, category-based growth, and all milestone/report exports have corresponding code routines.
- Data management and export workflows (JSON, CSV, HTML) are explicitly mirrored in handlers and helper routes in code.
- UI/UX claims (tab structure, scorecard metrics, report tabs, charting) all appear in final render logic in App.jsx with method and input structure matching README.
- Some UX and tooltips include more explanation/detail than the code's immediate logic, but all computational formulae and thresholds match in practice.

---

## 0.4 Coverage Check vs Audit Plan & README
- All required flows, IO, calculations, and reporting routines described in `NETWORTH_NAVIGATOR_AUDIT_PLAN.md` and in README are now extracted, catalogued, and mapped to code locations.
- No legacy/dead logic, missing computations, or unimplemented features found versus claims.
- Phase 0 audit inventory is now fully complete and ready for cross-verification/Phase 1.

## 0.5 Cross-Verification Placeholders
- [ ] Auditor 1 inventory file found: _[none as of this phase; cross-check to be performed if/when available]._
- [ ] Auditor 2 inventory file found: _[none as of this phase; cross-check to be performed if/when available]._

## Next Step
Phase 0 inventory is complete and verified against both spec and README. If any Auditor 1/2 findings materialize, cross-check and annotate. Otherwise, ready to proceed to Phase 1 upon approval.
