# PTE Task Blueprints

Auto-generated from pte-task-manifest.json. Do not edit manually.

## Speaking and Writing

### Read Aloud

- **Canonical ID**: read_aloud
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess pronunciation and oral fluency
- **Official skills assessed**: Speaking
- **Score contributions**: Reading, Speaking
- **Prompt type**: Text
- **Prompt length**: Text up to 60 words
- **Student interface**: Text passage displayed, preparation countdown and recording status box. The microphone opens automatically after the tone.
- **Input media**: Text passage on screen
- **Answer format**: Audio recording
- **Preparation behaviour**: Item-dependent (varies by item)
- **Response behaviour**: Item-dependent (varies)
- **Playback limit**: No audio
- **Recording limit**: 1
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Pronunciation, Oral fluency
- **Official human-reviewed traits**: None — AI-scored only
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Content (word alignment and sequence comparison against expected passage), Pronunciation (phonetic accuracy, stress patterns, intelligibility), Oral fluency (speech rate, pause frequency, rhythm)
- **Feedback format**: Component scores, overall estimated score, transcript comparison, fluency metrics
- **Content metadata**: Passage text, source, difficulty, word count, estimated reading time, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay of own recording, transcript after attempt, hints, model answer, extended preparation option
- **Mock mode**: microphone opens automatically after countdown/tone, item-dependent response duration, one recording, no hints, no transcript before submission, no answer correction after submission
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Repeat Sentence

- **Canonical ID**: repeat_sentence
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess listening and speaking accuracy
- **Official skills assessed**: Listening, Speaking
- **Score contributions**: Listening, Speaking
- **Prompt type**: Audio
- **Prompt length**: Audio 3 to 9 seconds
- **Student interface**: Audio playback occurs automatically, recording activates after playback ends, countdown timer
- **Input media**: Audio sentence playback
- **Answer format**: Audio recording
- **Preparation behaviour**: Immediate
- **Response behaviour**: 15 seconds
- **Playback limit**: 1
- **Recording limit**: 1
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Pronunciation, Oral fluency
- **Official human-reviewed traits**: None — AI-scored only
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Word-level alignment against expected sentence, Pronunciation (phonetic accuracy, stress, intelligibility), Oral fluency (speech rate, pause frequency)
- **Feedback format**: Word-level accuracy, overall estimated score, fluency metrics
- **Content metadata**: Sentence text, audio duration, difficulty, source, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after attempt, slow playback, repeat attempt
- **Mock mode**: single playback, 15-second answer period, one recording, no transcript before submission
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Describe Image

- **Canonical ID**: describe_image
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess ability to describe an image orally
- **Official skills assessed**: Speaking
- **Score contributions**: Speaking
- **Prompt type**: Image
- **Prompt length**: Not applicable (1 image stored as separate interface requirement)
- **Student interface**: Image displayed with preparation countdown and recording status box. The microphone opens automatically after the tone.
- **Input media**: Static image on screen
- **Answer format**: Audio recording
- **Preparation behaviour**: 25 seconds preparation
- **Response behaviour**: 40 seconds
- **Playback limit**: No audio
- **Recording limit**: 1
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Pronunciation, Oral fluency
- **Official human-reviewed traits**: Content
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Relevant content concepts, Organisation of spoken response, Pronunciation (phonetic accuracy, stress patterns, intelligibility), Oral fluency (speech rate, pause frequency)
- **Feedback format**: Component scores, overall estimated score, model response comparison, fluency metrics
- **Content metadata**: Image file, description, difficulty, source, canonical ID
- **Image requirement**: One image displayed as part of the student interface (not part of official prompt-length measurement)
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: extended preparation, configurable replay, transcript, model response, hints on key features
- **Mock mode**: 25-second preparation, 40-second response, one recording, no replay, no hints
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Retell Lecture

