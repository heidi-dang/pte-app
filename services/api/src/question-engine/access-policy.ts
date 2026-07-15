import type {
  QuestionAccessPolicy,
  QuestionAccessInput,
  QuestionAccessDecision,
  QuestionSessionMode,
} from '@pte-app/contracts';

export class DefaultQuestionAccessPolicy implements QuestionAccessPolicy {
  private readonly allowedModes: Set<QuestionSessionMode>;

  constructor(config: { allowedModes: QuestionSessionMode[] }) {
    this.allowedModes = new Set(config.allowedModes);
  }

  public async canStartSession(input: QuestionAccessInput): Promise<QuestionAccessDecision> {
    if (!input.userId) {
      return { allowed: false, reason: 'Authentication required' };
    }

    if (!this.allowedModes.has(input.sessionMode as QuestionSessionMode)) {
      return {
        allowed: false,
        reason: `Session mode '${input.sessionMode}' is not configured/allowed in this environment`,
      };
    }

    return { allowed: true };
  }
}
