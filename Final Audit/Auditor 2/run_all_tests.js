#!/usr/bin/env node
// Run All Auditor 2 Verification Tests
// Execute: node run_all_tests.js

const { execSync } = require('child_process');
const path = require('path');

console.log('='.repeat(60));
console.log('AUDITOR 2 - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(60));
console.log('');

const tests = [
  { file: 'monte_carlo_test.js', phase: 'Phase 3' },
  { file: 'projection_test.js', phase: 'Phase 2' },
  { file: 'scorecard_test.js', phase: 'Phase 4' },
  { file: 'gap_levers_test.js', phase: 'Phase 5' }
];

let allPassed = true;

tests.forEach(({ file, phase }) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${file} (${phase})`);
  console.log('='.repeat(60));
  
  try {
    const result = execSync(`node ${file}`, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log(`✓ ${file} PASSED\n`);
  } catch (error) {
    console.error(`✗ ${file} FAILED`);
    console.error(error.message);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('ALL TESTS PASSED ✓');
} else {
  console.log('SOME TESTS FAILED ✗');
  process.exit(1);
}
console.log('='.repeat(60));
