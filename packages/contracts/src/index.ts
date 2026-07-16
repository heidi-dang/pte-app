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
  VersionedConfiguration,
  ConfigurationScope,
  TimingProfileConfig,
  VersionedTimingProfile,
  QuestionMetadataConfig,
  ExamMetadataConfig,
  MediaMetadataConfig,
  LanguageMetadataConfig,
  FeatureFlags,
  VersionedFeatureFlags,
  VersionedLanguageConfig,
  VersionedQuestionMetadataConfig,
  VersionedExamMetadataConfig,
  VersionedMediaMetadataConfig,
} from './configuration.js';

export {
  TRAINING_TIMING_PROFILES,
  getTimingProfile,
  getTimingProfileById,
  getActiveTimingProfiles,
  requireTimingProfile,
  TRAINING_QUESTION_CONFIG,
  TRAINING_EXAM_CONFIG,
  TRAINING_MEDIA_CONFIG,
  getQuestionConfigById,
  requireQuestionConfig,
  getExamConfigById,
  requireExamConfig,
  getMediaConfigById,
  requireMediaConfig,
  getActiveQuestionConfig,
  getActiveExamConfig,
  getActiveMediaConfig,
  TRAINING_LANGUAGE_CONFIG,
  getLanguageConfigById,
  requireLanguageConfig,
  getActiveLanguageConfig,
  getEnabledLanguages,
  getLanguageByCode,
  isLanguageEnabled,
  TRAINING_DEFAULT_FLAGS,
  TRAINING_DEVELOPMENT_FLAGS,
  TRAINING_STAGING_FLAGS,
  TRAINING_PRODUCTION_FLAGS,
  getFeatureFlagsById,
  requireFeatureFlags,
  getFeatureFlagsForEnvironment,
  requireFeatureFlagsForEnvironment,
  isFeatureEnabled,
  getFeatureFlagValue,
} from './config/index.js';

export * from './content-provenance/index.js';
export * from './phase-h/index.js';
export * from './phase-i/index.js';

export * from './question-engine/errors.js';
export * from './question-engine/mode-profile.js';
export * from './question-engine/playback-state.js';
export * from './question-engine/progress-event.js';
export * from './question-engine/renderer-manifest.js';
export * from './question-engine/session-mode.js';
export * from './question-engine/session-state.js';
export * from './question-engine/submission-result.js';
export * from './question-engine/timer-display-profile.js';
export * from './question-engine/timer-state.js';
export * from './question-engine/access-policy.js';
export * from './question-engine/question-version.js';
export * from './questions/index.js';
export type { ResponseState } from './question-engine/response-state.js';
export type {
  ScoringProfileId,
  QuestionVersionId,
  PlaybackRightId,
  TimingProfileId,
  PlaybackProfileId,
} from './question-engine/identifiers.js';
