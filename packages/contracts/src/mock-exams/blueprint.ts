/**
 * Mock exam blueprint — versioned configuration for mock exams.
 */
export interface MockBlueprint {
  id: string;
  version: number;
  /** Test type: 'full-mock' | 'section-test'. */
  testType: 'full-mock' | 'section-test';
  /** Section ordering. */
  sectionOrder: string[];
  /** Task distribution per section. */
  taskDistribution: MockTaskDistribution[];
  /** Task quantity rules. */
  taskQuantityRules: TaskQuantityRules;
  /** Selection policy. */
  selectionPolicy: SelectionPolicy;
  /** Timing profile reference. */
  timingProfileId: string;
  /** Playback profiles per section. */
  playbackProfiles: Record<string, string>;
  /** Recording profiles per section. */
  recordingProfiles: Record<string, string>;
  /** Scoring profiles per section. */
  scoringProfiles: Record<string, string>;
  /** Evaluation profiles per section. */
  evaluationProfiles: Record<string, string>;
  /** No-response policy. */
  noResponsePolicy: NoResponsePolicy;
  /** Navigation policy. */
  navigationPolicy: NavigationPolicy;
}

export interface MockTaskDistribution {
  section: string;
  taskType: string;
  count: number;
  difficultyRange: [number, number];
}

export interface TaskQuantityRules {
  minPerSection: number;
  maxPerSection: number;
  totalTasks: number;
}

export interface SelectionPolicy {
  method: 'random' | 'stratified' | 'adaptive';
  seed?: number;
}

export interface NoResponsePolicy {
  penaliseUnanswered: boolean;
  allowPartialSubmission: boolean;
}

export interface NavigationPolicy {
  allowFreeNavigation: boolean;
  allowSectionRevisit: boolean;
  showProgressBar: boolean;
}
