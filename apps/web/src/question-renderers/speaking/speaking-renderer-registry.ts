import type { ComponentType } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import { ReadAloudRenderer } from './read-aloud.js';
import { RepeatSentenceRenderer } from './repeat-sentence.js';
import { DescribeImageRenderer } from './describe-image.js';
import { RetellLectureRenderer } from './retell-lecture.js';
import { AnswerShortQuestionRenderer } from './answer-short-question.js';
import { SummarizeGroupDiscussionRenderer } from './summarize-group-discussion.js';
import { RespondToSituationRenderer } from './respond-to-situation.js';

type AnyRenderer = ComponentType<QuestionRendererProps<never, never>>;

export const SPEAKING_RENDERER_REGISTRY: Record<string, AnyRenderer> = {
  read_aloud: ReadAloudRenderer as unknown as AnyRenderer,
  repeat_sentence: RepeatSentenceRenderer as unknown as AnyRenderer,
  describe_image: DescribeImageRenderer as unknown as AnyRenderer,
  retell_lecture: RetellLectureRenderer as unknown as AnyRenderer,
  answer_short_question: AnswerShortQuestionRenderer as unknown as AnyRenderer,
  summarize_group_discussion: SummarizeGroupDiscussionRenderer as unknown as AnyRenderer,
  respond_to_situation: RespondToSituationRenderer as unknown as AnyRenderer,
};
