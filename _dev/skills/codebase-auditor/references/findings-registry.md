# Findings Registry Template

Use this template to track all findings across an audit session. Copy this to a working
file (e.g., `FINDINGS.md` in the codebase's _dev/docs/ directory) and update it live
as the audit proceeds.

---

## Registry Header

```
AUDIT FINDINGS REGISTRY
========================
Codebase: [name]
Audit Start: [date]
Auditor: [Claude version]
Prior Audits: [list any prior audit finding series, e.g., F-01–F-63]
This Audit Series: [e.g., MA-01, PP-01, etc.]
```

---

## Severity Key

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Silent wrong results, data loss, or security risk |
| **HIGH** | Behaviorally incorrect — user sees wrong output |
| **MEDIUM** | Fragile — works but will break under plausible conditions |
| **LOW** | Code quality, maintainability, or minor UX issue |

---

## Active Findings Table

| ID | Phase | Severity | Short Title | Status | File:Line |
|----|-------|----------|-------------|--------|-----------|
| FINDING-01 | 4 | CRITICAL | [title] | OPEN | [file:line] |
| ... | | | | | |

**Status values:** OPEN / IN_PROGRESS / FIXED / DEFERRED / WON'T FIX

---

## Finding Detail Template

Copy this block for each finding:

```
---
ID: FINDING-{N}
Phase: {N}
Severity: CRITICAL / HIGH / MEDIUM / LOW
Title: {Short descriptive title}
File: {path:line}
Status: OPEN

Description:
{What the problem is — factual, not interpretive}

Evidence:
{Specific code snippet, formula trace, or test result showing the problem}

Before (Current Behavior):
{What the user experiences today, with a concrete example}

After (Expected Behavior):
{What should happen, with the same concrete example}

Proposed Fix:
{Specific change: which file, which function, what to change}

Estimated Effort: Trivial / Moderate / Significant
```

---

## Deferred Items Log

For items that are real but not blocking for current release:

| ID | Description | Reason for Deferral | Risk If Not Fixed | Suggested Timeline |
|----|-------------|--------------------|--------------------|-------------------|
| FINDING-{N} | [short title] | [why deferred] | [what could go wrong] | [next sprint / v2 / future] |

---

## Specialist Referrals

Items that exceed this audit's scope and need a specialized review:

| Finding | Specialist Type | Why Specialist Needed |
|---------|----------------|----------------------|
| [area] | [e.g., LLM prompt engineer] | [e.g., verify extraction accuracy across bank formats] |
| [area] | [e.g., security pen tester] | [e.g., full security assessment for production API] |

---

## Phase Completion Log

| Phase | Name | Status | Findings Count | Key Notes |
|-------|------|--------|----------------|-----------|
| 0 | Pre-Audit Reading | COMPLETE / IN_PROGRESS | {n} | |
| 1 | Documentation Sync | | | |
| 2 | Dead Code & Structure | | | |
| 3 | Universality | | | |
| 4 | Logic & Formula Verification | | | |
| 5 | Parity Audit | | | |
| 6 | Edge Cases | | | |
| 7 | Test Suite Audit | | | |
| 8 | Security Baseline | | | |
| 9 | UI/UX & Output Quality | | | |
| 10 | Efficacy Review | | | |
| 11 | Synthesis | | | |

---

## Fix Verification Log

After applying fixes, record verification here:

| Finding ID | Fix Applied | Verification Method | Verified By | Result |
|------------|-------------|--------------------|----|--------|
| FINDING-{N} | [what was changed] | [how you verified] | [test/manual] | PASS / FAIL |

---

## Final Summary (filled in at Phase 11)

```
MASTER AUDIT SUMMARY
====================
Total findings: {N}
  CRITICAL: {n}
  HIGH: {n}
  MEDIUM: {n}
  LOW: {n}

Resolved: {n}
Deferred: {n}
Won't Fix: {n}
Outstanding: {n}

PRODUCTION READINESS: GO / CONDITIONAL GO / NO-GO

Rationale:
{2-3 sentences}

To achieve GO, resolve:
- [list any blockers]

Top 5 Most Important Findings:
1. FINDING-{N}: {title}
2. ...
```
