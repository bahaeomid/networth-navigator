# Audit Registry — NetWorth Navigator

**Purpose:** Index of all audits performed on this codebase.

---

| # | Date | Auditor | Scope | Status | Report Location |
|---|------|---------|-------|--------|-----------------|
| A1 | 2026 (pre-v2) | Auditor 1 (Deepseek) | Formula + scorecard verification | **SUPERSEDED** by A4 | `_dev/docs/audits/legacy/auditor-1/` |
| A2 | 2026 (pre-v2) | Auditor 2 | Full audit + test suite | **SUPERSEDED** by A4 | `_dev/docs/audits/legacy/auditor-2/` |
| A3 | 2026 (pre-v2) | Auditor 3 | Cross-auditor reconciliation (5 phases) | **SUPERSEDED** by A4 | `_dev/docs/audits/legacy/auditor-3/` |
| A4 | 2026-04-17 | Claude Opus 4.6 | Full 20-phase audit (11 core + 9 supplementary) | **SUPERSEDED** by A5 | `_dev/docs/audits/AUDIT_REPORT_2026-04-17.md` |
| **A5** | **2026-04-19** | **GitHub Copilot (GPT-5.3-Codex)** | **Independent full re-audit + cross-check + targeted UI regression remediation** | **CURRENT** | `_dev/docs/audits/AUDIT_REPORT_2026-04-19.md` |
| A6 | 2026-05-12 | Codex | User-reported savings/cashflow and investment-contribution planning gaps | **SUPERSEDED by A7 addendum** | `_dev/docs/audits/AUDIT_REPORT_2026-05-12.md` |
| A7 | 2026-05-12 | Sonnet/Codex | Post-implementation audit of contribution/surplus UX disclosure gaps | **SUPERSEDED by A8 addendum** | `_dev/docs/audits/AUDIT_REPORT_2026-05-12-post-implementation.md` |
| A8 | 2026-05-12 | Codex | Lever-actionability parity and cross-surface calculation re-verification | **CURRENT ADDENDUM** | `_dev/docs/audits/AUDIT_REPORT_2026-05-12-lever-and-surface-parity.md` |

---

## Notes

- A1–A3 produced the initial findings consolidated into `_dev/docs/audits/plans/NETWORTH_NAVIGATOR_AUDIT_PLAN_v2.md`
- A4 executed the consolidated plan, discovered 12 additional findings, and resolved all CRITICAL/HIGH issues
- A5 independently re-audited A4 outputs and current code, confirmed prior logic/security fixes remained intact, and resolved 3 new UI regressions (NEW-30..NEW-32)
- A5 addendum (Session 4) performed a fresh from-scratch rerun, resolved 3 additional findings (NEW-33..NEW-35), and re-verified the full release chain
- Combined tracked findings are maintained in `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md`; the master finding table there is authoritative.
- A6 adds 3 findings: annual investment contributions (fixed), current-year savings-rate parity (fixed), and liability debt-service workflow documentation (documented/deferred)
- A7 adds 6 post-implementation findings covering Save More surplus-offset copy, Surplus Deployment scenario framing, investment-item layout, contribution tooltips, savings-rate tooltip wording, and HTML report notes.
- A8 adds 2 findings: actionable parity fixes for all three gap-closing levers and a collapsed Investments contribution cue, then re-verifies all major calculation surfaces.
- Legacy pre-skill audits are archived under `_dev/docs/audits/legacy/`
- Implementation log: `_dev/docs/audits/continuity/IMPLEMENTATION_LOG.md`
- Lessons learned: `_dev/docs/audits/continuity/LESSONS_LEARNED.md`
- Release verification surface: `npm run test:release` (`lint` + `_dev/tests` harnesses + `_dev/e2e` smoke)
