---
name: codebase-auditor
version: 2.1.1
type: Type 1 — Instruction skill (Markdown only)
description: >
  Full-spectrum codebase audit skill. Use whenever a user wants to audit, review, verify,
  stress-test, or assess production-readiness of any codebase — regardless of language, size,
  or domain. Triggers on: "audit my codebase", "review my code", "pre-production check",
  "find bugs", "verify my calculations", "production readiness", "sanity check my code",
  "run a full audit", or any request for systematic codebase verification. Also triggers
  proactively when a user shares a codebase and asks if it's "ready" for anything.
  Also triggers on targeted commands: "docs-sync", "dead-code", "hardcoding", "logic",
  "parity", "edge-cases", "test-audit", "security", "output-quality", "efficacy".
  Generates a tailored multi-phase audit plan from a full scan, then executes it completely:
  finding issues, proposing and applying fixes, verifying them, and declaring readiness.
  Produces audit report files that can be directly ingested by the audit-fix-implementer skill.
---

# Codebase Auditor

A complete audit framework for any codebase. Scans everything first, generates a tailored
plan, then executes it phase by phase until all issues are found, fixed, verified, and signed off.
Produces structured audit report files as formal handoff artefacts.

---

## Path Resolution

Follow the path resolution protocol below.

**Agent context file:** Resolve for this project: `CLAUDE.md` (Claude Code) → `AGENTS.md` (OpenCode/Codex) → `.cursor/rules/` (Cursor) → ask user. Never assume a filename.

**Writing files:**
1. Check agent context file `## Paths` section for a declared path
2. Check `_dev/docs/` and appropriate subdirectory if it exists
3. Ask once: "Where should I save [filename]? I suggest [default] — confirm or redirect."
4. Confirm path before writing. Never write silently. Never overwrite without confirmation.

**Reading files:**
1. Check agent context file `## Paths` section
2. Check `_dev/docs/` conventional locations, then project root
3. Ask if not found. Verify critical inputs before proceeding.

**Persist resolved paths** to the agent context file `## Paths` section — ask user before appending.

**Default `_dev/` layout:**
```
_dev/docs/
├── audit/          <- AUDIT_REGISTRY.md, AUDIT_REPORT_YYYY-MM-DD.md
├── handovers/      <- HANDOVER-[PROJECT]-[SESSION].md
├── PLAN.md
├── EXECUTION_PLAN.md
├── IMPLEMENTATION_LOG.md
└── LESSONS_LEARNED.md
```

**This skill's paths:**
| Output | Default path |
|--------|-------------|
| Audit report | `_dev/docs/audit/AUDIT_REPORT_YYYY-MM-DD.md` |
| Supplementary files | `_dev/docs/audit/AUDIT_REPORT_YYYY-MM-DD_[PHASE].md` |
| Audit registry | `_dev/docs/audit/AUDIT_REGISTRY.md` |
| Agent context file scaffold | Project root (correct filename for environment) |

---

## Commands

### `codebase-auditor full`
Run the complete audit — all phases. See Stage 0 → Stage 1 → Stage 2 → Stage 3 below.

### Targeted commands — single phase after scan

All targeted commands run **Phase 0 (full codebase scan) first**, then execute only the
named phase.

| Command | Runs | Phase objective |
|---------|------|-----------------| 
| `codebase-auditor docs-sync` | Phase 0 + Phase 1 | Every doc claim matches current code |
| `codebase-auditor dead-code` | Phase 0 + Phase 2 | Remove everything that serves no purpose |
| `codebase-auditor hardcoding` | Phase 0 + Phase 3 | Zero hardcoded user/region/environment assumptions |
| `codebase-auditor logic` | Phase 0 + Phase 4 | Every calculation produces the exact right number |
| `codebase-auditor parity` | Phase 0 + Phase 5 | Duplicated logic is identical across all locations |
| `codebase-auditor edge-cases` | Phase 0 + Phase 6 | Zero data, bad input, and boundaries all handled |
| `codebase-auditor test-audit` | Phase 0 + Phase 7 | Existing tests are correct; coverage gaps identified |
| `codebase-auditor security` | Phase 0 + Phase 8 | Users protected from common vulnerabilities |
| `codebase-auditor output-quality` | Phase 0 + Phase 9 | Labels, tooltips, and output are accurate |
| `codebase-auditor efficacy` | Phase 0 + Phase 10 | Doing the right thing, not just doing it right |

