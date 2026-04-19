# Implementation Log Template

Copy this file to `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md` at the start of **Session 1**.
In continuation sessions, do not copy this template — append a new session block
to the existing file instead (see Session Block Template below).

This document is **append-only**. Never edit or delete prior session blocks.
The full history across all sessions is what makes this document valuable.

---

## DOCUMENT HEADER (Session 1 only — fill once, never overwrite)

```markdown
# Implementation Log — [PROJECT NAME]

**Source audit:** [audit document path or title]
**Codebase:** [name / brief description]
**Domain(s):** [e.g., financial / e-commerce / data engineering]
**Created:** [YYYY-MM-DD] by Session 1
**Last updated:** [YYYY-MM-DD] by Session {N}  ← update each session

---

## Master Finding Status Table
*The single source of truth for finding status across all sessions.*
*Update Status, Session resolved, and Notes columns as work progresses.*

| ID | Title | Severity | Batch | Status | Session resolved | Notes |
|----|-------|----------|-------|--------|-----------------|-------|
| FINDING-01 | [title] | CRITICAL | A | OPEN | — | |
| FINDING-02 | [title] | HIGH | B | OPEN | — | |
| FINDING-03 | [title] | HIGH | B | OPEN | — | |
<!-- Add one row per finding from the audit. -->
<!-- Status: OPEN / IN_PROGRESS / FIXED ✅ / BLOCKED ⛔ / PARTIAL ⚠️ / DEFERRED 🔁 / WONT_FIX -->

---
```

---

## SESSION BLOCK TEMPLATE (copy and append for each new session)

```markdown
---
## SESSION {N} — [YYYY-MM-DD] — [Agent identifier or "unspecified"]

**Picking up from:** Session {N-1} / Fresh start (Session 1)
**Open findings at session start:** [list IDs from Master Status Table]
**Session goal:** [what this session aims to complete — e.g., "Resolve all CRITICAL and HIGH findings"]
**Session end status:** [fill at close — e.g., "FINDING-01–04 FIXED, FINDING-05 BLOCKED"]

---
```

### Finding Entries (within this session block)

```markdown
### FINDING-{N}: {title}
**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Status:** FIXED ✅ | BLOCKED ⛔ | DEFERRED 🔁 | PARTIAL ⚠️
**Prior session attempts:** Yes — [summary from prior log blocks] / No — first attempt

#### What was changed
```
File: [exact path]
Lines: [range or "new file"]
Change: [what was removed / what was added]
```

#### Code delta (for small, high-stakes changes — omit for large refactors)
```[language]
// BEFORE
[old code]

// AFTER
[new code]
```

#### Verification
**Method:** [what was run or manually checked]
**Result:** PASS ✅ / FAIL ❌

#### Attempts this session (only if more than one)
| # | Approach | Outcome | Root cause of failure |
|---|----------|---------|----------------------|
| 1 | [what tried] | FAIL | [why] |
| 2 | [what tried] | PASS | — |

#### Drift from audit or prior sessions
[Did the code differ from the audit's description, or from the state a prior session
 left it in? Note any unexpected starting state. Write "No drift" if none.]

#### Observations
[Anything future agents should know. Hidden coupling, constraints, code smells,
 non-obvious behaviour. Be specific. This feeds LESSONS_LEARNED.md.
 Write "No notable observations" only if genuinely nothing to record.]
```

---

### Blocked Findings (within this session block)

```markdown
### BLOCKED: FINDING-{N} — {title}

**Why blocked this session:**
[Root cause — what architectural constraint, missing information, or dependency
 prevented resolution. Not "couldn't figure it out" — diagnose to the cause.]

**All attempts across all sessions:**
| Session | Approach | Outcome | Root cause |
|---------|----------|---------|-----------|
| Session 1 | [what tried] | FAIL | [why] |
| Session 2 | [what tried] | FAIL | [why] |

**What this block reveals about the codebase:**
[Often the most valuable knowledge. What hidden coupling or design constraint
 does this block expose?]

**Minimum viable unblocking action:**
[The most targeted change that would make this fixable next session.]

**Residual risk if left unresolved:**
[Severity and likelihood — honest assessment.]
```

---

### New Findings (within this session block)

```markdown
### NEW-{N}: {short title}
**Discovered while:** fixing FINDING-{N}
**File:** [path:line]
**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Description:** [What was found — factual.]
**Action:**
- [ ] Fixed in this session (note: outside original audit scope)
- [ ] Added to Master Finding Status Table for future session
- [ ] Documented only — no code change needed
```

---

### Session Close Summary (within this session block — fill at session end)

```markdown
### Session {N} Close Summary

**Completed this session:**
  FIXED: [list IDs]
  BLOCKED: [list IDs]
  PARTIAL: [list IDs]
  DEFERRED: [list IDs]

**Cumulative status:**
  FIXED: {n} / {total actionable}
  Remaining open: [list IDs]

**Key discovery this session:**
[The single most important thing learned — constraint, pattern, or principle.]

**Critical context for next session:**
  1. [Most important constraint the next agent must read before touching code]
  2. [Approach that failed — do not retry without new information]
  3. [Pending user decision, if any]

**Master Finding Status Table: updated ✅ / needs update ⚠️**
```

---

## Document Footer (append at true project close)

```markdown
---
## PROJECT CLOSE — [YYYY-MM-DD]

**Total sessions:** {n}
**Total findings:** {n}
  FIXED: {n}
  BLOCKED/DEFERRED: {n}
  WONT_FIX: {n}

Final LESSONS_LEARNED.md written: [path]
Project status: CLOSED / CONDITIONALLY CLOSED / OPEN ITEMS REMAIN
```
