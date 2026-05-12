---
name: executor
version: 1.1.1
type: Type 1 — Instruction skill (Markdown only)
description: >
  Generates and maintains a multi-phase, dependency-aware execution schedule for
  delivering a software project. Transforms a completed PLAN.md (or any project
  description) into a living EXECUTION_PLAN.md that agents consult at the start of
  every session and update as work progresses — preventing plan drift, improvisation,
  and the loss of task state across sessions and agents. Use whenever a user wants
  to generate an execution schedule, break a plan into implementable tasks, create
  a delivery roadmap, or establish a master document that coordinates multi-session
  multi-agent development. Triggers on: "generate an execution plan", "break this
  plan into tasks", "create an execution schedule", "what do we build first",
   "create a delivery plan", "executor generate", "executor resume", "executor status",
   "executor replan", or any request to translate a project plan into ordered, actionable work.
  Fully standalone. Compatible with any AI coding environment. Tool-agnostic.
  Designed to work alongside the planner skill (upstream) and session-handover skill
  (session continuity), but depends on neither.
compatibility: >
  Any AI coding environment — claude.ai, Claude Code, Codex, OpenCode, Cursor, or any
  surface with file read/write capability. Tool-agnostic. Standalone.
license: Proprietary
---

# Executor

Transforms a project plan into a living execution schedule — a persistent master
document that every agent reads at session start, updates as tasks complete, and
relies on instead of in-memory TODO lists that evaporate on compaction.

This skill occupies the **implement** step of the project lifecycle:

```
plan → [implement — executor] → review & audit → fix, document & iterate → close
```

The core problem this skill solves:

> Agents without a persistent external task register drift from the plan, improvise,
> re-do completed work, and lose track of what's next when sessions end. The
> EXECUTION_PLAN.md is that external register. It is the agent's working memory
> for the project, externalised into a file that survives context resets.

---

## Commands

### `executor generate`
Generate a full execution schedule from a completed PLAN.md or equivalent planning
document. The primary command. Produces EXECUTION_PLAN.md and appends a standing
instruction to the project's agent context file.

### `executor generate-lite`
Generate an execution schedule from a rough description, notes, or brief — no formal
PLAN.md required. Runs a condensed interview to fill gaps, then generates the schedule.
Use when planning was informal or when jumping straight to execution.

### `executor resume`
Resume work from an existing EXECUTION_PLAN.md. Reads the schedule, reconstructs
current state, presents a status summary, and begins or continues execution of the
next pending task. The standard command for every session after the first.

### `executor status`
Read the current EXECUTION_PLAN.md and produce a status report: what's done, what's
in progress, what's blocked, what's next. Does not execute — read-only.

### `executor replan`
Re-generate or significantly revise the execution schedule when scope changes, new
constraints emerge, or the original plan needs restructuring. Preserves completed
task history. Produces a versioned update with a change log.

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
| File | Resolution |
|------|-----------|
| `PLAN.md` (input) | Agent context `PLAN.md:` → `_dev/docs/PLAN.md` → project root → ask |
| `EXECUTION_PLAN.md` | Agent context `Execution plan:` → `_dev/docs/EXECUTION_PLAN.md` → project root → ask |
| Agent context file | Resolve by environment (see above) |

---

## First Action: Determine Mode

Before doing anything else, determine which command applies and what inputs exist.

Apply Path Resolution above to locate files before asking the user. If the files can be
found from the agent context file or conventional locations, confirm them rather than asking.

Ask only what isn't already resolved:

> "Are we generating a new execution plan, or resuming work from an existing one?
> [If not found automatically:] Where are the planning files — PLAN.md or equivalent?
> And where should I save the execution plan?"

Do not hardcode any paths. Only ask for:
1. Location of PLAN.md or other planning inputs — if not auto-resolved
2. Location of existing EXECUTION_PLAN.md — if not auto-resolved
3. Where to save the execution plan (if new) — if not auto-resolved

---

## Startup Path A: Generate (`executor generate`)

Used when a formal PLAN.md exists and has been reviewed and approved.

1. Read PLAN.md (and any split reference files) in full
2. Read existing AGENTS.md / CLAUDE.md if present (for conventions and constraints)
3. Run Stage 0: Plan Analysis
4. Run Stage 1: Schedule Generation
5. Run Stage 2: Agent Context File Update
6. Run Stage 3: Session Execution (begin working, or confirm schedule first)

---

## Startup Path B: Generate Lite (`executor generate-lite`)

Used when no formal PLAN.md exists. Runs a condensed interview to gather enough
context, then generates the schedule.

