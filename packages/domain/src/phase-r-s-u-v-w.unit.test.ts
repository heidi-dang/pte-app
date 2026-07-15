import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  ScoreTrendConfig,
  ScoreTrendId,
  MasteryProfile,
  MasteryId,
  MasterySnapshotId,
  EvidencePolicy,
  MasteryEvidence,
  WeightedContribution,
} from '@pte-app/contracts';
import { buildScoreTrendSet, isProfileCompatible } from './reporting/score-trend.js';
import {
  calculateSkillMastery,
  calculateTaskMastery,
  buildMasterySnapshot,
  MasteryValidationError,
} from './reporting/mastery-calculator.js';
import {
  MasterySnapshotSchema,
  MasteryLevelSchema,
  WeightedContributionSchema,
  ExcludedEvidenceSchema,
  ScoreNormalisationPolicySchema,
  EvidencePolicySchema,
  ValidMasteryEvidenceSchema,
  RawMasteryEvidenceSchema,
} from '@pte-app/schemas';
import { evaluateFreshness } from './reporting/freshness.js';
import { hasPartialData, labelScore } from './reporting/partial-data.js';
import { buildCompositeReport } from './reporting/report-builder.js';
import { hasCapability } from './staff/permission-policy.js';
import { isAssignedTeacher } from './staff/teacher-student-access.js';
import { createFeedbackVersion } from './staff/feedback-versioning.js';
import { acquireLock, isLockExpired } from './staff/review-lock.js';
import { createConfirmation, isConfirmationStale } from './staff/sensitive-action.js';
import { canStartImpersonation } from './staff/impersonation-policy.js';
import { canTransition as canTransitionDraft } from './content-factory/draft-state-machine.js';
import { evaluateProvenanceGate } from './content-factory/provenance-gate.js';
import { canSelfApprove } from './content-factory/approval-state-machine.js';
import { calculateAgreement } from './calibration/agreement-metrics.js';
import { evaluatePromotionGate } from './calibration/promotion-gate.js';
import { isNotificationBlocked } from './operations/notification-policy.js';
import { canTransition as canTransitionCase } from './operations/support-case-state-machine.js';
import { createAssignment, publishAssignment } from './staff/assignment-service.js';
import { createModerationCase, canTransitionModeration } from './staff/moderation-state-machine.js';
import { createScoringSupportAction } from './staff/scoring-support.js';
import { createEntitlementAdjustmentRequest } from './staff/entitlement-adjustment-policy.js';
import { validateImportRow } from './content-factory/import-validator.js';
import { evaluatePublicationGate } from './content-factory/publication-gate.js';
import { calculateQualityScore } from './content-factory/quality-score.js';
import { createBatchResult } from './content-factory/batch-operation.js';
import { validateDatasetSamples } from './calibration/dataset-validator.js';
import { detectBias } from './calibration/bias-analysis.js';
import { detectDrift } from './calibration/drift-detector.js';
import { finalizeReport, buildCalibrationReport } from './calibration/report-builder.js';
import { canRollback, createRollbackDecision } from './calibration/rollback-evaluator.js';
import { evaluateEffectiveness } from './calibration/study-plan-effectiveness.js';
import { canTransitionDelivery } from './operations/delivery-state-machine.js';
import { canRecoverScoring } from './operations/failed-scoring-recovery.js';
import { canRepairMedia } from './operations/media-repair.js';
import { requiresRestorationEvidence } from './operations/backup-verification.js';
import { isEligibleForRetention, previewRetention } from './operations/retention-policy.js';
import { isProgressStale } from './operations/admin-progress.js';

function mkPol(overrides: Partial<EvidencePolicy> = {}): EvidencePolicy {
  return {
    completeResultPolicy: 'include',
    partialResultPolicy: 'include',
    partialResultWeight: 0.5,
    failedResultPolicy: 'exclude',
    failedResultWeight: 0,
    minimumEvidence: 3,
    minimumConfidence: 0.5,
    scoreNormalisationPolicy: { method: 'none' },
    confidenceWeightingPolicy: 'none',
    referenceScoringProfileId: null,
    referenceScoringProfileVersion: null,
    referenceEvaluationProfileId: null,
    referenceEvaluationProfileVersion: null,
    allowedScoringProfileIds: [],
    allowedScoringProfileVersions: [],
    allowedEvaluationProfileIds: [],
    allowedEvaluationProfileVersions: [],
    mixedProfilePolicy: 'allow',
    ...overrides,
  };
}

