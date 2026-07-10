# PTE Task Blueprints

## Speaking and Writing

### Read Aloud

- **Canonical ID**: read_aloud
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Speaking
- **Score contributions**: Reading, Speaking
- **Task purpose**: Assess pronunciation and oral fluency
- **Prompt type**: Text
- **Prompt length**: Text up to 60 words
- **Student interface**: Text passage displayed, recording button, preparation countdown, response countdown
- **Input media**: Text passage on screen
- **Answer format**: Audio recording
- **Preparation behaviour**: Preparation timer (30-40 seconds per item, varies by text length), recording indicator after preparation completes, recording begins when student clicks start or after a short tone
- **Response behaviour**: Recording active for item-dependent duration, automatic stop after time expires, one recording allowed
- **Playback limit**: No audio
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable replay of own recording, transcript of own response after attempt, hints, model answer, extended preparation option
- **Mock-mode behaviour**: Microphone opens automatically after countdown/tone, item-dependent response duration, one recording, no hints, no transcript before submission, no answer correction after submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Pronunciation, Oral fluency
- **Platform estimated-scoring evidence**: Content (word alignment and sequence comparison against expected passage), Pronunciation (phonetic accuracy, stress patterns, intelligibility), Oral fluency (speech rate, pause frequency, rhythm)
- **Feedback format**: Component scores, overall estimated score, transcript comparison, fluency metrics
- **Content metadata**: Passage text, source, difficulty, word count, estimated reading time, canonical ID
- **Validation requirements**: Minimum 1-second recording, audio file integrity check, file format verification
- **Failure and recovery behaviour**: Recording failure shows error and retry option; partial recording saved server-side; preparation completes before recording begins; browser keeps recording locally until server storage confirmed; interrupted uploads resume without requiring new response
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Repeat Sentence

- **Canonical ID**: repeat_sentence
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Listening, Speaking
- **Score contributions**: Listening, Speaking
- **Task purpose**: Assess listening and speaking accuracy
- **Prompt type**: Audio
- **Prompt length**: Audio 3 to 9 seconds
- **Student interface**: Audio playback occurs automatically, recording activates automatically after playback ends, countdown timer for 15-second answer
- **Input media**: Audio sentence playback
- **Answer format**: Audio recording
- **Preparation behaviour**: Audio plays once automatically; no text displayed; response period begins immediately after playback ends
- **Response behaviour**: 15-second answer period, one recording, automatic stop after time expires
- **Playback limit**: 1
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable replay, transcript after attempt, slow playback, repeat attempt
- **Mock-mode behaviour**: Single playback only, 15-second answer period, one recording, no transcript before submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Pronunciation, Oral fluency
- **Platform estimated-scoring evidence**: Content (word-level alignment against expected sentence), Pronunciation (phonetic accuracy, stress, intelligibility), Oral fluency (speech rate, pause frequency)
- **Feedback format**: Word-level accuracy, overall estimated score, fluency metrics
- **Content metadata**: Sentence text, audio duration, difficulty, source, canonical ID
- **Validation requirements**: Audio file integrity, minimum duration, file format verification
- **Failure and recovery behaviour**: Audio load failure aborts task; recording failure shows error and retry; browser keeps recording locally until server storage confirmed; interrupted uploads resume without requiring new response
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Describe Image

- **Canonical ID**: describe_image
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Speaking
- **Score contributions**: Speaking
- **Task purpose**: Assess ability to describe visual information
- **Prompt type**: Image
- **Prompt length**: 1 image
- **Student interface**: Image display, preparation countdown, recording countdown, recording button after preparation
- **Input media**: Static image
- **Answer format**: Audio recording
- **Preparation behaviour**: 25-second preparation with visible image; recording indicator after preparation completes
- **Response behaviour**: 40-second spoken response, one recording, automatic stop after time expires
- **Playback limit**: No audio
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable preparation, replay own recording, sample answer, transcript after attempt
- **Mock-mode behaviour**: 25-second preparation, 40-second response, one recording, no replay, no hints; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Pronunciation, Oral fluency
- **Platform estimated-scoring evidence**: Content (key point detection, content coverage, relevance), Pronunciation (phonetic accuracy, intelligibility), Oral fluency (speech rate, pause frequency, rhythm)
- **Feedback format**: Content coverage score, key point detection, fluency metrics, estimated component scores
- **Content metadata**: Image file, image type, key points, difficulty, source, canonical ID
- **Validation requirements**: Image renders correctly, recording quality check, file format verification
- **Failure and recovery behaviour**: Image load failure shows error; recording failure retry; browser keeps recording locally until server storage confirmed; interrupted uploads resume
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Retell Lecture

