export { CONTRACT_VERSION } from './version.js';

export type { QuestionContract, QuestionMediaReference, ScoringPrinciple } from './question.js';

export type { AnswerContract, AnswerResponse } from './answer.js';

export type { ExamContract, ExamSection } from './exam.js';

export type { SessionContract, SessionStatus } from './session.js';

export type { UserProfileContract, UserRole, UserPreferences } from './user.js';

export type { CourseContract } from './course.js';

export type { LessonContract } from './lesson.js';

export type { ProgressContract } from './progress.js';

export type { MediaContract, MediaType } from './media.js';

export type { UploadContract, UploadStatus } from './upload.js';

export type { AttemptContract, AttemptStatus, QuestionResponse } from './attempt.js';

export type { ResultContract, SectionScore } from './result.js';

export type { FeedbackContract, FeedbackType } from './feedback.js';

export type { AuditEventContract, AuditEventType } from './audit-event.js';

export type {
  ConfigurationContract,
  ConfigurationScope,
  TimingProfile,
  QuestionMetadataConfig,
  ExamMetadataConfig,
  MediaMetadataConfig,
  LanguageMetadataConfig,
  FeatureFlags,
} from './configuration.js';

export {
  getTimingProfile,
  TIMING_PROFILES,
  SPEAKING_TIMING,
  WRITING_TIMING,
  READING_TIMING,
  LISTENING_TIMING,
  getQuestionConfig,
  getExamConfig,
  getMediaConfig,
  DEFAULT_QUESTION_CONFIG,
  DEFAULT_EXAM_CONFIG,
  DEFAULT_MEDIA_CONFIG,
  SUPPORTED_LANGUAGES,
  getEnabledLanguages,
  getLanguageByCode,
  isLanguageEnabled,
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_BY_ENVIRONMENT,
  getFeatureFlags,
  isFeatureEnabled,
  getFeatureFlagValue,
} from './config/index.js';