---

## Agent Context File Setup

**Agent context file:** Resolve the correct filename for this project's environment:
`CLAUDE.md` (Claude Code) → `AGENTS.md` (OpenCode/Codex) → `.cursor/rules/` (Cursor) → ask user.

If the project has no agent context file, offer to scaffold one before starting:
> "This project has no agent context file (CLAUDE.md / AGENTS.md / equivalent). Would you
> like me to scaffold one from `skills/codebase-auditor/CLAUDE.md.template`? It provides
> a starting structure for audit history and project context. I'll save it as [correct
> filename for this environment]."

If the project already has an agent context file, after delivering the Master Findings Report,
append a row to the Audit History table in it (create the table if absent):

```markdown
| [YYYY-MM-DD] | [command run] | [N findings: C/H/M/L] | [GO / CONDITIONAL GO / NO-GO] |
```

Ask user to confirm before appending. If no Audit History table exists, offer to add one.

---

## How to Use This Skill

**Full audit invocation:**
- Say: "I'll start with a complete read of the codebase before generating the plan. Reading now."
- Execute Stage 0 immediately. Do not ask what to audit — read everything first.

**Targeted command invocation:**
- Say: "Running [command]. Starting with a full codebase scan first."
- Execute Stage 0, then the named phase only.

**Three stages for full audit, always in order:**
1. **SCAN** — Read the entire codebase
2. **PLAN** — Generate a tailored audit plan. Present it. Get approval.
3. **EXECUTE** — Phase by phase. Fix → Verify → Next.

---

## Stage 0: Full Codebase Scan

**Read everything before writing a single phase.**

### What to Read
- Every source file (all languages present)
- Every config file (.json, .yaml, .toml, .env.example, etc.)
- Every documentation file (README, /docs/, /memory/, any .md)
- Every existing test file
- Every build/dependency file (package.json, requirements.txt, etc.)
- .gitignore (reveals what sensitive paths exist)

### What to Build During the Scan

**Mental model:**
- What does this codebase *actually do*? (One sentence, specific)
- What is the primary output a user relies on?
- What are the 3–5 most critical code paths?
- Where does user data enter and exit the system?
- What languages and environments are present?
- What external services or APIs does it depend on?

**Red flag register:**
- Formulas or calculations (will need hand-verification in Phase 4)
- The same logic appearing in more than one place (parity risk)
- Hardcoded values that look like they should be configurable
- Places where docs claim X but code does Y
- TODOs, FIXMEs, commented-out code
- Division operations (÷0 risk)
- User-controlled strings going into any output (injection risk)
- Config keys referenced in code but not found in config (or vice versa)
- Dead functions — defined but no call sites found
- Async/concurrency patterns — potential race conditions, unhandled promise rejections,
  missing await, shared mutable state across async paths

**Domain identification — drives supplementary planning:** See below.

### Scan Deliverable

```
CODEBASE SCAN SUMMARY
=====================
What it does: [one specific sentence]
Languages: [list]
Critical paths: [3–5 named paths]
Test coverage: [what tests exist — or "none"]

Domains identified: [see Domain Identification below]

Red flags (will become audit targets):
  [file:line] — [description]
  ...

Questions before I write the plan:
  [anything ambiguous that changes the plan scope]
```

---

## Stage 1: Audit Plan Generation

### Layer 1 — Universal BASE Phases
Load `references/base-phases.md` for full specifications.

