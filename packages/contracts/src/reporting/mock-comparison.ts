import type { MockComparisonId } from './identifiers.js';

export interface MockComparisonEntry {
  mockSessionId: string;
  blueprintId: string;
  blueprintVersion: number;
  completedAt: string;
  estimatedResult: number;
  classification: string;
  taskResults: Array<{ taskType: string; score: number; maxScore: number; partial: boolean }>;
  compatible: boolean;
  incompatibilityReason?: string;
}

export interface MockComparison {
  id: MockComparisonId;
  userId: string;
  entries: MockComparisonEntry[];
  warnings: string[];
  generatedAt: string;
}
