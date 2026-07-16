import type { RendererContract } from '@pte-app/contracts';

/**
 * Demo/Fake renderer for development and test verification.
 * Proves the engine contract works before Phase J/K/L/M implement real renderers.
 */
export const DEMO_SINGLE_ANSWER_TASK_TYPE = 'pte:demo:single-answer';
export const DEMO_TEXT_RESPONSE_TASK_TYPE = 'pte:demo:text-response';

export function createDemoSingleAnswerRenderer(): RendererContract {
  return {
    taskType: DEMO_SINGLE_ANSWER_TASK_TYPE,
    responseSchema: {
      type: 'object',
      properties: {
        selectedIndex: { type: 'number' },
      },
      required: ['selectedIndex'],
    },
    emptyResponseFactory: () => ({ selectedIndex: null }),
    validateResponse: (response) => {
      if (!response || typeof response !== 'object') {
        return { valid: false, errors: ['Response must be an object'] };
      }
      const r = response as Record<string, unknown>;
      if (r.selectedIndex === null || r.selectedIndex === undefined) {
        return { valid: true }; // empty is valid per demo contract
      }
      if (typeof r.selectedIndex !== 'number') {
        return { valid: false, errors: ['selectedIndex must be a number or null'] };
      }
      return { valid: true };
    },
    normalizeResponse: (response) => {
      const r = response as Record<string, unknown>;
      return { selectedIndex: typeof r.selectedIndex === 'number' ? r.selectedIndex : null };
    },
    scoringAdapter: (response) => {
      const r = response as Record<string, unknown>;
      return { score: r.selectedIndex !== null && r.selectedIndex !== undefined ? 1 : 0 };
    },
    timerPolicy: {
      serverAuthoritative: true,
      enforceTimeLimit: false,
      graceSeconds: 0,
      warnAtSeconds: null,
    },
    reviewVisibilityPolicy: {
      showQuestionPrompt: true,
      showUserResponse: true,
      showCorrectAnswer: false,
      showScore: false,
      showFeedback: false,
      allowAnswerMutation: false,
    },
    accessibility: {
      supportsScreenReader: true,
      supportsKeyboardNavigation: true,
      supportsFontScaling: true,
      supportsReducedMotion: true,
      supportsHighContrast: true,
    },
    progressEventContract: {
      onStart: 'demo:attempt:start',
      onProgress: 'demo:attempt:progress',
      onAutosave: 'demo:attempt:autosave',
      onSubmit: 'demo:attempt:submit',
      onTimeout: 'demo:attempt:timeout',
      onError: 'demo:attempt:error',
    },
  };
}

export function createDemoTextResponseRenderer(): RendererContract {
  return {
    taskType: DEMO_TEXT_RESPONSE_TASK_TYPE,
    responseSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
      required: ['text'],
    },
    emptyResponseFactory: () => ({ text: '' }),
    validateResponse: (response) => {
      if (!response || typeof response !== 'object') {
        return { valid: false, errors: ['Response must be an object'] };
      }
      const r = response as Record<string, unknown>;
      if (typeof r.text !== 'string') {
        return { valid: false, errors: ['text must be a string'] };
      }
      return { valid: true };
    },
    normalizeResponse: (response) => {
      const r = response as Record<string, unknown>;
      return { text: typeof r.text === 'string' ? r.text : '' };
    },
    scoringAdapter: (response) => {
      const r = response as Record<string, unknown>;
      const text = typeof r.text === 'string' ? r.text.trim() : '';
      return { score: text.length > 0 ? 1 : 0, length: text.length };
    },
    timerPolicy: {
      serverAuthoritative: true,
      enforceTimeLimit: false,
      graceSeconds: 0,
      warnAtSeconds: null,
    },
    reviewVisibilityPolicy: {
      showQuestionPrompt: true,
      showUserResponse: true,
      showCorrectAnswer: false,
      showScore: false,
      showFeedback: false,
      allowAnswerMutation: false,
    },
    accessibility: {
      supportsScreenReader: true,
      supportsKeyboardNavigation: true,
      supportsFontScaling: true,
      supportsReducedMotion: true,
      supportsHighContrast: true,
    },
    progressEventContract: {
      onStart: 'demo:attempt:start',
      onProgress: 'demo:attempt:progress',
      onAutosave: 'demo:attempt:autosave',
      onSubmit: 'demo:attempt:submit',
      onTimeout: 'demo:attempt:timeout',
      onError: 'demo:attempt:error',
    },
  };
}

export function createDemoAudioPolicyRenderer(): RendererContract {
  const base = createDemoSingleAnswerRenderer();
  return {
    ...base,
    taskType: 'pte:demo:audio-policy',
    playbackPolicy: {
      maxPlays: 2,
      consumeOnFirstPlay: true,
      reconnectResetsConsumed: false,
      policyId: 'demo:audio:max-2',
    },
  };
}
