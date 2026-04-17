---
name: session-handover
version: 1.2.1
description: "Generates a comprehensive, structured handover document in Markdown format at the end of a development session, capturing all context, progress, decisions, nuances, and continuity details required for the next agent or session to pick up without any knowledge loss."
type: Type 1 — Instruction skill (Markdown only)
compatibility: "claude.ai, Claude Desktop, Cowork, Claude Code — any surface with file output capability"
license: Proprietary
---

# Session Handover Skill

## Why this skill exists

Development sessions get interrupted — tokens run out, context fills up, a specialist agent
takes over, or the user simply pauses work. Each interruption risks losing hard-won knowledge:
why a specific approach was chosen, what failed and why, what the exact state of every file is,
what subtle constraints exist, and what the next move is.

A poor handover = the next agent starts from scratch, repeats mistakes, breaks working code,
misses constraints, and asks the user questions they've already answered.

A great handover = the next agent reads one document and picks up exactly where you left off,
with full confidence.

This skill produces great handovers.

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
| Output | Default path |
|--------|-------------|
| Handover document | `_dev/docs/handovers/HANDOVER-[PROJECT]-[SESSION].md` |

---

## When to invoke this skill

Invoke this skill when any of the following are true:

- You are approaching context or token limits
- The user says "let's continue in a new session" or "write a handover"
- A phase of work is complete and a new phase will begin (possibly with a different agent)
- The user is pausing work and wants a checkpoint document
- The user explicitly asks for a handover, handoff, or continuity document

**No standing agent context injection needed.** This skill is invoked on-demand at session
end — it does not require any standing instruction in your AGENTS.md or CLAUDE.md. Simply
invoke it when needed using the triggers above.

**Note on self-handovers:** This skill is equally useful when *you* will resume work in a
future session (not just handing off to a different agent). In that case, Part 8 (User Context
& Preferences) is less critical but still worth filling in — you may return with a different
context window and the same blind spots as any incoming agent.

---

## How to produce the handover

### Step 1 — Reconstruct the full session from memory

Before writing a single line, mentally replay the entire session from the first message:

- What was the user trying to accomplish overall?
- What did you build, fix, or change, in what order?
- What failed and had to be revised?
- What decisions were made, and why?
- What was explicitly ruled out, and why?
- What is the exact current state of every file?
- What is left to do?
- What does the next agent need to know to not break anything?

Do not start writing until you can answer all of these.

### Step 2 — Write the handover document

Follow the template below exactly. Do not skip sections. If a section does not apply,
write "N/A — [brief reason]" rather than omitting it.

### Step 3 — Validate before delivering

Run through the **Handover Quality Checklist** at the end of this skill.
Fix anything that fails before delivering the document.

### Step 4 — Resolve output path and deliver

Resolve the output path using the Path Resolution section above. Confirm with the user.
Write the completed handover to the confirmed path and confirm it's ready.

---

## Handover Document Template

Use the following template verbatim as your structural scaffold. Replace all `[BRACKETED]`
items with real content. Omit nothing.

---

