# PTE Task Blueprints

## Speaking and Writing

### Read Aloud

- **Task purpose**: Assess pronunciation and oral fluency
- **Student interface**: Text passage displayed, recording button, countdown timer
- **Input media**: Text passage on screen
- **Answer format**: Audio recording (MP4/WAV)
- **Preparation behaviour**: Fixed preparation time (30-40 seconds), timer counts down, recording indicator before response starts
- **Response behaviour**: Recording active for set duration, automatic stop after time expires
- **Practice-mode behaviour**: Unlimited preparation, replay recording, review transcript
- **Mock-mode behaviour**: Exact official timing, no replay, no pause
- **Scoring components**: Content, pronunciation, oral fluency
- **Feedback format**: Overall score, component scores, transcript comparison
- **Content metadata**: Passage text, source, difficulty, word count, estimated reading time
- **Validation requirements**: Minimum 5-second recording, audio file integrity check
- **Failure and recovery behaviour**: Recording failure shows error and retry option; partial recording saved; server-side check for empty/corrupt audio

### Repeat Sentence

- **Task purpose**: Assess listening and speaking accuracy
- **Student interface**: Audio playback button, recording button after playback
- **Input media**: Audio sentence playback
- **Answer format**: Audio recording
- **Preparation behaviour**: Audio plays once automatically; no text displayed
- **Response behaviour**: Recording starts automatically after playback ends; fixed response time
- **Practice-mode behaviour**: Replay audio limited times; view transcript after attempt
- **Mock-mode behaviour**: Single playback only; no transcript
- **Scoring components**: Content accuracy, pronunciation, fluency
- **Feedback format**: Word-level accuracy, overall score, fluency metrics
- **Content metadata**: Sentence text, audio duration, difficulty, source
- **Validation requirements**: Audio file integrity, minimum duration
- **Failure and recovery behaviour**: Audio load failure aborts task; recording failure retry

### Describe Image

- **Task purpose**: Assess ability to describe visual information
- **Student interface**: Image display, recording button, preparation and response timers
- **Input media**: Static image (graph, chart, map, process, picture)
- **Answer format**: Audio recording
- **Preparation behaviour**: Fixed preparation time (25 seconds) with visible image
- **Response behaviour**: Fixed response time (40 seconds)
- **Practice-mode behaviour**: Extended preparation, replay recording, sample answer
- **Mock-mode behaviour**: Exact official timing
- **Scoring components**: Content, pronunciation, fluency
- **Feedback format**: Content coverage score, key point detection, fluency metrics
- **Content metadata**: Image file, image type, key points, difficulty, source
- **Validation requirements**: Image renders correctly, recording quality check
- **Failure and recovery behaviour**: Image load failure shows error; recording failure retry

### Retell Lecture

- **Task purpose**: Assess listening comprehension and summarisation
- **Student interface**: Audio playback with optional image, recording button after playback
- **Input media**: Audio lecture with optional accompanying image
- **Answer format**: Audio recording
- **Preparation behaviour**: Audio plays automatically; image displayed if available
- **Response behaviour**: Fixed response time (40 seconds) after playback ends
- **Practice-mode behaviour**: Replay lecture limited times; view transcript after attempt
- **Mock-mode behaviour**: Single playback only
- **Scoring components**: Content, pronunciation, fluency
- **Feedback format**: Content coverage score, key points detected, fluency metrics
- **Content metadata**: Lecture audio, transcript, key points, difficulty, source
- **Validation requirements**: Audio file integrity, lecture duration
- **Failure and recovery behaviour**: Audio load failure aborts task; recording failure retry

### Answer Short Question

- **Task purpose**: Assess ability to understand and respond concisely
- **Student interface**: Audio or text question, recording or text input
- **Input media**: Audio question (with optional text)
- **Answer format**: Short audio recording or single word/phrase text
- **Preparation behaviour**: Question plays once
- **Response behaviour**: Fixed response time (10 seconds)
- **Practice-mode behaviour**: Replay question, view correct answer after attempt
- **Mock-mode behaviour**: Single playback only
- **Scoring components**: Correct/incorrect answer
- **Feedback format**: Correct or incorrect with correct answer shown
- **Content metadata**: Question, answer, difficulty, topic, source
- **Validation requirements**: Answer matching against accepted answers list
- **Failure and recovery behaviour**: Audio load failure shows text fallback

### Summarize Group Discussion

- **Task purpose**: Assess ability to summarise a conversation (not yet official, included for future readiness)
- **Student interface**: Audio recording of group discussion, recording button
- **Input media**: Multi-speaker audio
- **Answer format**: Audio recording
- **Preparation behaviour**: Audio plays once
- **Response behaviour**: Fixed response time
- **Scoring components**: Content, pronunciation, fluency
- **Feedback format**: Content coverage, key point accuracy
- **Content metadata**: Discussion audio, transcript, key points
- **Validation requirements**: Multi-speaker audio clarity
- **Failure and recovery behaviour**: Audio load failure; recording retry

