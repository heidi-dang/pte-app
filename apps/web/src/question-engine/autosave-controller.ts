import type { ResponseState } from '@pte-app/contracts';

export interface AutosaveOptions {
  debounceMs: number;
  onSave: (payload: unknown, state: ResponseState) => Promise<void>;
  onError: (err: unknown) => void;
}

export function createAutosaveController(options: AutosaveOptions) {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPayload: unknown = null;
  let pendingState: ResponseState | null = null;
  let savePromise: Promise<void> | null = null;

  const performSave = async () => {
    if (pendingState === null) return;
    const payload = pendingPayload;
    const state = pendingState;
    pendingPayload = null;
    pendingState = null;

    try {
      savePromise = options.onSave(payload, state);
      await savePromise;
    } catch (err) {
      options.onError(err);
    } finally {
      savePromise = null;
    }
  };

  return {
    schedule(payload: unknown, state: ResponseState) {
      pendingPayload = payload;
      pendingState = state;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(performSave, options.debounceMs);
    },
    async flush() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pendingState !== null) {
        await performSave();
      }
      if (savePromise) {
        await savePromise;
      }
    },
    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingPayload = null;
      pendingState = null;
    },
  };
}