- **Canonical ID**: retell_lecture
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Listening, Speaking
- **Score contributions**: Listening, Speaking
- **Task purpose**: Assess listening comprehension and summarisation
- **Prompt type**: Audio (may include accompanying image)
- **Prompt length**: Audio up to 90 seconds
- **Student interface**: Audio playback with optional image, preparation timer after playback, recording timer
- **Input media**: Audio lecture with optional accompanying image
- **Answer format**: Audio recording
- **Preparation behaviour**: Audio plays automatically (up to 90 seconds); 10-second preparation after playback ends
- **Response behaviour**: 40-second spoken response, one recording, automatic stop after time expires
- **Playback limit**: 1
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable replay, transcript after attempt, guided notes, slow playback
- **Mock-mode behaviour**: Single playback only, 10-second preparation, 40-second response, one recording, no transcript before submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Pronunciation, Oral fluency
- **Platform estimated-scoring evidence**: Content (main-point coverage, key concepts, relevance), Pronunciation (phonetic accuracy, intelligibility), Oral fluency (speech rate, pause frequency, rhythm)
- **Feedback format**: Content coverage score, key points detected, fluency metrics, estimated component scores
- **Content metadata**: Lecture audio, transcript, key points, difficulty, source, canonical ID
- **Validation requirements**: Audio file integrity, lecture duration within limits, recording quality check
- **Failure and recovery behaviour**: Audio load failure aborts task; recording failure retry; browser keeps recording locally until server storage confirmed
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Answer Short Question

- **Canonical ID**: answer_short_question
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Task purpose**: Assess ability to understand and respond concisely
- **Prompt type**: Audio (an image may accompany the question)
- **Prompt length**: Audio 3 to 9 seconds
- **Student interface**: Audio playback occurs automatically, recording activates after playback, countdown timer for 10-second answer
- **Input media**: Audio question
- **Answer format**: Audio recording
- **Preparation behaviour**: Question plays once automatically
- **Response behaviour**: 10-second spoken answer period, one recording, automatic stop after time expires
- **Playback limit**: 1
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable replay, view correct answer and explanation after attempt
- **Mock-mode behaviour**: Single playback, 10-second answer period, one microphone recording, no text-response fallback, no answer reveal before submission; unanswered mock responses permitted
- **Official scoring type**: Correct/incorrect
- **Official scoring traits**: Vocabulary
- **Platform estimated-scoring evidence**: Accepted-answer vocabulary matching, response relevance, pronunciation verification
- **Feedback format**: Correct or incorrect with correct answer shown, accepted alternative answers
- **Content metadata**: Question, answer list of accepted responses, difficulty, topic, source, canonical ID
- **Validation requirements**: Answer matching against accepted answers list, minimum recording duration
- **Failure and recovery behaviour**: Audio load failure shows error; recording failure retry; browser keeps recording locally until server storage confirmed
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Summarize Group Discussion