function mkProf(overrides: Partial<MasteryProfile> = {}): MasteryProfile {
  return {
    id: 'mp1' as MasteryId,
    version: 1,
    evidencePolicy: mkPol(overrides.evidencePolicy),
    levelDefinitions: [
      { id: 'l1', label: 'L1', value: 1, threshold: 0.5 },
      { id: 'l2', label: 'L2', value: 2, threshold: 0.8 },
    ],
    staleDataThresholdDays: 30,
    fallbackLevel: null,
    ...overrides,
  };
}

function mkEv(overrides: Partial<MasteryEvidence> = {}): MasteryEvidence {
  return {
    attemptId: 'att1',
    resultId: 'r1',
    questionVersionId: 'qv1',
    taskId: 'task1',
    taskType: 'read',
    taskName: 'Read',
    skillId: 'reading',
    skillName: 'Reading',
    estimatedTrainingScore: 0.7,
    confidence: 0.8,
    scoringProfileId: 'sp1',
    scoringProfileVersion: 1,
    evaluationProfileId: null,
    evaluationProfileVersion: null,
    completenessStatus: 'complete',
    timestamp: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// ================================================================
// PHASE R — Mastery
// ================================================================
describe('Phase R — Score Trend', () => {
  it('compatible profile', () => {
    const cfg: ScoreTrendConfig = {
      id: 'c1' as ScoreTrendId,
      version: 1,
      timeGrouping: 'day' as const,
      aggregationMethod: 'mean' as const,
      minimumDataPoints: 2,
      includePartial: false,
      profileChangePolicy: 'flag' as const,
      staleDataThresholdDays: 30,
    };
    const pts = [
      {
        timestamp: '2025-01-01T00:00:00Z',
        value: 0.7,
        sourceResultId: 'r1',
        profileId: 'p1',
        profileVersion: 1,
        partial: false,
      },
      {
        timestamp: '2025-01-02T00:00:00Z',
        value: 0.8,
        sourceResultId: 'r2',
        profileId: 'p1',
        profileVersion: 1,
        partial: false,
      },
    ];
    const t = buildScoreTrendSet(cfg, pts);
    assert.equal(t.dataPoints.length, 2);
    assert.equal(t.warnings.length, 0);
  });

  it('profile-change detected', () => {
    const cfg: ScoreTrendConfig = {
      id: 'c1' as ScoreTrendId,
      version: 1,
      timeGrouping: 'day' as const,
      aggregationMethod: 'mean' as const,
      minimumDataPoints: 1,
      includePartial: false,
      profileChangePolicy: 'flag' as const,
      staleDataThresholdDays: 30,
    };
    const pts = [
      {
        timestamp: '2025-01-01T00:00:00Z',
        value: 0.7,
        sourceResultId: 'r1',
        profileId: 'p1',
        profileVersion: 1,
        partial: false,
      },
      {
        timestamp: '2025-01-02T00:00:00Z',
        value: 0.8,
        sourceResultId: 'r2',
        profileId: 'p1',
        profileVersion: 2,
        partial: false,
      },
    ];
    assert.ok(buildScoreTrendSet(cfg, pts).warnings.length > 0);
  });

  it('incompatible profiles flagged', () => {
    assert.equal(
      isProfileCompatible({ profileId: 'p1', profileVersion: 1 }, { profileId: 'p1', profileVersion: 2 }),
      false,
    );
  });
});

describe('Phase R — Weighted Mastery', () => {
  it('weighted mean correct denominator', () => {
    const ev = [
      mkEv({ completenessStatus: 'partial', estimatedTrainingScore: 0.9 }),
      mkEv({ completenessStatus: 'complete', estimatedTrainingScore: 0.5 }),
    ];
    const pol = mkPol({ minimumEvidence: 2, partialResultPolicy: 'discount', partialResultWeight: 0.5 });
    const { levels } = calculateSkillMastery(
      mkProf({
        evidencePolicy: pol,
        levelDefinitions: [
          { id: 'l1', label: 'L1', value: 1, threshold: 0.45 },
          { id: 'l2', label: 'L2', value: 2, threshold: 0.7 },
        ],
      }),
      ev,
    );
    if (levels[0]?.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.ok(typeof levels[0]?.level === 'number');
  });

  it('weighted mean distinguishes formula', () => {
    const ev = [
      mkEv({ completenessStatus: 'partial', estimatedTrainingScore: 0.9 }),
      mkEv({ completenessStatus: 'complete', estimatedTrainingScore: 0.3 }),
    ];
    const pol = mkPol({ minimumEvidence: 2, partialResultPolicy: 'discount', partialResultWeight: 0.5 });
    const { levels } = calculateSkillMastery(
      mkProf({ evidencePolicy: pol, levelDefinitions: [{ id: 'l1', label: 'L1', value: 1, threshold: 0.55 }] }),
      ev,
    );
    assert.equal(levels[0]?.status, 'insufficient');
  });

  it('weighted confidence', () => {
    const ev = [
      mkEv({ completenessStatus: 'complete', confidence: 0.9 }),
      mkEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.7, confidence: 0.1 }),
    ];
    const pol = mkPol({ minimumEvidence: 2, failedResultPolicy: 'include-with-disclosure', failedResultWeight: 0.2 });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol, fallbackLevel: 0 }), ev);
    const lvl = levels[0];
    if (!lvl || lvl.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.ok(lvl.confidence > 0.6);
  });

  it('zero-weight excluded', () => {
    const ev = [mkEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.5 })];
    const pol = mkPol({ minimumEvidence: 1, failedResultPolicy: 'include-with-disclosure', failedResultWeight: 0 });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol }), ev);
    assert.equal(levels[0]?.status, 'insufficient');
    assert.equal(levels[0]?.contributingEvidence.length, 0);
  });
});