| # | Phase | Core Question |
|---|-------|---------------|
| 1 | Documentation Sync | Does every doc claim match what the code actually does? |
| 2 | Dead Code & Structure | Is there anything that serves no purpose? |
| 3 | Universality & Hardcoding | Does any logic assume a specific user, region, or environment? |
| 4 | Logic & Formula Verification | Does every calculation produce the exact right number? |
| 5 | Parity Audit | When the same logic exists in multiple places, do they match? |
| 6 | Edge Cases & Stress Testing | What breaks under boundary conditions? |
| 7 | Test Suite Audit | Are existing tests correct? What's missing? |
| 8 | Security Baseline | Are users protected from common vulnerabilities? |
| 9 | Output Quality | Is what users see accurate, clear, and consistent? |
| 10 | Efficacy Review | Are we doing the right thing, not just doing the thing right? |
| 11 | Synthesis | Master findings, severity ratings, go/no-go verdict |

### Layer 2 — Domain-Specific SUPPLEMENTARY Phases
See **Domain Identification & Supplementary Planning** section.

### Plan Format
For each phase, specify: Objective, Key targets, Specific checks, Test files to generate,
Pass criteria. Present the full plan. Get explicit approval before executing.

---

## Domain Identification & Supplementary Planning

After the scan:
1. Identify what domain(s) the codebase operates in
2. Identify the domain-specific failure modes
3. Generate supplementary phases targeting those failure modes

### Domain signal patterns

| If the codebase... | Domain is likely... |
|-------------------|---------------------|
| Calculates amounts, totals, budgets, projections | Financial / Accounting |
| Stores or processes health records, symptoms, dosages | Healthcare / Medical |
| Processes orders, payments, inventory, prices | E-commerce / Retail |
| Trains models, scores data, makes predictions | ML / AI |
| Manages schedules, compliance, regulatory submissions | Legal / Regulatory |
| Controls physical systems, sensors, actuators | Embedded / Safety-critical |
| Ingests, transforms, and stores large datasets | Data Engineering |
| Provides analysis or intelligence for decisions | Analytics / BI |
| Manages users, permissions, and access | Identity / Auth |

See `references/supplementary-examples.md` for worked examples.

---

## Stage 2: Phase Execution

### Execution Discipline
1. Announce the phase
2. Reference exact file paths and line numbers
3. Compare claimed vs actual — especially for docs, labels, tooltips
4. Hand-verify calculations — trace with real values, not code output
5. Record findings immediately using the format below
6. Do not fix during audit — document first, fix after
7. Mark phase complete with a summary

### Finding Format

```
[SEVERITY] FINDING-{N}: {Title}
File: {path}:{line}
Phase: {N}
Description: {what the problem is — factual}
Evidence: {specific code, formula trace, or test showing the problem}
Before: {what the user gets today — with a concrete example}
After: {what they should get — same concrete example}
Fix: {specific change: file, function, what to change}
Effort: Trivial / Moderate / Significant
```

**Severity:**
- **CRITICAL** — Silent wrong results, data loss, or security vulnerability
- **HIGH** — User sees incorrect or misleading output
- **MEDIUM** — Fragile; will break under plausible conditions
- **LOW** — Code quality, dead code, cosmetic, or documentation

### Testing Protocol
See `references/test-templates.md` for Python templates.
Compute expected values BY HAND first, then compare to code.

---

## Stage 3: Synthesis & Sign-Off

### Saving the Audit Report

After completing all phases, save the audit report. Follow the Path Resolution protocol.

The report must be saved as a file (not just presented in chat) so that it can be
directly ingested by the `audit-fix-implementer` skill in subsequent sessions.

**Standard structure for `AUDIT_REPORT.md`:**

```markdown
# Audit Report — [PROJECT NAME]
**Date:** [YYYY-MM-DD]
**Command:** [codebase-auditor full / codebase-auditor [phase]]
**Auditor:** Claude [model if known]
**Codebase:** [brief description]
**Location:** [path or repo]

---

## Executive Summary

[2–3 sentences: what was audited, overall health, key verdict]

## Production Readiness Verdict

**[GO / CONDITIONAL GO / NO-GO]**

Rationale: [2–3 sentences]

Blockers (must fix for GO):
  1. FINDING-{N}: {title}
  ...

## Finding Counts

| Severity | Count |
|----------|-------|
| CRITICAL | {n} |
| HIGH | {n} |
| MEDIUM | {n} |
| LOW | {n} |
| **Total** | **{n}** |

---

## Findings

[All findings in FINDING-{N} format, grouped by severity: CRITICAL first]

---

## Phases Executed

| Phase | Status | Findings |
|-------|--------|---------|
| [phase name] | Complete | {n} findings |
| ...

---

## Top 5 Most Impactful Findings

1. ...
```

