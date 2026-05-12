## [1.1.1] — 2026-04-16

### Changed
- `executor replan` command added to frontmatter trigger phrases
- Removed `_shared/PATH_RESOLUTION.md` reference

---

## v1.1.0 — 2026-04-15
See library CHANGELOG for full details of this release.

# Changelog — executor

## [1.0.0] — Initial release

### Added
- Five commands: `executor generate`, `generate-lite`, `resume`, `status`, `replan`
- Four startup paths: A (generate from plan), B (generate-lite from description),
  C (resume from existing schedule), D (status read-only)
- Stage 0A: Plan Analysis — complexity assessment, dependency identification,
  parallelism detection, plan analysis deliverable with user confirmation gate
- Stage 0B: Lite Interview — 7-question condensed interview for informal planning
- Stage 1: Schedule Generation — dynamic depth (flat / phase+task / phase+task+subtask)
  based on project complexity; dependency map; quality gate checklist
- Stage 2: Agent Context File Update — mandatory standing instruction appended to
  AGENTS.md / CLAUDE.md enforcing EXECUTION_PLAN.md consultation at every session start;
  this is the primary drift prevention mechanism
- Stage 3: Session Execution — per-task protocol with status update forcing function,
  new-work discovery protocol, blocked task protocol
- Stage 4: Session Close — session summary, handover context block for session-handover
  skill, EXECUTION_PLAN.md session log entry
- The Drift Prevention System (three interlocking parts: external file memory,
  standing instruction, status update forcing function)
- Six Executor Principles (E1–E6)
- Multi-Agent Coordination section
- references/execution-plan-template.md — full EXECUTION_PLAN.md structure with
  Master Task Status Table, dependency map, session log, change log
- references/task-sizing-guide.md — XS/S/M/L/XL sizing, sub-task rules, domain
  calibration, done criteria test
- references/dependency-patterns.md — five dependency patterns, identification guide,
  parallelism guide, common mistakes