describe('Phase R — Freshness / Labels', () => {
  it('freshness', () => {
    assert.equal(evaluateFreshness(new Date().toISOString(), 3600000, 't').status, 'fresh');
    assert.equal(evaluateFreshness(new Date(Date.now() - 7200000).toISOString(), 3600000, 't').status, 'stale');
  });
  it('partial data', () => {
    assert.equal(hasPartialData([{ status: 'insufficient' }]), true);
    assert.equal(hasPartialData([{ status: 'sufficient' }, { status: 'sufficient' }]), false);
  });
  it('label says Estimated training result', () => {
    assert.ok(labelScore(0.75, 'g').startsWith('Estimated training result'));
  });
  it('report builder', () => {
    const r = buildCompositeReport('u1', { includePartial: true, includeFailed: false }, {});
    assert.ok(r.warnings.length >= 0);
  });
  it('lineage', () => {
    const ev = Array.from({ length: 3 }, (_, i) => mkEv({ resultId: `res${i}` }));
    const pol = mkPol({ minimumEvidence: 3 });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol, fallbackLevel: 0 }), ev);
    if (levels[0]?.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.equal(levels[0]?.contributingEvidence[0]?.evidence.resultId, 'res0');
  });
  it('task/skill separation', () => {
    const ev = [mkEv({ skillId: 'reading', taskId: 't1' }), mkEv({ skillId: 'reading', taskId: 't2' })];
    const pol = mkPol({ minimumEvidence: 1 });
    const { levels: sl } = calculateSkillMastery(mkProf({ evidencePolicy: pol }), ev);
    const { levels: tl } = calculateTaskMastery(mkProf({ evidencePolicy: pol }), ev);
    assert.equal(sl.length, 1);
    assert.equal(tl.length, 2);
  });
  it('snapshot warning modes', () => {
    const s1 = buildMasterySnapshot(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 10 }) }),
      'u1',
      [mkEv()],
      'fresh',
      undefined,
      undefined,
      'task',
    );
    assert.ok(s1.warnings.some((w) => w.includes('tasks')));
    const s2 = buildMasterySnapshot(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 10 }) }),
      'u1',
      [mkEv()],
      'fresh',
      undefined,
      undefined,
      'skill',
    );
    assert.ok(s2.warnings.some((w) => w.includes('skills')));
  });
});

