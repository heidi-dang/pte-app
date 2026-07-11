/**
 * Date and time utilities contract.
 *
 * All stored timestamps are ISO-8601 strings in UTC.
 */

export type IsoTimestamp = string; // "2026-07-11T12:00:00.000Z"

export function now(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

export function addSeconds(iso: IsoTimestamp, seconds: number): IsoTimestamp {
  const d = new Date(iso);
  d.setUTCSeconds(d.getUTCSeconds() + seconds);
  return d.toISOString() as IsoTimestamp;
}

export function diffSeconds(a: IsoTimestamp, b: IsoTimestamp): number {
  return (new Date(a).getTime() - new Date(b).getTime()) / 1000;
}
