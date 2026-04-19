---
name: audit-fix-implementer
version: 1.5.1
type: Type 1 — Instruction skill (Markdown only)
description: >
  Implements fixes from a completed audit document, verifies each fix with an
  iterate-and-fix algorithm, and compounds all learning into persistent, portable
  knowledge artifacts. Designed for multi-session, multi-agent development: each
  agent session appends to shared living documents rather than overwriting them,
  with a mandatory startup protocol to read prior session state before touching
  anything. Use whenever a user wants to action an audit report, fix findings from
  a prior review, implement a remediation plan, or execute any "fix & iterate" phase
  following an audit, code review, or technical assessment. Triggers on: "implement
  the audit fixes", "fix the findings", "action the audit", "execute the remediation
  plan", "implement fixes from the review", "go through the audit and fix everything",
  "fix, document and iterate", "continue the audit fixes", "pick up where we left off
  on the fixes", or any request to address previously identified issues from an audit.
  Also triggers on the explicit close command: "audit-fix-implementer close", which
  produces the final consolidated LESSONS_LEARNED.md at project end. Never produce
  the final LESSONS_LEARNED.md speculatively — only on explicit close invocation.
  Fully standalone. Compatible with any AI coding environment: Claude, Codex, OpenCode,
  Cursor, or any surface with file read/write capability. Tool-agnostic.
compatibility: >
  Any AI coding environment — claude.ai, Claude Code, Codex, OpenCode, Cursor, or any
  surface with file read/write capability. Tool-agnostic. No dependencies on other skills.
license: Proprietary
---

# Audit Fix Implementer

A systematic framework for implementing fixes from an audit document, verifying each
fix, and compounding all learning into two living documents that accumulate knowledge
across multiple sessions and agents over the life of a project.

This skill occupies the **fix, document & iterate** step of the project lifecycle:

```
plan → implement → review & audit → [fix, document & iterate] → close project
```

The two living documents this skill maintains:

| Document | Role | Lifespan |
|----------|------|----------|
| `IMPLEMENTATION_LOG.md` | Append-only session record: what changed, what failed, why | Duration of fix work |
| `LESSONS_LEARNED.md` | Accumulating knowledge: patterns, principles, guidance | Permanent; feeds knowledge library |