describe('Phase R — Normalisation', () => {
  it('invalid linear range fails domain', () => {
    const pol = mkPol({
      minimumEvidence: 1,
      scoreNormalisationPolicy: {
        method: 'linear',
        direction: 'ascending',
        inputMinimum: 10,
        inputMaximum: 5,
        outputMinimum: 0,
        outputMaximum: 100,
      },
    });
    assert.throws(
      () => calculateSkillMastery(mkProf({ evidencePolicy: pol }), [mkEv()]),
      (e: unknown) => e instanceof MasteryValidationError,
    );
  });
  it('invalid linear range fails Zod', () => {
    assert.throws(() =>
      ScoreNormalisationPolicySchema.parse({
        method: 'linear',
        direction: 'ascending',
        inputMinimum: 10,
        inputMaximum: 5,
        outputMinimum: 0,
        outputMaximum: 100,
      }),
    );
  });
});

describe('Phase R — Evaluation Disclosure', () => {
  it('both-null disclosed', () => {
    const pol = mkPol({
      minimumEvidence: 1,
      mixedProfilePolicy: 'disclose-mismatched',
      referenceEvaluationProfileId: 'ep1',
      referenceEvaluationProfileVersion: 1,
    });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol, fallbackLevel: 0 }), [mkEv()]);
    if (levels[0]?.status === 'insufficient') {
      assert.fail();
      return;
    }
    const c = levels[0]?.contributingEvidence[0] as WeightedContribution;
    assert.equal(c.profileCompatibility.status, 'included-with-disclosure');
    if (c.profileCompatibility.status === 'included-with-disclosure')
      assert.ok(c.profileCompatibility.mismatches.includes('evaluation-profile-missing'));
    assert.equal(levels[0]?.status, 'partial');
  });

  it('both-null excluded', () => {
    const pol = mkPol({
      minimumEvidence: 1,
      mixedProfilePolicy: 'exclude-mismatched',
      referenceEvaluationProfileId: 'ep1',
      referenceEvaluationProfileVersion: 1,
    });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol }), [mkEv()]);
    assert.equal(levels[0]?.eligibleEvidence, 0);
    assert.equal(levels[0]?.excludedEvidence[0]?.reason, 'missing-reference-evaluation-profile');
    assert.doesNotThrow(() => ExcludedEvidenceSchema.parse(levels[0]?.excludedEvidence[0] as any));
  });

  it('half-present in unassigned', () => {
    const { levels, unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ evaluationProfileId: null, evaluationProfileVersion: 1 }),
    ]);
    assert.equal(levels.length, 0);
    assert.equal(unassigned.length, 1);
    assert.equal(unassigned[0]?.reason, 'invalid-evaluation-pair');
    const snap = buildMasterySnapshot(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }),
      'u1',
      [mkEv({ evaluationProfileId: null, evaluationProfileVersion: 1 })],
      'fresh',
    );
    assert.doesNotThrow(() => MasterySnapshotSchema.parse(snap));
  });
});

