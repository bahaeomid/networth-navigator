# Audit Test Files

This directory contains the test files created during the NetWorth Navigator audit.

## Files

1. **`audit_test.js`** - Phase 2.1: Projection Engine Audit
   - Hand computation verification of 5-year projection
   - Tests investment growth, liability amortization, income/expense growth
   - Identifies critical calculation issues

2. **`monte_carlo_test.js`** - Phase 3: Monte Carlo Engine Audit
   - Box-Muller transform statistical validation
   - Simulation structure analysis
   - Phase-out schedule verification

3. **`scorecard_audit.js`** - Phase 4: Financial Health Scorecard Audit
   - Analysis of all 7 metrics
   - Tests for each scorecard calculation
   - Identifies inconsistencies and misleading metrics

4. **`gap_levers_audit.js`** - Phase 5: Gap-Closing Levers & Surplus Deployment Audit
   - Verification of "Save More", "Retire Later", "Higher Return" levers
   - Surplus deployment scenario analysis
   - Edge case testing

## Usage

Each file can be run independently:
```bash
node audit_test.js
node monte_carlo_test.js
node scorecard_audit.js
node gap_levers_audit.js
```

## Purpose

These files demonstrate the mathematical verification performed during the audit and provide reproducible test cases for the critical issues identified in the main audit report.

## Audit Report

See the main audit report: `../AUDIT_FINDINGS_REPORT.md`