1. Run the Lite Interview (see Stage 0B)
2. Run Stage 1: Schedule Generation
3. Run Stage 2: Agent Context File Update
4. Run Stage 3: Session Execution (begin or confirm first)

---

## Startup Path C: Resume (`executor resume`)

The standard path for every session after the first. All steps mandatory.

1. Read EXECUTION_PLAN.md in full — every phase, every task, every status
2. Read AGENTS.md / CLAUDE.md for any standing instructions
3. Check for session handover documents in `_dev/docs/` — if a HANDOVER file exists
   from the previous session, read it. Cross-reference its task state against
   EXECUTION_PLAN.md. If they conflict, surface the conflict before proceeding:
   > "The session handover and EXECUTION_PLAN.md show different states for [task(s)]:
   > handover says [X], plan says [Y]. Which reflects the actual current state?"
4. Produce State Reconstruction Summary (see below)
5. Confirm with user before executing
6. Open a session block and begin work on the next pending task

### State Reconstruction Summary (present before executing anything)

```
EXECUTION STATE SUMMARY
========================
Project: [name]
Plan version: [from EXECUTION_PLAN.md header]
Last session: [date and session ID from log]

Phase status:
  Phase 1 — [name]: COMPLETE ✅ / IN PROGRESS 🔄 / PENDING ⏳ / BLOCKED ⛔
  Phase 2 — [name]: [status]
  ...

Task summary:
  Complete:    {n} / {total}
  In progress: {n} — [task IDs]
  Blocked:     {n} — [task IDs + reason]
  Pending:     {n}

Current position: [Phase X, Task Y — last worked task or next pending]

Blocked items requiring attention:
  [TASK-ID]: [blocker description, what would unblock it]

Proposed work this session:
  1. [Task ID + title] — [brief rationale for starting here]
  2. [Task ID + title]
  ...

Questions before I begin:
  [Anything requiring user input — e.g. "TASK-03 was blocked on an architecture
   decision — has that been resolved?"]
```

Wait for user confirmation before opening the session block and executing.

---

## Startup Path D: Status (`executor status`)

Read-only. Produce the State Reconstruction Summary above and stop. Do not begin
execution. Do not modify EXECUTION_PLAN.md. Present the summary and ask what to do next.

---

## Stage 0A: Plan Analysis (for `generate`)

Read PLAN.md in full. Extract and organise:

### What to extract

**Project identity:** name, domain, primary output, users.

**Scope:** what's in scope, what's explicitly out of scope, any phasing defined.

**Architecture:** tech stack, key components, data model, interfaces.

**Constraints:** non-negotiable constraints, hard dependencies, external blockers.

**Open questions:** any unresolved decisions that could affect task sequencing.

**Complexity signals** — use these to determine schedule depth:

| Signal | Implication |
|--------|------------|
| Single developer, < 1 week | Flat task list — no phases needed |
| 1–3 developers, 1–4 weeks | 2–4 phases, tasks only (no sub-tasks) |
| Team or multi-month | 3–6 phases, tasks with sub-tasks where complex |
| Existing codebase + new feature | 2–3 phases, emphasis on integration tasks |
| Multiple external dependencies | Add explicit dependency tasks and validation gates |
| Compliance / security requirements | Add dedicated review and sign-off tasks |

### Plan Analysis Deliverable

Present before generating the schedule:

```
PLAN ANALYSIS SUMMARY
=====================
Project: [name]
Domain: [domain(s)]
Scope: [1–2 sentence summary]
Complexity assessment: Small / Medium / Large / Feature-addition
Schedule depth: Flat / Phase+Task / Phase+Task+Subtask

Key architectural decisions (from plan):
  [Decision 1]
  [Decision 2]

Hard dependencies (must complete before other work):
  [Dependency 1 — blocks: [what it blocks]]
  [Dependency 2]

Open questions that affect sequencing:
  [OQ-01: question — [how it affects the schedule]]

Parallelisable work identified:
  [Task A and Task B can run in parallel because [reason]]

Suggested phases:
  Phase 1: [name] — [rationale]
  Phase 2: [name] — [rationale]
  ...

Questions before I generate the schedule:
  [Anything needing confirmation]
```

Wait for confirmation before proceeding to Stage 1.

---

## Stage 0B: Lite Interview (for `generate-lite`)

When no formal plan exists, run this condensed interview. One question at a time.

