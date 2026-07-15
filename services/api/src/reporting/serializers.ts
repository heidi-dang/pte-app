export function serializeScore(value: number, classification: string): string {
  return `Estimated training result: ${classification} (${value.toFixed(2)})`;
}

export function serializeFreshness(status: string, updatedAt: string): string {
  if (status === 'stale') return `Data may be outdated (last updated ${updatedAt})`;
  return `Data current as of ${updatedAt}`;
}
