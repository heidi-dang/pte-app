import type { ContentId, UserId, IsoTimestamp } from '@pte-app/contracts';

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'retired';

export type TaskType = 
  | 'read_aloud' | 'repeat_sentence' | 'describe_image' | 'retell_lecture'
  | 'answer_short_question' | 'summarize_group_discussion' | 'respond_to_a_situation'
  | 'summarize_written_text' | 'write_essay'
  | 'reading_fill_blanks' | 'multiple_choice_multiple' | 'reorder_paragraph'
  | 'reading_fill_blanks_single' | 'multiple_choice_single'
  | 'summarize_spoken_text' | 'listening_multiple_choice_multiple'
  | 'listening_fill_blanks' | 'highlight_correct_summary'
  | 'listening_multiple_choice_single' | 'select_missing_word'
  | 'highlight_incorrect_words' | 'write_from_dictation';

export type ContentSource = 'original' | 'licensed' | 'generated' | 'imported';

export interface ContentProvenance {
  readonly source: ContentSource;
  readonly authorId?: UserId;
  readonly licenceRef?: string;
  readonly attribution?: string;
  readonly reviewedById?: UserId;
  readonly reviewedAt?: IsoTimestamp;
}

export interface ContentItem {
  readonly id: ContentId;
  readonly taskType: TaskType;
  readonly status: ContentStatus;
  readonly version: number;
  readonly title: string;
  readonly instructions: string;
  readonly prompt: Record<string, unknown>;
  readonly correctAnswer?: Record<string, unknown>;
  readonly rubric?: Record<string, unknown>;
  readonly difficulty: number;
  readonly skills: string[];
  readonly timeLimitSeconds?: number;
  readonly provenance: ContentProvenance;
  readonly sourceFile?: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly publishedAt?: IsoTimestamp;
}
