export function isNotificationBlocked(enabled: boolean, mandatory: boolean, quietHours: boolean): boolean {
  if (mandatory) return false;
  if (!enabled) return true;
  if (quietHours) return true;
  return false;
}
