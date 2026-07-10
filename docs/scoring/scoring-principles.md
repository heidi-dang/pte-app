# Scoring Principles

## Core Principles

1. **Scores are estimated training scores.** Platform scores are not official PTE scores. They are estimated indicators designed to help students track progress and identify areas for improvement.

2. **Objective questions use deterministic scoring.** Multiple-choice, fill-in-the-blanks and other objective task types use exact-match or partial-credit scoring that is fully deterministic and reproducible.

3. **AI must not provide unsupported final scores.** AI-generated evaluations for speaking and writing must provide component-level evidence and confidence ranges. The platform must never present AI scores as equivalent to Pearson's official scoring.

4. **Pearson's private scoring engine will not be represented as reproduced.** No marketing, interface text or documentation may claim that the platform replicates Pearson's scoring model.

## Speaking Scoring

Speaking evaluation is separated into two categories based on response type.

### Constrained-Response Speaking Tasks

Tasks: Read Aloud, Repeat Sentence, Answer Short Question

These tasks have a single expected response or a limited set of acceptable answers. Scoring uses:

- **Word alignment**: Alignment of speech-to-text output against the expected text
- **Sequence comparison**: Order and completeness of spoken content relative to expected word sequence
- **Accepted-answer matching**: Vocabulary-based matching against list of acceptable answers (Answer Short Question)
- **Pronunciation evidence**: Phonetic accuracy, stress patterns, intelligibility
- **Oral fluency**: Speech rate, pause frequency and duration, rhythm

### Open-Response Speaking Tasks

Tasks: Describe Image, Retell Lecture, Summarize Group Discussion, Respond to a Situation

These tasks have no single correct response. Scoring uses:

- **Content concepts**: Presence and relevance of key content points
- **Relevance**: Appropriateness of content to the prompt
- **Main-point coverage**: Proportion of key points addressed
- **Speaker contribution coverage**: Coverage of different speaker viewpoints where applicable (Summarize Group Discussion)
- **Situational goal completion**: Appropriateness of response to the scenario (Respond to a Situation)
- **Organisation**: Logical structure and flow of the spoken response
- **Pronunciation evidence**: Phonetic accuracy, stress patterns, intelligibility
- **Oral fluency**: Speech rate, pause frequency and duration, rhythm

**Preparation-time usage** may be shown as coaching feedback but must not be treated as an official scoring trait.

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

## Integrated-Skill Contributions by Task

| Task | Skills Assessed | Contribution |
|------|----------------|--------------|
| Read Aloud | Reading, Speaking | Reading comprehension, oral production |
| Repeat Sentence | Listening, Speaking | Listening accuracy, oral reproduction |
| Describe Image | Speaking | Visual interpretation, oral description |
| Retell Lecture | Listening, Speaking | Listening comprehension, oral summarisation |
| Answer Short Question | Listening | Listening comprehension, concise response |
| Summarize Group Discussion | Listening, Speaking | Multi-speaker listening, oral summary |
| Respond to a Situation | Speaking | Situational response, oral production |
| Summarize Written Text | Reading, Writing | Reading comprehension, written summarisation |
| Write Essay | Writing | Written composition |
| Reading and Writing: Fill in the Blanks | Reading, Writing | Reading comprehension, vocabulary, written accuracy |
| Multiple Choice, Multiple Answers (Reading) | Reading | Reading comprehension |
| Reorder Paragraph | Reading | Logical organisation |
| Reading: Fill in the Blanks | Reading | Reading, vocabulary |
| Multiple Choice, Single Answer (Reading) | Reading | Reading comprehension |
| Summarize Spoken Text | Listening, Writing | Listening comprehension, written summarisation |
| Multiple Choice, Multiple Answers (Listening) | Listening | Listening comprehension |
| Fill in the Blanks (Listening) | Listening, Writing | Listening, spelling, written accuracy |
| Highlight Correct Summary | Listening, Reading | Listening comprehension, reading comparison |
| Multiple Choice, Single Answer (Listening) | Listening | Listening comprehension |
| Select Missing Word | Listening | Listening prediction |
| Highlight Incorrect Words | Listening, Reading | Listening accuracy, reading verification |
| Write From Dictation | Listening, Writing | Listening accuracy, written reproduction |

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
