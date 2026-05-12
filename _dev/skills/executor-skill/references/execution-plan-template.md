# Execution Plan Template

Use this template when generating `EXECUTION_PLAN.md` in Stage 1.
This document is the master schedule for the project. It is a living document —
agents update it as work progresses. It is never rewritten from scratch after
the first session; it is appended to and updated.

---

```markdown
# [PROJECT NAME] — Execution Plan

**Version:** 1.0
**Generated:** [YYYY-MM-DD] by executor v1.1.0
**Source plan:** [path to PLAN.md or "generated from description"]
**Last updated:** [YYYY-MM-DD] — Session {N}
**Status:** IN PROGRESS 🔄 / COMPLETE ✅ / BLOCKED ⛔

> **For all agents:** Read this document in full at the start of every session
> before writing any code. Update task statuses as you work. Do not rely on
> in-session TODO lists — this file is the only authoritative task register.

---

## Master Task Status Table

*Single source of truth. Update Status and Session columns as work proceeds.*
*Last updated: [YYYY-MM-DD] — Session {N}*

| Task ID | Title | Phase | Status | Session | Notes |
|---------|-------|-------|--------|---------|-------|
| TASK-0-1 | [title] | 0 | PENDING ⏳ | — | |
| TASK-0-2 | [title] | 0 | PENDING ⏳ | — | |
| TASK-1-1 | [title] | 1 | PENDING ⏳ | — | |
<!-- Add one row per task. Update Status and Session as work progresses. -->
<!-- Status values: PENDING ⏳ / IN PROGRESS 🔄 / COMPLETE ✅ / BLOCKED ⛔ / DEFERRED 🔁 -->

**Progress:** {n} / {total} tasks complete | Phase {N} of {total} in progress

---

## Dependency Map

*Read before starting any task. Do not start a task whose dependencies are incomplete.*

```
[Phase 0 — Foundation]
  TASK-0-1 → TASK-0-2 → TASK-0-3
  TASK-0-1 → TASK-0-4 ║ parallel with TASK-0-2

[Phase 1 — Core]
  Requires: Phase 0 complete
  TASK-1-1, TASK-1-2 ║ can start in parallel
  TASK-1-3 → requires TASK-1-1

[Phase 2 — ...]
  Requires: Phase 1 complete
  ...
```

Legend: → = "must complete before" | ║ = "can run in parallel"

---

## Phases

---

### Phase 0: Foundation

**Goal:** [What this phase delivers — one sentence]
**Entry criteria:** [What must be true before this phase starts]
**Exit criteria:** [What must be true to call this phase done]
**Status:** PENDING ⏳ / IN PROGRESS 🔄 / COMPLETE ✅

---

#### TASK-0-1: [title]
**Status:** PENDING ⏳
**Assigned to:** [agent role or "unassigned"]
**Depends on:** none
**Can run in parallel with:** [TASK-ID or "none"]
**Estimated effort:** XS / S / M / L / XL
**Session resolved:** —

**Description:**
[What needs to be done. Specific. Reference files, components, or commands where known.]

**Done when:**
- [ ] [Concrete, checkable criterion]
- [ ] [Another criterion]

**Notes:** [Any constraints, gotchas, or context]

---

#### TASK-0-2: [title]
**Status:** PENDING ⏳
**Assigned to:** unassigned
**Depends on:** TASK-0-1
**Can run in parallel with:** none
**Estimated effort:** M
**Session resolved:** —

**Description:**
[...]

**Done when:**
- [ ] [...]

**Notes:**

---

<!-- Repeat task format for all tasks in this phase -->

---

### Phase 1: Core

**Goal:** [What this phase delivers]
**Entry criteria:** Phase 0 complete
**Exit criteria:** [...]
**Status:** PENDING ⏳

---

<!-- Repeat task format -->

---

### Phase 2: [Name]

<!-- Continue for all phases -->

---

## Session Log

*Append a new entry at the end of every session. Do not edit prior entries.*

---

### Session 1 — [YYYY-MM-DD]
**Agent:** [identifier or "unspecified"]
**Tasks completed:** [list TASK-IDs]
**Tasks in progress:** [list TASK-IDs]
**Tasks blocked:** [list TASK-IDs with reason]
**New tasks added:** [list TASK-IDs or "none"]
**Key decisions made this session:** [any decisions that affect the schedule]
**Next session should start with:** [TASK-ID: title]
**Notes:** [anything the next agent must know]

---

<!-- Append new session entries here -->

---

## Change Log

*Record every version change to the schedule. Do not edit prior entries.*

| Version | Date | Change summary | Reason |
|---------|------|---------------|--------|
| 1.0 | [date] | Initial schedule generated | Plan v1.0 |

---

## Open Questions Affecting Execution

*Copied from PLAN.md. Update when resolved. Blocks are noted on affected tasks.*

| # | Question | Owner | Target | Affects |
|---|---------|-------|--------|---------|
| OQ-01 | [question] | [owner] | [date] | [TASK-IDs blocked] |

---

*executor v1.1.0 | Source: [PLAN.md path] | Generated: [date]*
*Standing instruction: read this file at the start of every session.*
*To update: run `executor resume` or `executor replan`.*
```
