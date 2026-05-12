# Complexity Guide

Use this reference in Phase 5 of the interview (Complexity Assessment) to determine
the right plan structure for the project.

---

## Decision Framework

### Step 1 — Estimate scale

Ask the user: "Roughly how large is this project — days, weeks, or months of work?"
Then cross-reference with signals from the interview and source materials.

| Signal | Scale indicator |
|--------|----------------|
| Single developer, < 1 week | Small |
| 1–3 developers, 1–4 weeks | Medium |
| Team, multi-month | Large |
| Adding a feature to existing codebase | Feature |
| Greenfield product, full scope | Large or Medium |
| Internal tool / script / CLI | Small or Medium |

### Step 2 — Apply output structure

| Scale | Plan output | Agent context file |
|-------|------------|-------------------|
| **Small** | Single `PLAN.md` in project root | Single `CLAUDE.md` or `AGENTS.md` |
| **Medium** | Single `PLAN.md` with all sections | Single `CLAUDE.md` or `AGENTS.md` |
| **Large** | `PLAN.md` (overview) + `references/` split files | `CLAUDE.md` / `AGENTS.md` + optional sub-docs |
| **Feature** | `docs/plans/PLAN-[feature]-[YYYY-MM-DD].md` | Append to existing agent context file |

---

## Large Project Split

When a project is Large, split `PLAN.md` into:

```
docs/
└── plans/
    ├── PLAN.md                    ← overview: sections 1, 2, 6, 7, 9, 10
    └── references/
        ├── architecture.md        ← sections 4.2–4.5 (architecture detail)
        ├── requirements.md        ← section 8 expanded (full NFR and scope)
        └── open-questions.md      ← section 7 expanded (full decision log)
```

`PLAN.md` references these files explicitly:
```markdown
> Architecture detail: see [references/architecture.md](references/architecture.md)
> Full requirements: see [references/requirements.md](references/requirements.md)
> Open questions log: see [references/open-questions.md](references/open-questions.md)
```

---

## Feature Plan

When planning a new feature in an existing codebase:

1. Read the existing `PLAN.md` (if present) for project context
2. Read the existing `CLAUDE.md` / `AGENTS.md` for conventions and stack
3. Run a lightweight codebase orientation scan (see Stage 0 in SKILL.md)
4. Generate `docs/plans/PLAN-[feature-name]-[YYYY-MM-DD].md` with:
   - How this feature fits into the existing architecture
   - What files it touches
   - Any new dependencies or patterns it introduces
   - Impact on existing decisions
5. Append to the existing agent context file — do not regenerate it from scratch

---

## Signals that a Small plan is becoming Medium or Large

Escalate the plan structure if any of these appear during interview:

- More than 5 distinct user-facing features
- More than one external API integration
- More than one database or data store
- Team of more than 2 developers
- Any compliance, security, or regulatory requirement
- Phased delivery is mentioned
- The user says "and also..." more than twice

---

## When to suggest scope reduction

Surface this if:

- The project as described would take > 3 months for the stated team size
- The user implied a tight deadline but the scope is large
- More than 5 open questions remain after the interview

Suggested framing:
> "Based on what you've described, this is a [scale] project. Before writing the
> full plan, it might be worth identifying a minimum viable version — the smallest
> scope that delivers the core value. Want to define that first, or proceed with
> the full scope?"

This is the user's decision, not yours. Surface it once, then follow their lead.
