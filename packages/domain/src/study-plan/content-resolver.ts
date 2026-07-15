import type { StudyPlan, ContentReference } from '@pte-app/contracts';

/**
 * Content resolver — validates plan references against available content.
 */
export function validatePlanContent(
  plan: StudyPlan,
  availableContent: ContentReference[],
): { valid: boolean; missingReferences: string[] } {
  const availableIds = new Set(availableContent.map((c) => c.contentId));
  const missingReferences: string[] = [];

  for (const ref of plan.contentReferences) {
    if (!availableIds.has(ref.contentId)) {
      missingReferences.push(ref.contentId);
    }
  }

  return {
    valid: missingReferences.length === 0,
    missingReferences,
  };
}
