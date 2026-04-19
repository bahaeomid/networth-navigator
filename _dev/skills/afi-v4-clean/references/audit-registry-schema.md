# Audit Registry Schema

The `AUDIT_REGISTRY.md` is a per-project index of all audit runs. It is created by
whichever lifecycle skill runs first: `planner`, `codebase-auditor`, or `audit-fix-implementer`.
Every subsequent audit run appends to it. It is the single source of truth for the audit
history of a project.

**Default location:** `_dev/docs/audits/AUDIT_REGISTRY.md`
Check agent context file `Audit registry:` key first, then the default above, then ask the user.

---

## File format

```markdown
# Audit Registry — [PROJECT NAME]
*Created: [YYYY-MM-DD] by [skill that created it]*
*Last updated: [YYYY-MM-DD]*

## Current Ground Truth

> The most recent active audit is: **[AUDIT-ID]** ([date])
> All earlier audits are superseded unless noted as covering a different scope.

---

## Audit Index

| ID | Date | Command / Source | Scope | Report path | Status | AFI session |
|----|------|-----------------|-------|-------------|--------|-------------|
| AUDIT-01 | YYYY-MM-DD | codebase-auditor full | Full codebase, pre-launch | _dev/docs/audits/AUDIT_REPORT_YYYY-MM-DD.md | SUPERSEDED by AUDIT-02 | AFI session 1–3 (CLOSED) |
| AUDIT-02 | YYYY-MM-DD | codebase-auditor security | Security focus post-refactor | _dev/docs/audits/AUDIT_REPORT_YYYY-MM-DD.md | ACTIVE | AFI session 4 (IN PROGRESS) |

---

## Finding Supersession Notes

> Use this section when a later audit explicitly supersedes specific findings from an
> earlier audit — e.g. a module was rewritten and its old findings are no longer relevant.

| Earlier finding | Superseded by | Reason |
|----------------|--------------|--------|
| AUDIT-01 FINDING-07 | AUDIT-02 | Module X was rewritten; finding no longer applicable |

---

## Status Key

- **ACTIVE** — This is the current audit. Findings are actionable.
- **SUPERSEDED BY [ID]** — A later audit covers the same scope. Do not act on findings here unless the later audit explicitly defers them.
- **PARTIAL SCOPE** — This audit covered a specific area only. May coexist with other active audits on different areas.
- **CLOSED** — All findings resolved or explicitly deferred. AFI project closed.
```

---

## Rules for maintaining this file

1. **One row per audit run.** Even if the same command is run twice, each run gets its own row.
2. **Never delete rows.** Mark as SUPERSEDED; do not remove.
3. **Update AFI session column** when AFI closes a project for that audit.
4. **Update "Current Ground Truth"** header whenever an audit is added or status changes.
5. **Use the Finding Supersession Notes section** only when a later audit explicitly makes
   earlier findings invalid — not just when time passes.

---

## Creation rules (which skill creates it)

- **Planner** creates a stub (header + empty table) during project scaffolding
- **Codebase-auditor** creates it if not already present, then appends its first row
- **AFI** creates it if neither planner nor codebase-auditor was used (e.g. third-party audit)
- All three check for existence first — never overwrite an existing registry
