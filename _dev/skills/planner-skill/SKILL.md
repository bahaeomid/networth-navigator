---
name: planner
version: 1.2.0
type: Type 1 — Instruction skill (Markdown only)
description: >
  Comprehensive project planning skill. Transforms any combination of inputs — user
  conversation, rough notes, screenshots, PDFs, markdown files, web links, existing
  code — into a structured PLAN.md and an initial CLAUDE.md / AGENTS.md scaffold for
  the project. Use whenever a user wants to plan a new project, feature, or codebase;
  create a requirements document; generate a technical plan before development begins;
  or produce agent instructions for a new project. Triggers on: "plan this project",
  "help me plan", "create a plan", "write up a plan", "I want to build X", "plan this
  feature", "let's plan before we start", "create a requirements doc", "write a PRD",
   "generate a plan from these notes", "make a plan from this", "planner resume",
   "planner update", or any request to define scope, architecture, or requirements
   before implementation begins.
  Interviews the user progressively to gather context, ingests any provided source
  materials, and produces PLAN.md (full plan) and an agent context file scaffold
  (CLAUDE.md or AGENTS.md) appropriate to the project's tooling.
  Does NOT produce execution schedules or task lists — those belong to the Executor skill.
  Fully standalone. Compatible with any AI coding environment. Tool-agnostic.
compatibility: >
  Any AI coding environment — claude.ai, Claude Code, Codex, OpenCode, Cursor, or any
  surface with file read/write capability. Tool-agnostic. Standalone.
  Optionally uses file-ingest skill if available for non-text source materials.
license: Proprietary
---

# Planner

Transforms any inputs — conversation, notes, PDFs, screenshots, URLs, existing code —
into two structured artifacts that anchor all subsequent development:

| Artifact | Purpose |
|----------|---------|
| `PLAN.md` | Comprehensive project plan: goals, scope, architecture, decisions, constraints, acceptance criteria |
| `CLAUDE.md` or `AGENTS.md` | Initial agent context scaffold: foundational rules, stack, conventions, what agent should always/never do |

This skill covers the **plan** step of the project lifecycle:

```
[plan] → implement → review & audit → fix, document & iterate → close project
```

**Scope boundary:** the Planner defines *what* and *why*. It does not produce task
lists, execution schedules, or sprint plans. Those are the Executor skill's domain.

---

## Commands

### `planner start`
Begin planning from scratch or from provided source materials.
Runs: Source Ingestion → Interview → Plan Generation → Agent Context File Generation.

### `planner resume`
Resume an in-progress planning session. Reads existing draft plan, reconstructs
interview state, and continues from where work stopped.

### `planner update`
Update an existing PLAN.md to reflect new information, changed scope, or revised
decisions. Runs a targeted interview to understand what changed, then produces
a versioned update to the plan with a change log.

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
| File | Default |
|------|---------|
| `PLAN.md` | `_dev/docs/PLAN.md` (confirm with user) |
| Agent context file | Project root — ask which environment before creating |
| Audit registry stub | `_dev/docs/audit/AUDIT_REGISTRY.md` (offer to create) |

---

## Stage 0: Source Ingestion

If source materials are provided, ingest them before interviewing.

### Supported source types

| Source type | How to handle |
|-------------|--------------|
| Text pasted in chat | Read directly — no ingestion needed |
| `.md`, `.txt` files | Read directly |
| `.pdf`, `.docx`, `.pptx` | Use `file-ingest` skill if available; otherwise ask user to paste key content |
| Screenshots / images | Read and extract visible text and structure; note any diagrams |
| Web URLs | Use `file-ingest` skill if available; otherwise use web fetch |
| Existing codebase | Run a lightweight orientation scan (see below) |
| Voice/rough notes | Read as-is; treat as unstructured input requiring heavy interview |

### If `file-ingest` skill is available

Check whether `skills/file-ingest/` exists in the project. If it does, read its
SKILL.md for usage instructions, then invoke `skills/file-ingest/ingest.py` from the
project root using the Python interpreter available in the environment (`python`,
`python3`, or `py` on Windows):

```bash
python skills/file-ingest/ingest.py [source path or URL]
```

Use the returned markdown as the source content. Note any `warnings` or
`action_required: true` flags — these mean the content may need human review.

### If `file-ingest` is not available

For PDFs, DOCX, and other non-text files: ask the user to paste the key content,
or note what couldn't be ingested and proceed with what's available.

### Lightweight codebase orientation scan

If an existing codebase is provided as context:

1. List directory structure (top 2 levels)
2. Read `README.md`, `package.json` / `pyproject.toml` / equivalent manifest
3. Read any existing `CLAUDE.md` or `AGENTS.md`
4. Read 2–3 key source files to understand patterns and conventions
5. Note: languages, frameworks, folder conventions, existing patterns