### Respond to a Situation

- **Task purpose**: Assess ability to respond appropriately in a scenario (future task)
- **Student interface**: Written scenario, recording button
- **Input media**: Text scenario
- **Answer format**: Audio recording
- **Scoring components**: Appropriateness, pronunciation, fluency
- **Feedback format**: Content score, language use
- **Content metadata**: Scenario text, appropriate response, difficulty
- **Failure and recovery behaviour**: Recording failure retry

### Summarize Written Text

- **Task purpose**: Assess reading comprehension and summarisation
- **Student interface**: Reading passage, text input area, word count
- **Input media**: Text passage
- **Answer format**: Written text (single sentence, 5-75 words)
- **Preparation behaviour**: Reading time before response
- **Response behaviour**: Fixed response time (10 minutes)
- **Practice-mode behaviour**: Extended time, hints, multiple attempts
- **Mock-mode behaviour**: Exact official timing
- **Scoring components**: Content, form, grammar, vocabulary
- **Feedback format**: Score per component, word count, sentence structure feedback
- **Content metadata**: Passage text, sample summary, difficulty, source
- **Validation requirements**: Word count within range, single sentence validation
- **Failure and recovery behaviour**: Autosave every 5 seconds; restore on reload

### Write Essay

- **Task purpose**: Assess writing ability
- **Student interface**: Essay prompt, text editor with word count, formatting
- **Input media**: Text prompt
- **Answer format**: Written essay (200-300 words)
- **Preparation behaviour**: Reading prompt
- **Response behaviour**: Fixed response time (20 minutes)
- **Practice-mode behaviour**: Extended time, outline tool, spell check
- **Mock-mode behaviour**: Exact official timing
- **Scoring components**: Content, form, structure, coherence, grammar, vocabulary, linguistic range, spelling
- **Feedback format**: Component scores, overall score, specific suggestions
- **Content metadata**: Essay prompt, sample essay, difficulty, topic, source
- **Validation requirements**: Word count within range, autosave check
- **Failure and recovery behaviour**: Autosave every 5 seconds; restore on reload; word count preserved

## Reading

### Reading and Writing: Fill in the Blanks

- **Task purpose**: Assess reading comprehension and vocabulary
- **Student interface**: Reading passage with dropdown menus in blanks
- **Input media**: Text passage
- **Answer format**: Selected words per blank from dropdown list
- **Preparation behaviour**: Read passage
- **Response behaviour**: No per-question timer; section timer applies
- **Practice-mode behaviour**: Show correct answers after submission
- **Mock-mode behaviour**: Section-level timing only
- **Scoring components**: Correct/incorrect per blank
- **Feedback format**: Correct blanks highlighted, incorrect shown with correct answer
- **Content metadata**: Passage, blank positions, answer options, correct answers, difficulty, source
- **Validation requirements**: All blanks must have a selection before submission
- **Failure and recovery behaviour**: Autosave selections; restore on reload

### Multiple Choice, Multiple Answers

- **Task purpose**: Assess reading comprehension with multiple correct options
- **Student interface**: Reading passage, checkbox list of options
- **Input media**: Text passage
- **Answer format**: Selected checkboxes
- **Scoring components**: Partial credit per correct selection; penalty for incorrect selections
- **Feedback format**: Score with partial credit breakdown
- **Content metadata**: Passage, options, correct answers, scoring rule, difficulty, source
- **Validation requirements**: At least one selection accepted
- **Failure and recovery behaviour**: Autosave selections

### Reorder Paragraph

- **Task purpose**: Assess ability to understand logical text flow
- **Student interface**: Scrambled text boxes, drag-and-drop ordering area
- **Input media**: Text paragraphs
- **Answer format**: Ordered sequence of paragraph identifiers
- **Scoring components**: Correct adjacent pairs scoring
- **Feedback format**: Score per correct adjacent pair, correct order shown
- **Content metadata**: Paragraphs, correct order, difficulty, source
- **Validation requirements**: All paragraphs must be placed in order
- **Failure and recovery behaviour**: Autosave ordering state; drag state preserved

### Reading: Fill in the Blanks

- **Task purpose**: Assess reading and vocabulary
- **Student interface**: Reading passage with blank spaces, drag words from list
- **Input media**: Text passage
- **Answer format**: Words assigned to blanks
- **Scoring components**: Correct/incorrect per blank
- **Feedback format**: Correct words highlighted, incorrect shown with correct answer
- **Content metadata**: Passage, blank positions, word bank, correct answers, difficulty, source
- **Validation requirements**: All blanks filled before submission
- **Failure and recovery behaviour**: Autosave word placements

### Multiple Choice, Single Answer

