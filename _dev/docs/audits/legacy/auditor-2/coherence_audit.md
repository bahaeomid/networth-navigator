# Phase 9: Metric System Coherence Audit

## 9.1 Completeness Check

### Questions the App Answers ✓

1. **"Am I building wealth?"** → Net Worth, Savings Rate ✓
2. **"Will I have enough to retire?"** → Retirement Funding %, Monte Carlo ✓
3. **"When can I retire?"** → FI Age ✓
4. **"How long will my money last?"** → Runway Chart ✓
5. **"What should I do?"** → Gap-closing levers ✓

### Questions NOT Answered ❌

1. **"What if I live longer?"** → No longevity sensitivity
2. **"How much monthly income in retirement?"** → Missing metric
3. **"How many years covered by current assets?"** → Missing metric

---

## 9.2 Conflict Check

### Retirement Funding % vs Monte Carlo

**Scenario:** User is 100% funded but Monte Carlo = 55%

**Explanation:** 
- Retirement Funding: Static nest egg target met
- Monte Carlo: Year-by-year drawdown with volatility

**Verdict:** Complementary, not contradictory. Needs explanation.

---

### Required Nest Egg vs Runway Chart

**Issue:**
- Nest Egg: Assumes Day 1 spending forever
- Runway: Models actual phase-outs

**Verdict:** Apparent contradiction. Add note.

---

## 9.3 Redundancy Check

| Metric Pair | Redundant? | Verdict |
|-------------|------------|---------|
| Monte Carlo vs Runway | No | Complementary |
| FI Age vs Funding % | No | Different questions |
| NW Multiple vs Funding % | No | Peer vs personal |

---

## 9.4 Industry Benchmarking

### Missing Standard Metrics

1. **Years of Expenses Covered**
   - Formula: (investments + cash) / annual expenses
   - Used by: Vanguard, Fidelity, Personal Capital

2. **Sustainable Monthly Income**
   - Formula: portfolio × SWR / 12
   - Used by: NewRetirement, Projection Lab

3. **Longevity Sensitivity**
   - "What if you live to 95/100?"
   - Used by: cFIREsim, NewRetirement

---

## 9.5 Coherence Verdict

**Overall:** Coherent but incomplete

**Strengths:**
- Core metrics mathematically sound
- Multiple perspectives on retirement readiness
- Clear action levers

**Weaknesses:**
- Missing key industry-standard metrics
- Cash treatment inconsistent
- Surplus deployment not integrated

**Recommendation:** Add missing metrics, clarify cash handling.
