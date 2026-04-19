# audit-fix-implementer

**Type:** Type 1 — Instruction skill (Markdown only)
**Version:** 1.5.0
**Compatible with:** Any AI coding environment — Claude Code, OpenCode, Codex, Cursor, or any surface with file read/write capability. Fully tool-agnostic. Standalone.

**Position in project lifecycle:**
```
plan → implement → review & audit → [fix, document & iterate] → close project
```

## Purpose

Implements fixes from an audit document, verifies each fix with an iterate-and-fix
algorithm, and compounds all learning into two living documents that accumulate knowledge
across multiple sessions and agents.

Accepts audit documents from any source — `codebase-auditor` standard format, third-party
reports, or informal finding lists. Normalizes all incoming formats before planning.

## Commands

| Command | When to use |
|---------|------------|
| `audit-fix-implementer start` | First session on a new audit |
| `audit-fix-implementer continue` | Resuming from a prior session |
| `audit-fix-implementer close` | Explicitly when the project is closing — produces final Lessons Learned |

The `close` command is always user-initiated.

## Output artefacts

| Artefact | Default location | Description |
|---------|-----------------|-------------|
| `IMPLEMENTATION_LOG.md` | `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md` | Append-only session record |
| `LESSONS_LEARNED.md` | `_dev/docs/audits/continuity/LESSONS_LEARNED.md` | Accumulating knowledge document |

Both documents are append-only — each agent session adds its own stamped block.
`LESSONS_LEARNED.md` Part 4 contains generalizable principles designed to feed a
cross-project knowledge wiki.

## File structure

```
audit-fix-implementer/
├── SKILL.md                              ← Main agent instructions
├── README.md                             ← This file
├── VERSION                               ← 1.5.0
├── CHANGELOG.md                          ← Version history
└── references/
    ├── lessons-learned-template.md       ← 8-part final document template
    ├── implementation-log-template.md    ← Document header and session block templates
    └── knowledge-schemas.md              ← Principle and pattern schemas
```

## Audit Registry integration

On first session, this skill checks for `_dev/docs/audits/AUDIT_REGISTRY.md`.
If found, it reads the current ground truth to identify the authoritative audit.
If not found, it creates the registry. Either way, it updates the registry's
AFI session column as work progresses and marks it CLOSED on project close.

## Vendoring

Copy this folder into `skills/audit-fix-implementer/` inside your project.
Note: the folder in this library is named `afi-v4-clean/` for historical reasons —
rename it to `audit-fix-implementer/` when vendoring.