```markdown
# [PROJECT NAME] — Session Handover Document

**Session ID / Revision:** [e.g. R71, Session 3, Phase 2]
**Date:** [YYYY-MM-DD]
**Outgoing agent:** Claude [model if known]
**Status:** [One-line summary: e.g. "Phase 2 complete. Ready for Phase 3." or "Blocked on X."]

---

## QUICK START FOR NEXT AGENT

> Read this section first. It tells you exactly how to begin without reading the whole document.

1. **Working file(s):** [Full path(s) to the file(s) to continue working on]
2. **First action:** [The single most important thing to do first]
3. **Do NOT touch:** [Anything that must not be modified]
4. **Key constraint to remember:** [The most important non-obvious constraint]
5. **Codebase orientation scan needed?** [Yes / No — and why.]

**Startup validation command (run this first):**
```bash
# [Paste the exact command(s) to verify the environment is healthy]
```

---

## PART 1: PROJECT OVERVIEW

### What this project is
[2–4 sentences. What is the product/tool/system being built? Who uses it? What does it do?]

### Tech stack
[Languages, frameworks, libraries, constraints. Include what is explicitly NOT used.]

### File structure
```
[Paste the actual directory/file structure relevant to this project]
```

### Working files & snapshots

| File | Purpose | Notes |
|------|---------|-------|
| [path] | [what it is] | [e.g. CURRENT WORKING — use this] |
| [path] | [what it is] | [e.g. Stable snapshot before last change] |

---

## PART 2: FULL SESSION NARRATIVE

### What was the goal coming into this session
[What did the user want to accomplish? What was the plan at the start?]

### What was done (in order)

#### Action 1: [Short title]
- **Goal:** [What this action was meant to achieve]
- **What was done:** [Specifics]
- **Outcome:** ✅ Complete / ⚠️ Partial / ❌ Failed
- **Files changed:** [List files and what changed]

[Repeat for every discrete action]

### What was attempted but did not work

| Attempt | Why it failed | What was tried instead |
|---------|--------------|----------------------|
| [description] | [root cause] | [resolution or current status] |

### Key decisions made (with rationale)

| Decision | Rationale | Alternatives considered |
|----------|-----------|------------------------|
| [What was decided] | [Why] | [What else was on the table] |

### What was explicitly ruled out
[List any features, approaches, or changes deliberately rejected.]

---

## PART 3: CURRENT STATE

### Overall status
[✅ Complete / 🟡 In Progress / 🔴 Blocked]

### Feature / task status

| Feature / Task | Status | Notes |
|---------------|--------|-------|
| [name] | ✅ Complete | [any nuance] |
| [name] | 🟡 In Progress | [what's done, what's left] |
| [name] | 🔴 Blocked | [blocker description] |
| [name] | ⏳ Not started | [priority / dependencies] |

### Known bugs / issues

| Issue | Severity | Location | Hypothesis | Status |
|-------|----------|----------|------------|--------|
| [description] | 🔴 Critical / 🟡 Minor | [file + line if known] | [suspected cause] | [open/workaround/deferred] |

### What is broken right now
[Be explicit. If nothing is broken, say "Nothing broken. All implemented features working."]

---

## PART 4: ARCHITECTURE & TECHNICAL REFERENCE

### Data model / state
[Describe key data structures, state variables, schema.]

### Key functions / components

| Function/Component | Location (line ~) | What it does | Important notes |
|-------------------|------------------|--------------|----------------|
| [name] | L[line] | [purpose] | [gotchas, constraints] |

### Key line numbers
> Always grep to verify before editing — line numbers drift as code changes.
```
L[N]  [what lives here]
```

### Data flow
[How data moves through the system.]

### Critical constraints (do not violate these)
[The absolute rules that must not be broken.]

---

## PART 5: LESSONS LEARNED & PITFALLS

### Patterns that work well

| Pattern | Context | Why it works |
|---------|---------|-------------|
| [description] | [when to use] | [reason] |

### Patterns to avoid

| Anti-pattern | Context | What to do instead |
|-------------|---------|-------------------|
| [description] | [when it bites you] | [correct approach] |

### Bugs caused by X (recurring failure modes)

#### [Failure mode name]
- **Symptom:** [What you see when this goes wrong]
- **Root cause:** [Why it happens]
- **Prevention:** [How to avoid it]
- **Fix:** [How to recover]

---

## PART 6: REMAINING WORK

### Immediate next action
[Be specific. Not "continue development" — say exactly what to do and where.]

### Remaining tasks (prioritised)

| Priority | Task | Description | Dependencies | Effort |
|----------|------|-------------|-------------|--------|
| 🔴 P1 | [name] | [what and why] | [blockers] | [S/M/L] |
| 🟡 P2 | [name] | [what and why] | [blockers] | [S/M/L] |

### Deferred / out of scope

| Item | Reason deferred | Revisit condition |
|------|----------------|------------------|
| [name] | [why not now] | [what would trigger picking it up] |

### Open questions / decisions needed

| Question | Context | Options considered | Who decides |
|----------|---------|-------------------|-------------|
| [question] | [why it matters] | [options] | [user / next agent / tbd] |

---

## PART 7: TESTING & VALIDATION

### How to verify things are working
```bash
# [Paste exact validation commands]
```

### Test cases to run after next changes

| Test | Steps | Expected result |
|------|-------|----------------|
| [name] | [how to test] | [what success looks like] |

---

## PART 8: USER CONTEXT & PREFERENCES

### User profile
- **Location:** [City, Country]
- **Role / domain:** [e.g. developer, product manager]
- **Technical level:** [e.g. senior engineer / non-technical]

### Communication preferences
- [e.g. Prefers concise answers. Does not want preamble.]

### UX / product preferences
- [e.g. Minimal clutter — prefers collapsible sections]

### Things the user has explicitly said they don't want
- [e.g. "Don't use Tailwind"]

---

## PART 9: REFERENCE MATERIAL

### Key code snippets (canonical patterns for this project)
```[language]
// [Pattern name — when to use]
[code]
```

### External references

| Resource | URL / Path | Why it matters |
|----------|-----------|---------------|
| [name] | [location] | [what it's for] |

### Glossary

| Term | Definition |
|------|-----------|
| [term] | [what it means in this project's context] |

---

## PART 10: HANDOVER SIGN-OFF

### Outgoing agent confidence assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Current state is accurate | [High/Medium/Low] | [any caveats] |
| Next actions are clear | [High/Medium/Low] | [any ambiguity] |
| Architecture notes are complete | [High/Medium/Low] | [anything missing] |
| No hidden landmines | [High/Medium/Low] | [any unknown unknowns] |

### What I would do first if I were continuing
[Short paragraph in first person. Exactly what you would do if continuing this work.]

### Anything the user should be aware of before the next session starts
[Any heads-up for the user.]

---

*Handover generated by session-handover skill v1.2.0*
*Next agent: read Part 1 Quick Start first, then Part 3 Current State, then Part 6 Remaining Work.*
```

