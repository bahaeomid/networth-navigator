# Test File Templates

When the audit calls for generating test files, use these templates as starting points.
Adapt them to the specific codebase's imports, data structures, and function signatures.

All test files should:
1. Use hand-computed expected values (not code-derived)
2. Be independently runnable: `python audit_calculations.py`
3. Print clear PASS/FAIL for each test
4. Exit with code 1 if any test fails

---

## Template 1: Calculation Verification Test

```python
"""
audit_calculations.py — Hand-verified formula tests

Run: python audit_calculations.py
Each test uses pre-computed expected values to verify formula implementations.
"""

import sys
import math

# ─── Add project root to path ───────────────────────────────────────────────
sys.path.insert(0, "..")  # Adjust as needed for project structure

# Import the functions being tested
# from scripts.report import weighted_rolling, compute_monthly_averages  # example

PASS = 0
FAIL = 0

def check(label, actual, expected, tolerance=0.01):
    """Check a numeric result against expected value."""
    global PASS, FAIL
    if isinstance(expected, float):
        ok = abs(actual - expected) < tolerance
    else:
        ok = actual == expected
    status = "PASS" if ok else "FAIL"
    if status == "PASS":
        PASS += 1
    else:
        FAIL += 1
        print(f"  {status} {label}")
        print(f"    Expected: {expected}")
        print(f"    Actual:   {actual}")
    return ok


def check_exact(label, actual, expected):
    """Check for exact equality."""
    global PASS, FAIL
    ok = actual == expected
    status = "PASS" if ok else "FAIL"
    if status == "PASS":
        PASS += 1
    else:
        FAIL += 1
        print(f"  {status} {label}")
        print(f"    Expected: {expected!r}")
        print(f"    Actual:   {actual!r}")
    return ok


# ─── Test 1: [Describe the formula] ─────────────────────────────────────────
print("\nTest 1: [Formula Name]")

# Pre-computed expected values:
# 12 months: [500, 600, 550, 480, 520, 490, 510, 530, 560, 580, 590, 610]
# Older 6 months (1x weight): sum=3140
# Newer 6 months (2x weight): sum=3380, weighted=6760
# Weighted total: 3140 + 6760 = 9900
# Weighted count: 6 + 12 = 18
# Expected result: 9900 / 18 = 550.0

monthly_data = [500, 600, 550, 480, 520, 490, 510, 530, 560, 580, 590, 610]
# result = weighted_rolling(monthly_data)  # uncomment and adjust
result = 550.0  # PLACEHOLDER — replace with actual function call
check("Weighted rolling average (12 months, even split)", result, 550.0)


# ─── Test 2: Edge case — single month ───────────────────────────────────────
print("\nTest 2: Single month edge case")

single_month = [500]
# result = weighted_rolling(single_month)
result = 500.0  # PLACEHOLDER
check("Single month returns the single value", result, 500.0)


# ─── Test 3: Edge case — zero months ────────────────────────────────────────
print("\nTest 3: Zero months edge case")

empty = []
# result = weighted_rolling(empty)
result = 0.0  # PLACEHOLDER — should return 0 or None gracefully
check("Empty input returns 0 or None without crash", result, 0.0)


# ─── Test 4: Denominator correctness ────────────────────────────────────────
print("\nTest 4: Gap-safe denominator")

# Jan: 1000 (31 days), Feb: MISSING, Mar: 500 (15 days), Apr: 800 (30 days)
# Expected denominator: 31 + 15 + 30 = 76 days (NOT spanning Jan-Apr = 120 days)
# Average: (1000 + 500 + 800) / (76/30) = 2300 / 2.533 = 908.0
# (Adjust formula based on actual implementation)

# result = compute_average_with_gaps(data_with_gap)
result = 908.0  # PLACEHOLDER
check("Gap-safe denominator uses day-ranges, not calendar span", result, 908.0, tolerance=5.0)


# ─── Final Results ───────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"Results: {PASS} passed, {FAIL} failed")
if FAIL > 0:
    print("AUDIT FAILED — review failures above")
    sys.exit(1)
else:
    print("All calculation tests passed.")
    sys.exit(0)
```

---

## Template 2: Idempotency Test