- **Task purpose**: Assess reading comprehension
- **Student interface**: Reading passage, radio button list of options
- **Input media**: Text passage
- **Answer format**: Single selected option
- **Scoring components**: Correct/incorrect
- **Feedback format**: Correct or incorrect with correct answer shown
- **Content metadata**: Passage, options, correct answer, difficulty, source
- **Validation requirements**: Exactly one selection
- **Failure and recovery behaviour**: Autosave selection

## Listening

### Summarize Spoken Text

- **Task purpose**: Assess listening comprehension and writing
- **Student interface**: Audio playback, text input area, word count
- **Input media**: Audio lecture
- **Answer format**: Written text (50-70 words)
- **Preparation behaviour**: Audio plays automatically
- **Response behaviour**: Fixed response time (10 minutes from audio end)
- **Practice-mode behaviour**: Replay audio, extended time
- **Mock-mode behaviour**: Single playback, exact timing
- **Scoring components**: Content, form, grammar, vocabulary
- **Feedback format**: Component scores, word count, content coverage
- **Content metadata**: Audio file, transcript, sample summary, difficulty, source
- **Validation requirements**: Word count 50-70
- **Failure and recovery behaviour**: Autosave text; restore on reload

### Multiple Choice, Multiple Answers (Listening)

- **Task purpose**: Assess listening comprehension
- **Student interface**: Audio playback, checkbox list of options
- **Input media**: Audio recording
- **Answer format**: Selected checkboxes
- **Scoring components**: Partial credit per correct selection; penalty for incorrect
- **Feedback format**: Score with partial credit breakdown
- **Content metadata**: Audio, options, correct answers, transcript, difficulty, source
- **Validation requirements**: Audio plays fully; at least one selection accepted
- **Failure and recovery behaviour**: Autosave selections

### Fill in the Blanks (Listening)

- **Task purpose**: Assess listening and spelling
- **Student interface**: Audio playback, transcript with blank text inputs
- **Input media**: Audio recording
- **Answer format**: Typed words in blank text inputs
- **Scoring components**: Correct/incorrect spelling per blank
- **Feedback format**: Correct and incorrect blanks highlighted
- **Content metadata**: Audio, transcript, blank positions, correct words, difficulty, source
- **Validation requirements**: Exact spelling match for correct answer
- **Failure and recovery behaviour**: Autosave typed words

### Highlight Correct Summary

- **Task purpose**: Assess listening comprehension
- **Student interface**: Audio playback, multiple text summaries as options
- **Input media**: Audio recording
- **Answer format**: Single selected summary
- **Scoring components**: Correct/incorrect
- **Feedback format**: Correct or incorrect with correct summary highlighted
- **Content metadata**: Audio, transcript, summaries, correct summary, difficulty, source
- **Validation requirements**: Audio plays fully
- **Failure and recovery behaviour**: Autosave selection

### Multiple Choice, Single Answer (Listening)

- **Task purpose**: Assess listening comprehension
- **Student interface**: Audio playback, radio button options
- **Input media**: Audio recording
- **Answer format**: Single selected option
- **Scoring components**: Correct/incorrect
- **Feedback format**: Correct or incorrect with correct answer shown
- **Content metadata**: Audio, options, correct answer, transcript, difficulty, source
- **Validation requirements**: Audio plays fully; exactly one selection
- **Failure and recovery behaviour**: Autosave selection

### Select Missing Word

- **Task purpose**: Assess ability to predict missing word
- **Student interface**: Audio playback with option list, last word replaced by beep
- **Input media**: Audio recording
- **Answer format**: Single selected option for missing word
- **Scoring components**: Correct/incorrect
- **Feedback format**: Correct or incorrect with correct word shown
- **Content metadata**: Audio (with beep), options, correct word, transcript, difficulty, source
- **Validation requirements**: Audio plays fully
- **Failure and recovery behaviour**: Autosave selection

### Highlight Incorrect Words

- **Task purpose**: Assess listening and reading accuracy
- **Student interface**: Audio playback, displayed transcript with clickable words
- **Input media**: Audio recording with transcript
- **Answer format**: Selected words in transcript that differ from audio
- **Scoring components**: Correct selections minus incorrect selections
- **Feedback format**: Correct and incorrect selections highlighted
- **Content metadata**: Audio, original transcript, modified transcript with errors, correct selections, difficulty, source
- **Validation requirements**: Audio plays fully
- **Failure and recovery behaviour**: Autosave word selections

### Write From Dictation

- **Task purpose**: Assess listening and writing accuracy
- **Student interface**: Audio playback, text input area
- **Input media**: Audio sentence
- **Answer format**: Typed sentence
- **Preparation behaviour**: Audio plays automatically once
- **Response behaviour**: Fixed response time
- **Practice-mode behaviour**: Replay audio limited times
- **Mock-mode behaviour**: Single playback only
- **Scoring components**: Correct/incorrect per word
- **Feedback format**: Word-level accuracy, correct sentence shown
- **Content metadata**: Audio, correct sentence, difficulty, source
- **Validation requirements**: Non-empty response
- **Failure and recovery behaviour**: Autosave typed text
