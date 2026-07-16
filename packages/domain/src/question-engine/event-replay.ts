import type { QuestionSessionEvent, QuestionProgressEventType } from '@pte-app/contracts';

export function validateEventSequence(events: QuestionSessionEvent[]): boolean {
  if (events.length === 0) return true;
  // Sort events by sequence number
  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  // Sequence must start at 0 (or 1 depending on DB schema, let's say 0-based contiguous)
  const first = sorted[0];
  if (first === undefined || first.sequence !== 0) return false;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    if (current === undefined || previous === undefined || current.sequence !== previous.sequence + 1) {
      return false;
    }
  }
  return true;
}

export function replayEvents<TState>(
  events: QuestionSessionEvent[],
  initialState: TState,
  reducer: (state: TState, event: QuestionSessionEvent) => TState,
): TState {
  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);
  return sorted.reduce(reducer, initialState);
}

export function getLatestEventOfType<T = unknown>(
  events: QuestionSessionEvent[],
  type: QuestionProgressEventType,
): QuestionSessionEvent<T> | undefined {
  const matching = events.filter((e) => e.type === type);
  if (matching.length === 0) return undefined;
  return matching.sort((a, b) => b.sequence - a.sequence)[0] as QuestionSessionEvent<T>;
}