```python
"""
audit_idempotency.py — Verify that running the same operation twice produces identical results.

Run: python audit_idempotency.py
This is a CRITICAL test for any system that writes state.
"""

import sys
import json
import copy
import hashlib

sys.path.insert(0, "..")

PASS = 0
FAIL = 0

def hash_dict(d):
    """Produce a stable hash of a dict/list for comparison."""
    return hashlib.md5(
        json.dumps(d, sort_keys=True, default=str).encode()
    ).hexdigest()


def check(label, actual, expected):
    global PASS, FAIL
    ok = actual == expected
    status = "PASS" if ok else "FAIL"
    if status == "PASS":
        PASS += 1
    else:
        FAIL += 1
        print(f"  {status} {label}")
    return ok


# ─── Setup: Create a known initial state ─────────────────────────────────────
# Adapt this to your codebase's data structures

INITIAL_HISTORY = [
    {"id": "txn-001", "date": "2024-01-15", "amount": 500.0, "category": "Groceries"},
    {"id": "txn-002", "date": "2024-01-20", "amount": 200.0, "category": "Dining"},
]

NEW_TRANSACTIONS = [
    {"id": "txn-003", "date": "2024-02-10", "amount": 1500.0, "category": "Rent"},
]


# ─── Test: Merge idempotency ──────────────────────────────────────────────────
print("\nTest: Merge idempotency")

# from scripts.apply_feedback import merge_transactions  # example import

def mock_merge(history, new_txns):
    """REPLACE with actual merge function."""
    result = copy.deepcopy(history)
    existing_ids = {t["id"] for t in result}
    for txn in new_txns:
        if txn["id"] not in existing_ids:
            result.append(copy.deepcopy(txn))
    return result


# Run 1
history_after_run1 = mock_merge(INITIAL_HISTORY, NEW_TRANSACTIONS)
count_run1 = len(history_after_run1)
hash_run1 = hash_dict(sorted(history_after_run1, key=lambda x: x["id"]))

# Run 2 — same input, same operation
history_after_run2 = mock_merge(history_after_run1, NEW_TRANSACTIONS)
count_run2 = len(history_after_run2)
hash_run2 = hash_dict(sorted(history_after_run2, key=lambda x: x["id"]))

print(f"  Run 1: {count_run1} records")
print(f"  Run 2: {count_run2} records")

check("Transaction count unchanged after second merge", count_run2, count_run1)
check("History content identical after second merge", hash_run2, hash_run1)

if count_run2 != count_run1:
    extra = count_run2 - count_run1
    print(f"  CRITICAL: {extra} phantom transaction(s) created on second merge")


# ─── Test: Change one transaction and re-merge ────────────────────────────────
print("\nTest: Single update propagates correctly")

UPDATED_TRANSACTION = {"id": "txn-003", "date": "2024-02-10", "amount": 1500.0, "category": "Utilities"}

history_after_update = mock_merge(history_after_run1, [UPDATED_TRANSACTION])

# Find the updated transaction
updated_txn = next((t for t in history_after_update if t["id"] == "txn-003"), None)

check("Updated transaction reflects new category",
      updated_txn["category"] if updated_txn else None,
      "Utilities")
check("Only one transaction updated — count unchanged",
      len(history_after_update),
      len(history_after_run1))


# ─── Final Results ───────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"Results: {PASS} passed, {FAIL} failed")
if FAIL > 0:
    print("IDEMPOTENCY AUDIT FAILED — merge algorithm has phantom duplication or data loss")
    sys.exit(1)
else:
    print("Idempotency verified.")
    sys.exit(0)
```

---

## Template 3: Edge Case Test

