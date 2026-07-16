import type { QuestionTypeHandler } from '@pte-app/contracts';
import { createReadAloudHandler } from './read-aloud.handler.js';
import { createRepeatSentenceHandler } from './repeat-sentence.handler.js';
import { createDescribeImageHandler } from './describe-image.handler.js';
import { createRetellLectureHandler } from './retell-lecture.handler.js';
import { createAnswerShortQuestionHandler } from './answer-short-question.handler.js';
import { createSummarizeGroupDiscussionHandler } from './summarize-group-discussion.handler.js';
import { createRespondToSituationHandler } from './respond-to-situation.handler.js';

export function createSpeakingHandlers(): QuestionTypeHandler[] {
  return [
    createReadAloudHandler(),
    createRepeatSentenceHandler(),
    createDescribeImageHandler(),
    createRetellLectureHandler(),
    createAnswerShortQuestionHandler(),
    createSummarizeGroupDiscussionHandler(),
    createRespondToSituationHandler(),
  ];
}