- **Canonical ID**: retell_lecture
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess listening comprehension and oral summarisation
- **Official skills assessed**: Listening, Speaking
- **Score contributions**: Listening, Speaking
- **Prompt type**: Audio Or Video
- **Prompt length**: Audio up to 90 seconds
- **Student interface**: Audio or video playback with an optional related image, preparation countdown and recording status box. The microphone opens automatically after the tone.
- **Input media**: Audio or audiovisual recording, optional related image may be displayed
- **Answer format**: Audio recording
- **Preparation behaviour**: 10 seconds preparation
- **Response behaviour**: 40 seconds
- **Playback limit**: 1
- **Recording limit**: 1
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Pronunciation, Oral fluency
- **Official human-reviewed traits**: Content
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Key content points from lecture, Coverage of main ideas, Organisation of spoken response, Pronunciation (phonetic accuracy, stress patterns, intelligibility), Oral fluency (speech rate, pause frequency)
- **Feedback format**: Component scores, overall estimated score, key points covered, fluency metrics
- **Content metadata**: Audio or audiovisual file, transcript, difficulty, source, duration, canonical ID
- **Audiovisual support**: Supports audio or audiovisual input; optional related image may be displayed
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after attempt, hints on key points, model response
- **Mock mode**: single playback only, 10-second preparation, 40-second response, one recording, no transcript before submission
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Answer Short Question

- **Canonical ID**: answer_short_question
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess listening comprehension and concise spoken response
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Prompt type**: Audio
- **Prompt length**: Audio 3 to 9 seconds
- **Student interface**: Audio question plays automatically, optional accompanying image may be displayed, recording activates after playback
- **Input media**: Audio question, optional accompanying image may be displayed
- **Answer format**: Audio recording
- **Preparation behaviour**: Immediate
- **Response behaviour**: 10 seconds
- **Playback limit**: 1
- **Recording limit**: 1
- **Official scoring type**: Correct/Incorrect
- **Official rubric traits**: Vocabulary
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Vocabulary-based matching against acceptable answers
- **Feedback format**: Correct answer shown, vocabulary match score, overall estimated score
- **Content metadata**: Question text, audio file, acceptable answers, difficulty, canonical ID
- **Optional image**: Audio question is required; an accompanying image is optional
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, correct answer after submission, hints
- **Mock mode**: single playback, 10-second answer period, one microphone recording, no text-response fallback, no answer reveal before submission
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Summarize Group Discussion

- **Canonical ID**: summarize_group_discussion
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess multi-speaker listening comprehension and oral summary
- **Official skills assessed**: Listening, Speaking
- **Score contributions**: Listening, Speaking
- **Prompt type**: Audio
- **Prompt length**: Audio up to 180 seconds
- **Student interface**: Audio playback of group discussion with preparation countdown and recording status box. The microphone opens automatically after the tone.
- **Input media**: Audio recording of group discussion
- **Answer format**: Audio recording
- **Preparation behaviour**: 10 seconds preparation
- **Response behaviour**: 2 minutes
- **Playback limit**: 1
- **Recording limit**: 1
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Pronunciation, Oral fluency
- **Official human-reviewed traits**: Content
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Coverage of different speaker viewpoints, Key content points, Organisation of spoken summary, Pronunciation, Oral fluency
- **Feedback format**: Component scores, overall estimated score, speaker coverage, fluency metrics
- **Content metadata**: Audio file, speaker count, transcript, difficulty, duration, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after attempt, hints on summarisation strategy, model response
- **Mock mode**: single playback, 10-second preparation, 2-minute response, one recording, no transcript before submission
- **Official reference IDs**: source-1, source-2, source-5, source-6
- **Last verified date**: 2026-07-10

### Respond to a Situation