- **Canonical ID**: summarize_group_discussion
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Listening, Speaking
- **Score contributions**: Listening, Speaking
- **Task purpose**: Assess ability to summarise a discussion between multiple speakers
- **Prompt type**: Audio
- **Prompt length**: Audio up to 180 seconds
- **Student interface**: Audio playback, preparation timer after playback, recording timer
- **Input media**: Multi-speaker audio (three speakers)
- **Answer format**: Audio recording
- **Preparation behaviour**: Audio plays automatically once (up to 3 minutes); 10-second preparation after playback ends
- **Response behaviour**: 2-minute (120-second) spoken response, one recording, automatic stop after time expires
- **Playback limit**: 1
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable replay, transcript after attempt, guided notes on speaker contributions
- **Mock-mode behaviour**: Single playback, 10-second preparation, 2-minute response, one recording, no transcript before submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Pronunciation, Oral fluency
- **Platform estimated-scoring evidence**: Content (speaker contribution coverage, main-point coverage, relevance), Pronunciation, Oral fluency
- **Feedback format**: Content coverage score, speaker point detection, fluency metrics, estimated component scores
- **Content metadata**: Discussion audio, transcript, key discussion points, difficulty, source, canonical ID
- **Validation requirements**: Multi-speaker audio clarity, file integrity, recording quality check
- **Failure and recovery behaviour**: Audio load failure aborts task; recording failure retry; browser keeps recording locally until server storage confirmed
- **Official reference IDs**: source-1, source-2, source-5, source-6
- **Last verified date**: 2026-07-10

### Respond to a Situation

- **Canonical ID**: respond_to_situation
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Speaking
- **Score contributions**: Speaking
- **Task purpose**: Assess ability to respond appropriately in a given scenario
- **Prompt type**: Text and audio
- **Prompt length**: Text up to 60 words
- **Student interface**: Written situation displayed, audio plays the same situation, preparation timer after audio, recording timer
- **Input media**: Text scenario with audio narration
- **Answer format**: Audio recording
- **Preparation behaviour**: Student listens to and reads the situation; 10-second preparation after audio ends
- **Response behaviour**: 40-second spoken answer, one recording, automatic stop after time expires
- **Playback limit**: 1
- **Recording limit**: 1
- **Practice-mode behaviour**: Configurable replay, transcript after attempt, model response, hints on situational goal
- **Mock-mode behaviour**: Text and audio both required, single playback, 10-second preparation, 40-second spoken response, one recording, no hints; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Pronunciation, Oral fluency
- **Platform estimated-scoring evidence**: Content (situational goal completion, relevance, appropriateness), Pronunciation, Oral fluency
- **Feedback format**: Content score (goal completion), language use, estimated component scores
- **Content metadata**: Scenario text, appropriate response criteria, difficulty, source, canonical ID
- **Validation requirements**: Audio file integrity, recording quality check
- **Failure and recovery behaviour**: Recording failure retry; browser keeps recording locally until server storage confirmed
- **Official reference IDs**: source-1, source-2, source-5, source-6
- **Last verified date**: 2026-07-10

### Summarize Written Text

- **Canonical ID**: summarize_written_text
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Reading, Writing
- **Score contributions**: Reading, Writing
- **Task purpose**: Assess reading comprehension and summarisation
- **Prompt type**: Text
- **Prompt length**: Text up to 300 words
- **Student interface**: Reading passage displayed, single-line text input area, word count display
- **Input media**: Text passage
- **Answer format**: Written text (single sentence, one or more clauses, 5 to 75 words)
- **Preparation behaviour**: Reading time before response begins
- **Response behaviour**: 10-minute response timer, single sentence required, autosave every 5 seconds
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Extended time option, hints, sentence structure guide, multiple attempts, model answer
- **Mock-mode behaviour**: 10-minute timer, single sentence, 5-75 word limit, autosave, no hints, no spell check; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Form, Grammar, Vocabulary
- **Platform estimated-scoring evidence**: Content (relevance to passage, key point coverage), Form (single sentence compliance, word count), Grammar (accuracy, range), Vocabulary (lexical range, appropriateness)
- **Feedback format**: Component scores, word count, sentence structure feedback, estimated overall score
- **Content metadata**: Passage text, sample summary, difficulty, source, canonical ID
- **Validation requirements**: Word count within 5-75 range, single sentence validation, autosave verification
- **Failure and recovery behaviour**: Autosave every 5 seconds; restore on reload; submitted response remains after refresh, API restart and browser restart
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Write Essay