Both documents are **written to, never rewritten**. Every agent session appends its
own stamped block. The documents grow richer with each session.

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
├── audits/         <- AUDIT_REGISTRY.md, AUDIT_REPORT_YYYY-MM-DD.md, continuity/
├── handovers/      <- HANDOVER-[PROJECT]-[SESSION].md
├── PLAN.md
├── EXECUTION_PLAN.md
└── core/
```

**This skill's paths:**
| File | Read path | Write path |
|------|----------|-----------|
| Audit document | Agent context `Audit report:` → `_dev/docs/audits/` (most recent) → ask | — |
| Audit registry | Agent context `Audit registry:` → `_dev/docs/audits/AUDIT_REGISTRY.md` → optional | — |
| `IMPLEMENTATION_LOG.md` | Agent context → `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md` | `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md` |
| `LESSONS_LEARNED.md` | Same pattern | `_dev/docs/audits/continuity/LESSONS_LEARNED.md` |
| `references/` templates | Resolve dynamically: find the skill folder containing this SKILL.md, then read `references/` within it. Never hardcode the folder name. | — |

---

## Audit Registry Check

Before ingesting the audit document, check for an audit registry.

**If `AUDIT_REGISTRY.md` is found:** read it. The "Current Ground Truth" header tells you
which audit is authoritative. If multiple ACTIVE audits exist with different scopes (e.g.
one full audit + one targeted security audit), note this to the user:
> "I found [N] active audits covering different scopes: [list]. I'll work from the most
> recent full audit as the primary document. Confirm, or specify which to prioritise."

**If no registry exists:** create one now using `references/audit-registry-schema.md` (bundled with this skill).
This project may not have used `codebase-auditor` — that's fine. Add the incoming audit
document as the first row. Ask the user for the audit date and scope if not evident from
the document itself.

**The registry is not a hard dependency.** If the user declines to create one, proceed
with ingesting the audit document directly. The registry improves navigability; it does
not block functionality.

---

## Audit Document Ingestion

This skill can ingest audit documents from any source — not just `codebase-auditor` output.

**Supported input formats:**
- `codebase-auditor` standard format: `FINDING-{N}` blocks with Severity, File, Description,
  Evidence, Before/After, Fix, Effort fields — all parseable directly
- Third-party audit reports: any structured format (PDF, DOCX, markdown, spreadsheet) —
  the skill normalises these into the standard finding format before planning
- Informal finding lists: bullet points, numbered lists, inline notes — normalised on ingestion

**Normalization pass (always run, regardless of format):**

Before building the Master Finding Status Table, normalise all findings into this structure.
Fill what's available; mark missing fields as "Unspecified":

```
FINDING-{N}
Severity:    [CRITICAL / HIGH / MEDIUM / LOW — infer from source if not explicit]
Title:       [Short descriptive title]
File:        [file:line if available, else "Unspecified"]
Description: [What the problem is]
Evidence:    [Code, test, or observation — or "Unspecified"]
Fix:         [Proposed fix — or "To be designed"]
Effort:      [Trivial / Moderate / Significant — or "Unspecified"]
Source:      [Finding ID from original report, or original text if no ID]
```

If severity is not specified in the source, infer conservatively from the description
and note the inference:
> "FINDING-03 had no severity stated — inferred as HIGH based on description of data loss risk.
> Confirm or adjust before planning."

Present the normalised finding inventory for user confirmation before planning.

**If the audit document is split across multiple files:** ingest the index file first,
then read supplementary files as needed. Check `_dev/docs/audits/` for related files.

---

## Commands

### `audit-fix-implementer start`
Begin fix implementation from a completed audit document. First session only.
Runs: Startup Path A → Stage 0 → Stage 1 → Stage 2 → Stage 3 → Stage 4.

### `audit-fix-implementer continue`
Resume fix work from a prior session. Triggers Startup Path B: reads existing
artifacts, reconstructs state, confirms with user, opens new session block, resumes.

### `audit-fix-implementer close`
**Explicitly invoked by the user when the project is closing.**

The agent cannot determine on its own that the project is closing. The close procedure
runs only when explicitly requested.

Acceptable close triggers: `audit-fix-implementer close`, "close out the audit",
"generate the final lessons learned", "wrap up the fix project", "we're done."

If all findings appear resolved but the user has not issued a close command, ask:
> "All tracked findings are resolved. Shall I run the close procedure and produce the
> final consolidated Lessons Learned document?"

---

## How to Use This Skill

**Starting fresh:** Say "implement the audit fixes" or "audit-fix-implementer start."
The skill will locate the audit document, ingest it, plan, and begin.

**Resuming:** Say "continue the audit fixes" or "audit-fix-implementer continue."
The skill reads existing artifacts, reconstructs state, confirms, and resumes.

**Closing:** Say "audit-fix-implementer close."
The skill consolidates all accumulated knowledge into the final Lessons Learned document.

---

## First Action: Determine Session Type

Before doing anything else, check for the presence of `IMPLEMENTATION_LOG.md`:
- If found: Startup Path B (continue) or C (close)
- If not found: Startup Path A (start)

Ask:
> "Is this a new audit session, a continuation of prior fix work, or are we closing
> out the project? And where is the audit document or existing log?"

Follow the appropriate startup path.

---

## Startup Path A: First Session (`start`)

1. Locate and read the audit document (path resolution above)
2. Run Stage 0 (Ingest)
3. Run Stage 1 (Plan) — create the Master Finding Status Table
4. Create `IMPLEMENTATION_LOG.md` with document header and Session 1 block
5. Create `LESSONS_LEARNED.md` with document header
6. Run Stage 2 (Execute)
7. Run Stage 3 (Compound — batch syntheses and session close summary)
8. Run Stage 4 (Close session — not project)

---

## Startup Path B: Continuation Session (`continue`)

### Step B1 — Read existing artifacts in full

Read in this order before touching anything:

1. `IMPLEMENTATION_LOG.md` — every session block. Understand what was attempted,
   what failed, what constraints exist, what approaches are known to fail.
2. `LESSONS_LEARNED.md` — all accumulated principles and patterns.
3. The audit document — re-read. Do not rely on prior summaries.

### Step B2 — Reconcile state

Before reconstructing, cross-reference the audit document against IMPLEMENTATION_LOG.md.
If there are discrepancies (e.g. tasks marked done that appear incomplete, or the audit
document was updated externally since last session), surface them:
> "I found a discrepancy: [description]. IMPLEMENTATION_LOG says [X] but the audit
> document shows [Y]. Which is current?"

Resolve discrepancies before opening a session block.

### Step B3 — Reconstruct current state

```
CONTINUATION STATE SUMMARY
===========================
Prior sessions: {n}  (Sessions {list})
Last session date: [from log]

