# Task Sizing Guide

Reference for calibrating task granularity in Stage 1.

---

## The Core Rule

**A task should be completable by a single agent in one uninterrupted session.**

This rule exists because sessions are the atomic unit of AI-assisted development.
A task that spans multiple sessions will be interrupted, partially done, and difficult
to resume cleanly. A task that's too small creates unnecessary overhead. Size tasks
to fit sessions.

Practical definition: one session ≈ 1–3 hours of focused implementation work,
or roughly 2,000–8,000 tokens of active output.

---

## Effort Size Reference

| Size | Rough time | Typical contents |
|------|-----------|-----------------|
| **XS** | < 30 min | Single file edit, config change, one-function fix |
| **S** | 30–90 min | Single component or module, small feature |
| **M** | 90 min–3 hr | Multi-file feature, integration between two components |
| **L** | 3–6 hr | Full feature end-to-end, significant refactor |
| **XL** | > 6 hr | Split this task — it's too large |

If a task is XL: split it. No exceptions. An XL task will be interrupted mid-way
and the incomplete state will confuse the next agent.

---

## When to Add Sub-tasks

Add sub-tasks (nested under a parent task) when **all three** of the following are true:

1. The parent task has internal sequencing (part B can only start after part A)
2. The parts could realistically be done by different agents or at different times
3. Each part has a distinct, checkable done criterion

Do not add sub-tasks just to show thoroughness. Flat tasks with clear done criteria
are easier to track than nested hierarchies with no real dependency structure.

**Good sub-task candidate:**
- Task: "Build user authentication"
- Sub-tasks: "Implement login endpoint" → "Implement JWT token issuance" → "Implement token refresh" → "Implement logout"
- Rationale: clear sequence, each independently testable

**Bad sub-task candidate:**
- Task: "Style the dashboard"
- Proposed sub-tasks: "Style the header", "Style the sidebar", "Style the main content"
- Problem: these have no real dependency — they can all be done in one pass and there's no reason to track them separately

---

## Project Scale → Schedule Depth

| Project scale | Phases | Tasks | Sub-tasks |
|--------------|--------|-------|----------|
| Small (< 1 week, 1 dev) | None needed — flat task list | Yes | Rarely |
| Medium (1–4 weeks, 1–3 devs) | 2–4 phases | Yes | Where genuinely complex |
| Large (multi-month, team) | 3–6 phases | Yes | Where complex |
| Feature addition (existing codebase) | 2–3 phases | Yes | Where complex |

For **small projects**: skip phases. Use a single flat task list with a "Foundation"
group and a "Delivery" group. Phases add overhead that isn't warranted at this scale.

For **large projects**: be disciplined about phase exit criteria. A phase that never
"completes" because tasks keep getting added to it is a planning failure, not an
execution failure.

---

## Calibration by Domain

Different domains have characteristic task sizes:

| Domain | Typical task size | Notes |
|--------|-----------------|-------|
| Frontend UI components | S–M | One component per task usually right |
| API endpoints | S | One endpoint or one route group per task |
| Data model / migrations | S–M | One entity or one migration per task |
| Authentication / security | M–L | Higher complexity, more interdependencies |
| Testing | S per feature | Test coverage task per feature, not one big "write tests" task |
| DevOps / infrastructure | M–L | Often has hidden dependencies; size conservatively |
| Data pipeline / ETL | M | One pipeline stage per task |
| Documentation | XS–S | Don't let docs pile into a big task at the end |

---

## Signals that a task is too large

- You can't write its "Done when" criteria without writing a paragraph
- It touches more than 5 files
- It requires multiple different types of work (e.g., data model + API + tests + docs)
- You're using the word "and" multiple times in the task description
- The estimated effort is XL

In each case: split. Ask "what's the first thing that must be true before anything
else in this task can start?" — that's your first sub-task.

---

## Signals that a task is too small

- Done criteria can be checked in under 2 minutes
- The task is a single line of code or a single config value
- It would feel wasteful to write a session log entry for it
- There are 10+ tasks of this size in a row with no meaningful dependencies

In each case: group. Combine logically related small tasks into one task with
multiple done criteria. "Set up linting, formatting, and CI checks" is one task,
not three.

---

## The Done Criteria Test

Every task must pass this test before being added to the schedule:

1. Can you write at least 2 concrete, checkable done criteria?
2. Could an agent with no prior context check each criterion independently?
3. Are the criteria about behaviour, not effort? ("The endpoint returns 200 with
   correct schema" is a behaviour. "The endpoint is implemented" is effort.)

If any answer is no, redefine the task before adding it.
