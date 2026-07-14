export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Object.isFrozen(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(record)) {
    const nested = record[key];
    if (nested !== null && typeof nested === 'object') {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}
