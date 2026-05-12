## [1.2.0] — 2026-04-16

### Changed
- `.cursorrules` references updated to `.cursor/rules/base.mdc` (3 occurrences)
- `planner resume` and `planner update` commands added to frontmatter trigger phrases
- Audit registry schema bundled in `references/audit-registry-schema.md` (no longer depends on `_shared/`)
- Removed `_shared/PATH_RESOLUTION.md` reference (self-contained path resolution)

---

## v1.1.0 — 2026-04-15
See library CHANGELOG for full details of this release.

# Changelog — planner

## [1.0.0] — Initial release

### Added
- Three commands: `planner start`, `planner resume`, `planner update`
- Stage 0: Source Ingestion — multi-source input handling (text, files, URLs,
  screenshots, existing codebases); optional integration with file-ingest skill
- Stage 1: Progressive Interview — five phases, one question at a time, with
  per-phase summaries and a completion confidence gate
- Stage 2: Plan Generation — full PLAN.md with 10 sections; quality gate checklist;
  split-file support for large projects
- Stage 3: Agent Context File Generation — CLAUDE.md / AGENTS.md / .cursorrules
  scaffold with foundational rules, stack, conventions, locked decisions, open
  questions; append-safe (never overwrites existing file)
- Stage 4: Delivery — confirmed paths, delivery summary, scope-too-large surfacing
- The 7 Planning Principles (P1–P7)
- references/plan-template.md — 10-section PLAN.md template with quality gate
- references/agent-context-template.md — agent context scaffold with 9 sections
  including an append-only operational rules section for future sessions
- references/complexity-guide.md — small/medium/large/feature scale decision
  framework with escalation signals and scope reduction guidance
