import type { TeacherFeedback } from '@pte-app/contracts';

export function createFeedbackVersion(feedback: TeacherFeedback, newContent: string): TeacherFeedback {
  return {
    ...feedback,
    writtenFeedback: newContent,
    version: feedback.version + 1,
    status: 'revised',
    updatedAt: new Date().toISOString(),
    versionHistory: [
      ...feedback.versionHistory,
      { version: feedback.version + 1, content: newContent, updatedAt: new Date().toISOString() },
    ],
  };
}
