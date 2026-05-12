# executor

**Type:** Type 1 — Instruction skill (Markdown only)
**Version:** 1.1.0
**Compatible with:** Any AI coding environment — Claude Code, OpenCode, Codex, Cursor, or any surface with file read/write capability. Tool-agnostic. Standalone.

**Position in project lifecycle:**
```
plan → [implement — executor] → review & audit → fix, document & iterate → close
```

## Purpose

Transforms a completed PLAN.md into a living `EXECUTION_PLAN.md` — a persistent master
document that every agent reads at session start, updates as tasks complete, and relies
on instead of in-memory TODO lists that evaporate on context reset.

Prevents plan drift, improvisation, and loss of task state across sessions and agents.

## Commands

| Command | When to use |
|---------|------------|
| `executor generate` | Generate schedule from a completed PLAN.md |
| `executor generate-lite` | Generate schedule from rough notes — no formal PLAN.md needed |
| `executor resume` | Resume work from existing EXECUTION_PLAN.md (every session after first) |
| `executor status` | Read current schedule state — read-only, no execution |
| `executor replan` | Revise schedule when scope changes — versioned, history preserved |

## Output artefacts

| Artefact | Default location |
|---------|-----------------|
| `EXECUTION_PLAN.md` | `_dev/docs/EXECUTION_PLAN.md` |
| Agent context file update | Appended to project's CLAUDE.md / AGENTS.md / equivalent |

## File structure

```
executor/
├── SKILL.md                           ← Main agent instructions
├── README.md                          ← This file
├── VERSION                            ← 1.1.0
├── CHANGELOG.md                       ← Version history
└── references/
    ├── execution-plan-template.md     ← Full EXECUTION_PLAN.md structure
    ├── task-sizing-guide.md           ← XS–XL sizing, sub-task rules, done criteria
    └── dependency-patterns.md        ← Dependency types, patterns, parallelism guide
```

## Vendoring

Copy this folder into `skills/executor/` inside your project.