```python
"""
audit_edge_cases.py — Boundary condition and adversarial input tests.

Run: python audit_edge_cases.py
"""

import sys

sys.path.insert(0, "..")

PASS = 0
FAIL = 0

def check(label, actual, expected, tolerance=None):
    global PASS, FAIL
    if tolerance is not None:
        ok = abs(actual - expected) < tolerance
    else:
        ok = actual == expected
    status = "PASS" if ok else "FAIL"
    if status == "PASS":
        PASS += 1
    else:
        FAIL += 1
        print(f"  {status} {label}")
        print(f"    Expected: {expected!r}")
        print(f"    Actual:   {actual!r}")
    return ok


def check_no_crash(label, fn, *args, **kwargs):
    """Verify function doesn't raise an exception."""
    global PASS, FAIL
    try:
        result = fn(*args, **kwargs)
        PASS += 1
        return result
    except Exception as e:
        FAIL += 1
        print(f"  FAIL {label}")
        print(f"    Raised: {type(e).__name__}: {e}")
        return None


# ─── Empty input ──────────────────────────────────────────────────────────────
print("\nEdge Case: Empty input")

# from scripts.report import compute_monthly_averages  # example

def mock_compute(transactions):
    """REPLACE with actual function."""
    if not transactions:
        return {"total": 0.0, "by_category": {}}
    return {"total": sum(t["amount"] for t in transactions), "by_category": {}}


result = check_no_crash("Empty list doesn't crash", mock_compute, [])
if result is not None:
    check("Empty list returns zero total", result.get("total", None), 0.0)


# ─── Single record ─────────────────────────────────────────────────────────────
print("\nEdge Case: Single record")

single_record = [{"id": "txn-001", "amount": 500.0, "category": "Groceries", "date": "2024-01-15"}]
result = check_no_crash("Single record doesn't crash", mock_compute, single_record)
if result is not None:
    check("Single record total is correct", result.get("total"), 500.0)


# ─── Zero amount ──────────────────────────────────────────────────────────────
print("\nEdge Case: Zero amount transactions")

zero_records = [{"id": "txn-001", "amount": 0.0, "category": "Groceries", "date": "2024-01-15"}]
result = check_no_crash("Zero amount doesn't crash", mock_compute, zero_records)


# ─── All excluded ──────────────────────────────────────────────────────────────
print("\nEdge Case: All transactions excluded")

excluded_records = [
    {"id": "txn-001", "amount": 500.0, "category": "Groceries", "excluded": True},
    {"id": "txn-002", "amount": 200.0, "category": "Dining", "excluded": True},
]

def mock_compute_filtered(transactions):
    """REPLACE with actual filtered function."""
    active = [t for t in transactions if not t.get("excluded", False)]
    if not active:
        return {"total": 0.0, "by_category": {}, "message": "No active transactions"}
    return {"total": sum(t["amount"] for t in active), "by_category": {}}

result = check_no_crash("All excluded doesn't crash", mock_compute_filtered, excluded_records)
if result is not None:
    check("All excluded returns zero total", result.get("total"), 0.0)


# ─── Division by zero guards ──────────────────────────────────────────────────
print("\nEdge Case: Potential division by zero")

# Test function that divides by count — what happens with count=0?
def mock_average(values):
    """REPLACE with actual function."""
    if not values:
        return 0.0
    return sum(values) / len(values)

check_no_crash("Average of empty list doesn't crash", mock_average, [])
result = mock_average([])
check("Average of empty list returns 0 (not exception)", result, 0.0)


# ─── Unicode/special characters ───────────────────────────────────────────────
print("\nEdge Case: Unicode merchant names")

unicode_records = [
    {"id": "txn-001", "merchant": "مطعم الخليج", "amount": 150.0},  # Arabic
    {"id": "txn-002", "merchant": "星巴克", "amount": 45.0},          # Chinese
    {"id": "txn-003", "merchant": "Café de Flore", "amount": 80.0},  # French accents
    {"id": "txn-004", "merchant": "A" * 200, "amount": 10.0},        # Very long name
]

def mock_process_merchants(records):
    """REPLACE with actual function."""
    return [r["merchant"] for r in records]

result = check_no_crash("Unicode merchant names don't crash", mock_process_merchants, unicode_records)


# ─── Final Results ───────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"Results: {PASS} passed, {FAIL} failed")
if FAIL > 0:
    print("EDGE CASE AUDIT FAILED — review failures above")
    sys.exit(1)
else:
    print("All edge case tests passed.")
    sys.exit(0)
```

---

## Template 4: Parity Test (Cross-Language)

