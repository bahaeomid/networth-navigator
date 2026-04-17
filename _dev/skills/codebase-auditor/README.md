# codebase-auditor

**Type:** Type 1 — Instruction skill (Markdown only)
**Version:** 2.1.0
**Compatible with:** Any AI coding environment — Claude Code, OpenCode, Codex, Cursor, or any surface with file read/write capability. Tool-agnostic.

## Purpose

Full-spectrum codebase audit framework. Scans everything first, generates a tailored
multi-phase audit plan (universal BASE phases + domain-specific SUPPLEMENTARY phases),
executes phase by phase, fixes findings, and issues a production-readiness verdict.

Produces dated audit report files and maintains an Audit Registry (`AUDIT_REGISTRY.md`)
for traceability across multiple audit runs on the same project.

## Commands

```
codebase-auditor full           → complete audit, all phases
codebase-auditor docs-sync      → scan + documentation sync only
codebase-auditor dead-code      → scan + dead code removal only
codebase-auditor hardcoding     → scan + universality/hardcoding check only
codebase-auditor logic          → scan + formula/logic verification only
codebase-auditor parity         → scan + parity audit only
codebase-auditor edge-cases     → scan + edge case testing only
codebase-auditor test-audit     → scan + test suite review only
codebase-auditor security       → scan + security baseline only
codebase-auditor output-quality → scan + output quality review only
codebase-auditor efficacy       → scan + efficacy review only
```

## Output artefacts

| Artefact | Default location | Description |
|---------|-----------------|-------------|
| Audit report | `_dev/docs/audit/AUDIT_REPORT_YYYY-MM-DD.md` | Full findings report |
| Audit registry | `_dev/docs/audit/AUDIT_REGISTRY.md` | Index of all audit runs |
| Agent context scaffold | Project root | CLAUDE.md / AGENTS.md / equivalent |

The audit report is formatted for direct ingestion by the `audit-fix-implementer` skill.

## File structure

```
codebase-auditor/
├── SKILL.md                     ← Main agent instructions
├── CLAUDE.md.template           ← Scaffold template for new projects
├── README.md                    ← This file
├── VERSION                      ← 2.1.0
├── CHANGELOG.md                 ← Version history
└── references/
    ├── base-phases.md           ← Full specs for all 11 universal audit phases
    ├── supplementary-examples.md ← Domain-specific phase generation examples
    ├── findings-registry.md     ← Per-audit working document template
    └── test-templates.md        ← Python test file templates
```

## Setup

**Step 1 — Vendor into your project:**
```bash
cp -r skills/codebase-auditor /path/to/your-project/skills/
```

**Step 2 — Optional: scaffold an agent context file:**
Copy `CLAUDE.md.template` to your project root and rename it to the correct filename
for your environment (`CLAUDE.md`, `AGENTS.md`, etc.). Fill in the project context.

**Step 3 — Invoke:**
```
codebase-auditor full
```
or any targeted command.

## Audit Registry

The Audit Registry (`_dev/docs/audit/AUDIT_REGISTRY.md`) tracks all audit runs with
dates, scopes, report paths, and supersession status. This solves the common problem
of multiple audits accumulating without traceability — agents always know which audit
is current and which findings have been superseded.

If the planner skill was used, the registry stub was created during scaffolding.
Otherwise, codebase-auditor creates it on the first run.
