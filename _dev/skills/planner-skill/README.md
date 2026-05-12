# planner

**Type:** Type 1 — Instruction skill (Markdown only)
**Version:** 1.1.0
**Compatible with:** Any AI coding environment — Claude Code, OpenCode, Codex, Cursor, or any surface with file read/write capability. Tool-agnostic. Standalone.
**Optional integration:** Uses `file-ingest` skill if present for PDF, DOCX, and URL sources.

**Position in project lifecycle:**
```
[plan] → implement → review & audit → fix, document & iterate → close project
```

## Purpose

Transforms any combination of inputs (conversation, notes, PDFs, screenshots, URLs,
existing code) into two structured artefacts that anchor all subsequent development:

| Artefact | Purpose |
|----------|---------|
| `PLAN.md` | Goals, scope, architecture, decisions, constraints, acceptance criteria |
| Agent context file | Initial scaffold: stack, conventions, locked decisions, always/never rules |

Also scaffolds the `_dev/` project layout and optionally creates an `AUDIT_REGISTRY.md` stub.

**Scope boundary:** Planner defines *what* and *why*. Task lists and execution schedules
are the Executor skill's domain.

## Commands

| Command | When to use |
|---------|------------|
| `planner start` | Beginning a new plan from scratch or source materials |
| `planner resume` | Resuming an in-progress planning session |
| `planner update` | Updating an existing plan with new information or changed scope |

## Output artefacts

| Artefact | Default location |
|---------|-----------------|
| `PLAN.md` | `_dev/docs/PLAN.md` |
| Agent context file | Project root (correct filename for environment) |
| Audit registry stub | `_dev/docs/audit/AUDIT_REGISTRY.md` (optional, ask first) |

## File structure

```
planner/
├── SKILL.md                          ← Main agent instructions
├── README.md                         ← This file
├── VERSION                           ← 1.1.0
├── CHANGELOG.md                      ← Version history
└── references/
    ├── plan-template.md              ← 10-section PLAN.md template + quality gate
    ├── agent-context-template.md     ← Full agent context file scaffold template
    └── complexity-guide.md           ← Small/medium/large/feature scale framework
```

## Vendoring

Copy this folder into `skills/planner/` inside your project.
