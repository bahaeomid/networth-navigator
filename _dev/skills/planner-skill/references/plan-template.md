# Plan Template

Use this template when producing `PLAN.md` in Stage 2.
Fill every section. Where information is genuinely unknown, write
"TBD — [what needs to be decided, by whom, by when]" rather than omitting the section.

For large projects, split at the markers indicated below into separate reference files.

---

```markdown
# [PROJECT NAME] — Plan

**Version:** 1.0
**Date:** [YYYY-MM-DD]
**Status:** Draft / Review / Approved
**Produced by:** planner skill v1.0.0

---

## 1. Overview (read this first)

> Any reader — including an agent starting fresh — should understand this project
> in 60 seconds from this section alone.

### What this is
[2–4 sentences. What is being built, what it does, who it's for.]

### Why it exists
[The problem it solves. Be specific. Avoid marketing language.]

### What done looks like
[How you know the project is complete. Measurable, not vague.]

### Anti-goals (what this is NOT)
- [Explicit thing this project will not do]
- [Another explicit out-of-scope item]
- [At least 2–3. These prevent scope creep.]

---

## 2. Goals and Success Criteria

### Primary goal
[One sentence. The single most important outcome.]

### Secondary goals (priority order)
1. [Goal]
2. [Goal]
3. [Goal]

### Success criteria
| Criterion | Measurement | Target |
|-----------|------------|--------|
| [e.g., Performance] | [e.g., p95 response time] | [e.g., < 200ms] |
| [e.g., Reliability] | [e.g., uptime] | [e.g., 99.9%] |
| [e.g., Adoption] | [e.g., active users at 30 days] | [e.g., 100] |

---

## 3. Users and Context

### Primary users
[Who uses this. Technical level. Frequency of use.]

### Usage context
[Where and when they use it. Device, environment, connection quality if relevant.]

### Scale expectations
[Users, requests/day, data volume — rough order of magnitude is enough at plan stage.]

---

## 4. Technical Architecture

<!-- For large projects: move sections 4.2–4.5 to references/architecture.md -->

### 4.1 Stack
| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | | | |
| Framework | | | |
| Database | | | |
| Hosting | | | |
| [Other] | | | |

**Explicitly NOT using:** [e.g., "Tailwind — styling is CSS modules only"]

### 4.2 Architecture pattern
[monolith / microservices / serverless / API + SPA / library / CLI / data pipeline / other]

[2–4 sentences describing the high-level shape of the system. Why this pattern was chosen.]

### 4.3 Core data model
| Entity | Description | Key fields |
|--------|------------|-----------|
| [Entity name] | [what it represents] | [id, key attributes] |

[Relationships between entities — prose or simple diagram notation.]

### 4.4 Key interfaces
| Interface | Type | Description |
|-----------|------|-------------|
| [Name] | [REST API / GraphQL / CLI / UI / webhook / queue] | [what it does] |

### 4.5 Non-functional requirements
| Requirement | Priority | Target | Notes |
|------------|---------|--------|-------|
| Performance | | | |
| Security | | | |
| Availability | | | |
| Scalability | | | |
| Accessibility | | | |
| [Other] | | | |

---

## 5. Constraints and Dependencies

### Non-negotiable constraints
[Things that cannot change regardless of what the plan says — compliance, budget,
 deadline, existing system integration, technology mandate, etc.]

- [Constraint 1]
- [Constraint 2]

### External dependencies
| Dependency | Type | Risk | Mitigation |
|-----------|------|------|-----------|
| [Library / API / team / data source] | [external lib / third-party API / internal team] | Low/Med/High | [mitigation] |

### Assumptions
[Things assumed to be true that, if wrong, would significantly change the plan.]

- [Assumption 1] — Risk if wrong: [consequence]
- [Assumption 2] — Risk if wrong: [consequence]

---

## 6. Decisions Log

> This is the most durable section of the plan. Document every significant decision
> made during planning — what was decided, why, and what was rejected.
> Future agents must not re-litigate these without explicit instruction.

### Decision [N]: [Short title]
**Decision:** [What was decided]
**Rationale:** [Why this option was chosen]
**Alternatives considered:** [What else was on the table]
**Why alternatives were rejected:** [Specific reasons]
**Locked?** Yes — do not revisit / No — can be revisited if [condition]

---

## 7. Open Questions

> Every open question must have an owner. An unowned question will be answered
> by whoever writes the code first, without visibility.

<!-- For large projects: move to references/open-questions.md -->

| # | Question | Owner | Target date | Blocks |
|---|---------|-------|------------|--------|
| OQ-01 | [question] | [name or "owner needed"] | [date or "before dev starts"] | [what it blocks] |
| OQ-02 | | | | |

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Technical risk] | Low/Med/High | Low/Med/High | [what to do about it] |
| [Schedule risk] | | | |
| [Dependency risk] | | | |

---

## 9. Scope and Phasing

### In scope (this project / phase)
- [Feature or capability 1]
- [Feature or capability 2]

### Out of scope (explicitly deferred)
- [Capability 1 — reason for deferral]
- [Capability 2]

### Phasing (if applicable)
| Phase | Description | Success gate |
|-------|------------|-------------|
| Phase 1 | [what's included] | [what must be true to call phase done] |
| Phase 2 | | |

---

## 10. Change Log

| Version | Date | Author | Summary of changes |
|---------|------|--------|-------------------|
| 1.0 | [date] | [agent/person] | Initial plan |

---

*Generated by planner skill v1.0.0*
*Next step: when ready to implement, invoke the Executor skill to generate an
execution schedule from this plan.*
```