1. **What are we building?** One sentence — what is the end product?
2. **What's the most important thing it must do?** The core deliverable.
3. **What's the tech stack?** Decided or open?
4. **What are the hardest parts?** Where is the most uncertainty?
5. **What must be true before anything else can start?** Foundation dependencies.
6. **Rough size?** Days / weeks / months.
7. **Any hard deadlines or constraints?**

After the interview, produce a brief summary and confirm before generating.

---

## Stage 1: Schedule Generation

Load `references/execution-plan-template.md` and produce `EXECUTION_PLAN.md`.

### Phasing logic

Phases should represent **coherent stages of delivery** — each phase produces
something demonstrably working. Good phase boundaries:

- Foundation complete (dev environment, data model, core infrastructure)
- Core functionality working end-to-end (even if rough)
- Feature-complete (all specified features built)
- Production-ready (tested, hardened, deployed)

Bad phase boundaries: arbitrary chunks of time, or phases that don't produce
anything usable at their end.

**Standard phase sequence for greenfield projects:**

| Phase | Name | Typical contents |
|-------|------|-----------------|
| 0 | Foundation | Repo setup, environment, data model, core infrastructure |
| 1 | Core | Primary user-facing functionality, happy path only |
| 2 | Complete | Remaining features, edge cases, error handling |
| 3 | Hardening | Testing, security, performance, documentation |
| 4 | Launch | Deployment, monitoring, cutover |

Adapt freely. A small project might only need Phases 0–2. A complex project may
need additional phases between these. Always name phases by what they deliver, not
by time.

### Task granularity rules

Apply these rules to decide how deep to go:

**Rule 1 — Size tasks for one session.**
A task should be completable by a single agent in one session (roughly 1–3 hours
of focused work). If a task would clearly take multiple sessions, split it.

**Rule 2 — Sub-tasks only when a task has internal dependencies.**
Don't add sub-tasks for the sake of completeness. Add them when: (a) parts of
the task can be done independently, (b) parts have different owners or skill
requirements, or (c) the task is complex enough that a flat description would
be ambiguous.

**Rule 3 — Every task must be verifiable.**
Each task has a "Done when" criterion. If you can't write a concrete, checkable
done criterion, the task is too vague and needs to be redefined.

**Rule 4 — Dependencies must be explicit.**
If Task B cannot start until Task A is complete, write that. Don't leave it
implicit. Dependencies are what determines execution order and parallelism.

### Task format

```markdown
#### TASK-{phase}-{n}: {title}
**Status:** PENDING ⏳ | IN PROGRESS 🔄 | COMPLETE ✅ | BLOCKED ⛔ | DEFERRED 🔁
**Assigned to:** [Agent role or "unassigned"]
**Depends on:** [TASK-{x}-{n} or "none"]
**Can run in parallel with:** [TASK-{x}-{n} or "none"]
**Estimated effort:** [XS: < 1hr / S: 1–2hr / M: 2–4hr / L: 4–8hr / XL: > 8hr]
**Session resolved:** [session ID when marked complete, else "—"]

**Description:**
[What needs to be done. Specific enough that an agent with no prior context
 can execute it. Reference specific files, functions, or components where known.]

**Done when:**
- [ ] [Concrete, checkable criterion]
- [ ] [Another criterion]

**Notes:** [Any constraints, gotchas, or context specific to this task]
```

### Dependency visualisation

After generating all tasks, produce a simple dependency summary:

```
DEPENDENCY MAP
==============
Phase 0 (must complete first):
  TASK-0-1 → TASK-0-2 → TASK-0-3
  TASK-0-1 → TASK-0-4 (parallel with 0-2 after 0-1)

Phase 1 (requires Phase 0 complete):
  TASK-1-1, TASK-1-2 (can start in parallel)
  TASK-1-3 (requires TASK-1-1)
  ...
```

### Quality gate before saving

- [ ] Every phase ends with something demonstrably working
- [ ] Every task has a concrete "Done when" criterion
- [ ] Every task is sized for one session (no task is > XL)
- [ ] All dependencies are explicit and form a DAG (no circular dependencies)
- [ ] Parallelisable tasks are identified
- [ ] Open questions from the plan are reflected as explicit tasks or blockers
- [ ] The schedule does not contain architecture decisions — those are in PLAN.md

---

## Stage 2: Agent Context File Update

After generating the schedule, append a standing instruction to the project's
agent context file (`CLAUDE.md` / `AGENTS.md` / `.cursor/rules/` / equivalent).

**This is mandatory. It is the mechanism that prevents plan drift.**

If no agent context file exists, create a minimal one containing only this section.
If one exists (e.g., generated by the planner skill), append to it.

