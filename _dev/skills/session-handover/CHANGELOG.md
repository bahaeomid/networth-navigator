## [1.2.1] — 2026-04-16

### Changed
- Added "no standing agent context injection needed" note
- Fixed `agent context file` literal to `CLAUDE.md` in path resolution section
- Removed `_shared/PATH_RESOLUTION.md` reference

---

## v1.2.0 — 2026-04-15
See library CHANGELOG for full details of this release.

# Changelog

## [1.0.0] - 2026-04-07

### Added
- Initial release of session-handover skill
- Full SKILL.md with prompt template and all section scaffolding
- Handover quality checklist
- Session startup protocol for receiving agent
- README with usage instructions

## [1.1.0] - 2026-04-07

### Added
- Conditional codebase orientation scan guidance in receiving agent startup protocol
- Decision rule: when to scan (large codebase, stale handover) vs when not to (small codebase, handover maps it fully)
- Lightweight 4-step orientation scan protocol (spatial awareness only — not a full audit)
- Item 5 in handover template Quick Start: outgoing agent now explicitly flags whether incoming agent needs a scan
- Clear distinction between orientation scan (this skill) and full codebase-auditor Phase 0 sweep
