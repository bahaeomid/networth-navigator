# Lessons Learned Template

## Two modes of use

**Intermediate session close** (work continues in future sessions):
→ Do NOT use this full template. Append a Session Close Summary block instead
  (format provided in SKILL.md Stage 3.4 and the implementation log template).
→ Keep the document as accumulated batch synthesis blocks — structured but not yet final.

**Final project close** (all findings resolved or project is closing):
→ Use this full template to consolidate all accumulated batch syntheses into the
  final structured document.
→ Replace the accumulated batch blocks with the consolidated final version.
→ This is the document that gets ingested into a cross-codebase knowledge library.

---

## Document Header (create at Session 1, update each session)

```markdown
# Lessons Learned — [PROJECT NAME]

**Source audit:** [audit document path or title]
**Codebase domain(s):** [e.g., financial / e-commerce / data engineering / identity]
**Sessions:** {n total}  |  **Agents:** {n distinct agents if known}
**First session:** [YYYY-MM-DD]  |  **Last updated:** [YYYY-MM-DD]
**Findings addressed:** {n} total — {n} FIXED, {n} BLOCKED/DEFERRED
**Principles documented:** {n}  ← update each time a principle is added

---
> **For incoming agents:** Read the Quick Reference first, then Session Close
> Summaries (most recent first), then Part 4 for principles. Parts 1–3 and 5–7
> are reference — consult as needed.
```

---

## QUICK REFERENCE

```markdown
## Quick Reference

> Read this first. The sections below provide full context.

### Rules for this codebase (as of [date])

- [Rule 1 — direct instruction, codebase-specific]
- [Rule 2]
- [Rule 3]
*Update this list each session when new rules emerge.*

### Do not touch without reading this document first

- `[file or component]`: [why fragile / what the constraint is]
- `[another area]`: [note]

### Patterns to watch for

- [Pattern or code smell that caused issues — name file/module if useful]
- [Another pattern]

### What broke and why (top issues)

| What broke | Root cause | How to avoid |
|-----------|-----------|-------------|
| [description] | [root cause] | [prevention] |
*Add rows each session. Do not remove prior entries.*
```

---

## Accumulated Session Synthesis Blocks

During active development, the document body consists of batch synthesis blocks
appended each session. At project close, these are consolidated into Parts 1–7 below.

**While active:** append blocks here using the format in SKILL.md Stage 3.3.

**At project close:** replace this section with the consolidated final document
(Parts 1–7). Archive the raw blocks if desired.

---

## FINAL CONSOLIDATED DOCUMENT (produce at project close)

```markdown
---

## PART 1: PROJECT SCOPE

### What was addressed

[What findings were implemented across all sessions. Reference the audit document.
 Summary of finding counts by severity, what was fixed vs deferred.]

### What was not fixed

| Finding ID | Title | Status | Reason | Risk if unresolved |
|------------|-------|--------|--------|--------------------|
| FINDING-{N} | [title] | BLOCKED | [reason] | [risk] |
| FINDING-{N} | [title] | DEFERRED | [reason] | [risk] |

### Overall codebase health after all sessions

[1–2 sentences. Honest assessment. What class of risk remains, if any.]

---

## PART 2: CHALLENGES AND HOW THEY WERE RESOLVED

For each significant challenge across all sessions:

### Challenge [N]: [Short title]
*(Encountered in Session {N})*

**What happened:** [Factual description]
**Root cause:** [Underlying reason, not the surface symptom]
**Attempts across sessions:**
| Session | Approach | Outcome |
|---------|----------|---------|
| 1 | [tried] | FAIL — [why] |
| 2 | [tried] | PASS |
**Resolution:** [What finally worked]
**Effort impact:** Trivial / Minor / Significant

---

## PART 3: TECHNICAL DISCOVERIES

Issues found during implementation not present in the original audit:

### Discovery [N]: [Short title]
*(Session {N})*
**File:** [path:line]
**Severity:** CRITICAL / HIGH / MEDIUM / LOW / INFO
**Description:** [What was discovered]
**Action:** Fixed in-session / Added to backlog / Documented only

---

## PART 4: GENERALIZABLE PRINCIPLES

> ⚠️ **PORTABILITY RULE — READ BEFORE WRITING:**
>
> This section contains ONLY principles that apply beyond this codebase.
> File paths, function names, and project-specific architectural notes belong
> in Parts 1–3 and Part 5.
>
> A principle that requires knowing this codebase to be understood is not
> generalizable. Extract the underlying rule; cite the specific evidence.
> This section is what gets ingested into a cross-codebase knowledge library.
> Mixed entries degrade the library. Enforce the separation at source.

---

### Principle [N]: [Descriptive name — searchable]
*(First documented: Session {N}. Last updated: Session {N}.)*

**Statement:**
> When [condition], always [action], because [reason].

**Applies when:**
[Specific type of codebase, domain, pattern, or tech that makes this relevant.
 "Any codebase" is almost never accurate — get specific.]

**Evidence from this project:**
[Finding IDs or challenge titles. Brief. The principle stands alone — evidence
 is citation, not the body.]

**Counter-example to avoid:**
[What happens when this principle is violated. Concrete. Code sketch if needed.]

**Confidence:** High / Medium / Low
> High = multiple findings, or well-established principle clearly demonstrated
> Medium = single strong example
> Low = hypothesis; one observation, needs more evidence

**Revision history:**
| Session | Change |
|---------|--------|
| Session 1 | First documented |
| Session 2 | Confidence upgraded from Medium to High — second supporting finding |

**Related:** [Principle N, if applicable]

---

[3–8 principles per project is typical. Quality over quantity.]

---

## PART 5: CODEBASE-SPECIFIC PATTERNS

Patterns specific to this codebase. Future agents on this project should know these.
These are NOT ingested into a cross-codebase library.

### Pattern: [Name]

**Observed in:** [Files or subsystems]
**Type:** Architectural / Code style / Error handling / Data flow / Other
**Description:** [Neutral, factual description]
**Implication for future work:** [What to do differently because of this pattern]
**Code example:**
```[language]
// [Brief illustrative snippet — 5–10 lines maximum]
```
**Related findings:** [FINDING-N if this pattern contributed to a finding]

---

## PART 6: VERIFICATION METHODS THAT WORKED

Methods proven reliable in this codebase. Reusable by the next agent.

| Verification type | Method | When to use |
|------------------|--------|-------------|
| [type] | [method] | [context] |

---

## PART 7: WHAT THE NEXT AGENT SHOULD DO FIRST

1. [Most important orientation step]
2. [Second step]
3. [Run this command to verify environment health]
4. [Fragile area — approach carefully]

### Do NOT touch without reading this document first:
- `[file or component]`: [why / constraint]

---

## PART 8: CONTINUATION NOTE (if project is not fully closed)

**Remaining findings:** [list IDs and titles]
**Why not completed:** [reason]
**First action for next session:** [specific instruction]
**Critical context:** [what the next agent must not lose]

---

*Generated by audit-fix-implementer v1.2.0*
*Project: [name] | Sessions: {n} | Findings addressed: {n} | Principles: {n}*
```