If the report would exceed ~800 lines, split into per-phase supplementary files and
produce an index in `AUDIT_REPORT.md`. Ask the user before splitting.

### Go/No-Go Criteria
- **GO** — Zero CRITICAL, zero HIGH. All MEDIUM documented with fix plans.
- **CONDITIONAL GO** — Zero CRITICAL, ≤2 HIGH with clear plans. Ship with documented caveats.
- **NO-GO** — Any CRITICAL, or any HIGH finding that produces silently wrong results or loses data.

### Audit Registry

After saving the audit report, update `AUDIT_REGISTRY.md`. Follow path resolution
(key: `Audit registry:` in agent context file; default: `_dev/docs/audit/AUDIT_REGISTRY.md`).

**If no registry exists:** create it now using the schema in
`references/audit-registry-schema.md` (bundled with this skill). This project may not have used the planner
skill or may be entering the audit workflow for the first time — that's fine. Create the
registry, add the header, and add this audit as the first row.

**If a registry already exists:** append a new row. Do not modify existing rows.
Update the "Current Ground Truth" header if this audit supersedes prior ones in scope.

Row to append:
```
| AUDIT-{N} | [YYYY-MM-DD] | [command or "Third-party audit"] | [scope summary] | [report path] | ACTIVE | — |
```

If this audit covers the same scope as a prior ACTIVE audit, update the prior audit's
status to `SUPERSEDED by AUDIT-{N}` and note this to the user.

### After delivering the report

1. Confirm the audit report path and the registry update to the user
2. Note: "This report can be directly ingested by the `audit-fix-implementer` skill.
   The audit registry at [path] records this run and all prior audits on this project."
3. If a CLAUDE.md / AGENTS.md exists, offer to append the audit history row (see Agent Context File Setup)

---

## The 12 Quality Principles

**P1 — Math Correctness**: Every formula produces the exact number a user would compute by hand.
**P2 — Cross-Environment Parity**: Logic duplicated across languages or environments must produce identical results.
**P3 — State Consistency**: When state changes, every metric that should update does.
**P4 — Denominator Correctness**: Every division uses the precisely correct denominator.
**P5 — Universality**: No hardcoded usernames, region names, currencies, institution names, date formats, or absolute paths in logic code.
**P6 — Documentation Alignment**: Every claim in every doc matches current code.
**P7 — Label Accuracy**: Every label, tooltip, and description accurately describes the adjacent value.
**P8 — Graceful Degradation**: Zero data, all-filtered, single record, malformed input — all produce valid output.
**P9 — No Double-Counting**: When data is split into categories, every record belongs to exactly one bucket.
**P10 — Security**: User-controlled strings are escaped before insertion into any output format.
**P11 — Config Accuracy**: Every config comment/description matches the key's actual behavior.
**P12 — Regression Integrity**: No prior fix has been partially or fully reverted by subsequent changes.

---

## Reference Files

| File | Load When |
|------|-----------|
| `references/base-phases.md` | Writing the audit plan — full specs for all BASE phases |
| `references/supplementary-examples.md` | Generating domain supplements |
| `references/findings-registry.md` | Tracking findings — copy as working document |
| `references/test-templates.md` | Writing test files |

---

## What NOT To Do

- **Do not skip the scan** — the plan must come from the actual code
- **Do not pre-assume the domain** — derive it from reading
- **Do not present findings only in chat** — save them to AUDIT_REPORT.md
- **Do not fix during audit** — document first, fix after
- **Do not say "probably fine"** — verify or flag for specialist review
- **Do not use code output to verify formulas** — hand-compute expected values
- **Do not modify production data** — use copies and synthetic datasets
