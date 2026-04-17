# Knowledge Schemas

Structured formats for knowledge entries produced by the audit-fix-implementer.
These schemas ensure all knowledge artifacts are consistent, searchable, and
ready for ingestion into a cross-codebase knowledge library.

---

## 1. Generalizable Principle (inline in LESSONS_LEARNED.md Part 4)

The primary portable knowledge unit. Used in `LESSONS_LEARNED.md` Part 4.

Each principle has a revision history — in multi-session projects, principles
are refined over time rather than replaced. The history is part of the value.

```markdown
### Principle [N]: [Descriptive name — phrased to be searchable]
*(First documented: Session {N} [date]. Last updated: Session {N} [date].)*

**Statement:**
> When [condition], always [action], because [reason].

**Applies when:**
[What type of codebase, domain, architectural pattern, or tech stack makes this
 principle relevant. Be specific. "Any codebase" is almost never the right answer.]

**Evidence from this project:**
[Finding IDs or challenge titles. Brief. The principle should be understandable
 without the evidence — evidence is citation, not the body of the principle.]

**Counter-example to avoid:**
[Concrete description of what happens when this principle is violated.
 Code sketch if the concept benefits from illustration.]

**Confidence:** High / Medium / Low
> High = observed across multiple findings, or well-established principle with
>        clear evidence here
> Medium = single strong example; warrants adoption
> Low = hypothesis based on one observation; needs more evidence

**Revision history:**
| Session | Change |
|---------|--------|
| Session 1 [date] | First documented |
| Session 2 [date] | [what changed — e.g., confidence upgraded, scope narrowed] |

**Related:** [Principle N, if applicable]
```

---

## 2. Standalone Knowledge Entry (for future wiki ingestion)

When LESSONS_LEARNED.md principles are ingested into a knowledge library, each
principle in Part 4 becomes a standalone file. Format:

```markdown
---
type: principle | lesson | pattern | anti-pattern | discovery
tags: [domain-tag, tech-tag, pattern-tag]
confidence: high | medium | low
created: [YYYY-MM-DD]
last_updated: [YYYY-MM-DD]
source_codebase: [project name]
source_audit: [audit document name and date]
sessions_contributing: {n}
severity_trigger: CRITICAL | HIGH | MEDIUM | LOW | N/A
---

# [Title — same as principle name in LESSONS_LEARNED.md]

## One-line summary
[The core insight in a single sentence. Intelligible without any codebase context.
 This is what appears in search results in the wiki.]

## Full explanation
[2–5 paragraphs. What the problem was, why it happened, what the fix revealed,
 and why this generalizes. Write for a reader who has never seen the source codebase.]

## When this applies
[Specific conditions: type of codebase, domain, architecture, or tech stack.
 Concrete enough that a reader can assess "does this apply to me?"]

## What to do
[Concrete, actionable instruction. Imperative. Specific enough to follow without
 additional context.]

## What NOT to do
[The anti-pattern this principle warns against.]

## Evidence
Source: [project name], [audit name], [date(s)].
Findings: [IDs].
[Optional 5-line code sketch — only if the concept requires illustration.]

## Revision notes
[If this principle was refined across sessions, note what changed and why.]

## Related entries
[Titles or IDs of related entries in the knowledge library, if any.]
```

---

## 3. Blocked Finding Knowledge Entry

Diagnostic knowledge from blocked findings — valuable even when the fix wasn't possible.

```markdown
### BLOCKED: FINDING-{N} — {title}
*(Sessions attempted: {list})*

**Blocked because:**
[Root cause — the actual architectural constraint, missing information, or
 dependency that prevented resolution. Not "couldn't figure it out."]

**All attempts (across all sessions):**
| Session | Approach | Outcome | What was learned |
|---------|----------|---------|-----------------|
| Session 1 | [tried] | FAIL | [what the failure revealed] |
| Session 2 | [tried] | FAIL | [what the failure revealed] |

**What this block reveals about the codebase:**
[What hidden coupling or design constraint does this block expose?
 This is often the most valuable knowledge in the entire document.]

**Minimum viable unblocking action:**
[The most targeted change that would make this fixable.]

**Risk if left unresolved:**
| Scenario | Consequence | Likelihood |
|----------|-------------|-----------|
| [scenario] | [what breaks] | Low / Medium / High |

**Expertise needed:**
[Type of engineer or specialist best positioned to resolve this.]
```

---

## 4. Pattern Entry (codebase-specific — stays in this project's documents)

```markdown
### Pattern: [Name]
*(First observed: Session {N}. Still present as of Session {N}.)*

**Observed in:** [Files or subsystems]
**Type:** Architectural / Code style / Error handling / Data flow / Other

**Description:**
[What the pattern is — neutral and factual.]

**Why it matters for future work:**
[What an agent should know or do differently because of this pattern.]

**Code example:**
```[language]
// [5–10 lines maximum — only if genuinely clarifying]
```

**Related findings:** [FINDING-N]
**Still relevant?** Yes / Resolved in Session {N}
```

---

## Usage Guide

| Schema | Where it goes | Audience | Portability |
|--------|--------------|----------|-------------|
| Generalizable Principle | `LESSONS_LEARNED.md` Part 4 | Knowledge library + future agents | Cross-codebase |
| Standalone Knowledge Entry | Future wiki (one file per principle) | Cross-codebase library | Cross-codebase |
| Blocked Finding Entry | `LESSONS_LEARNED.md` Part 2 + log | This project's agents | This project |
| Pattern Entry | `LESSONS_LEARNED.md` Part 5 | This project's agents | This project |

---

## The Golden Rule

If a knowledge entry requires knowing this specific codebase to be useful, it is
codebase-specific. If it would help an agent on a completely different codebase
with similar characteristics, it is generalizable.

When in doubt: write the codebase-specific version first. You can always abstract
upward from specifics. You cannot reliably reconstruct specifics from an abstraction
written without them.

In multi-session projects: when adding a principle, always check the existing
principles list first. Refine and extend an existing principle before creating a
new one. Duplication is noise.