- **Canonical ID**: respond_to_situation
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess ability to respond appropriately to a written and spoken scenario
- **Official skills assessed**: Speaking
- **Score contributions**: Speaking
- **Prompt type**: Text And Audio
- **Prompt length**: Text up to 60 words
- **Student interface**: Text and audio prompt with preparation countdown and recording status box. The microphone opens automatically after the tone.
- **Input media**: Text prompt and audio recording
- **Answer format**: Audio recording
- **Preparation behaviour**: 10 seconds preparation
- **Response behaviour**: 40 seconds
- **Playback limit**: 1
- **Recording limit**: 1
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Pronunciation, Oral fluency
- **Official human-reviewed traits**: Content
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Situational goal completion, Appropriateness of response, Organisation, Pronunciation, Oral fluency
- **Feedback format**: Component scores, overall estimated score, goal completion, fluency metrics
- **Content metadata**: Scenario text, audio file, difficulty, source, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":true,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after attempt, model response, hints on situational goal
- **Mock mode**: text and audio both required, single playback, 10-second preparation, 40-second spoken response, one recording, no hints
- **Official reference IDs**: source-1, source-2, source-5, source-6
- **Last verified date**: 2026-07-10

### Summarize Written Text

- **Canonical ID**: summarize_written_text
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess reading comprehension and written summarisation
- **Official skills assessed**: Reading, Writing
- **Score contributions**: Reading, Writing
- **Prompt type**: Text
- **Prompt length**: Text up to 300 words
- **Student interface**: Text passage displayed, text input area, response timer
- **Input media**: Text passage on screen
- **Answer format**: Text response (single sentence)
- **Preparation behaviour**: Immediate
- **Response behaviour**: 10 minutes
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Form, Grammar, Vocabulary
- **Official human-reviewed traits**: Content
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Content relevance and task completion, Form adherence, Grammatical accuracy and range, Vocabulary range and appropriateness
- **Feedback format**: Component scores, overall estimated score, model answer comparison
- **Content metadata**: Passage text, source, difficulty, word count, reading time, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: extended time, outline tool, model response, multiple attempts
- **Mock mode**: 10-minute timer, single sentence, 5-75 word limit, autosave, no hints, no spell check
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

### Write Essay

- **Canonical ID**: write_essay
- **Current official status**: Current official task
- **Section**: Speaking and Writing
- **Task purpose**: Assess written composition skills
- **Official skills assessed**: Writing
- **Score contributions**: Writing
- **Prompt type**: Text
- **Prompt length**: Text 2 to 3 sentences
- **Student interface**: Essay prompt displayed, text input area with word count, response timer
- **Input media**: Text prompt on screen
- **Answer format**: Text response (200-300 words)
- **Preparation behaviour**: Immediate
- **Response behaviour**: 20 minutes
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Form, Development, Structure and Coherence, Grammar, General Linguistic Range, Vocabulary Range, Spelling
- **Official human-reviewed traits**: Content, Development, Structure and Coherence, General Linguistic Range
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Content relevance, Form adherence, Development, Structure and Coherence, Grammatical accuracy and range, General Linguistic Range, Vocabulary Range, Spelling
- **Feedback format**: Component scores, overall estimated score, model answer, specific improvement suggestions
- **Content metadata**: Prompt text, source, difficulty, word count guidelines, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: extended time option, outline tool, spell check, model response, multiple attempts
- **Mock mode**: 20-minute response, 200-300 words, autosave, no spell check, no outlines
- **Official reference IDs**: source-1, source-2, source-6
- **Last verified date**: 2026-07-10

## Reading

### Reading and Writing: Fill in the Blanks

- **Canonical ID**: reading_writing_fill_blanks
- **Current official status**: Current official task
- **Section**: Reading
- **Task purpose**: Assess reading comprehension and vocabulary in context
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Prompt type**: Text
- **Prompt length**: Text up to 300 words
- **Student interface**: Text passage with dropdown menus at each blank, section-level timer
- **Input media**: Text passage with dropdown menus
- **Answer format**: Dropdown selections
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Per-correct-blank: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Per-blank exact match: +1 correct, 0 incorrect, minimum 0 per item
- **Feedback format**: Per-blank correct/incorrect indication, overall estimated score
- **Content metadata**: Passage text, blank positions, dropdown options, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: show correct answers after submission, hints for each blank, explanation of vocabulary
- **Mock mode**: section-level timer, no hints, no answer reveal until section ends, no partial feedback
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Multiple Answers (Reading)

