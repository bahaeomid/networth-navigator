#!/usr/bin/env node
// Run all Auditor 2 verification tests with current filenames.

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tests = [
  { file: 'auditor2_monte_carlo.js', phase: 'Phase 3' },
  { file: 'auditor2_projection.js', phase: 'Phase 2' },
  { file: 'auditor2_scorecard.js', phase: 'Phase 4' },
  { file: 'auditor2_gap_levers.js', phase: 'Phase 5' },
];

let allPassed = true;

console.log('='.repeat(60));
console.log('AUDITOR 2 - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(60));

for (const { file, phase } of tests) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${file} (${phase})`);
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
  console.log('SOME TESTS FAILED ✗');
  process.exit(1);
}

console.log('ALL TESTS PASSED ✓');
console.log('='.repeat(60));