Master Finding Status:
  FIXED:    {n} — [IDs]
  BLOCKED:  {n} — [IDs + last known reason]
  PARTIAL:  {n} — [IDs]
  DEFERRED: {n} — [IDs]
  OPEN:     {n} — [IDs]

Blocked findings needing attention:
  FINDING-{N}: [why blocked, what was tried, what might unblock it]

Key constraints from prior sessions (do not rediscover):
  [List extracted from prior observation entries]

Principles accumulated: {n} — [brief name list, to avoid duplication]

Proposed work this session: [ordered findings list with rationale]

Questions before I begin: [anything needing user input]
```

Wait for confirmation before opening the session block.

### Step B4 — Open a new session block

Append to `IMPLEMENTATION_LOG.md`:

```markdown
---
## SESSION {N} — [YYYY-MM-DD] — [Agent identifier or "unspecified"]
**Picking up from:** Session {N-1}
**Open findings at session start:** [list IDs]
**Session goal:** [what this session aims to complete]
**Session end status:** [fill at close]
---
```

Then proceed to Stage 2. Skip Stages 0 and 1.

---

## Startup Path C: Project Close (`close`)

1. Read `IMPLEMENTATION_LOG.md` and `LESSONS_LEARNED.md` in full
2. Confirm with user: any findings being intentionally left open at close?
3. Load `references/lessons-learned-template.md`
4. Produce the final consolidated `LESSONS_LEARNED.md`:
   - Synthesise all accumulated batch synthesis and Session Close Summary blocks
   - Consolidate and deduplicate all principles into Part 4
   - Fill all 8 parts of the template completely
5. Present the document for user review before saving
6. Save to confirmed path, update agent context file `## Paths`
7. Update audit registry: change the actioned audit's AFI column to `CLOSED ([date])`
8. **Wiki note:** Part 4 of `LESSONS_LEARNED.md` contains only generalizable principles
   with no project-specific references. If you maintain a cross-project knowledge wiki,
   Part 4 is designed to be ingested into it. Ingest it using your `llm-knowledge-base`
   skill or equivalent knowledge management workflow.

---

## Stage 0: Audit Document Ingestion

*(First session only.)*

Read the entire audit document before forming any plan.

### What to Extract

**Scope:** system covered, phases audited, what is explicitly out of scope.

**Finding inventory:** ID, severity, file/location, description, proposed fix (if given).
Note findings already FIXED / DEFERRED / WONT-FIX — no action needed for these.

**Implementation signals:** are fixes proposed or is fix design our responsibility?
Finding dependencies (fix A before B)? Specialist-review flags?

**Codebase context:** domain(s), primary user-facing output, 3–5 critical code paths.

### Ingestion Deliverable

```
AUDIT INGESTION SUMMARY
=======================
Audit document: [path]
Audit date: [if stated]
Codebase: [name / brief description]
Domain(s): [identified domain(s)]

Finding counts:
  CRITICAL:  {n}
  HIGH:      {n}
  MEDIUM:    {n}
  LOW:       {n}
  Pre-resolved / deferred / wont-fix: {n}
  Actionable: {n}

Critical code paths: [list]
Finding dependencies: [list or "None identified"]
Findings needing fix design: [list or "All include proposed fixes"]
Questions before planning: [list or "None"]
```

