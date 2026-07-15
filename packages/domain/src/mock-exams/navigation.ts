import type { MockSession } from '@pte-app/contracts';

/**
 * Navigation — manages section and task transitions.
 */
export function getNextTask(session: MockSession): { section: string; position: number } | null {
  const sectionQuestions = session.selectedQuestions.filter((q) => q.section === session.currentSection);
  if (sectionQuestions.length === 0) return null;
  const maxPosition = Math.max(...sectionQuestions.map((q) => q.position));

  if (session.currentTaskPosition < maxPosition) {
    return { section: session.currentSection, position: session.currentTaskPosition + 1 };
  }

  const sections = [...new Set(session.selectedQuestions.map((q) => q.section))];
  const currentIdx = sections.indexOf(session.currentSection);
  if (currentIdx >= 0 && currentIdx < sections.length - 1) {
    const nextSection = sections[currentIdx + 1];
    if (!nextSection) return null;
    const nextSectionQuestions = session.selectedQuestions.filter((q) => q.section === nextSection);
    if (nextSectionQuestions.length === 0) return null;
    const minPosition = Math.min(...nextSectionQuestions.map((q) => q.position));
    return { section: nextSection, position: minPosition };
  }

  return null;
}
