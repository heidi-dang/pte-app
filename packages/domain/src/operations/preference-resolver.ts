import type { NotificationPreference } from '@pte-app/contracts';

export function resolvePreference(
  preferences: NotificationPreference[],
  category: string,
  channel: string,
): NotificationPreference | undefined {
  return preferences.find((p) => p.category === category && p.channel === channel);
}

export function isInQuietHours(pref: NotificationPreference, now: Date): boolean {
  if (!pref.quietHoursStart || !pref.quietHoursEnd) return false;
  const start = new Date(`1970-01-01T${pref.quietHoursStart}Z`);
  const end = new Date(`1970-01-01T${pref.quietHoursEnd}Z`);
  const current = new Date(`1970-01-01T${now.toISOString().split('T')[1]}`);
  return current >= start && current <= end;
}