### Standing instruction to append

```markdown
---
## Execution Plan — Standing Instructions
*Added by executor skill — [YYYY-MM-DD]*

### Primary working document
The master execution schedule for this project is at:
  [full path to EXECUTION_PLAN.md]

### Mandatory session protocol
At the start of EVERY session:
1. Read [EXECUTION_PLAN.md path] in full before writing any code
2. Run `executor resume` or manually check the Master Task Status table
3. Identify the next PENDING task and confirm it with the user
4. Update task status to IN PROGRESS before starting work
5. Update task status to COMPLETE (with Done criteria checked) when finished

### Do not improvise
Do not begin any work that is not represented as a task in EXECUTION_PLAN.md.
If a necessary piece of work is missing from the plan, add it as a new task
before starting. Do not silently add work.

### If the plan needs to change
Surface scope changes to the user immediately. Run `executor replan` to update
the schedule with a versioned change log. Do not modify the plan silently.
---
```

Ask the user to confirm the path to the agent context file before appending.
Never append without confirmation.

---

## Stage 3: Session Execution

Once the schedule exists and the agent context file is updated, work begins.
This stage governs how the executor skill operates during active implementation.

### Per-task execution protocol

For every task, in strict order:

1. **Announce** — "Starting TASK-{x}-{n}: {title}."
2. **Update status** — Change task status to IN PROGRESS 🔄 in EXECUTION_PLAN.md
   before writing any code.
3. **Read context** — Read relevant files, the task description, and done criteria.
   Check if dependent tasks are truly complete.
4. **Execute** — Implement the task. Stay within scope. If unexpected work is
   discovered, add it as a new task rather than silently expanding the current one.
5. **Verify done criteria** — Check each "Done when" criterion explicitly.
   If any fail, continue work until they pass.
6. **Update status** — Mark task COMPLETE ✅. Record session ID.
   Check off done criteria in EXECUTION_PLAN.md.
7. **Log** — Write a brief execution note in the task's Notes field:
   what was done, any deviations from the plan, anything the next agent needs to know.
8. **Next task** — Consult the dependency map. Move to the next PENDING task
   that has all dependencies satisfied.

### Discovering new work

If implementation reveals work that isn't in the plan:

```
NEW TASK DISCOVERY:
→ Stop. Do not silently implement unlisted work.
→ Describe the new work to the user: what it is and why it's needed.
→ Assess: is it in scope (omitted from plan) or out of scope (new requirement)?
→ In scope: add as TASK-{phase}-{n+1} with full format, then proceed.
→ Out of scope: flag for user decision before adding. Do not add unilaterally.
```

### Blocked task protocol

If a task cannot be completed:

1. Update status to BLOCKED ⛔
2. Record the blocker in the task's Notes field: what the blocker is, what would unblock it,
   what was attempted (if anything)
3. Update EXECUTION_PLAN.md Master Task Status table
4. Find the next task that does not depend on the blocked task and continue
5. If no unblocked tasks remain, present the situation to the user with full context
6. **At session close:** always surface all BLOCKED tasks explicitly in the Session Summary,
   even if they were blocked in a prior session. Do not silently carry them forward.

### Session close protocol

At the end of every session:

1. **Update all task statuses** — ensure every task touched this session reflects
   accurate status in EXECUTION_PLAN.md
2. **Write session log entry** in EXECUTION_PLAN.md (see template)
3. **Produce handover context block** (see Stage 4)
4. **Present session summary** (see Stage 4)

---

## Stage 4: Session Close & Handover

### Session summary

```
SESSION CLOSE — [YYYY-MM-DD] — Session {N}
==========================================
Project: [name]

Tasks completed this session:
  ✅ TASK-{x}-{n}: [title]
  ✅ TASK-{x}-{n}: [title]

Tasks in progress (will continue next session):
  🔄 TASK-{x}-{n}: [title] — [what's done, what remains]

Tasks blocked:
  ⛔ TASK-{x}-{n}: [title] — [blocker + what would unblock]

New tasks added this session: {n}
  [TASK-ID]: [why added]

Overall progress: {n} / {total} tasks complete ({n} phases complete)

Next session should start with:
  TASK-{x}-{n}: [title] — [brief reason this is next]

EXECUTION_PLAN.md updated: ✅ [path]
```

### Handover context block

Produce this for the session-handover skill (or for the next agent directly):

