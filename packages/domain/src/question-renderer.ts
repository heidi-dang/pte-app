import type {
  RendererContract,
  TimerPolicy,
  PlaybackPolicy,
  ReviewVisibilityPolicy,
  AccessibilityContract,
  ProgressEventContract,
} from '@pte-app/contracts';

export type { RendererContract, TimerPolicy, PlaybackPolicy, ReviewVisibilityPolicy, AccessibilityContract, ProgressEventContract };

export function createRendererContract(partial: Partial<RendererContract> & { taskType: string; responseSchema: Record<string, unknown> }): RendererContract {
  return {
    taskType: partial.taskType,
    responseSchema: partial.responseSchema as Record<string, unknown>,
    emptyResponseFactory: partial.emptyResponseFactory ?? (() => ({})),
    validateResponse: partial.validateResponse ?? (() => ({ valid: true })),
    normalizeResponse: partial.normalizeResponse ?? ((r) => r),
    scoringAdapter: partial.scoringAdapter ?? ((r) => r),
    timerPolicy: partial.timerPolicy ?? {
      serverAuthoritative: true,
      enforceTimeLimit: true,
      graceSeconds: 0,
      warnAtSeconds: null,
    },
    playbackPolicy: partial.playbackPolicy,
    reviewVisibilityPolicy: partial.reviewVisibilityPolicy ?? {
      showQuestionPrompt: true,
      showUserResponse: true,
      showCorrectAnswer: false,
      showScore: false,
      showFeedback: false,
      allowAnswerMutation: false,
    },
    accessibility: partial.accessibility ?? {
      supportsScreenReader: true,
      supportsKeyboardNavigation: true,
      supportsFontScaling: true,
      supportsReducedMotion: true,
      supportsHighContrast: true,
    },
    progressEventContract: partial.progressEventContract ?? {
      onStart: 'attempt:start',
      onProgress: 'attempt:progress',
      onAutosave: 'attempt:autosave',
      onSubmit: 'attempt:submit',
      onTimeout: 'attempt:timeout',
      onError: 'attempt:error',
    },
  } as RendererContract;
}

export function rendererSupportsPlayback(renderer: RendererContract): boolean {
  return renderer.playbackPolicy !== undefined;
}

export function rendererAllowsAnswerMutation(renderer: RendererContract): boolean {
  return renderer.reviewVisibilityPolicy.allowAnswerMutation;
}

export function rendererIsTimed(renderer: RendererContract): boolean {
  return renderer.timerPolicy.serverAuthoritative || renderer.timerPolicy.enforceTimeLimit;
}
