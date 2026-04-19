# _dev Workspace Guide

This folder contains developer-only assets used for validation, auditing, and project continuity.

## Layout

- `docs/` — canonical documentation and audit history
- `tests/` — deterministic formula/parity/edge audit harnesses
- `e2e/` — Playwright smoke coverage for release checks
- `skills/` — reusable workflow instructions (auditing, fix implementation)
- `artifacts/` — disposable generated outputs (e.g., Playwright run outputs)

## Start Here

- Documentation index: `docs/README.md`
- Release verification command: `npm run test:release`