- **Canonical ID**: write_essay
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Official skills assessed**: Writing
- **Score contributions**: Writing
- **Task purpose**: Assess writing ability
- **Prompt type**: Text
- **Prompt length**: Text 2 to 3 sentences
- **Student interface**: Essay prompt displayed, text editor with word count, formatting toolbar for practice mode
- **Input media**: Text prompt
- **Answer format**: Written essay (200 to 300 words)
- **Preparation behaviour**: Reading prompt
- **Response behaviour**: 20-minute response timer, autosave every 5 seconds
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Extended time, outline tool, spell check, model response, multiple attempts
- **Mock-mode behaviour**: 20-minute timer, 200-300 word range, autosave, no spell check, no outlines; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Form, Development, Structure and Coherence, Grammar, General Linguistic Range, Vocabulary Range, Spelling
- **Platform estimated-scoring evidence**: Content (relevance, task completion), Form (length compliance), Structure (organisation, paragraphing), Coherence (flow, transitions), Grammar (accuracy, range), Vocabulary (lexical range, appropriateness), Linguistic range (sentence variety), Spelling (accuracy)
- **Feedback format**: Component scores, overall estimated score, specific suggestions per trait
- **Content metadata**: Essay prompt, sample essay, difficulty, topic, source, canonical ID
- **Validation requirements**: Word count within 200-300 range, autosave check, submission confirmation
- **Failure and recovery behaviour**: Autosave every 5 seconds; restore on reload; submitted response remains after refresh, API restart and browser restart
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

## Reading

### Reading and Writing: Fill in the Blanks

- **Canonical ID**: reading_writing_fill_blanks
- **Current official status**: Current official task
- **Section**: Reading
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Task purpose**: Assess reading comprehension and vocabulary
- **Prompt type**: Text
- **Prompt length**: Text up to 300 words
- **Student interface**: Reading passage with dropdown menus at blank positions
- **Input media**: Text passage
- **Answer format**: Selected words per blank from dropdown list
- **Preparation behaviour**: Read passage, no per-question timer
- **Response behaviour**: Section-level timer applies across all reading tasks, no individual question timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Show correct answers after submission, hints for each blank, explanation of vocabulary
- **Mock-mode behaviour**: Section-level timer, no hints, no answer reveal until section ends, no partial feedback; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Reading, Writing
- **Platform estimated-scoring evidence**: Correct/incorrect per blank with partial credit scoring
- **Feedback format**: Correct blanks highlighted, incorrect blanks shown with correct answer, vocabulary explanations
- **Content metadata**: Passage, blank positions, answer options, correct answers, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave selections; restore on reload
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Multiple Answers (Reading)

- **Canonical ID**: reading_multiple_answers
- **Current official status**: Current official task
- **Section**: Reading
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Task purpose**: Assess reading comprehension with multiple correct options
- **Prompt type**: Text
- **Prompt length**: Text up to 350 words
- **Student interface**: Reading passage, checkbox list of options
- **Input media**: Text passage
- **Answer format**: Selected checkboxes
- **Preparation behaviour**: Read passage
- **Response behaviour**: Section-level timer, no individual question timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Show correct answers after submission, explanation, partial credit explanation
- **Mock-mode behaviour**: Section-level timer, no hints, no answer reveal until section ends; unanswered mock responses permitted
- **Official scoring type**: Partial credit (negative marking for incorrect selections)
- **Official scoring traits**: Reading
- **Platform estimated-scoring evidence**: Correct/incorrect per option with negative marking applied
- **Feedback format**: Score with partial credit breakdown, correct and incorrect selections identified
- **Content metadata**: Passage, options, correct answers, scoring rule, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave selections; restore on reload
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Reorder Paragraph

