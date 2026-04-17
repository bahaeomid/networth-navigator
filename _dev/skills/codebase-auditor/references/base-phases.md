# Base Audit Phases — Detailed Specification

All codebases receive these phases. Every phase has a specific objective, input set, concrete
checks, and pass/fail criteria. Read this when writing the audit plan.

---

## Phase 0: Pre-Audit Reading (Foundation)

**Objective:** Build a complete mental model of the codebase before touching any phase.

**Critical mindset:** Treat documentation as potentially outdated claims. The code is the source
of truth. Note discrepancies between docs and code as you go — these become Phase 1 inputs.

**What to read (in order):**
1. README and all top-level .md files
2. All documentation directories (/docs, /memory, /archives, etc.)
3. All config files (JSON, YAML, .env.example, .toml)
4. All source files (read every function, not just headers)
5. All test files (understand what's already tested — and what isn't)
6. All build/dependency files

**What to note during reading:**
- Every formula, calculation, or derived value
- Every place where the same logic appears in multiple files
- Every hardcoded value (threshold, path, name, currency, etc.)
- Every TODO/FIXME/HACK comment with current status assessment
- Every division operation (potential ÷ 0)
- Every place where user-controlled data touches output
- Every discrepancy between what docs say and what code does

**Output:**
- Codebase Intelligence Report (as specified in SKILL.md)
- List of red flags to investigate
- Proposed audit plan scope

**Pass criteria:** You can accurately describe every major data flow, every critical function's
behavior, and every config key's effect — from memory, without re-reading.

---

## Phase 1: Documentation Sync

**Objective:** Every claim in every documentation file is accurate against the current code.

**Why this matters:** Stale docs mislead future developers (and AI agents). They also reveal
where the codebase has drifted from its intended design.

**Process:**
For each documentation file:
1. Read every claim it makes (features, formulas, file paths, behavior, step names)
2. Find the code that implements that claim
3. If code matches doc: ✓
4. If code differs from doc: FINDING — note what doc says vs what code does
5. If doc describes something that no longer exists: flag for removal or archival
6. If code has significant behavior that docs don't mention: flag for new documentation

**Specific items to always check:**
- Does the README accurately describe the current architecture?
- Do any docs reference deleted files, renamed functions, or removed features?
- Are all configuration keys documented? Are documented config keys actually used?
- Do step numbers match across documentation? (e.g., "Step 4" in README vs implementation)
- Are error messages in docs the same as actual error messages in code?
- Are there new documentation files that need to be created for undocumented subsystems?

**Output:**
- Sync change list: [file] → [what was updated and why]
- List of new documentation files needed
- Updated/corrected documentation files

**Pass criteria:** Zero claims in any doc that contradict the code. Zero significant code
behaviors that have no documentation.

---

## Phase 2: Dead Code & Structure Audit

**Objective:** Remove everything that serves no purpose and verify the codebase is well-organized.

**Dead code categories to check:**
- **Dead functions** — defined but never called anywhere
- **Dead imports** — imported but never referenced
- **Dead config keys** — keys in config files that no code reads
- **Dead files** — files that nothing imports or references
- **Dead CSS/style classes** — defined but never applied
- **Commented-out code blocks** — code that's been disabled but not removed
- **TODO/FIXME comments** — assess: resolved (remove), still outstanding (keep + list)

**Structure checks:**
- Are files in the right directories? (logic in logic/, tests in tests/, etc.)
- Are there any test files outside the test directory?
- Are there orphaned "scratch" or "temp" files that should be deleted?
- Are there files clearly misnamed or with stale names?

**Process:**
For each function: search the entire codebase for calls. If none found, mark as dead.
For each import: check if the imported symbol is used. If not, mark dead.
For each config key: search codebase for the key name. If not found in code, mark dead.

**Output:**
- Dead code inventory: [file:line] — [what it is] — [recommendation: remove / keep with reason]
- Structure violations: [issue] — [recommendation]

**Pass criteria:** No dead code remains (or is explicitly documented as intentionally kept with
a rationale). No obvious structural violations.

---

## Phase 3: Universality & Hardcoding Audit

**Objective:** The codebase works correctly for any user, in any region, with any configuration.
Zero hardcoded assumptions about who is using it.

**What to search for:**

