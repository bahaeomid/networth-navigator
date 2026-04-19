# Auditor 3 — Phase 1: Independent Verification of Calculations & Logic

## Instructions
- Methodically verify each calculation, constant, assumption, and process from the Phase 0 inventory, referencing actual code, UI, and input/output behaviours.
- No referencing of Auditor 1 or Auditor 2 outputs at this stage.
- For each item: state verification status (Success, Discrepancy, Needs-Review) with justification, test evidence, and code or UI references.

## Checklist (expand each in detail below)

- [ ] Currency formatting & conversion logic — AED↔other, display accuracy
- [ ] Asset/Liability/Income/Expense aggregation totals match UI & export
- [ ] Growth and compounding routines — per-category logic and boundary/caps
- [ ] Monte Carlo simulation structure and parameterization
- [ ] Category inflation, phase-out, and one-time expense logic
- [ ] Asset/liability/income sub-item rollups and amortization
- [ ] Milestone/FI calculations, chart labeling, legend flows
- [ ] Import/export mechanisms for JSON, CSV, HTML; error handling
- [ ] State synchronization and edge-case/phase-out flows
- [ ] Defaults, user overrides, code/README methodological match

## Inventory Expanded — Verification Results

### 1. Currency Formatting & Conversion
- **Formulas to check:** AED↔USD/CAD/EUR, UI inputs, formatted output, round-trip integrity.
- **Test Method:** Input test values in all currencies; check UI, final report, and export values agree (code: `formatCurrency`, `toDisplay`, `fromDisplay`).
- **Status:** _Pending_

### 2. Asset/Liability/Income/Expense Aggregation
- **Formulas to check:** Totals in state, summary tiles, export.
- **Test Method:** Enter sample data, check sums in state, all reports, and exports; confirm rounding/edge-case behaviour. (code: aggregation/summary routines)
- **Status:** _Pending_

### 3. Growth & Compounding Routines
- **Formulas to check:** Annual and per-category percentage increases, enforcement of caps, pre/post-retirement inflation.
- **Test Method:** Sample percent values, run annual projections, compare math; test capped/min/max edge cases. (code: getProjectedExpenses, getRetNominalForYear, etc.)
- **Status:** _Pending_

### 4. Monte Carlo Simulation
- **Structure to check:** Box-Muller transform, scenario count, parameterization (mean/sd), success counter, phase-out/horizon logic.
- **Test Method:** Run simulations with edge parameter values, check distribution shape, success rates at high/low withdrawal/volatility regimes. (code: runMonteCarloSimulation)
- **Status:** _Pending_

### 5. Expense/Income Projections & Phase-Out Logic
- **Process to check:** Per-category/case handling, phase-out at endYear, OTE inflation, dual-path inflation (pre/post retirement).
- **Test Method:** Configure categories with/without endYear, single/recurrent OTE, track category results for each year/phase. (code: getLifeStageExpense, OTE inflation path, reporting/export)
- **Status:** _Pending_

### 6. Asset/Liability/Income Sub-Item Rollups and Amortization
- **Process to check:** Sub-item sum, term-based amortization, proper rollup to parent category and export.
- **Test Method:** Add sub-items with varying terms, remove/modify, check sum logic, amortization vs default. (code: addSubItem, amortizeLiability)
- **Status:** _Pending_

### 7. Milestone & FI Calculations
- **Calculation to check:** FI Age, net worth thresholds, chart milestone detection, legend labels.
- **Test Method:** Input data around $1M, $5M triggers, adjust expenses/SWR, confirm FI/milestone display matches computation. (code: milestone detection, fiAge)
- **Status:** _Pending_

### 8. Import/Export/IO Mechanisms
- **Process to check:** JSON save/load, CSV parsing, full report HTML, all edge/error/confirmation cases.
- **Test Method:** Export data, edit/re-import, deliberately malformed CSVs, check confirmations/errors, report completeness. (code: import/export handlers)
- **Status:** _Pending_

### 9. State Sync & Edge Flow
- **Process to check:** Cross-category dependencies, UI events updating state/export, phase-outs, endYears, category disables.
- **Test Method:** Manipulate categories (retire, phase-out), observe report/UI differences, check exported state matches UI.
- **Status:** _Pending_

### 10. Defaults, User Overrides, Code/README Sync
- **Process to check:** Initial state/population, code/init values vs README claimed defaults/assumptions, user override propagation.
- **Test Method:** Compare README table vs code, change settings, examine projected/report changes/consistency.
- **Status:** _Pending_

---

## Evidence, Notes, and Verification Logs
(Expand this section during item-by-item verifications)
