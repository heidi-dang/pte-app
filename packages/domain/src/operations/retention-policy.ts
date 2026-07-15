export function isEligibleForRetention(dataAgeDays: number, retentionDays: number, onLegalHold: boolean): boolean {
  if (onLegalHold) return false;
  return dataAgeDays >= retentionDays;
}

export function previewRetention(items: number, excludedItems: number): { eligible: number; excluded: number } {
  return { eligible: items - excludedItems, excluded: excludedItems };
}
