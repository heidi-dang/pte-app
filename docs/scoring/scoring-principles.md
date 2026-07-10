# Scoring Principles

## Core Principles

1. **Scores are estimated training scores.** Platform scores are not official PTE scores. They are estimated indicators designed to help students track progress and identify areas for improvement.

2. **Objective questions use deterministic scoring.** Multiple-choice, fill-in-the-blanks and other objective task types use exact-match or partial-credit scoring that is fully deterministic and reproducible.

3. **AI must not provide unsupported final scores.** AI-generated evaluations for speaking and writing must provide component-level evidence and confidence ranges. The platform must never present AI scores as equivalent to Pearson's official scoring.

4. **Pearson's private scoring engine will not be represented as reproduced.** No marketing, interface text or documentation may claim that the platform replicates Pearson's scoring model.

## Speaking Scoring

Speaking evaluation uses:

- **Transcript comparison**: Comparison of the speech-to-text transcript against the expected response
- **Content coverage**: Proportion of required content points addressed
- **Fluency features**: Speech rate, pause frequency and duration, rhythm
- **Pronunciation evidence**: Phonetic accuracy, stress patterns, intelligibility
- **Timing evidence**: Response duration relative to expected range, preparation time usage

## Writing Scoring

Writing evaluation uses:

- **Content**: Relevance to prompt, task completion
- **Form**: Adherence to required format and length
- **Structure**: Logical organisation, paragraphing
- **Coherence**: Flow of ideas, linking, transitions
- **Grammar**: Grammatical accuracy and range
- **Vocabulary**: Lexical range and appropriateness
- **Linguistic range**: Variety of sentence structures
- **Spelling**: Spelling accuracy

## Result Storage

Every scoring result must store:

- Scoring-profile version used
- Question version used
- Provider version (if using external AI service)
- Component evidence (per-criterion scores and supporting data)
- Confidence range (estimated score lower and upper bounds)

## Historical Result Integrity

- **Historical results cannot silently change after a scoring update.**
- When a scoring profile is updated, existing results retain their original profile version.
- Students may optionally request re-scoring of historical attempts with a new profile.
- Re-scored results are stored as a new result record alongside the original.

## Scoring Profile Management

- All scoring profiles are versioned and immutable once published.
- Profile updates create a new version number.
- New scoring profiles require regression testing against a golden dataset.
- Profile changes must include calibration data showing impact on scores.
- Profile deployment requires super administrator approval.
- The active scoring profile is recorded per-result at the time of scoring.