Wait for confirmation before proceeding to Stage 1.

---

## Stage 1: Fix Planning

Create the **Master Finding Status Table** and save it in `IMPLEMENTATION_LOG.md`:

```markdown
## Master Finding Status Table
*Last updated: [YYYY-MM-DD] Session {N}*

| ID | Severity | Title | Status | Session | Notes |
|----|----------|-------|--------|---------|-------|
| FINDING-01 | CRITICAL | [title] | OPEN | — | [dependency notes] |
| FINDING-02 | HIGH | [title] | OPEN | — | |
...
```

**Sequencing rules:**
1. CRITICAL findings first — always
2. Within severity: dependencies define order (fix A before B if B depends on A)
3. Independent findings of the same severity: highest effort first (clear the hard ones)
4. LOW findings last — batch them

Present the ordered fix plan. Confirm with user before executing.

---

## Stage 2: Fix Execution

### Per-finding protocol

For every finding, in strict order:

1. **Announce** — "Implementing FINDING-{N}: {title}."
2. **Read** — Re-read the finding description, evidence, and proposed fix in the audit document.
   Do not rely on your memory or the IMPLEMENTATION_LOG summary — re-read the source.
3. **Design** — If the audit proposes a specific fix, use it. If not, design the fix and
   present it for user confirmation before implementing.
4. **Implement** — Apply the fix. Stay within scope of the finding.
5. **Verify** — Re-run the failing test, reproduce the original condition, or apply
   the verification method specified in the finding.
6. **Iterate** — If verification fails: diagnose, revise the fix, re-verify. Maximum 3 attempts.
   If still failing after 3 attempts: mark BLOCKED, document the failure, move on.
7. **Log** — Append to `IMPLEMENTATION_LOG.md` (format below).
8. **Update table** — Update the Master Finding Status Table.

### BLOCKED task protocol

If a finding cannot be resolved after 3 attempts:

1. Mark status BLOCKED in the Master Finding Status Table
2. Record in IMPLEMENTATION_LOG: what was tried (all 3 attempts), root cause hypothesis,
   what information or resource would unblock it
3. Move to the next finding — do not stall the session on one blocked item
4. Before session close, present all BLOCKED findings to the user with diagnoses

### Log entry format

```markdown
### FINDING-{N} — [YYYY-MM-DD]
**Status:** FIXED ✅ / BLOCKED ⛔ / PARTIAL ⚠️ / DEFERRED 🔁
**Fix applied:** [specific change: file(s), function(s), what changed]
**Verification:** [how verified — test run, manual check, etc.]
**Verification result:** PASS ✅ / FAIL ❌ / PARTIAL ⚠️
**Attempts:** {n}
**Observations:** [anything discovered during implementation that the next agent should know]
**Files changed:** [list]
```

---

## Stage 3: Knowledge Compounding

After each batch of findings (or at natural session breaks), synthesise learning.

### Batch synthesis block

*Append to `LESSONS_LEARNED.md` after each batch:*

```markdown
## Batch Synthesis — Session {N} — [YYYY-MM-DD]
Findings in batch: [IDs]

### Patterns observed
[What common root causes appeared across this batch?]

### Principles extracted
[Each principle: short statement + rationale. One principle per line.]
- **[Principle name]:** [What to do / not do, and why]

### Codebase-specific observations
[Any fragile areas, surprising constraints, or conventions discovered]
```

**Before writing any new principle:** check existing principles in `LESSONS_LEARNED.md`.
Do not duplicate. If a new observation reinforces an existing principle, strengthen
the existing entry rather than adding a new one.

### Parts 1–3 vs Part 4 distinction

`LESSONS_LEARNED.md` has two kinds of content:

**Parts 1, 2, 3, 5** — codebase-specific: file paths, function names, project structure,
domain-specific failure modes. Useful for future work on *this codebase*.

