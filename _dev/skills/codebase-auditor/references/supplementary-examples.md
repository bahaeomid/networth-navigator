# Supplementary Phase Examples

This file contains worked examples of domain-specific supplementary audit phase generation.
Its purpose is **calibration** — showing what good domain reasoning looks like, not providing
exhaustive domain coverage. You will encounter domains not shown here. Apply the same
first-principles methodology.

---

## How to Use This File

When generating supplementary phases for an unfamiliar domain:
1. Find the closest example here
2. Observe the *structure* of the reasoning (failure mode → code location → audit check)
3. Apply that structure to the actual domain using your training knowledge
4. Scale the depth to match the actual risk in this specific codebase

---

## The Core Question for Any Domain

Before writing supplementary phases, always answer:

> *"What does this system promise its users — and what are the domain-specific ways
> that promise could be broken silently, in ways a generic code review would miss?"*

"Silently" is key. A crash is always caught. A number that's slightly wrong, a classification
that's off in edge cases, a calculation that uses the wrong methodology — these are the
domain-specific failures that hurt users.

---

## Example A: Financial / Accounting System

### Domain signals that triggered this supplement
- Primary output is a number users use to make spending or investment decisions
- Codebase aggregates transactions into averages, projections, or budgets
- Numbers represent real money

### Failure mode analysis (reasoning process)

*"What goes wrong in financial calculation systems that a generic audit misses?"*

- **Double-representation**: The same money counted in both a summary figure and a detail figure. A user adds them and overstates their financial need.
- **Denominator mismatch**: An average computed over "all months" when it should use "months with complete data" — gaps silently drag the average down.
- **Methodology mismatch**: Using arithmetic mean when a median would be more robust for skewed distributions (e.g., one large expense inflates the average).
- **Periodic expense bias**: Time-weighted averages systematically understate expenses that happen quarterly or annually because they fall in the "older half" of the window.
- **Currency/locale hardcoding**: A threshold like "flag if over 500" is meaningless without knowing the currency. 500 USD ≠ 500 JPY ≠ 500 AED.
- **Refund double-subtraction**: A refund already netted against a category total and then also excluded from the dataset — subtracted twice.
- **Gap inflation**: A denominator that spans a date range (Jan–Dec) rather than summing actual day-ranges — inflated by missing months.

### Supplementary phases generated

**SUP-1: Financial Methodology Critique**
- Objective: Verify the primary financial figure uses the right calculation method, not just implements the chosen method correctly
- Checks: Is mean vs. median appropriate for each category? Does time-weighting serve users or distort periodic expenses? Is the rolling window size appropriate? What would change if the methodology changed — is that disclosed?
- Pass criteria: Each methodology choice is documented with rationale. Any choice that could mislead a user in a predictable scenario is flagged.

**SUP-2: Double-Representation Audit**
- Objective: Verify no amount appears in both a summary figure and a detail section additively
- Checks: For every "detail" section (lump sums, periodic expenses, category breakdowns), verify whether its amounts are already included in the headline figure. If yes, is this disclosed? Can a user construct a wrong total by adding displayed figures?
- Pass criteria: Zero scenarios where adding two displayed figures overstates the real total.

**SUP-3: Denominator Consistency**
- Objective: Every financial average uses the same, correct denominator definition
- Checks: Map every division in the codebase. Classify each denominator (all records / valid records / complete periods / eligible periods). Verify the denominator matches the stated purpose of the metric. Verify all related metrics use consistent denominator definitions.
- Pass criteria: No two metrics displayed together use different denominator definitions without explicit disclosure.

**SUP-4: Financial Data Integrity**
- Objective: Every input transaction appears exactly once in the output
- Checks: Input count = counted + excluded + errored. Run merge/import twice with same data — output count must not increase. Verify refund handling doesn't subtract amounts more than once.
- Pass criteria: Transaction conservation equation holds. Idempotency test passes.

---

## Example B: Machine Learning / AI System

### Domain signals that triggered this supplement
- Codebase trains models or runs inference
- Predictions, scores, or classifications are primary outputs
- Users make decisions based on model output

### Failure mode analysis

*"What goes wrong in ML systems that generic code review misses?"*

- **Train/test leakage**: Test data contaminated by training process — model appears to generalize but doesn't.
- **Label encoding drift**: Feature encoding at training time differs from inference time — model receives different inputs than it was trained on.
- **Evaluation metric gaming**: Metric optimized during training doesn't reflect real-world performance. Accuracy is high because classes are imbalanced.
- **Silent model drift**: Model degrades over time as input distribution shifts, but there's no monitoring.
- **Confidence miscalibration**: Model reports high confidence on inputs far from training distribution.
- **Feature importance assumptions**: Model relies on a feature that won't be available in production.
- **Reproducibility failure**: Re-running training produces different results due to random seeds, non-deterministic operations.

### Supplementary phases generated

**SUP-1: Data Pipeline Integrity**
- Objective: Verify training and inference pipelines use identical preprocessing
- Checks: For every preprocessing step in training, find the corresponding step in inference. Compare: same normalization parameters? Same encoding maps? Same handling of nulls? Same feature order?
- Pass criteria: Preprocessing is either shared code or verified identical.

**SUP-2: Evaluation Validity**
- Objective: Verify the evaluation metric reflects real-world performance
- Checks: Is the test set truly held-out? Is class imbalance handled in the metric? Would a naive baseline beat the model on any reported metric? Are confidence scores calibrated (calibration curve)?
- Pass criteria: Evaluation metric is appropriate for the task. No leakage confirmed.

