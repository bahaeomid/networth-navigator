#!/usr/bin/env node
// Run all executable audit harnesses in _dev/tests.

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = [
  'audit_phase4_formula_verification.js',
  'audit_phase5_parity.js',
  'audit_phase6_edge_cases.js',
  'audit_phase6_idempotency.js',
  'auditor1_gap_levers.js',
  'auditor1_monte_carlo.js',
  'auditor1_projection_test.js',
  'auditor1_scorecard.js',
  'auditor2_gap_levers.js',
  'auditor2_monte_carlo.js',
  'auditor2_projection.js',
  'auditor2_scorecard.js',
];

let allPassed = true;

console.log('='.repeat(60));
console.log('NETWORTH NAVIGATOR - AUDIT TEST SUITE');
console.log('='.repeat(60));

for (const file of tests) {
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