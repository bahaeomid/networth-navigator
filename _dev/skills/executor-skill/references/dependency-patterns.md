# Dependency Patterns

Reference for modelling task dependencies in Stage 1.
Use this to identify and document dependencies correctly when generating the schedule.

---

## Core Concepts

### Hard dependency (→)
Task B cannot start until Task A is complete. The most common type.
Example: "Implement API endpoints" cannot start until "Define data model" is complete.

### Soft dependency (⇢)
Task B is easier or safer to do after Task A, but not strictly blocked.
Example: Writing tests is easier after the feature is implemented, but can be
written in parallel if the interface is defined.
Note soft dependencies in the task's Notes field, not as formal dependencies.

### Parallel tasks (║)
Tasks with no dependency on each other and no shared file conflicts.
Can be executed simultaneously by different agents.

### Blocking dependency (⛔)
An external factor (open question, third-party decision, hardware, another team)
that blocks a task. Document as a blocker in the task, not as a task dependency.

---

## Common Dependency Patterns

### Pattern 1: Linear chain
Each task depends on the previous.
```
TASK-0-1 → TASK-0-2 → TASK-0-3
```
When to use: Setup and infrastructure phases. Foundation work where each step builds
on the last.

### Pattern 2: Fan-out (parallel work after a dependency)
One foundational task unlocks multiple parallel tasks.
```
TASK-0-1 → TASK-1-1 ║
         → TASK-1-2 ║
         → TASK-1-3 ║
```
When to use: After core infrastructure is in place, multiple features can be built
independently. Common in Phase 1 when foundation (Phase 0) is complete.

### Pattern 3: Fan-in (convergence before integration)
Multiple parallel tasks must all complete before integration can begin.
```
TASK-1-1 ║ → TASK-2-1
TASK-1-2 ║ → TASK-2-1
TASK-1-3 ║ → TASK-2-1
```
When to use: Integration tasks (connecting frontend to backend, merging feature
branches, end-to-end testing) that depend on multiple independently-built components.

### Pattern 4: Layered (phased delivery)
Each phase must complete before the next begins.
```
[Phase 0: complete] → [Phase 1: begins]
[Phase 1: complete] → [Phase 2: begins]
```
When to use: Standard pattern between phases. Phase gates ensure each layer is
solid before building on it.

### Pattern 5: Spike-first (research unlocks design)
A time-boxed investigation task must complete before implementation is planned.
```
TASK-0-1 (spike: evaluate library options) → TASK-1-1 (implement using chosen library)
```
When to use: When a technical decision is genuinely open and the wrong choice would
require significant rework. The spike is a task that produces a decision, not code.

---

## How to Identify Dependencies During Plan Analysis

Work through the plan and ask these questions for each task:

**1. What must exist before this task can start?**
- Data models before API endpoints
- API endpoints before frontend integration
- Auth before anything that requires logged-in users
- Dev environment before any implementation task
- External service credentials before tasks that call those services

**2. What does this task produce that other tasks need?**
If Task A produces X, and Task B needs X, then B depends on A.

**3. What files does this task touch?**
If two tasks touch the same file, they should not run in parallel. Either sequence
them (with a dependency) or split the work so they touch different parts of the file.

**4. Is there an open question that must be resolved first?**
If the plan has an unresolved open question that affects how this task is implemented,
mark the task BLOCKED ⛔ and reference the open question. Do not include it in the
execution sequence until resolved.

---

## Dependency Mistakes to Avoid

**Over-dependency:** Making every task depend on every other "just to be safe."
This creates an unnecessarily linear schedule and prevents parallel work. Only
model dependencies that genuinely exist.

**Under-dependency:** Missing implicit dependencies because they feel obvious.
The "obviously" in "obviously you need the database before you query it" is exactly
the kind of thing that gets missed. Model it explicitly.

**Circular dependency:** Task A depends on B, which depends on A. This means the
tasks are incorrectly scoped — there's a shared concern that should be extracted
into its own foundational task.

**External as task:** Treating external blockers (waiting for a third-party API key,
a decision from another team) as task dependencies creates false sequencing. Model
these as blockers on the affected tasks, not as tasks themselves.

---

## Dependency Map Format

In EXECUTION_PLAN.md, the dependency map uses this notation:

```
[Phase N — Phase name]
  TASK-N-1 → TASK-N-2 → TASK-N-3     (linear chain)
  TASK-N-1 → TASK-N-4 ║ TASK-N-2     (parallel after shared dep)
  TASK-N-5 (no dependencies — can start any time in phase)
  TASK-N-6 ⛔ blocked on: [OQ-01 / external factor]
```

Keep the map readable. If it becomes too complex to fit on one screen, it's a signal
the schedule has too many fine-grained tasks that should be grouped.

---

## Parallelism Guide for Multi-Agent Projects

When multiple agents will work simultaneously:

**Safe to parallelize (different files, different concerns):**
- Frontend components vs. backend API endpoints
- Different feature modules with no shared state
- Documentation vs. implementation
- Tests vs. the feature being tested (if interface is defined)

**Unsafe to parallelize (shared files or state):**
- Two tasks that modify the same schema/migration file
- Two tasks that edit the same configuration file
- Two tasks that implement the same interface differently
- Any task that depends on the output of a currently in-progress task

**How to identify safe parallelism:**
After generating the schedule, scan the "Description" of each task for file references.
If two tasks reference the same file, they should not run in parallel — add a dependency
or split the file modifications so they don't conflict.
