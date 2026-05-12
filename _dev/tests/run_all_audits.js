#!/usr/bin/env node
// Run all executable audit harnesses in _dev/tests.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = [
  { file: 'audit_phase4_formula_verification.js' },
  { file: 'audit_phase5_parity.js' },
  { file: 'audit_phase6_edge_cases.js' },
  { file: 'audit_phase6_idempotency.js' },
  { file: 'auditor1_gap_levers.js', mode: 'advisory' },
  { file: 'auditor1_monte_carlo.js', mode: 'advisory' },
  { file: 'auditor1_projection_test.js', mode: 'advisory' },
  { file: 'auditor1_scorecard.js', mode: 'advisory' },
  { file: 'auditor2_gap_levers.js' },
  { file: 'auditor2_monte_carlo.js' },
  { file: 'auditor2_projection.js' },
  { file: 'auditor2_scorecard.js' },
  {
    file: 'verify_full_element_coverage.mjs',
    requires: [
      '../artifacts/user_scenario_capture.json',
      '../artifacts/user_scenario_extracted.json',
    ],
    skipMessage: 'requires user scenario capture/extracted artifacts',
  },
];

let gatingPassed = true;
let gatingRan = 0;
let advisoryRan = 0;
let advisoryFailed = 0;

console.log('='.repeat(60));
console.log('NETWORTH NAVIGATOR - AUDIT TEST SUITE');
console.log('='.repeat(60));

for (const testDef of tests) {
  const file = testDef.file;
  const mode = testDef.mode || 'gating';
  const missingPrereqs = (testDef.requires || [])
    .map((relPath) => resolve(__dirname, relPath))
    .filter((absPath) => !existsSync(absPath));

  if (missingPrereqs.length > 0) {
    console.log(`\n↷ Skipping ${mode.toUpperCase()}: ${file} (${testDef.skipMessage || 'missing prerequisites'})`);
    continue;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${file}`);
  console.log('='.repeat(60));

  const result = spawnSync(process.execPath, [resolve(__dirname, file)], {
    stdio: 'inherit',
  });

  if (mode === 'advisory') advisoryRan += 1;
  else gatingRan += 1;

  if (result.status === 0) {
    if (mode === 'advisory') console.log(`ℹ ${file} COMPLETED (advisory, non-gating)`);
    else console.log(`✓ ${file} PASSED`);
    continue;
  }

  if (mode === 'advisory') {
    console.error(`⚠ ${file} FAILED (advisory, non-gating)`);
    advisoryFailed += 1;
    continue;
  }

  console.error(`✗ ${file} FAILED`);
  gatingPassed = false;
}

console.log(`\n${'='.repeat(60)}`);
if (!gatingPassed) {
  console.log('SOME GATING AUDIT TESTS FAILED ✗');
  process.exit(1);
}

console.log(`GATING AUDIT TESTS PASSED ✓ (${gatingRan} run)`);
if (advisoryRan > 0) {
  console.log(
    advisoryFailed === 0
      ? `ADVISORY AUDITS COMPLETED (non-gating): ${advisoryRan} run`
      : `ADVISORY AUDITS COMPLETED WITH FAILURES (non-gating): ${advisoryRan - advisoryFailed}/${advisoryRan} run`
  );
  console.log('Review advisory output for diagnostic findings; advisory scripts do not control pass/fail gates.');
}
console.log('='.repeat(60));
