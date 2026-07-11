export interface MockBlueprint {
  readonly id: string;
  readonly sections: MockSection[];
  readonly totalTimeSeconds: number;
  readonly absoluteDeadline: string;
}

export interface MockSection {
  readonly order: number;
  readonly tasks: string[];
  readonly timeSeconds: number;
}

export class MockExamEngine {
  async createBlueprint(tasks: string[]): Promise<MockBlueprint> {
    return {
      id: `mock_${Date.now().toString(36)}`,
      sections: [{ order: 1, tasks, timeSeconds: tasks.length * 120 }],
      totalTimeSeconds: tasks.length * 120,
      absoluteDeadline: new Date(Date.now() + tasks.length * 120000).toISOString(),
    };
  }

  async calculateRemaining(deadline: string): Promise<number> {
    return Math.max(0, new Date(deadline).getTime() - Date.now());
  }
}