- **Canonical ID**: reading_multiple_answers
- **Current official status**: Current official task
- **Section**: Reading
- **Task purpose**: Assess reading comprehension with multiple correct answers
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Prompt type**: Text
- **Prompt length**: Text up to 350 words
- **Student interface**: Text passage with checkbox options, section-level timer
- **Input media**: Text passage with checkbox options
- **Answer format**: Checkbox selections
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Partial credit (negative marking)
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Selection with negative marking: +1 correct, -1 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Selection with negative marking: +1 correct, -1 incorrect, minimum 0 per item
- **Feedback format**: Per-selection correct/incorrect indication, overall estimated score
- **Content metadata**: Passage text, options, correct answer set, difficulty, source, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: show correct answers after submission, explanation, partial credit explanation
- **Mock mode**: section-level timer, no hints, no answer reveal until section ends
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Reorder Paragraph

- **Canonical ID**: reorder_paragraph
- **Current official status**: Current official task
- **Section**: Reading
- **Task purpose**: Assess ability to understand logical text organisation
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Prompt type**: Text
- **Prompt length**: Text up to 150 words
- **Student interface**: Draggable text boxes, section-level timer
- **Input media**: Draggable text boxes
- **Answer format**: Drag-and-drop ordering
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Adjacent pair order: +1 correct pair, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Adjacent-pair ordering: +1 per correct adjacent pair, 0 per incorrect pair, minimum 0 per item
- **Feedback format**: Correct order shown after submission, logical flow explanation
- **Content metadata**: Paragraph texts, correct order, difficulty, source, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: correct order shown after submission, logical flow explanation, hints on connectors
- **Mock mode**: section-level timer, no hints, no answer reveal until section ends
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Reading: Fill in the Blanks

- **Canonical ID**: reading_fill_blanks
- **Current official status**: Current official task
- **Section**: Reading
- **Task purpose**: Assess reading comprehension and vocabulary
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Prompt type**: Text
- **Prompt length**: Text up to 80 words
- **Student interface**: Text passage with blank spaces and draggable word bank, section-level timer
- **Input media**: Text passage with blank spaces and word bank
- **Answer format**: Drag-words-to-blanks placements
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Per-correct-word: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Per-correct-word placement: +1 correct, 0 incorrect, minimum 0 per item
- **Feedback format**: Per-blank correct words shown after submission, overall estimated score
- **Content metadata**: Passage text, blank positions, word bank, difficulty, source, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: show correct words after submission, hints available per blank
- **Mock mode**: section-level timer, no hints, no answer reveal until section ends
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Single Answer (Reading)

- **Canonical ID**: reading_single_answer
- **Current official status**: Current official task
- **Section**: Reading
- **Task purpose**: Assess reading comprehension with single correct answer
- **Official skills assessed**: Reading
- **Score contributions**: Reading
- **Prompt type**: Text
- **Prompt length**: Text up to 300 words
- **Student interface**: Text passage with radio-button options, section-level timer
- **Input media**: Text passage with radio-button options
- **Answer format**: Radio-button selection
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: No audio
- **Recording limit**: No audio
- **Official scoring type**: Correct/Incorrect
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 per item
- **Feedback format**: Correct answer shown with explanation, overall estimated score
- **Content metadata**: Passage text, options, correct answer, difficulty, source, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: correct answer and explanation after submission
- **Mock mode**: section-level timer, no hints, no answer reveal until section ends
- **Official reference IDs**: source-1, source-3, source-6
- **Last verified date**: 2026-07-10

## Listening

### Summarize Spoken Text