- **Canonical ID**: reorder_paragraph
- **Current official status**: Current official task
- **Section**: Reading
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Task purpose**: Assess ability to understand logical text flow
- **Prompt type**: Text
- **Prompt length**: Text up to 150 words
- **Student interface**: Scrambled text boxes, drag-and-drop ordering area, touch support for reordering
- **Input media**: Text paragraphs
- **Answer format**: Ordered sequence of paragraph identifiers
- **Preparation behaviour**: Read all paragraphs
- **Response behaviour**: Section-level timer, no individual question timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Correct order shown after submission, logical flow explanation, hints on connectors
- **Mock-mode behaviour**: Section-level timer, no hints, no answer reveal until section ends; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Reading
- **Platform estimated-scoring evidence**: Correct adjacent pairs scoring, sequence alignment
- **Feedback format**: Score per correct adjacent pair, correct order comparison
- **Content metadata**: Paragraphs, correct order, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave ordering state; drag state preserved on reload
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Reading: Fill in the Blanks

- **Canonical ID**: reading_fill_blanks
- **Current official status**: Current official task
- **Section**: Reading
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Task purpose**: Assess reading and vocabulary
- **Prompt type**: Text
- **Prompt length**: Text up to 80 words
- **Student interface**: Reading passage with blank spaces, draggable words from a provided list
- **Input media**: Text passage
- **Answer format**: Words assigned to blanks via drag-and-drop
- **Preparation behaviour**: Read passage and word bank
- **Response behaviour**: Section-level timer, no individual question timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Show correct words after submission, hints available per blank
- **Mock-mode behaviour**: Section-level timer, no hints, no answer reveal until section ends; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Reading
- **Platform estimated-scoring evidence**: Correct/incorrect per blank
- **Feedback format**: Correct words highlighted, incorrect blanks shown with correct answer
- **Content metadata**: Passage, blank positions, word bank, correct answers, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave word placements; restore on reload
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Single Answer (Reading)

- **Canonical ID**: reading_single_answer
- **Current official status**: Current official task
- **Section**: Reading
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Task purpose**: Assess reading comprehension
- **Prompt type**: Text
- **Prompt length**: Text up to 300 words
- **Student interface**: Reading passage, radio button list of options
- **Input media**: Text passage
- **Answer format**: Single selected option
- **Preparation behaviour**: Read passage
- **Response behaviour**: Section-level timer, no individual question timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Practice-mode behaviour**: Correct answer and explanation after submission
- **Mock-mode behaviour**: Section-level timer, no hints, no answer reveal until section ends; unanswered mock responses permitted
- **Official scoring type**: Correct/incorrect
- **Official scoring traits**: Reading
- **Platform estimated-scoring evidence**: Exact match against correct answer
- **Feedback format**: Correct or incorrect with correct answer shown and explanation
- **Content metadata**: Passage, options, correct answer, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave selection; restore on reload
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

## Listening

### Summarize Spoken Text

- **Canonical ID**: summarize_spoken_text
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening, Writing
- **Score contributions**: Listening, Writing
- **Task purpose**: Assess listening comprehension and writing
- **Prompt type**: Audio
- **Prompt length**: Audio 60 to 90 seconds
- **Student interface**: Audio playback controls, text input area, word count display
- **Input media**: Audio lecture
- **Answer format**: Written text (50 to 70 words)
- **Preparation behaviour**: Audio plays automatically
- **Response behaviour**: Ten-minute total task timer includes audio playback and writing time, autosave every 5 seconds
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after attempt, extended time option
- **Mock-mode behaviour**: Single playback, 10 minutes total to listen and write, 50-70 word response, no transcript before submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Content, Form, Grammar, Vocabulary, Spelling
- **Platform estimated-scoring evidence**: Content (key point coverage, relevance), Form (word count compliance), Grammar (accuracy, range), Vocabulary (lexical range), Spelling (accuracy)
- **Feedback format**: Component scores, word count, content coverage summary
- **Content metadata**: Audio file, transcript, sample summary, difficulty, source, canonical ID
- **Validation requirements**: Word count within 50-70 range, autosave check
- **Failure and recovery behaviour**: Autosave text; restore on reload; submitted response remains after refresh, API restart and browser restart
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Multiple Answers (Listening)

