# session-handover

**Type:** Type 1 — Instruction skill (Markdown only)
**Version:** 1.2.0
**Compatible with:** Any AI coding environment — Claude Code, OpenCode, Codex, Cursor, or any surface with file output capability. Tool-agnostic.

## Purpose

Generates a comprehensive structured handover document at the end of a development session.
Captures current state, decisions, rationale, failure modes, remaining work, and a startup
protocol — so the next agent or session (even your own future session) picks up with zero
knowledge loss.

## When to invoke

- Approaching context or token limits
- User says "write a handover" or "let's continue in a new session"
- Completing a phase and starting a new one, possibly with a different agent
- Pausing work and wanting a checkpoint document

## Output

A single `HANDOVER-[PROJECT]-[SESSION].md` file saved to `_dev/docs/handovers/` by default
(or a user-confirmed location). Covers 10 parts:

1. Quick Start for next agent
2. Full session narrative (what was done, in order)
3. Current state
4. Architecture and technical reference
5. Lessons learned and pitfalls
6. Remaining work (prioritised)
7. Testing and validation
8. User context and preferences
9. Reference material
10. Sign-off and confidence assessment

## File structure

```
session-handover/
├── SKILL.md      ← Main agent instructions + 10-part template
├── README.md     ← This file
├── VERSION       ← 1.2.0
└── CHANGELOG.md  ← Version history
```

## Vendoring

Copy this folder into `skills/session-handover/` inside your project.
Reference in your agent context file:
```
When ending a session or approaching context limits, invoke the session-handover skill.
```