**Part 4** — generalizable principles only. No file paths. No project-specific references.
This is the portable section. This is what enters a broader knowledge library.

---

## Stage 3.5: Agent Context File Additions

After each batch, identify operational rules that belong in the project's agent context file.

**What qualifies — a rule belongs in the agent context file if it is:**
- **Universal** — applies to any agent working in this codebase at any time
- **Operational** — derived from a real failure mode encountered during this fix session
- **Actionable** — short enough to follow without interpretation

**What does NOT qualify:**
- Rules specific to the audit findings themselves
- Rules already present in the agent context file
- Code style preferences better enforced by a linter

**Format each suggestion:**

```markdown
## Operational Rules — audit-fix-implementer session [YYYY-MM-DD]
*Append to the Operational Rules section of [agent context file path]*

### [Category — e.g., "Data layer", "Error handling"]
- [Rule as direct instruction: "Always X before Y because Z"]

### Watch-points (fragile areas discovered this session)
- `[file or module]`: [why fragile / what constraint to be aware of]
```

**Delivery rules:**
- Only if the agent context file already exists — never create one from scratch here
- Always present suggestions for user review before appending — never write unilaterally
- Check prior session suggestions to avoid duplicates
- After the close session, if `agents-md-optimizer` is available, recommend running it
  to integrate accumulated operational rules cleanly and check for conflicts
- If no agent context file exists and you're in the close session: note in LESSONS_LEARNED.md
  that these rules were not persisted, and recommend the user create an AGENTS.md

---

## Stage 4: Session Close & Sign-Off

### Session Close Summary

Append to `IMPLEMENTATION_LOG.md`:

```markdown
## SESSION {N} CLOSE — [YYYY-MM-DD]
**Findings resolved this session:** {n} — [IDs]
**Findings blocked:** {n} — [IDs + summary]
**Findings deferred:** {n} — [IDs + reason]
**Overall progress:** {resolved} / {total actionable} ({n}% complete)

**Key observations this session:**
[Most important things discovered — patterns, constraints, surprises]

**Next session priority:**
[Ordered list of remaining findings to tackle next]
```

### Handover context block

If work is incomplete and continuing, produce this for the session-handover skill:

```
HANDOVER CONTEXT — audit-fix-implementer
=========================================
Skill: audit-fix-implementer v1.5.0
Audit document: [full path]
Implementation log: [full path]
Lessons learned: [full path]

Current state:
  Sessions completed: {n}
  Findings: FIXED {n} / BLOCKED {n} / PARTIAL {n} / DEFERRED {n} / OPEN {n}

Blocked findings (priority attention next session):
  FINDING-{N}: [why blocked, what to try next]

First action next session:
  Run 'audit-fix-implementer continue'. Read IMPLEMENTATION_LOG.md and
  LESSONS_LEARNED.md in full before touching anything. Confirm state with user.
  Then proceed with: [next finding ID and title].
```

Pass this block to the session-handover skill when writing the handover document.

---

## Principles

**A1 — Never rewrite prior session blocks.** Append only. The history of what was tried
and why it failed is as valuable as the successful fixes.

**A2 — Re-read the audit document before each finding.** Do not rely on summaries.
The audit document is the authoritative source.

**A3 — Prior sessions' failures must be read before retrying the same path.** The most
expensive bug is the one you've already fixed before.

**A4 — The knowledge artifacts are the primary durable output.** Code fixes are ephemeral —
they can be re-applied. Lessons accumulated over multiple sessions cannot be reconstructed
if the LESSONS_LEARNED.md is lost or corrupted.

**A5 — Close is explicit-only.** "All findings resolved" and "project is closing" are
different things. Never produce the final LESSONS_LEARNED.md without explicit user instruction.

---

## Reference Files

| File | Load When |
|------|-----------|
| `references/lessons-learned-template.md` | Running `audit-fix-implementer close` |
| `references/implementation-log-template.md` | Session 1 only — copy document header |
| `references/knowledge-schemas.md` | Writing principles, standalone wiki entries, blocked finding records |
