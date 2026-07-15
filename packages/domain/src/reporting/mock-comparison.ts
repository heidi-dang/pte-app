import type { MockComparisonEntry, MockComparison, MockComparisonId } from '@pte-app/contracts';

export function buildMockComparison(userId: string, entries: MockComparisonEntry[]): MockComparison {
  const warnings: string[] = [];

  for (const entry of entries) {
    if (!entry.compatible) {
      warnings.push(`Mock ${entry.mockSessionId} uses incompatible blueprint version`);
    }
    const partialTasks = entry.taskResults.filter((t) => t.partial);
    if (partialTasks.length > 0) {
      warnings.push(`Mock ${entry.mockSessionId} has ${partialTasks.length} partial task result(s)`);
    }
  }

  return {
    id: crypto.randomUUID() as MockComparisonId,
    userId,
    entries,
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

export function compareBlueprints(
  a: { blueprintId: string; blueprintVersion: number },
  b: { blueprintId: string; blueprintVersion: number },
): boolean {
  return a.blueprintId === b.blueprintId && a.blueprintVersion === b.blueprintVersion;
}