- **Canonical ID**: summarize_spoken_text
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening comprehension and written summarisation
- **Official skills assessed**: Listening, Writing
- **Score contributions**: Listening, Writing
- **Prompt type**: Audio
- **Prompt length**: Audio 60 to 90 seconds
- **Student interface**: Audio playback, text input area, total task timer includes listening and writing
- **Input media**: Audio recording
- **Answer format**: Text response (50-70 words)
- **Preparation behaviour**: Immediate
- **Response behaviour**: Ten minutes total includes listening and writing
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: Content, Form, Grammar, Vocabulary, Spelling
- **Official human-reviewed traits**: Content
- **Platform estimated-scoring rule**: Rubric-based estimate (platform produces estimated training feedback; does not reproduce Pearson's private scoring engine)
- **Platform estimated-scoring evidence**: Content relevance and key points, Form adherence, Grammatical accuracy and range, Vocabulary range and appropriateness, Spelling accuracy
- **Feedback format**: Component scores, overall estimated score, model answer comparison
- **Content metadata**: Audio file, transcript, difficulty, duration, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after attempt, extended time option
- **Mock mode**: single playback, 10 minutes total to listen and write, 50-70 word response, no transcript before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Multiple Answers (Listening)

- **Canonical ID**: listening_multiple_answers
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening comprehension with multiple correct answers
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Prompt type**: Audio
- **Prompt length**: Audio 80 to 120 seconds
- **Student interface**: Audio playback, checkbox options, section-level timer
- **Input media**: Audio recording
- **Answer format**: Checkbox selections
- **Preparation behaviour**: 7 seconds preparation
- **Response behaviour**: Section-level timer
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Partial credit (negative marking)
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Selection with negative marking: +1 correct, -1 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Selection with negative marking: +1 correct, -1 incorrect, minimum 0 per item
- **Feedback format**: Per-selection correct/incorrect indication, overall estimated score
- **Content metadata**: Audio file, options, correct answer set, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after submission, correct answers highlighted, explanation
- **Mock mode**: single playback, section-level timer, no transcript before submission, no answer reveal before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Fill in the Blanks (Listening)

- **Canonical ID**: listening_fill_blanks
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening comprehension and accurate spelling
- **Official skills assessed**: Listening
- **Score contributions**: Listening, Writing
- **Prompt type**: Audio
- **Prompt length**: Audio 30 to 60 seconds
- **Student interface**: Audio playback, incomplete transcript with blanks displayed before and during playback, text input per blank, section-level timer
- **Input media**: Audio recording with partially displayed transcript
- **Answer format**: Text input per blank
- **Preparation behaviour**: 7 seconds preparation
- **Response behaviour**: Section-level timer
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Per-correct-word: +1 correct, 0 incorrect, minimum 0, requires correct spelling (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Per-correct-word: +1 correct, 0 incorrect, requires correct spelling, minimum 0 per item
- **Feedback format**: Correct words shown after submission, overall estimated score
- **Content metadata**: Audio file, transcript with blanks, correct words, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after submission, correct words shown
- **Mock mode**: single playback, section-level timer, the incomplete transcript with blanks is displayed before and during playback because it is part of the official prompt, no answer reveal before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Highlight Correct Summary

- **Canonical ID**: highlight_correct_summary
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening comprehension and ability to identify correct summary
- **Official skills assessed**: Listening, Reading
- **Score contributions**: Listening, Reading
- **Prompt type**: Audio
- **Prompt length**: Audio 30 to 90 seconds
- **Student interface**: Audio playback, radio-button summary options, section-level timer
- **Input media**: Audio recording
- **Answer format**: Radio-button selection
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Correct/Incorrect
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 per item
- **Feedback format**: Correct summary highlighted with explanation, overall estimated score
- **Content metadata**: Audio file, summary options, correct summary, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after submission, correct summary highlighted with explanation
- **Mock mode**: single playback, section-level timer, no transcript before submission, no answer reveal before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Multiple Choice, Single Answer (Listening)

- **Canonical ID**: listening_single_answer
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening comprehension with single correct answer
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Prompt type**: Audio
- **Prompt length**: Audio 30 to 90 seconds
- **Student interface**: Audio playback, radio-button options, section-level timer
- **Input media**: Audio recording
- **Answer format**: Radio-button selection
- **Preparation behaviour**: 5 seconds preparation
- **Response behaviour**: Section-level timer
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Correct/Incorrect
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 per item
- **Feedback format**: Correct answer shown with explanation, overall estimated score
- **Content metadata**: Audio file, options, correct answer, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after submission, correct answer shown with explanation
- **Mock mode**: single playback, section-level timer, no transcript before submission, no answer reveal before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Select Missing Word

- **Canonical ID**: select_missing_word
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess ability to predict missing word from context
- **Official skills assessed**: Listening
- **Score contributions**: Listening
- **Prompt type**: Audio
- **Prompt length**: Audio 20 to 70 seconds
- **Student interface**: Audio playback, radio-button options for missing word, section-level timer
- **Input media**: Audio recording with transcript ending before missing word
- **Answer format**: Radio-button selection
- **Preparation behaviour**: Immediate
- **Response behaviour**: Section-level timer
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Correct/Incorrect
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Correct/Incorrect: +1 correct, 0 incorrect, minimum 0 per item
- **Feedback format**: Correct word shown with context explanation, overall estimated score
- **Content metadata**: Audio file, transcript with missing word marked, options, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after submission, correct word shown with context explanation
- **Mock mode**: single playback, section-level timer, no transcript before submission, no answer reveal before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Highlight Incorrect Words

- **Canonical ID**: highlight_incorrect_words
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening accuracy and reading verification
- **Official skills assessed**: Listening, Reading
- **Score contributions**: Listening, Reading
- **Prompt type**: Audio
- **Prompt length**: Audio 15 to 50 seconds
- **Student interface**: Audio playback, transcript with clickable words displayed, section-level timer
- **Input media**: Audio recording with displayed transcript
- **Answer format**: Clickable-text selections
- **Preparation behaviour**: 10 seconds preparation
- **Response behaviour**: Section-level timer
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Partial credit (negative marking)
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Selection with negative marking: +1 correct, -1 incorrect, minimum 0 (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Selection with negative marking: +1 correct, -1 incorrect, minimum 0 per item
- **Feedback format**: Correct selections highlighted, score explanation, overall estimated score
- **Content metadata**: Audio file, transcript with incorrect words marked, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, transcript after submission, correct selections highlighted, score explanation
- **Mock mode**: single playback, section-level timer, no transcript highlighting before submission, no answer reveal before submission
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10

### Write From Dictation

- **Canonical ID**: write_from_dictation
- **Current official status**: Current official task
- **Section**: Listening
- **Task purpose**: Assess listening accuracy and written reproduction
- **Official skills assessed**: Listening, Writing
- **Score contributions**: Listening, Writing
- **Prompt type**: Audio
- **Prompt length**: Audio 3 to 5 seconds
- **Student interface**: Audio playback, text input area
- **Input media**: Audio recording
- **Answer format**: Text input (sentence)
- **Preparation behaviour**: Immediate
- **Response behaviour**: Item-dependent (varies)
- **Playback limit**: 1
- **Recording limit**: No audio
- **Official scoring type**: Partial credit
- **Official rubric traits**: None — objective scoring
- **Official human-reviewed traits**: None — objective scoring
- **Platform estimated-scoring rule**: Per-correct-word: +1 correct, 0 incorrect, minimum 0, requires correct spelling (platform produces estimated training score)
- **Platform estimated-scoring evidence**: Per-correct-word: +1 correct, 0 incorrect, requires correct spelling, minimum 0 per item
- **Feedback format**: Correct sentence shown, word-level accuracy, overall estimated score
- **Content metadata**: Audio file, correct sentence, difficulty, canonical ID
- **Response validation**: {"allowedSubmissionStates":["complete","incomplete","empty"],"rejectCorruptPayload":true,"learningModeWarnBeforeSubmit":true,"timedModeForceAnswer":false,"noResponseScore":0}
- **Failure and recovery behaviour**: {"autosaveRequired":true,"preserveLocalResponseUntilConfirmed":true,"resumableUploadRequired":false,"audioLoadFailureAction":"retry-or-block-with-actionable-error","duplicateSubmissionPrevention":true}
- **Prompt transcript requirement**: Not required
- **Post-attempt transcript availability**: Available
- **Practice mode**: configurable replay, correct sentence after submission, word-level accuracy shown
- **Mock mode**: single playback, 3 to 5 second prompt, no replay, no transcript before submission, word-level partial credit
- **Official reference IDs**: source-1, source-4, source-6
- **Last verified date**: 2026-07-10