**SUP-3: Production Readiness of Inference**
- Objective: Verify the inference path handles real-world inputs robustly
- Checks: What happens with inputs outside the training distribution? What's the latency under production load? Is there a fallback when the model fails? Are model outputs logged for drift monitoring?
- Pass criteria: Graceful degradation on OOD inputs. Monitoring exists.

---

## Example C: Healthcare / Medical System

### Domain signals that triggered this supplement
- Codebase processes patient data, symptoms, diagnoses, or treatments
- Outputs influence clinical decisions or patient-facing health guidance
- Data contains personally identifiable health information

### Failure mode analysis

*"What goes wrong in healthcare systems that generic code review misses?"*

- **Unit confusion**: mg vs mcg, mmol/L vs mg/dL — a 1000× error. Has caused patient harm in real systems.
- **Off-by-one in date ranges**: Drug interaction windows, age-based dosing, pregnancy weeks — a one-day error changes clinical decisions.
- **Reference range errors**: Lab values compared to wrong population ranges (e.g., adult ranges applied to pediatric patients).
- **Patient data leakage**: Record A's data appearing in Record B's context — critical in multi-tenant or batched systems.
- **Regulatory compliance gaps**: HIPAA, GDPR, or regional health data regulations violated by logging, caching, or data retention practices.
- **Calculation errors in dosing**: Weight-based dosing calculations, pediatric scaling, renal adjustment formulas.

### Supplementary phases generated

**SUP-1: Unit and Calculation Safety**
- Objective: Verify all clinical calculations use correct units and produce safe outputs
- Checks: For every formula involving clinical values (dosages, lab results, vital signs), verify the unit is explicit, conversions are correct, and outputs are validated against clinically safe ranges. Test boundary conditions at clinically significant thresholds.
- Pass criteria: Zero unit ambiguity in clinical calculations. All outputs bounded.

**SUP-2: Data Isolation**
- Objective: Verify patient data cannot leak between patients or sessions
- Checks: In every query, API call, or data fetch, is the patient/user identifier enforced as a filter? Is there any shared mutable state that could carry data between requests? Are batch operations isolated per-patient?
- Pass criteria: No data path where Patient A's data can appear in Patient B's context.

**SUP-3: Regulatory Compliance Baseline**
- Objective: Flag obvious compliance risks for specialist review
- Checks: Are PHI fields identifiable in the data model? Are they encrypted at rest and in transit? Are access logs retained? Are there data retention policies enforced in code? Are third-party dependencies HIPAA-eligible?
- Note: This phase produces a referral list for a compliance specialist — not a full audit.
- Pass criteria: Obvious violations flagged. Specialist referral issued for full compliance review.

---

## Example D: Data Engineering / ETL Pipeline

### Domain signals that triggered this supplement
- Codebase reads data from one format and writes it to another
- Data quality is the primary responsibility
- Downstream systems depend on this pipeline's correctness

### Failure mode analysis

*"What goes wrong in ETL pipelines that generic code review misses?"*

- **Silent record loss**: Records dropped without logging — downstream systems receive incomplete data and have no way to know.
- **Schema drift**: Source schema changes, pipeline silently drops new fields or maps them incorrectly.
- **Type coercion errors**: String "01" parsed as integer 1, losing leading zeros. Timestamps in wrong timezone silently shifted.
- **Idempotency failure**: Re-running a pipeline creates duplicate records instead of safely overwriting.
- **Late-arriving data handling**: Records with past timestamps arrive after the pipeline has already processed that window.
- **Watermark/checkpoint drift**: Resuming from a checkpoint after failure reprocesses some records while missing others.

### Supplementary phases generated

**SUP-1: Record Conservation**
- Objective: Every input record is accounted for in the output
- Checks: Add record counts at each stage. Verify input_count = output_count + excluded_count + error_count. Any discrepancy is a CRITICAL finding.
- Pass criteria: Conservation equation holds at every stage boundary.

**SUP-2: Schema Resilience**
- Objective: Pipeline handles schema changes without silent data loss
- Checks: What happens when a new field appears in the source? What happens when a field is removed? What happens when a field's type changes? Are unknown fields logged or silently dropped?
- Pass criteria: Schema changes produce explicit errors or explicit handling, never silent data loss.

**SUP-3: Reprocessing Safety**
- Objective: Re-running the pipeline on already-processed data is safe
- Checks: Does re-running create duplicates? Is there a deduplication key? Are idempotency guarantees documented?
- Pass criteria: Full idempotency test passes (run twice, compare output).

---

## Calibration Notes

**How much supplementary content is enough?**
- Scale to the failure impact. A dosing calculation error that could harm patients → maximum depth.
- A pipeline that aggregates marketing analytics → moderate depth.
- A codebase that only stores data without analysis → lighter supplement.

**When you encounter a domain not in these examples:**
1. Ask: what does this system *promise* users?
2. Ask: in what ways could that promise be broken *silently*?
3. Ask: which of those failure modes are *specific to this domain* (not caught by generic phases)?
4. Turn each answer into a supplementary phase.

**The right number of supplementary phases:**
- 2–4 is typical for a single-domain codebase
- 5–8 for multi-domain or high-stakes systems
- More than 8 suggests the plan needs consolidation

**Always end with a Specialist Referral phase** for any domain where the audit's scope
is insufficient for full verification (e.g., full HIPAA compliance, penetration testing,
actuarial validation of financial models, FDA validation for medical devices).