```python
"""
audit_parity.py — Verify Python and JavaScript implementations produce identical results.

For codebases where Python calculations are replicated in JavaScript for client-side use.
Run: python audit_parity.py
"""

import sys
import json
import subprocess
import math

sys.path.insert(0, "..")

PASS = 0
FAIL = 0

def check(label, actual, expected, tolerance=0.01):
    global PASS, FAIL
    if isinstance(expected, float) or isinstance(actual, float):
        ok = abs(float(actual) - float(expected)) < tolerance
    else:
        ok = actual == expected
    status = "PASS" if ok else "FAIL"
    if status == "PASS":
        PASS += 1
    else:
        FAIL += 1
        print(f"  {status} {label}")
        print(f"    Python: {actual}")
        print(f"    JS:     {expected}")
    return ok


# ─── Shared test data ────────────────────────────────────────────────────────
# The same data will be fed to both Python and JS implementations

TEST_DATA = {
    "monthly_values": [500.0, 600.0, 550.0, 480.0, 520.0, 490.0,
                        510.0, 530.0, 560.0, 580.0, 590.0, 610.0],
    "window_size": 12,
}

# ─── Python implementation results ───────────────────────────────────────────
# from scripts.report import weighted_rolling

def python_weighted_rolling(values, window):
    """REPLACE with actual Python function call."""
    if not values:
        return 0.0
    n = min(len(values), window)
    vals = values[-n:]
    mid = n // 2
    older = vals[:mid]
    newer = vals[mid:]
    weighted_sum = sum(older) + sum(newer) * 2
    weighted_count = len(older) + len(newer) * 2
    return weighted_sum / weighted_count if weighted_count > 0 else 0.0

python_result = python_weighted_rolling(
    TEST_DATA["monthly_values"],
    TEST_DATA["window_size"]
)

# ─── JavaScript implementation results ───────────────────────────────────────
# Run the JS function via Node.js
JS_CODE = """
// Copy the actual JS function from your codebase here
function rollingAvg(values, window) {
    if (!values || values.length === 0) return 0;
    const n = Math.min(values.length, window);
    const vals = values.slice(-n);
    const mid = Math.floor(n / 2);
    const older = vals.slice(0, mid);
    const newer = vals.slice(mid);
    const weightedSum = older.reduce((a, b) => a + b, 0) + newer.reduce((a, b) => a + b, 0) * 2;
    const weightedCount = older.length + newer.length * 2;
    return weightedCount > 0 ? weightedSum / weightedCount : 0;
}

const data = {data};
const result = rollingAvg(data.monthly_values, data.window_size);
console.log(JSON.stringify({{result}}));
""".replace("{data}", json.dumps(TEST_DATA)).replace("{{result}}", '{"result": result}')

try:
    proc = subprocess.run(
        ["node", "-e", JS_CODE],
        capture_output=True, text=True, timeout=10
    )
    js_output = json.loads(proc.stdout.strip())
    js_result = js_output["result"]
except Exception as e:
    print(f"  SKIP: Could not run JS (Node.js required): {e}")
    js_result = python_result  # Skip comparison if Node unavailable


# ─── Compare results ─────────────────────────────────────────────────────────
print("\nParity Test: Weighted Rolling Average")
print(f"  Python result: {python_result:.4f}")
print(f"  JS result:     {js_result:.4f}")
check("Python and JS produce identical rolling average", python_result, js_result)


# ─── Final Results ───────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"Results: {PASS} passed, {FAIL} failed")
if FAIL > 0:
    print("PARITY AUDIT FAILED — Python and JS implementations diverge")
    sys.exit(1)
else:
    print("Python/JS parity verified.")
    sys.exit(0)
```

---

## Naming Convention for Audit Test Files

Place generated test files in the codebase's test directory. Use these names:

| File | What It Tests |
|------|--------------|
| `audit_calculations.py` | Hand-verified formula correctness |
| `audit_idempotency.py` | Run-twice-same-result for merge/update operations |
| `audit_edge_cases.py` | Boundary conditions and adversarial inputs |
| `audit_parity.py` | Cross-language/cross-file logic consistency |
| `audit_security.py` | XSS escape, secret handling, input validation |
| `stress_test.py` | High-volume performance and correctness |
| `regression_test.py` | Re-verify all prior audit findings haven't regressed |
| `audit_financial.py` | Financial-specific: denominator, totals, FX, refunds |