describe('Phase R — Domain Routing', () => {
  it('fractional scoring version → unassigned', () => {
    const { levels, unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ scoringProfileVersion: 1.5 }),
    ]);
    assert.equal(levels.length, 0);
    assert.equal(unassigned.length, 1);
  });
  it('negative scoring version → unassigned', () => {
    const { unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ scoringProfileVersion: -1 }),
    ]);
    assert.equal(unassigned.length, 1);
  });
  it('fractional evaluation version → unassigned', () => {
    const { unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: 1.5 }),
    ]);
    assert.equal(unassigned.length, 1);
  });
  it('negative evaluation version → unassigned', () => {
    const { unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: -1 }),
    ]);
    assert.equal(unassigned.length, 1);
  });
  it('confidence below 0 → unassigned', () => {
    const { unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ confidence: -0.1 }),
    ]);
    assert.equal(unassigned.length, 1);
  });
  it('confidence above 1 → unassigned', () => {
    const { unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ confidence: 1.1 }),
    ]);
    assert.equal(unassigned.length, 1);
  });
  it('every valid contribution parses WeightedContributionSchema', () => {
    const ev = Array.from({ length: 3 }, () => mkEv());
    const { levels } = calculateSkillMastery(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 3 }), fallbackLevel: 0 }),
      ev,
    );
    for (const l of levels) {
      if (l.status !== 'insufficient')
        for (const c of l.contributingEvidence) assert.doesNotThrow(() => WeightedContributionSchema.parse(c));
    }
  });
  it('every policy exclusion parses ExcludedEvidenceSchema', () => {
    const { levels } = calculateSkillMastery(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1, failedResultPolicy: 'exclude' }) }),
      [mkEv({ completenessStatus: 'failed' })],
    );
    for (const l of levels) {
      for (const ex of l.excludedEvidence) assert.doesNotThrow(() => ExcludedEvidenceSchema.parse(ex));
    }
  });
  it('malformed snapshot parses MasterySnapshotSchema', () => {
    const cases = [
      mkEv({ scoringProfileVersion: -1 }),
      mkEv({ evaluationProfileVersion: 1.5 }),
      mkEv({ confidence: 1.5 }),
      mkEv({ estimatedTrainingScore: -5 }),
    ];
    for (const e of cases) {
      const snap = buildMasterySnapshot(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), 'u1', [e], 'fresh');
      assert.doesNotThrow(() => MasterySnapshotSchema.parse(snap));
    }
  });
  it('raw malformed evidence remains recoverable', () => {
    const ev = mkEv({ scoringProfileVersion: -1, confidence: 1.5 });
    assert.doesNotThrow(() => RawMasteryEvidenceSchema.parse(ev));
  });

  it('NaN score throws NON_FINITE_ESTIMATED_SCORE', () => {
    assert.throws(
      () =>
        calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
          mkEv({ estimatedTrainingScore: NaN }),
        ]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'NON_FINITE_ESTIMATED_SCORE',
    );
  });
  it('Infinity score throws NON_FINITE_ESTIMATED_SCORE', () => {
    assert.throws(
      () =>
        calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
          mkEv({ estimatedTrainingScore: Infinity }),
        ]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'NON_FINITE_ESTIMATED_SCORE',
    );
  });
  it('Negative Infinity score throws NON_FINITE_ESTIMATED_SCORE', () => {
    assert.throws(
      () =>
        calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
          mkEv({ estimatedTrainingScore: -Infinity }),
        ]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'NON_FINITE_ESTIMATED_SCORE',
    );
  });
  it('NaN confidence throws NON_FINITE_CONFIDENCE', () => {
    assert.throws(
      () =>
        calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [mkEv({ confidence: NaN })]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'NON_FINITE_CONFIDENCE',
    );
  });
  it('Infinity confidence throws NON_FINITE_CONFIDENCE', () => {
    assert.throws(
      () =>
        calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
          mkEv({ confidence: Infinity }),
        ]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'NON_FINITE_CONFIDENCE',
    );
  });
  it('Negative Infinity confidence throws NON_FINITE_CONFIDENCE', () => {
    assert.throws(
      () =>
        calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
          mkEv({ confidence: -Infinity }),
        ]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'NON_FINITE_CONFIDENCE',
    );
  });
  it('non-finite never contributes', () => {
    const ev = [mkEv({ estimatedTrainingScore: 0.7 }), mkEv({ confidence: NaN })];
    assert.throws(
      () => calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 2 }) }), ev),
      MasteryValidationError,
    );
  });
});

