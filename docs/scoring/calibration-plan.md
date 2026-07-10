# Calibration Plan

## Purpose

Ensure platform-estimated scores are consistent, meaningful and directionally accurate when compared to qualified teacher assessments and official PTE scores.

## Process

### Step 1: Recruit Pilot Students

- Recruit a diverse group of students across the score range (10-90)
- Target minimum 100 pilot students for statistical significance
- Include native and non-native English speakers
- Cover all target score bands

### Step 2: Collect Student Responses

- Students complete diagnostic, practice and mock tests on the platform
- All responses are stored with full component data
- Speaking and writing responses are prioritised for calibration

### Step 3: Obtain Qualified Teacher Scores

- Qualified PTE teachers score speaking and writing responses
- Each response is scored by at least two teachers
- Teacher disagreement above threshold triggers a third reviewer
- Teacher scores are recorded per-component

### Step 4: Run Platform Scoring

- Platform scoring is executed on the same responses
- Scoring uses the current production scoring profile
- All component evidence and confidence ranges are stored

### Step 5: Compare AI and Teacher Results

- Compare platform scores against teacher scores
- Analyse by task type, score range and response characteristics
- Identify systematic differences

### Step 6: Identify Systematic Score Differences

- Document consistent over- or under-scoring patterns
- Identify task types or score ranges with largest divergence
- Determine root causes (feature extraction, weight assignment, reference data)

### Step 7: Adjust Versioned Weights

- Update scoring profile weights based on calibration findings
- Increment the scoring profile version
- Document all changes and their rationale

### Step 8: Run Golden Regression Fixtures

- Execute scoring against a fixed golden dataset of responses with known scores
- Verify that changes improve accuracy without introducing regressions
- All regression results are stored with the scoring profile

### Step 9: Collect Voluntary Official Score Reports

- Request pilot students to share official PTE score reports voluntarily
- Store official scores with student consent
- Anonymise data for calibration analysis

### Step 10: Compare Predicted and Official Results

- Compare platform-estimated scores against official PTE scores
- Analyse prediction accuracy by score range and task type
- Document the estimated-to-official score relationship

### Step 11: Recalibrate Using Evidence

- Use official score comparisons to further refine scoring profiles
- Establish confidence ranges that reflect real prediction accuracy
- Document the calibration history for audit

## Metrics Tracked

| Metric | Description |
|--------|-------------|
| Mean difference | Average difference between platform and teacher scores |
| Median difference | Median difference between platform and teacher scores |
| Difference by task type | Per-task-type score difference |
| Difference by score range | How difference varies across the score spectrum |
| Difference by response length | Correlation between response length and score difference |
| Teacher disagreement | Rate and magnitude of disagreement between teachers |
| Official-score difference | Difference between platform and official PTE scores |
| Confidence-range coverage | Proportion of official scores falling within predicted range |