Do not do a full audit. The goal is enough orientation to ask informed questions.

### Source Synthesis

After ingesting all materials, produce a brief internal summary before interviewing:

```
SOURCE SYNTHESIS (internal — present to user for confirmation)
==============================================================
Sources ingested: [list with format and any quality flags]
What I understand so far:
  Project type: [web app / API / data pipeline / CLI tool / library / other]
  Domain: [e.g., e-commerce / analytics / internal tooling / consumer product]
  Tech signals: [languages, frameworks, patterns observed]
  Stated goals: [any explicit goals found in source materials]
  Unstated/unclear: [what's missing or ambiguous — will clarify in interview]

Confidence in this synthesis: High / Medium / Low
```

Present this to the user. Confirm it's roughly right before proceeding to the interview.

---

## Stage 1: Progressive Interview

The interview gathers everything needed to write the plan. It proceeds in phases,
one question at a time — never multiple questions at once. Short-circuit phases where
the source materials have already answered the questions.

### Interview philosophy (from compound engineering)

- Ask questions one at a time. Cognitive load kills honesty.
- Prefer multiple-choice when natural options exist.
- If requirements are already clear from source materials, skip that question.
- Stop when you have enough to write a high-confidence plan. Don't over-interview.
- After each phase, briefly summarise what you've learned before continuing.

### Phase 1: Purpose and Goals

Establish the fundamental *why* before anything else.

