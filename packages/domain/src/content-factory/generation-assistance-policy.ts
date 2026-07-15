export function requiresHumanReview(
  generatedSections: string[],
  policy: { alwaysRequireReview: boolean; exemptSectionTypes: string[] },
): boolean {
  if (policy.alwaysRequireReview) return true;
  return generatedSections.some((s) => !policy.exemptSectionTypes.includes(s));
}
