export interface TranscriptPolicy {
  /** Whether the transcript is available during the active attempt. */
  showDuringAttempt: boolean;
  /** Whether the transcript is available in review mode. */
  showDuringReview: boolean;
  /** Whether correct answers are available in review mode. */
  showCorrectAnswersInReview: boolean;
}

const TRANSCRIPT_POLICIES: Record<string, TranscriptPolicy> = {
  summarise_spoken_text: {
    showDuringAttempt: false,
    showDuringReview: false,
    showCorrectAnswersInReview: true,
  },
  listening_single_answer: {
    showDuringAttempt: false,
    showDuringReview: false,
    showCorrectAnswersInReview: true,
  },
  listening_multiple_answers: {
    showDuringAttempt: false,
    showDuringReview: false,
    showCorrectAnswersInReview: true,
  },
  listening_fill_blanks: {
    showDuringAttempt: true,
    showDuringReview: true,
    showCorrectAnswersInReview: true,
  },
  highlight_correct_summary: {
    showDuringAttempt: false,
    showDuringReview: false,
    showCorrectAnswersInReview: true,
  },
  select_missing_word: {
    showDuringAttempt: true,
    showDuringReview: true,
    showCorrectAnswersInReview: true,
  },
  highlight_incorrect_words: {
    showDuringAttempt: true,
    showDuringReview: true,
    showCorrectAnswersInReview: true,
  },
  write_from_dictation: {
    showDuringAttempt: false,
    showDuringReview: false,
    showCorrectAnswersInReview: true,
  },
};

export function getTranscriptPolicy(taskType: string): TranscriptPolicy {
  return (
    TRANSCRIPT_POLICIES[taskType] ?? {
      showDuringAttempt: false,
      showDuringReview: false,
      showCorrectAnswersInReview: false,
    }
  );
}
