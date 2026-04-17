## [1.5.1] — 2026-04-16

### Changed
- Audit registry schema bundled in `references/audit-registry-schema.md` (no longer depends on `_shared/`)
- Removed `_shared/PATH_RESOLUTION.md` reference

---

## v1.5.0 — 2026-04-15
See library CHANGELOG for full details of this release.

# Changelog — audit-fix-implementer

## [1.4.0] — Improved agent context file section

### Changed
- Section 3.5 upgraded from a one-paragraph optional suggestion to a structured
  operational rule extraction process with explicit qualification criteria (universal,
  operational, actionable), a ready-to-append block format, clear rules for what does
  and does not belong, and a post-close recommendation to run agents-md-optimizer
- Added explicit note that planner skill owns initial agent context file creation —
  audit-fix-implementer only appends, never creates from scratch
- Updated version reference in handover context block from v1.3.0 to v1.4.0


## [1.3.0] — Explicit close command + library-conformant packaging

### Added
- **Three named commands** — `audit-fix-implementer start`, `continue`, and `close`
  with explicit trigger phrases for each; aligns with codebase-auditor command pattern
- **`audit-fix-implementer close` command** — dedicated close procedure (Startup Path C)
  that produces the final consolidated LESSONS_LEARNED.md only on explicit invocation;
  agent never infers project close autonomously
- **"All resolved" prompt** — if all findings appear resolved without a close command,
  agent asks user whether to run close rather than doing it unilaterally
- Packaged to library standard: VERSION file, CHANGELOG.md, README.md, SKILL.md,
  references/ subfolder

### Changed
- Session type determination now checks for the close command first, before asking
  about audit document location
- Completion Report (Stage 4.2) now explicitly instructs user on next step:
  invoke close vs continue
- SKILL.md frontmatter description updated to include close command trigger phrases

## [1.2.0] — Multi-session and multi-agent support

### Added
- Startup Path A / B / C split — explicit branching for first, continuation, and close
- State Reconstruction Summary — produced by each continuation agent before executing
- Master Finding Status Table — single source of truth across all sessions
- Session-stamped append-only log blocks
- Session Close Summary — lightweight intermediate close artifact
- Principle deduplication logic — decision tree before writing new principles
- Principle revision history — each principle tracks refinement across sessions
- Multi-Session Rules summary table
- Handover Context block (Stage 4.3) for use with a handover skill

### Changed
- Final LESSONS_LEARNED.md produced only at project close, not each session end
- Intermediate sessions produce Session Close Summary blocks instead

## [1.1.0] — Standalone and tool-agnostic

### Changed
- Removed all dependencies on other skills (codebase-auditor, session-handover,
  llm-knowledge-base)
- Tool-agnostic: neutral "agent context file" language supporting CLAUDE.md,
  AGENTS.md, .cursorrules, or equivalent
- Agent context file patches demoted to optional (only if file already exists)
- LESSONS_LEARNED.md promoted as primary long-term artifact
- Generalizable/codebase-specific separation reinforced as load-bearing for wiki

## [1.0.0] — Initial release

### Added
- Core skill: ingestion, planning, execution, knowledge compounding, session close
- Iterate-and-fix algorithm with 3-attempt escalation
- The 5 Compounding Principles (C1–C5)
- references/lessons-learned-template.md
- references/implementation-log-template.md
- references/knowledge-schemas.md