- **Canonical ID**: listening_multiple_answers
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Task purpose**: Assess listening comprehension
- **Prompt type**: Audio
- **Prompt length**: Audio 80 to 120 seconds
- **Student interface**: Audio playback, checkbox list of options, section timer
- **Input media**: Audio recording
- **Answer format**: Selected checkboxes
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Section-level timer, options available during and after playback
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after submission, correct answers highlighted, explanation
- **Mock-mode behaviour**: Single playback, section-level timer, no transcript before submission, no answer reveal before submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit (negative marking for incorrect selections)
- **Official scoring traits**: Listening
- **Platform estimated-scoring evidence**: Correct/incorrect per option with negative marking applied
- **Feedback format**: Score with partial credit breakdown, correct and incorrect selections
- **Content metadata**: Audio, options, correct answers, transcript, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave selections; restore on reload
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Fill in the Blanks (Listening)

- **Canonical ID**: listening_fill_blanks
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening
- **Score contributions**: Listening, Writing
- **Task purpose**: Assess listening and spelling
- **Prompt type**: Audio
- **Prompt length**: Audio 30 to 60 seconds
- **Student interface**: Audio playback, transcript with blank text inputs, section timer
- **Input media**: Audio recording
- **Answer format**: Typed words in blank text inputs
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Section-level timer, blanks can be filled during and after playback
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after submission, correct words shown
- **Mock-mode behaviour**: Single playback, section-level timer, the incomplete transcript with blanks is displayed because it is part of the official prompt, completed transcript and correct words hidden until review, unanswered blanks permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Listening, Writing
- **Platform estimated-scoring evidence**: Correct/incorrect spelling per blank, exact match required
- **Feedback format**: Correct blanks highlighted, incorrect blanks shown with correct spelling
- **Content metadata**: Audio, transcript, blank positions, correct words, difficulty, source, canonical ID
- **Validation requirements**: Exact spelling match for correct answer
- **Failure and recovery behaviour**: Autosave typed words; restore on reload
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Highlight Correct Summary

- **Canonical ID**: highlight_correct_summary
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening, Reading
- **Score contributions**: Listening, Reading
- **Task purpose**: Assess listening comprehension and summary recognition
- **Prompt type**: Audio
- **Prompt length**: Audio 30 to 90 seconds
- **Student interface**: Audio playback, multiple text summaries as radio options, section timer
- **Input media**: Audio recording
- **Answer format**: Single selected summary
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Section-level timer, selection available during and after playback
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after submission, correct summary highlighted with explanation
- **Mock-mode behaviour**: Single playback, section-level timer, no transcript before submission, no answer reveal before submission; unanswered mock responses permitted
- **Official scoring type**: Correct/incorrect
- **Official scoring traits**: Listening, Reading
- **Platform estimated-scoring evidence**: Exact match against correct summary
- **Feedback format**: Correct or incorrect with correct summary highlighted and justification
- **Content metadata**: Audio, transcript, summaries, correct summary, difficulty, source, canonical ID
- **Validation requirements**: Audio plays fully
- **Failure and recovery behaviour**: Autosave selection; restore on reload
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Single Answer (Listening)

- **Canonical ID**: listening_single_answer
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Task purpose**: Assess listening comprehension
- **Prompt type**: Audio
- **Prompt length**: Audio 30 to 90 seconds
- **Student interface**: Audio playback, radio button options, section timer
- **Input media**: Audio recording
- **Answer format**: Single selected option
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Section-level timer, selection available during and after playback
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after submission, correct answer shown with explanation
- **Mock-mode behaviour**: Single playback, section-level timer, no transcript before submission, no answer reveal before submission; unanswered mock responses permitted
- **Official scoring type**: Correct/incorrect
- **Official scoring traits**: Listening
- **Platform estimated-scoring evidence**: Exact match against correct answer
- **Feedback format**: Correct or incorrect with correct answer shown and explanation
- **Content metadata**: Audio, options, correct answer, transcript, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave selection; restore on reload
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Select Missing Word