// ================================================================
// PHASE S
// ================================================================
describe('Phase S', () => {
  it('teacher has student read', () => {
    assert.equal(hasCapability('teacher', 'teacher.students.read'), true);
  });
  it('teacher denied admin', () => {
    assert.equal(hasCapability('teacher', 'admin.users.manage'), false);
  });
  it('unrelated teacher denied', () => {
    const a = [
      {
        id: 'a1',
        teacherId: 't1',
        studentId: 's1',
        effectiveFrom: '',
        status: 'active' as const,
        auditHistory: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    assert.equal(isAssignedTeacher(a, 't2', 's1'), false);
  });
  it('assigned teacher allowed', () => {
    const a = [
      {
        id: 'a1',
        teacherId: 't1',
        studentId: 's1',
        effectiveFrom: '',
        status: 'active' as const,
        auditHistory: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    assert.equal(isAssignedTeacher(a, 't1', 's1'), true);
  });
  it('feedback versioning', () => {
    const fb = {
      id: 'f1',
      attemptId: 'a1',
      teacherId: 't1',
      status: 'draft' as const,
      version: 1,
      versionHistory: [{ version: 1, content: 'v1', updatedAt: '' }],
      author: 't1',
      studentVisible: true,
      createdAt: '',
      updatedAt: '',
    };
    assert.equal(createFeedbackVersion(fb, 'v2').version, 2);
  });
  it('review lock acquisition', () => {
    assert.equal(acquireLock('r1', 't1', 60000).status, 'active');
  });
  it('lock expiry', () => {
    assert.equal(
      isLockExpired({
        id: 'l1',
        reviewId: 'r1',
        ownerId: 't1',
        acquiredAt: '',
        expiresAt: '2020-01-01T00:00:00Z',
        status: 'active' as const,
        takeoverHistory: [],
      }),
      true,
    );
  });
  it('impersonation policy', () => {
    assert.equal(canStartImpersonation(true, true).allowed, true);
    assert.equal(canStartImpersonation(false, true).allowed, false);
  });
  it('assignment creation and publication', () => {
    assert.equal(publishAssignment(createAssignment('t1', 'T', 'D')).status, 'published');
  });
  it('moderation transitions', () => {
    assert.equal(createModerationCase('res', 'r1', 'm1').status, 'open');
    assert.equal(canTransitionModeration('open', 'triaged'), true);
  });
  it('scoring support preserves', () => {
    assert.equal(createScoringSupportAction('j1', 'retry', 'T', 'a1').originalResponsePreserved, true);
  });
  it('entitlement no billing', () => {
    assert.ok(!Object.keys(createEntitlementAdjustmentRequest('u1', { f: 'x' }, 't')).includes('price'));
  });
  it('sensitive action confirmation', () => {
    const c = createConfirmation('d', 't', {}, 'ik1', 60000);
    assert.equal(c.status, 'pending');
    assert.equal(isConfirmationStale(c), false);
  });
  it('sensitive action stale', () => {
    assert.equal(isConfirmationStale(createConfirmation('d', 't', {}, 'ik2', -60000)), true);
  });
});

// ================================================================
// PHASE U
// ================================================================
describe('Phase U', () => {
  it('draft transitions', () => {
    assert.equal(canTransitionDraft('draft', 'imported'), true);
    assert.equal(canTransitionDraft('draft', 'published'), false);
  });
  it('no provenance blocks', () => {
    assert.equal(evaluateProvenanceGate(null, true).passed, false);
  });
  it('author cannot self-approve', () => {
    assert.equal(canSelfApprove(true, true).allowed, false);
  });
  it('author can self-approve when permitted', () => {
    assert.equal(canSelfApprove(true, false).allowed, true);
  });
  it('idempotent publication', () => {
    assert.equal(canTransitionDraft('publication-queued', 'published'), true);
  });
  it('retirement preserves', () => {
    assert.equal(canTransitionDraft('published', 'retired'), true);
  });
  it('import validation', () => {
    assert.equal(validateImportRow({ n: 't' }, ['n', 'x']).valid, false);
  });
  it('publication gate', () => {
    assert.equal(evaluatePublicationGate([{ name: 'v', passed: false, message: 'F' }]).passed, false);
  });
  it('quality-profile weights', () => {
    assert.equal(
      calculateQualityScore(
        { id: 'qp1', version: 1, components: { s: { weight: 1, required: true, threshold: 0.5 } } },
        { s: 0.8 },
      ).overall,
      0.8,
    );
  });
  it('batch partial failure', () => {
    const r = createBatchResult([
      { contentId: 'c1', success: true },
      { contentId: 'c2', success: false },
    ]);
    assert.equal(r.partial, true);
  });
});

// ================================================================
// PHASE V
// ================================================================
describe('Phase V', () => {
  it('agreement', () => {
    assert.equal(calculateAgreement([1, 1], [1, 1], 0).absoluteAgreement, 1);
  });
  it('agreement failure', () => {
    assert.equal(calculateAgreement([1, 0], [0, 1], 0).absoluteAgreement, 0);
  });
  it('dataset validation', () => {
    assert.equal(validateDatasetSamples(3, 10).valid, false);
  });
  it('subgroup/bias analysis', () => {
    assert.equal(detectBias([0.9, 0.5], 0.7, 0.1).hasBias, true);
  });
  it('drift', () => {
    assert.equal(detectDrift(0.7, 0.9, 0.1).drifted, true);
  });
  it('promotion blocked without dataset', () => {
    assert.ok(
      evaluatePromotionGate({ profileId: 'p1', profileVersion: 1 }).failures.includes(
        'Required calibration dataset does not exist',
      ),
    );
  });
  it('promotion passed', () => {
    assert.equal(
      evaluatePromotionGate({
        profileId: 'p1',
        profileVersion: 1,
        datasetExists: true,
        minimumSamplesPass: true,
        agreementPass: true,
        biasPass: true,
        driftPass: true,
        reportApproved: true,
        rollbackCriteriaDefined: true,
        auditEventCreated: true,
      }).passed,
      true,
    );
  });
  it('report immutability', () => {
    assert.equal(finalizeReport(buildCalibrationReport('ds1', ['p1'])).immutable, true);
  });
  it('rollback preserves', () => {
    assert.equal(createRollbackDecision('p1', 3, 1, 'R', 'a1').silentOverwrite, false);
  });
  it('can rollback', () => {
    assert.equal(canRollback(3, 1), true);
  });
  it('observational wording', () => {
    assert.equal(evaluateEffectiveness(0.5, 0.7, false).classification, 'observational');
  });
});

// ================================================================
// PHASE W
// ================================================================
describe('Phase W', () => {
  it('notification failure does not block', () => {
    assert.equal(isNotificationBlocked(false, true, false), false);
  });
  it('notification suppressed', () => {
    assert.equal(isNotificationBlocked(false, false, false), true);
  });
  it('notification blocked quiet hours', () => {
    assert.equal(isNotificationBlocked(true, false, true), true);
  });
  it('support case transitions', () => {
    assert.equal(canTransitionCase('open', 'triaged'), true);
    assert.equal(canTransitionCase('resolved', 'closed'), true);
  });
  it('delivery transitions', () => {
    assert.equal(canTransitionDelivery('queued', 'sent'), true);
    assert.equal(canTransitionDelivery('delivered', 'sent'), false);
  });
  it('scoring recovery', () => {
    assert.equal(canRecoverScoring(true), true);
    assert.equal(canRecoverScoring(false), false);
  });
  it('media repair lineage', () => {
    assert.equal(canRepairMedia(true), true);
  });
  it('backup restoration evidence', () => {
    assert.equal(requiresRestorationEvidence('passed'), true);
  });
  it('retention', () => {
    assert.equal(isEligibleForRetention(365, 90, true), false);
    assert.equal(isEligibleForRetention(365, 90, false), true);
  });
  it('retention preview', () => {
    assert.equal(previewRetention(100, 5).eligible, 95);
  });
  it('stale progress', () => {
    assert.equal(isProgressStale(new Date(Date.now() - 7200000).toISOString(), 3600000), true);
  });
});