Questions to work through (ask only what isn't already answered):

1. **Problem statement:** What specific problem does this project solve?
   Who experiences this problem, and how badly?
2. **Primary goal:** What does success look like? What's the single most important
   outcome this project must deliver?
3. **Secondary goals:** What else matters, in priority order?
4. **Anti-goals:** What is explicitly out of scope? What should this project
   *not* do, even if it seems related?
5. **Success criteria:** How will you know the project succeeded? What's measurable?

Phase 1 summary format:
```
PHASE 1 SUMMARY — Purpose
Problem: [one sentence]
Primary goal: [one sentence]
Anti-goals: [list]
Success criteria: [list]
Confidence: High / Medium / Low
```

### Phase 2: Users and Context

Understand who uses this and under what conditions.

1. **Primary users:** Who uses this? What's their technical level?
2. **Usage context:** When and how do they use it? What environment?
3. **Scale expectations:** How many users, requests, or data volumes?
4. **Existing systems:** What does this need to integrate with or replace?
5. **Constraints given to you:** Any deadlines, compliance requirements, or
   non-negotiable technical constraints?

Phase 2 summary format:
```
PHASE 2 SUMMARY — Users and Context
Users: [description]
Scale: [rough expectation]
Integrations: [list]
Constraints: [list]
```

### Phase 3: Technical Scope

Establish the architecture and stack decisions.

1. **Tech stack:** What languages, frameworks, and tools are decided?
   What's still open?
2. **Architecture pattern:** monolith, microservices, serverless, API + frontend,
   library, CLI, or other?
3. **Data model:** What are the core entities? Where does data live?
4. **Key interfaces:** APIs, CLIs, UI screens, or data pipelines — what are the
   primary interaction surfaces?
5. **Non-functional requirements:** performance, security, availability, offline
   support, accessibility — what matters here?
6. **Known technical risks:** What's hardest about this? Where are you least certain?

Phase 3 summary format:
```
PHASE 3 SUMMARY — Technical Scope
Stack: [decided / open items]
Architecture: [pattern]
Core entities: [list]
Key interfaces: [list]
NFRs: [list]
Biggest risks: [list]
```

### Phase 4: Decisions and Open Questions

Surface explicit decisions and flag what remains unresolved.

1. **Decided:** What technical or product decisions are already made and not
   up for debate?
2. **Open:** What decisions still need to be made before or during development?
3. **Assumptions:** What are you assuming to be true that, if wrong, would
   significantly change the plan?
4. **Dependencies:** What external things (libraries, APIs, other teams, data
   sources) does this depend on?

Phase 4 summary format:
```
PHASE 4 SUMMARY — Decisions
Decided (locked): [list]
Open questions: [list with owner/timeline if known]
Key assumptions: [list]
External dependencies: [list]
```

### Phase 5: Complexity Assessment

Use this to determine whether a single PLAN.md is sufficient or whether the plan
needs to be split into multiple files.

Ask:
> "Roughly how large is this project? A few days of work, a few weeks, or months?"

Then apply this rule:

| Scale | Output structure |
|-------|-----------------|
| Small (1–5 days, single dev) | Single `PLAN.md` |
| Medium (1–4 weeks, 1–3 devs) | Single `PLAN.md` with sub-sections |
| Large (multi-month, team) | `PLAN.md` (overview) + `references/` split files |
| Existing codebase + new feature | `docs/plans/PLAN-[feature-name]-[date].md` |

For large projects, split plan into:
- `PLAN.md` — executive summary, goals, architecture overview, decisions log
- `references/architecture.md` — detailed architecture and data model
- `references/requirements.md` — full functional and non-functional requirements
- `references/open-questions.md` — decisions and open items log

### Interview Completion Check

Before writing the plan, verify:

```
INTERVIEW COMPLETE — Ready to plan?
=====================================
Problem statement: ✅ / ❓
Primary goal: ✅ / ❓
Success criteria: ✅ / ❓
Tech stack: ✅ / ❓ (open: [list])
Architecture: ✅ / ❓
Core entities: ✅ / ❓
Non-negotiable constraints: ✅ / ❓
Open questions documented: ✅ / ❓

Confidence to write plan: High / Medium / Low
If Low or Medium: [what's still needed]
```

If confidence is Low, run a targeted follow-up question before proceeding.
If Medium, proceed but flag open items prominently in the plan.
If High, proceed.

---

## Stage 2: Plan Generation

Load `references/plan-template.md` and produce `PLAN.md` (or split files for large
projects). Fill every section. Where information is genuinely unknown, write
"TBD — [what needs to be decided and by whom]" rather than leaving blanks.

### Core principles for a good plan

**Lead with the answer.** The first section must orient any reader in 60 seconds.
State what this is, why it exists, and what done looks like — before any detail.

**Decisions are the most valuable content.** Architecture diagrams and feature lists
are useful. But the most durable content is the record of *decisions made* and *why* —
especially alternatives that were considered and rejected. Future agents and developers
will re-litigate undocumented decisions. Document them.

**Separate what from how.** The plan defines what is being built and why. It does not
define implementation steps, task breakdowns, or execution sequences. Any "how" content
that appears belongs either in the architecture section or in the Executor skill's scope.

**Anti-goals are as important as goals.** A plan without explicit anti-goals will drift.
Every time someone says "while we're here, let's also..." the anti-goals section is the
response.

**Open questions must have owners.** An open question without an owner is a decision
that will be made by whoever writes the code first, without visibility. Name the owner
and a target resolution date.

### Plan quality gate

Before saving, verify:

- [ ] An unfamiliar developer could read the first section and understand the project in 60 seconds
- [ ] Every technical decision has a rationale (not just what was decided, but why)
- [ ] Anti-goals are explicit — at least 2–3
- [ ] Every open question has an owner or is flagged as "owner needed"
- [ ] Acceptance criteria are measurable — not "it works well" but "it handles X load / returns in Y ms / passes Z tests"
- [ ] The plan does not contain implementation steps or task lists

---

## Stage 3: Agent Context File Generation

After the plan is complete, generate the initial `CLAUDE.md` or `AGENTS.md`.

### Which file to generate

Ask if not already known:

> "What agent environment does this project use? Claude Code (CLAUDE.md), Codex or
> OpenCode (AGENTS.md), Cursor (.cursor/rules/base.mdc), or something else?"

| Environment | File to generate |
|------------|-----------------|
| Claude Code | `CLAUDE.md` |
| Codex, OpenCode | `AGENTS.md` |
| Cursor | `.cursor/rules/base.mdc` |
| Unknown / multiple | `AGENTS.md` (most portable) |
| Already exists | Append a planning section — never overwrite |

### What the agent context file contains at planning stage

The planning-stage agent context file encodes what the agent needs to know to work
in this codebase from day one. It is foundational — operational rules accumulated
during development are added later (by audit-fix-implementer and other skills).

Load `references/agent-context-template.md` for the full structure. Key sections:

**1. Project identity (3–5 sentences)**
What this project is, what it does, who it's for. The agent reads this every session —
make it dense and specific, not a marketing summary.

**2. Tech stack and versions**
Exact list. Language version, framework version, key library versions. Include what
is explicitly NOT used (e.g. "no Tailwind — all styles are CSS modules").

**3. Folder structure and conventions**
Where things live. Naming conventions. File organisation patterns.

**4. Always do / Never do**
Imperative rules. Short. Unambiguous. Examples:
- "Always use the Result type for error handling — never throw"
- "Never import directly from internal packages — use the public API"
- "Always run the linter before committing"

**5. Architecture decisions (locked)**
The decisions from Phase 4 of the interview that are not up for debate. The agent
should not re-litigate these or suggest alternatives unless asked.

**6. Open questions (to be resolved)**
Copy from the plan. The agent should flag these if they become blockers during work.

**7. Patterns to follow**
Reference code examples or pattern names that define the expected style.
For existing codebases: name specific files that exemplify good patterns.

### Agent context file quality gate

- [ ] An agent could read this file in under 2 minutes and know exactly how to work in this codebase
- [ ] Every "always/never" rule is unambiguous — no rule that requires interpretation
- [ ] The tech stack section is complete enough that the agent won't guess versions
- [ ] Open questions are clearly flagged as open (not stated as if decided)
- [ ] The file does not contain implementation steps or feature lists

---

## Stage 4: Deliver and Confirm

### File delivery

Confirm paths with the user before saving. Apply Path Resolution (see above).
Default paths if not otherwise declared:

| File | Default path |
|------|-------------|
| `PLAN.md` | `_dev/docs/PLAN.md` or project root |
| Split plan files | `_dev/docs/plans/` |
| `CLAUDE.md` / `AGENTS.md` | Project root (always) |
| `.cursor/rules/base.mdc` | Project root (always) |
| Audit registry stub | `_dev/docs/audit/AUDIT_REGISTRY.md` |

**Audit registry stub:** If the project is likely to undergo code review or auditing
(most software projects), create an empty `AUDIT_REGISTRY.md` stub during scaffolding
using the schema in `references/audit-registry-schema.md` (bundled with this skill). This ensures the registry
exists before any audit runs, so `codebase-auditor` and `audit-fix-implementer` find it
immediately. Ask the user before creating it:
> "Should I create an audit registry stub for tracking future audit runs on this project?
> Recommended for any project that will undergo code review. [Yes / No / Later]"

### Delivery summary

```
PLANNING COMPLETE
=================
Project: [name]
Date: [YYYY-MM-DD]

Artifacts produced:
  ✅ [PLAN.md path] — [N sections, N open questions]
  ✅ [CLAUDE.md / AGENTS.md path] — initial scaffold, [N rules]
  ✅ [Audit registry path] — stub created (if applicable)

Open questions requiring resolution before development:
  1. [question — owner — target date]
  2. ...

Recommended next steps:
  1. Review and confirm the open questions list
  2. Share PLAN.md with any stakeholders who need to sign off
  3. When ready to begin development, invoke the Executor skill to
     generate an execution schedule from this plan
  4. As development proceeds, append to [CLAUDE.md / AGENTS.md] with
     operational rules discovered during implementation
```

### If the plan reveals scope that's too large

If during planning it becomes clear the project is significantly larger than first
understood, surface this explicitly:

> "Based on what you've described, this project is [scope assessment]. Before
> generating a full plan, it may be worth deciding whether to: (a) proceed with
> the full scope, (b) identify a minimum viable version to plan first, or (c)
> split this into separate planning sessions by phase."

Do not silently plan a 6-month project when the user implied 2 weeks.

---

## Planning Principles

**P1 — Understand before designing.**
Never jump to architecture before understanding the problem. The interview is not a
formality — it is the most important part of planning.

**P2 — Questions one at a time.**
Multiple simultaneous questions produce shallow answers. Ask one, listen, then ask
the next. The interview should feel like a conversation, not a form.

**P3 — Short-circuit when clear.**
If source materials have already answered a question, don't ask it again. Respect
the user's time.

**P4 — Decisions are first-class content.**
A plan that records what was decided is useful. A plan that records what was decided
*and why* is durable. A plan that records what was *rejected and why* is invaluable.

**P5 — Anti-goals prevent drift.**
Every feature that scope creep adds is a feature that wasn't in the anti-goals list.
Make the boundaries explicit.

**P6 — The agent context file is living infrastructure.**
The planning-stage agent context file is a foundation, not a finished product.
It will be updated as development reveals operational rules. Design it to be appended
to, not rewritten.

**P7 — Plan the what, not the how.**
If you find yourself writing implementation steps in the plan, stop. Those belong
to the Executor. The plan is the contract. The execution schedule is the delivery plan.

---

## What NOT To Do

- **Do not hardcode file paths** — always ask the user where planning files should live
- **Do not skip the interview** — even a detailed brief will have gaps; the interview finds them
- **Do not ask multiple questions at once** — one question, one answer, then next
- **Do not include task lists or implementation steps in PLAN.md** — Executor scope
- **Do not generate CLAUDE.md / AGENTS.md without asking which environment** — wrong file name is friction
- **Do not overwrite an existing CLAUDE.md / AGENTS.md** — append a planning section
- **Do not leave open questions without owners** — undecided + no owner = decided by the coder
- **Do not plan speculatively** — if scope is unclear, surface that before producing the document

---

## Reference Files

| File | Load When |
|------|-----------|
| `references/plan-template.md` | Stage 2 — producing PLAN.md |
| `references/agent-context-template.md` | Stage 3 — producing CLAUDE.md / AGENTS.md scaffold |
| `references/complexity-guide.md` | Assessing whether to split plan into multiple files |
