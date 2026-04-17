## [2.1.1] — 2026-04-16

### Changed
- Audit registry schema bundled in `references/audit-registry-schema.md` (no longer depends on `_shared/`)
- Removed `_shared/PATH_RESOLUTION.md` reference

---

## v2.1.0 — 2026-04-15
See library CHANGELOG for full details of this release.

# codebase-auditor — Changelog

## v2.0.0 — 2026-04-07

### Added
- **Named targeted commands** — invoke a single audit phase without running the full audit:
  `docs-sync`, `dead-code`, `hardcoding`, `logic`, `parity`, `edge-cases`,
  `test-audit`, `security`, `output-quality`, `efficacy`
- `VERSION` file
- `CHANGELOG.md`

### Changed
- `SKILL.md`: added Commands section at the top documenting all 11 commands (full + 10 targeted);
  added targeted command invocation protocol (Phase 0 always runs first, then named phase only)
- `CLAUDE.md.template`: updated skill path from `~/skills/codebase-auditor/SKILL.md` to
  `skills/codebase-auditor/SKILL.md` (vendored path — project is now self-contained);
  added Available Commands reference block
- `README.md`: updated setup instructions to use vendored pattern; documented all commands

### Unchanged
- All `references/` files — no content changes to base-phases, supplementary-examples,
  findings-registry, or test-templates

## v1.0.0 — initial release
- Full audit framework: Stage 0 (scan) → Stage 1 (plan) → Stage 2 (execute) → Stage 3 (sign-off)
- 11 universal BASE phases
- Domain identification and supplementary phase generation
- 12 quality principles
- Finding format, severity levels, fix protocol, go/no-go criteria