```
HANDOVER CONTEXT — executor
============================
Skill: executor v1.1.0
Master schedule: [full path to EXECUTION_PLAN.md]

Current position:
  Phase {N}: [phase name] — [status]
  Last completed task: TASK-{x}-{n} — [title]
  Next task: TASK-{x}-{n} — [title]

Blocked items: [list with diagnoses, or "none"]
In-progress items: [list with state description]

New tasks added this session (not in original schedule):
  [TASK-ID]: [description and why added]

Critical context for next session:
  1. [Most important thing next agent must know]
  2. [Constraint or decision made this session]

First action for next session:
  Run 'executor resume'. Read EXECUTION_PLAN.md in full, confirm state
  with user, then proceed with TASK-{x}-{n}: [title].
```

Pass this block to the session-handover skill when writing the handover document.
The handover skill covers session narrative, decisions, and code state.
This block covers execution plan state. They complement each other.

---

## The Drift Prevention System

The core problem this skill addresses is **plan drift** — agents forgetting the
plan and improvising. The system has three interlocking parts:

**Part 1 — EXECUTION_PLAN.md as external memory.**
The schedule is a file, not a context-window list. Files survive compaction, session
resets, and agent switches. The agent's TODO list disappears. The file does not.

**Part 2 — Standing instruction in agent context file.**
The AGENTS.md / CLAUDE.md entry (Stage 2) makes consulting EXECUTION_PLAN.md a
mandatory habit, not an optional good practice. The agent sees this instruction
at the start of every session before it does anything.

**Part 3 — Status updates as proof of engagement.**
Requiring the agent to update task status (PENDING → IN PROGRESS → COMPLETE)
before and after each task creates a forcing function. An agent that hasn't updated
the status hasn't engaged with the plan. This is detectable and correctable.

All three parts are required. Any two without the third leaves a gap.

---

## Executor Principles

**E1 — The schedule is always current.**
An out-of-date EXECUTION_PLAN.md is worse than no plan — it misleads the next agent.
Update it as work progresses, not at the end of a session from memory.

**E2 — Tasks are sized for sessions, not sprints.**
A task that takes multiple sessions isn't a task — it's a phase. Break it down until
each piece is completable in one sitting. This is what makes session continuity possible.

**E3 — Dependencies are load-bearing.**
Undocumented dependencies are the primary cause of integration failures in multi-agent
work. If you know B depends on A, write it down before finding out the hard way.

**E4 — New work gets a task before it gets code.**
Silently adding work that isn't in the plan is how scope creep happens invisibly.
Every piece of work needs a task entry. This keeps the plan honest.

**E5 — The plan changes, but visibly.**
Requirements change. That's fine. What's not fine is silent plan drift. Every
change to the schedule gets a version entry in the change log. The history of what
the plan was, and why it changed, is itself valuable.

**E6 — Done criteria are non-negotiable.**
"Done" is not "it seems to work." Done is every criterion in the "Done when" list
checked off. Agents that self-certify completion without checking criteria produce
the most expensive bugs.

---

## Multi-Agent Coordination

When multiple agents work on the same project:

**Before starting any task:**
- Read EXECUTION_PLAN.md to check current task statuses
- Do not start a task already marked IN PROGRESS by another agent
- Do not start a task whose dependencies are not COMPLETE

**Task ownership:**
- Update "Assigned to" field when taking a task
- An IN PROGRESS task without a session stamp older than 24 hours may be stalled —
  surface to user before taking it

**Parallel work:**
- Tasks marked "Can run in parallel with" can be executed simultaneously
- Tasks with no shared file dependencies are safe to parallelize
- Tasks that modify the same files should not run in parallel

**Conflict resolution:**
- If two agents have modified the same file, do not silently merge
- Surface the conflict to the user with a clear description of both changes

---

## What NOT To Do

- **Do not hardcode paths** — always ask where plans and schedule live
- **Do not begin execution without reading EXECUTION_PLAN.md** (for `resume`)
- **Do not skip the agent context file update** — it is the drift prevention mechanism
- **Do not start work without updating task status to IN PROGRESS**
- **Do not mark a task COMPLETE without checking all done criteria**
- **Do not silently add work** — new discoveries get a task entry first
- **Do not silently modify the schedule** — changes get a version log entry
- **Do not improvise when the plan is unclear** — surface to user and update the plan

---

## Reference Files

| File | Load When |
|------|-----------|
| `references/execution-plan-template.md` | Stage 1 — generating EXECUTION_PLAN.md |
| `references/task-sizing-guide.md` | Stage 1 — calibrating task granularity |
| `references/dependency-patterns.md` | Stage 1 — modelling task dependencies |
