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
  { file: 'auditor1_gap_levers.js' },
  { file: 'auditor1_monte_carlo.js' },
  { file: 'auditor1_projection_test.js' },
  { file: 'auditor1_scorecard.js' },
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

let allPassed = true;

console.log('='.repeat(60));
console.log('NETWORTH NAVIGATOR - AUDIT TEST SUITE');
console.log('='.repeat(60));

for (const testDef of tests) {
  const file = testDef.file;
  const missingPrereqs = (testDef.requires || [])
    .map((relPath) => resolve(__dirname, relPath))
    .filter((absPath) => !existsSync(absPath));

  if (missingPrereqs.length > 0) {
    console.log(`\n↷ Skipping: ${file} (${testDef.skipMessage || 'missing prerequisites'})`);
    continue;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${file}`);
  console.log('='.repeat(60));

  const result = spawnSync(process.execPath, [resolve(__dirname, file)], {
    stdio: 'inherit',
  });

  if (result.status === 0) {
    console.log(`✓ ${file} PASSED`);
    continue;
  }

  console.error(`✗ ${file} FAILED`);
  allPassed = false;
}

console.log(`\n${'='.repeat(60)}`);
if (!allPassed) {
  console.log('SOME AUDIT TESTS FAILED ✗');
  process.exit(1);
}

console.log('ALL AUDIT TESTS PASSED ✓');
console.log('='.repeat(60));