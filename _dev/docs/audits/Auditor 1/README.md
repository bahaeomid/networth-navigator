# Audit Test Files

This directory contains the written audit artifacts for Auditor 1. The corresponding executable tests now live under `_dev/tests/`.

## Files

1. **`auditor1_projection_test.js`** - Phase 2.1: Projection Engine Audit
   - Hand computation verification of 5-year projection
   - Tests investment growth, liability amortization, income/expense growth
   - Identifies critical calculation issues

2. **`auditor1_monte_carlo.js`** - Phase 3: Monte Carlo Engine Audit
   - Box-Muller transform statistical validation
   - Simulation structure analysis
   - Phase-out schedule verification

3. **`auditor1_scorecard.js`** - Phase 4: Financial Health Scorecard Audit
   - Analysis of all 7 metrics
   - Tests for each scorecard calculation
   - Identifies inconsistencies and misleading metrics

4. **`auditor1_gap_levers.js`** - Phase 5: Gap-Closing Levers & Surplus Deployment Audit
   - Verification of "Save More", "Retire Later", "Higher Return" levers
   - Surplus deployment scenario analysis
   - Edge case testing

## Usage

Each file can be run independently:
```bash
node _dev/tests/auditor1_projection_test.js
node _dev/tests/auditor1_monte_carlo.js
node _dev/tests/auditor1_scorecard.js
node _dev/tests/auditor1_gap_levers.js
```

## Purpose

These files demonstrate the mathematical verification performed during the audit and provide reproducible test cases for the critical issues identified in the main audit report.

## Audit Report

See the main audit report: `./AUDIT_FINDINGS_REPORT_Deepseek.md`