export interface BatchItemResult {
  contentId: string;
  success: boolean;
  error?: string;
}

export function createBatchResult(results: BatchItemResult[]): {
  successCount: number;
  failureCount: number;
  partial: boolean;
} {
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  return { successCount, failureCount, partial: successCount > 0 && failureCount > 0 };
}