- **Canonical ID**: select_missing_word
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Task purpose**: Assess ability to predict missing word from context
- **Prompt type**: Audio
- **Prompt length**: Audio 20 to 70 seconds
- **Student interface**: Audio playback, radio button list of options for missing word, section timer
- **Input media**: Audio recording with terminal beep
- **Answer format**: Single selected option for missing word
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Section-level timer, selection available after playback ends
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after submission, correct word shown with context explanation
- **Mock-mode behaviour**: Single playback, section-level timer, no transcript before submission, no answer reveal before submission; unanswered mock responses permitted
- **Official scoring type**: Correct/incorrect
- **Official scoring traits**: Listening
- **Platform estimated-scoring evidence**: Exact match against correct answer
- **Feedback format**: Correct or incorrect with correct word shown and contextual explanation
- **Content metadata**: Audio (with beep), options, correct word, transcript, difficulty, source, canonical ID
- **Validation requirements**: Audio plays fully
- **Failure and recovery behaviour**: Autosave selection; restore on reload
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Highlight Incorrect Words

- **Canonical ID**: highlight_incorrect_words
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening, Reading
- **Score contributions**: Listening, Reading
- **Task purpose**: Assess listening and reading accuracy
- **Prompt type**: Audio
- **Prompt length**: Audio 15 to 50 seconds
- **Student interface**: Audio playback, displayed transcript with clickable words, section timer
- **Input media**: Audio recording with transcript
- **Answer format**: Selected words in transcript that differ from audio
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Section-level timer, transcript words remain clickable after playback
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, transcript after submission, correct selections highlighted, score explanation
- **Mock-mode behaviour**: Single playback, section-level timer, the task transcript is displayed as part of the prompt, correct incorrect-word selections are hidden until review, unanswered mock responses permitted
- **Official scoring type**: Partial credit (negative marking for incorrect selections)
- **Official scoring traits**: Listening, Reading
- **Platform estimated-scoring evidence**: Correct selections minus incorrect selections
- **Feedback format**: Correct and incorrect selections highlighted, score calculation
- **Content metadata**: Audio, original transcript, modified transcript with errors, correct selections, difficulty, source, canonical ID
- **Validation requirements**: Audio plays fully
- **Failure and recovery behaviour**: Autosave word selections; restore on reload
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Write From Dictation

- **Canonical ID**: write_from_dictation
- **Current official status**: Current official task
- **Section**: Listening
- **Official skills assessed**: Listening, Writing
- **Score contributions**: Listening, Writing
- **Task purpose**: Assess listening and writing accuracy
- **Prompt type**: Audio
- **Prompt length**: Audio 3 to 5 seconds
- **Student interface**: Audio playback, text input area, section timer
- **Input media**: Audio sentence
- **Answer format**: Typed sentence
- **Preparation behaviour**: Audio plays once automatically
- **Response behaviour**: Response time varies by item; text input available after playback
- **Playback limit**: 1
- **Recording limit**: No audio
- **Practice-mode behaviour**: Configurable replay, correct sentence after submission, word-level accuracy shown
- **Mock-mode behaviour**: Single playback only, 3 to 5 second prompt, no replay, no transcript before submission, no answer reveal before submission; unanswered mock responses permitted
- **Official scoring type**: Partial credit
- **Official scoring traits**: Listening, Writing
- **Platform estimated-scoring evidence**: Word-level accuracy against correct sentence
- **Feedback format**: Word-level accuracy, correct sentence shown, incorrect words highlighted
- **Content metadata**: Audio, correct sentence, difficulty, source, canonical ID
- **Validation requirements**: The stored response may be complete, incomplete or empty. Validate payload structure without forcing an answer. Invalid or corrupt payloads are rejected. Learning mode may warn before submission. Timed and mock modes permit no response and score it according to the versioned no-response rule
- **Failure and recovery behaviour**: Autosave typed text; restore on reload; submitted response remains after refresh, API restart and browser restart
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10