---

## Handover Quality Checklist

Before delivering the handover document, verify every item. Fix anything that fails.

### Completeness
- [ ] Every section is filled in (no `[BRACKETED]` placeholders remain)
- [ ] Every action taken in the session is documented in Part 2
- [ ] Every file that was created or modified is listed with its path
- [ ] Every decision made has its rationale recorded
- [ ] Everything that was ruled out is documented

### Accuracy
- [ ] File paths are exact and complete
- [ ] Line numbers are noted as approximate with "grep to verify" instruction
- [ ] Code snippets in the document are syntactically correct
- [ ] Current status accurately reflects actual state (not aspirational)

### Continuity
- [ ] Quick Start gives the next agent exactly what to do in the first 60 seconds
- [ ] Startup validation command is runnable as-is
- [ ] The "do not touch" list is explicit about anything fragile
- [ ] All recurring failure modes are documented with prevention steps

### Context preservation
- [ ] Non-obvious constraints are all listed in Part 4 (Critical Constraints)
- [ ] User preferences are all captured in Part 8
- [ ] Explicit user requests that were rejected are documented in "ruled out" section
- [ ] Any fragile or poorly-understood parts of the codebase are flagged

### Clarity
- [ ] Part 1 Quick Start can be read in under 2 minutes
- [ ] Priorities in Part 6 are clear
- [ ] No "you'll figure it out" references without explicit cross-links

---

## Notes for the outgoing agent

**On thoroughness:** Write for someone who knows nothing about this project. The incoming
agent has none of your context. What feels "obvious" to you is invisible to them.

**On code state:** Do not assume the next agent can reconstruct state from the code.
Describe the state explicitly, including what is broken right now.

**On decisions:** Every decision needs its rationale. Without it, the next agent
will re-litigate it with the user or silently reverse it.

---

## Receiving agent startup protocol

When you receive a handover document:

1. **Read Part 1 (Quick Start)** — understand where you are in 2 minutes
2. **Run the startup validation command** — confirm the environment is healthy
3. **Read Part 3 (Current State)** — know exactly what works and what doesn't
4. **Read Part 5 (Lessons Learned)** — load the failure modes so you don't repeat them
5. **Read Part 6 (Remaining Work)** — identify your first action
6. **Run a codebase orientation scan if indicated** — see Quick Start field 5
7. **Read Part 4 (Architecture)** as needed while working
8. **Confirm with user** before starting if anything is unclear

Do **not** start making changes until you've completed steps 1–5.
Do **not** ask the user to repeat information that is in the handover document.

### When to scan the codebase (and how)

Scan if any of the following are true:
- The handover's Quick Start field 5 says "Yes — scan recommended"
- The codebase has more than ~10 files or ~1,000 lines
- The handover flags itself as potentially stale
- You are taking over a codebase you have never seen

**How to scan (orientation only — not a full audit):**

```
1. List the file/directory structure → confirm matches handover description
2. Check line counts on key working files: wc -l [working file path]
3. Grep for 2–3 key landmarks the handover references by line number
4. Run the startup validation command from Part 1
```

Stop when you can answer: "I know where everything is and the file matches the handover."
That is the full goal. Do not go further.
