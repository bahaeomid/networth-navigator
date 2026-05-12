# Post-Implementation Audit Report - 2026-05-12

**Auditor:** Sonnet findings reviewed and implemented by Codex  
**Source:** `_dev/Prompt/session7-post-implementation-audit.md`  
**Scope:** Follow-up review of Session 7 investment-contribution, savings-rate, and liability workflow changes.

---

## Summary

The audit confirmed the core Session 7 model changes were correct:

1. Annual investment contributions now flow through the base projection and downstream retirement/report surfaces.
2. Current-year savings rate includes current-year planned expenses.
3. Liability balances remain balance-sheet items; debt-service cashflow is entered through expense categories for all liability types.

The audit identified six missed UX/documentation gaps. All six were accepted and fixed in Session 8. No calculation changes were required.

---

## Findings

### NEW-44 - Save More surplus-offset hint used gross surplus

**Severity:** High  
**Status:** Fixed  

The Save More lever continued to show gross current surplus as available to offset the additional monthly investment requirement. After investment-item annual contributions were introduced, this could double-count amounts already committed in the base projection.

**Fix:** Save More now uses undeployed surplus:

```
undeployedSurplus = currentYearSavings - annualInvestmentContributions
```

The hint only appears when undeployed surplus is positive. Tooltip and HTML report methodology wording now state that Save More is additional to entered contributions.

### NEW-45 - Surplus Deployment scenario framing was misleading

**Severity:** High  
**Status:** Fixed  

The Surplus Deployment explainer described the scenarios as additional deployment on top of the base projection. Tile 1 is actually a standalone alternative that invests the full dynamic surplus from the original projection, not an additive layer on top of entered contributions.

**Fix:** The app and report now describe these as standalone scenarios. The base projection uses entered investment contributions; Tile 1 is a full-surplus alternative; the FI Age delta is the benefit of deploying more than entered contributions.

### NEW-46 - Investment contribution layout was unclear

**Severity:** Medium  
**Status:** Fixed  

The investment-item row used a flat wrapping layout. The current balance field was not explicitly labelled and contribution fields were visually compressed.

**Fix:** Investment rows now use labelled fields for Name, Current value, Annual contrib, and Growth, with a lightweight header row and stable grid columns.

### NEW-47 - Contribution fields lacked local tooltips

**Severity:** Medium  
**Status:** Fixed  

Users could enter annual contribution and contribution growth values without nearby explanation of how these fields affect projections.

**Fix:** Inline tooltips were added beside Annual contrib and Growth. They state that contributions are included in the base projection, affect downstream retirement metrics, and are not automatically capped to calculated surplus.

### NEW-48 - Savings-rate tooltip omitted contribution treatment

**Severity:** Low  
**Status:** Fixed  

The current-year savings-rate tooltip did not explain whether investment contributions reduce the displayed savings rate.

**Fix:** Tooltip now clarifies that annual investment contributions are treated as deployment of savings, not expenses, and defines undeployed surplus as current surplus minus entered annual contributions.

### NEW-49 - HTML report Save More note referenced generic surplus

**Severity:** Low  
**Status:** Fixed  

The HTML report methodology note used old wording saying existing monthly surplus partially offsets Save More.

**Fix:** The report now documents the same undeployed-surplus logic used in the app.

---

## Verification Target

Run `npm run test:release` after implementation to verify lint, audit harnesses, and E2E smoke coverage.