**Hardcoded identifiers** (should never appear in logic code):
- Specific bank/institution names
- Specific currency names or symbols (USD, AED, £, $, €) in logic — these should come from config
- Specific region, country, or city names in logic
- Specific user names or personal identifiers
- Specific account types or numbers

**Hardcoded values** (should be config-driven):
- Numerical thresholds used in logic (acceptable if small and obviously universal, e.g., 0)
- Paths (should be dynamic relative to project root, not absolute)
- URLs (should be in config or .env)
- Model names / API endpoint names
- Color codes, display constants that affect behavior

**Exceptions (acceptable hardcoding):**
- Values in config files (that's their purpose)
- Values in documentation or test fixtures
- Universal constants (e.g., 0, 100, mathematical constants)
- Values explicitly commented as "intentional" with rationale

**Process:**
Use grep/search to find:
- All currency symbols and 3-letter currency codes
- All numbers used in comparisons or calculations (potential thresholds)
- All string literals used in conditional logic

**Output:**
- Universality violation list: [file:line] — [what is hardcoded] — [what config key should replace it]

**Pass criteria:** Zero hardcoded business-logic values in non-config files. Every configurable
value comes from the config system.

---

## Phase 4: Logic & Formula Verification

**Objective:** Every calculation produces the exact number a user would compute by hand.
No rounding errors, no off-by-one denominators, no incorrect period boundaries.

**This is the most important phase for computational codebases.**

### 4.1 Identify All Calculations
First, make a complete list of every formula, calculation, or derived value in the codebase:
- Aggregations (sum, average, count, median)
- Rates (per month, per year, percentage change)
- Derived values (rolling averages, weighted sums, normalized scores)
- Comparisons (thresholds, anomaly detection)
- Financial calculations (totals, budgets, projections)

### 4.2 Denominator Consistency Audit
For every division operation, identify EXACTLY which denominator is used and whether it is correct:
- Total records vs. valid records vs. eligible records vs. complete records
- Are all metrics using the SAME denominator definition consistently?
- Could a gap, partial record, or excluded record silently change the denominator?

This is where the most subtle bugs hide. A formula that uses "N months" when it should use
"N complete months" will produce numbers that are wrong by a small, hard-to-notice amount.

### 4.3 Hand-Verification Protocol
For each critical formula:
1. Find a dataset (real or synthetic) with known inputs
2. Compute the expected output BY HAND (not by running the code)
3. Compare to what the code would produce
4. If they match: ✓
5. If they differ: FINDING — show the discrepancy with the specific calculation

**Example format:**
```
Verifying: weighted_rolling_average()
Dataset: 12 months, amounts [500, 600, 550, 480, ...] (list all)
Expected (hand-calc):
  Older 6 months: [500, 600, 550, 480, 520, 490] → sum=3140, weight=1× each
  Newer 6 months: [510, 530, 560, 580, 590, 610] → sum=3380, weight=2× each
  Weighted sum: 3140 + (3380×2) = 9900
  Weighted count: 6 + (6×2) = 18
  Result: 9900/18 = 550.0
Code would produce: [trace the function with these inputs]
Match: YES / NO [if NO, explain discrepancy]
```

### 4.4 Edge Case Calculations
Verify every calculation handles:
- Zero denominator (division guard)
- Empty dataset (graceful return vs crash)
- Single data point (formulas designed for N≥2 applied to N=1)
- Negative values (if domain allows them)
- Extremely large values (overflow risk)
- All-identical values (e.g., standard deviation of [5,5,5,5])

### 4.5 Methodology Critique (not just correctness — appropriateness)
Beyond "is the formula implemented correctly?", ask "is this the right formula?":
- Is a mean appropriate here, or would a median be more robust?
- Is this weighting scheme producing the intended effect?
- Are we measuring what we claim to be measuring?
- Are there industry-standard approaches that would be more appropriate?
- Could this formula systematically mislead a user in a predictable scenario?

**Output:**
- List of all formulas with verification results
- Any formula that fails hand-verification: FINDING with severity

**Pass criteria:** Every formula hand-verified against known inputs. Zero discrepancies.
Every division has a zero-denominator guard. Methodology appropriateness assessed.

---

## Phase 5: Parity Audit

**Objective:** When the same logic is implemented in multiple places (different files, different
languages, different environments), all implementations are exactly identical.

**Common parity risks:**
- Backend (Python/Node) calculation also replicated in frontend (JS/TS) for client-side interaction
- Same validation logic in API handler AND in UI component
- Same normalization function in Python and JavaScript
- Same exclusion/filtering logic in multiple places
- Configuration values referenced in multiple places with different defaults

**Process:**
1. Identify all places where "the same" computation is done in multiple places
2. For each pair: read both implementations line by line
3. Check: same formula? Same denominator? Same edge case handling? Same default values?
4. Any difference: FINDING — show both versions and the discrepancy

**Special case: Language parity**
When a Python function is replicated in JavaScript (or vice versa), check:
- Split point calculation (e.g., midpoint of N items)
- Weight application (is it applied to the same half?)
- Denominator (weighted count vs unweighted count)
- Edge cases (what happens with N=1, N=0?)
- Type coercion differences (Python int vs JS float)
- Any "anchor" values that differ intentionally vs accidentally

**Document intentional divergences:**
Some divergences are intentional (e.g., Python uses today's date, JS uses last selected date).
These must be explicitly documented with rationale — not found during audit as bugs.

**Output:**
- Parity table: [function] — [implementation A] — [implementation B] — [match/divergence]
- For divergences: finding + whether intentional or bug

**Pass criteria:** All identical-purpose implementations produce identical results for the
same inputs. All intentional divergences are documented.

---

## Phase 6: Edge Cases & Stress Testing

**Objective:** The codebase handles boundary conditions, adversarial inputs, and high-volume
data without crashing, without producing silently wrong results, and with appropriate error messages.

### 6.1 Data Boundary Cases
Always test:
- **Empty input** — zero records, empty file, empty config
- **Single record** — every aggregation formula applied to N=1
- **Maximum volume** — 10× or 100× the expected data size
- **All-same values** — e.g., every transaction in one category
- **All-excluded** — every record filtered out by some rule
- **All-invalid** — every record fails validation
- **Minimum valid dataset** — the smallest dataset the system can handle

### 6.2 Value Edge Cases
- Zero amounts (0.00)
- Negative amounts
- Amounts exactly at a threshold (not above, not below — exactly at)
- Very large amounts (overflow risk)
- Amounts with many decimal places
- Unicode strings (special characters, emoji, RTL text, non-ASCII)
- Very long strings (field length limits)
- Empty strings where strings are expected
- Null/None where values are expected

### 6.3 Date/Time Edge Cases
- Year boundary (Dec 31 / Jan 1)
- Leap year (Feb 29)
- Future dates
- Very old dates (10+ years ago)
- Ambiguous date formats (01/02/03 — which format?)
- Missing dates
- Dates in different timezones

### 6.4 Idempotency Tests
**Critical for any system that writes state:**
Run the same operation twice. The result must be identical to running it once.
- Process the same input twice → output must be identical (no phantom duplicates)
- Merge the same data twice → no duplicates added, no data changed
- Apply the same fix twice → same result as applying once

**Idempotency test format:**
```
Run 1: [describe the operation and input]
Result 1: [hash or summary of output state]
Run 2: [exact same operation, same input]
Result 2: [hash or summary of output state]
Expected: Result 1 == Result 2
Actual: [pass/fail with details]
```

### 6.5 Adversarial Inputs
- Duplicate records with the same ID
- Records with conflicting data (same ID, different values)
- Self-referential or circular data
- Injected special characters (HTML, SQL, script tags)
- Extremely long field values
- Binary data where text is expected

**Output:**
- Edge case test results: [scenario] → [expected behavior] → [actual behavior] → [pass/fail]
- Any crash or wrong result: FINDING

**Pass criteria:** All edge cases produce either correct output or an explicit, clear error
message. Zero crashes. Zero silent wrong results.

---

## Phase 7: Test Suite Audit

**Objective:** Verify existing tests are correct, current, and passing. Identify coverage gaps.
Write new tests to fill critical gaps.

### 7.1 Run All Existing Tests
For each test file:
1. Run it. Does it pass?
2. If it fails: is this a real bug (FINDING) or a stale test?
3. Does it test what it claims to test? (Read the test assertions)
4. Are there false-positive tests (tests that pass even when the thing they test is broken)?

### 7.2 Test Coverage Analysis
After running all tests, ask:
- Which critical code paths have NO test coverage?
- Which formulas are tested with real data? Which are only tested abstractly?
- Are edge cases (from Phase 6) covered by tests?
- Is the happy path tested but the error path untested?
- Are integration tests (end-to-end) present, or only unit tests?

### 7.3 Assess Test Quality
Signs of poor-quality tests:
- Tests that only check "no exception raised" without checking output values
- Tests with hardcoded expected values that are just copied from the code (circular)
- Tests that require specific external state (network, specific files, specific user)
- Tests that depend on each other (order-dependent)
- Tests that are too broad (one test for 10 behaviors)

### 7.4 Write New Tests
For every critical gap identified:
- Write a test that would catch the specific type of failure
- Use hand-computed expected values (not code-derived)
- Name tests descriptively: `test_weighted_average_with_odd_month_count()`
- Include both the happy path and the relevant failure mode

**Standard test files to create (if not already present):**
- `audit_calculations.py` — hand-verified formula tests
- `audit_idempotency.py` — run-twice-same-result tests
- `audit_edge_cases.py` — boundary condition tests
- `audit_parity.py` — cross-language/cross-file consistency tests
- `stress_test.py` — high-volume performance and correctness tests

**Output:**
- Test run results: [file] → [N passed, N failed, failures listed]
- Coverage gap list: [uncovered behavior] → [new test written]
- Updated test files

**Pass criteria:** All existing tests pass. Critical behaviors have test coverage.
Each new test produces a deterministic, meaningful result.

---

## Phase 8: Security Baseline

**Objective:** The codebase does not expose users to common security risks.

**Note:** This is a baseline audit, not a penetration test. For high-security applications,
recommend a dedicated security specialist after this audit.

### 8.1 Input/Output Safety
- **XSS**: Any user-controlled string (names, descriptions, identifiers) that is inserted into
  HTML output must be HTML-escaped. Search for innerHTML, f-strings into HTML, template literals
  into DOM. Check: `html.escape()` in Python, `textContent` vs `innerHTML` in JS.
- **SQL injection**: Any user-controlled input used in a query must use parameterized queries.
- **Path traversal**: Any file path constructed from user input must be validated and restricted.
- **Template injection**: Any user input rendered in a template must be escaped.

### 8.2 Secret Handling
- No API keys, passwords, or secrets hardcoded in source code
- No secrets in git-tracked config files (check .gitignore covers .env)
- No secrets printed in logs or error messages
- .env.example shows the structure but not real values

### 8.3 Dependency Audit
- Are there known vulnerable versions in package.json / requirements.txt?
- Are dependencies pinned to specific versions or using loose ranges?

### 8.4 Error Message Safety
- Error messages don't expose internal file paths, stack traces, or system info to users
- Debug-level information is not shown in production output

**Output:**
- Security findings: [category] → [specific vulnerability] → [file:line] → [fix]

**Pass criteria:** Zero XSS vulnerabilities. No hardcoded secrets. No path traversal risks.
Error messages are safe to show users.

---

## Phase 9: UI/UX & Output Quality

**Objective:** What users actually see — in terminal output, UI, reports, or exported files —
is accurate, clear, consistent, and actionable.

### 9.1 Label & Tooltip Accuracy
For every label, tooltip, and display string:
- Does it accurately describe the adjacent value?
- Is the language understandable to the target user (non-technical where applicable)?
- Does it match what the code actually computes? (Not what it used to compute)

### 9.2 Consistency Audit
- Are numbers formatted consistently? (Currency symbol, decimal places, thousands separators)
- Are dates formatted consistently across all output?
- Is terminology consistent? (Don't say "transactions" in one place and "entries" elsewhere)
- Are error messages consistent in tone and format?

### 9.3 Completeness
- Do users see all the information they need to take action?
- Are there results that appear without context (numbers with no units, percentages with no denominator)?
- Are error messages actionable? ("Something went wrong" vs "File not found at path/to/file")

### 9.4 Noise vs. Signal
**Too much information:**
- Are there metrics or displays that add complexity without adding insight?
- Does any section duplicate information shown elsewhere?
- Are there warnings or alerts that fire too frequently (cry-wolf effect)?

**Too little information:**
- What are the most important questions a user will ask?
- Does the output answer each one clearly and prominently?
- Is the most important information shown first?

### 9.5 Zero-State Handling
What does the user see when:
- There is no data
- All data is filtered/excluded
- A specific section has nothing to show
→ Must show a clear "no data" message, not a blank or broken layout.

**Output:**
- UI/UX findings with specific improvement recommendations

**Pass criteria:** Every label is accurate. All output is consistent. Zero-states are handled.
The most important information is prominently displayed.

---

## Phase 10: Efficacy Review (First-Principles)

**Objective:** Step back from mechanics. Are we measuring the right things? Is the system
actually serving its core purpose effectively?

**This is a strategy phase, not a bug-hunt.**

### 10.1 Purpose Alignment
- What is the core purpose of this system? (Re-state it from Phase 0)
- For each major feature/output: does it directly serve that purpose?
- Are there features that exist because they were easy to build, not because users need them?
- Are there features users desperately need that don't exist yet?

### 10.2 Methodology Critique
- Are the metrics/calculations chosen the right ones for the problem?
- Are there industry-standard approaches that would serve users better?
- Are we computing the right thing, or just computing the current thing correctly?
- For each major metric: what question does it answer? Is that the question users are asking?

### 10.3 Metric Redundancy
- Are any two metrics measuring approximately the same thing?
- Could any metrics be combined or simplified without losing value?
- Is the information density appropriate (not too much, not too little)?

### 10.4 Threshold Calibration
- Are the default threshold values appropriate for the typical user?
- Do defaults produce too many false positives (noisy)? Or miss real events (silent)?
- Are thresholds documented with their rationale?

### 10.5 Friction Assessment
Walk through the system as a user. Measure:
- How many steps are required for the main task?
- Where are the friction points? (Confusion, manual steps, waiting)
- What fails if the user does something slightly unexpected?
- Is there an easy path for the returning user vs. only optimized for first-time?

### 10.6 Prioritized Recommendations
Produce a recommendation list in 4 tiers:
1. **Critical fixes** — produce wrong results; must fix before shipping
2. **Important improvements** — mislead users or produce suboptimal results; fix soon
3. **Nice-to-have** — would improve the tool, not blocking
4. **Future vision** — longer-term value additions

**Output:**
- Efficacy assessment: [feature] → [purpose] → [assessment] → [recommendation]
- Threshold calibration results
- Prioritized recommendation list

**Pass criteria:** Every major feature has a clear purpose. All thresholds are calibrated.
Recommendation list is complete and prioritized.

---

## Phase 11: Synthesis & Production Readiness

**Objective:** Compile all findings into a master report and render a go/no-go verdict.

### 11.1 Master Findings Register
Compile every finding from every phase:

| ID | Phase | Severity | Short Title | Status | Effort |
|----|-------|----------|-------------|--------|--------|
| FINDING-01 | 4 | CRITICAL | ... | OPEN | Trivial/Moderate/Significant |
| ... | | | | | |

### 11.2 Before/After Examples
For every CRITICAL and HIGH finding: provide a concrete example showing:
- What the user experiences TODAY (before fix)
- What they will experience AFTER the fix
- Use real or realistic data, not abstract descriptions

### 11.3 Deferred Items
Some issues are real but not blocking:
- Document each with: why deferred, what risk it carries, suggested timeline

### 11.4 Specialist Referrals
Flag items that exceed the audit's scope:
- LLM prompt engineering: "Verify extraction accuracy across all bank formats"
- Security penetration test: "Full security assessment for production API"
- Performance profiling: "Memory profiling for 10M+ record datasets"

### 11.5 Go/No-Go Decision

**GO** — Zero CRITICAL, zero HIGH. All MEDIUM have clear fix plans.
**CONDITIONAL GO** — Zero CRITICAL, ≤2 HIGH with clear fix plans. Ship with documented caveats.
**NO-GO** — Any CRITICAL, or HIGH findings that lose data or produce silently wrong results.

Final statement:
```
PRODUCTION READINESS VERDICT: [GO / CONDITIONAL GO / NO-GO]

Summary: {2-3 sentences explaining the verdict}

To achieve GO status, resolve: [list any blockers]
```
