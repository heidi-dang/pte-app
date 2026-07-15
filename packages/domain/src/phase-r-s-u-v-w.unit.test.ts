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
  EvidencePolicySchema,
  ScoreNormalisationPolicySchema,
  RawMasteryEvidenceSchema,
  ValidMasteryEvidenceSchema,
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

function makePolicy(overrides: Partial<EvidencePolicy> = {}): EvidencePolicy {
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

function makeProfile(overrides: Partial<MasteryProfile> = {}): MasteryProfile {
  return {
    id: 'mp1' as MasteryId,
    version: 1,
    evidencePolicy: makePolicy(overrides.evidencePolicy),
    levelDefinitions: [
      { id: 'l1', label: 'Beginner', value: 1, threshold: 0.5 },
      { id: 'l2', label: 'Advanced', value: 2, threshold: 0.8 },
    ],
    staleDataThresholdDays: 30,
    fallbackLevel: null,
    ...overrides,
  };
}

function makeEv(overrides: Partial<MasteryEvidence> = {}): MasteryEvidence {
  return {
    attemptId: 'att1',
    resultId: 'r1',
    questionVersionId: 'qv1',
    taskId: 'task1',
    taskType: 'reading_single_answer',
    taskName: 'Reading Task',
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

describe('Phase R — Normalisation Validation', () => {
  it('invalid linear input range fails domain', () => {
    const pol = makePolicy({
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
      () => calculateSkillMastery(makeProfile({ evidencePolicy: pol }), [makeEv()]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'INVALID_LINEAR_NORMALISATION_RANGE',
    );
  });

  it('invalid linear input range fails Zod', () => {
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

  it('ascending zero output span fails', () => {
    assert.throws(() =>
      ScoreNormalisationPolicySchema.parse({
        method: 'linear',
        direction: 'ascending',
        inputMinimum: 0,
        inputMaximum: 10,
        outputMinimum: 5,
        outputMaximum: 5,
      }),
    );
  });

  it('descending output span wrong direction fails', () => {
    assert.throws(() =>
      ScoreNormalisationPolicySchema.parse({
        method: 'linear',
        direction: 'descending',
        inputMinimum: 0,
        inputMaximum: 10,
        outputMinimum: 0,
        outputMaximum: 100,
      }),
    );
  });
});

describe('Phase R — Reference Pair Validation', () => {
  it('empty scoring reference ID fails', () => {
    assert.throws(() =>
      EvidencePolicySchema.parse(makePolicy({ referenceScoringProfileId: '', referenceScoringProfileVersion: 1 })),
    );
  });

  it('scoring ID without version fails', () => {
    assert.throws(
      () =>
        EvidencePolicySchema.parse(
          makePolicy({ referenceScoringProfileId: 'sp1', referenceScoringProfileVersion: null }),
        ),
      /must be both null or both non-null/,
    );
  });

  it('scoring version without ID fails', () => {
    assert.throws(
      () =>
        EvidencePolicySchema.parse(makePolicy({ referenceScoringProfileId: null, referenceScoringProfileVersion: 1 })),
      /must be both null or both non-null/,
    );
  });

  it('evaluation ID without version fails', () => {
    assert.throws(
      () =>
        EvidencePolicySchema.parse(
          makePolicy({ referenceEvaluationProfileId: 'ep1', referenceEvaluationProfileVersion: null }),
        ),
      /must be both null or both non-null/,
    );
  });

  it('zero reference version fails', () => {
    assert.throws(
      () =>
        EvidencePolicySchema.parse(makePolicy({ referenceScoringProfileId: 'sp1', referenceScoringProfileVersion: 0 })),
      /min/,
    );
  });
});

describe('Phase R — Evaluation Evidence Pairing', () => {
  it('evaluation ID present with missing version excluded', () => {
    const ev = [makeEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: null })];
    const pol = makePolicy({
      minimumEvidence: 1,
      mixedProfilePolicy: 'exclude-mismatched',
      referenceEvaluationProfileId: 'ep1',
      referenceEvaluationProfileVersion: 1,
    });
    const { levels } = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    assert.equal(levels[0]?.eligibleEvidence, 0);
  });
});

describe('Phase R — Version Validation', () => {
  it('zero scoring version fails', () => {
    assert.throws(() => ValidMasteryEvidenceSchema.parse(makeEv({ scoringProfileVersion: 0 })), /min/);
  });
  it('negative scoring version fails', () => {
    assert.throws(() => ValidMasteryEvidenceSchema.parse(makeEv({ scoringProfileVersion: -1 })), /min/);
  });
});

describe('Phase R — Raw vs Valid Evidence', () => {
  it('contributing evidence empty attemptId rejected', () => {
    assert.throws(() => ValidMasteryEvidenceSchema.parse(makeEv({ attemptId: '' })), /min/);
  });

  it('raw malformed evidence accepted only in unassigned', () => {
    assert.doesNotThrow(() => RawMasteryEvidenceSchema.parse(makeEv({ attemptId: '' })));
  });
});

describe('Phase R — Schema Parsing', () => {
  it('every generated contribution parses through WeightedContributionSchema', () => {
    const ev = Array.from({ length: 3 }, () => makeEv());
    const pol = makePolicy({ minimumEvidence: 3 });
    const { levels } = calculateSkillMastery(makeProfile({ evidencePolicy: pol, fallbackLevel: 0 }), ev);
    for (const l of levels) {
      if (l.status !== 'insufficient') {
        for (const c of l.contributingEvidence) {
          assert.doesNotThrow(() => WeightedContributionSchema.parse(c));
        }
      }
    }
  });

  it('every generated snapshot parses through MasterySnapshotSchema', () => {
    const ev = [makeEv(), makeEv({ taskType: '' })];
    const snap = buildMasterySnapshot(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }),
      'u1',
      ev,
      'fresh',
      undefined,
      undefined,
      'task',
    );
    assert.doesNotThrow(() => MasterySnapshotSchema.parse(snap));
  });
});

describe('Phase R — Weighted Confidence', () => {
  it('low-weight failed record affects confidence less', () => {
    const ev = [
      makeEv({ completenessStatus: 'complete', estimatedTrainingScore: 0.7, confidence: 0.9 }),
      makeEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.7, confidence: 0.1 }),
    ];
    const pol = makePolicy({
      minimumEvidence: 2,
      failedResultPolicy: 'include-with-disclosure',
      failedResultWeight: 0.2,
    });
    const { levels } = calculateSkillMastery(makeProfile({ evidencePolicy: pol, fallbackLevel: 0 }), ev);
    const lvl = levels[0];
    if (!lvl || lvl.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.ok(lvl.confidence > 0.6);
  });
});

describe('Phase R — Malformed Evidence', () => {
  it('empty taskType no task MasteryLevel', () => {
    const { levels, unassigned } = calculateTaskMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }),
      [makeEv({ taskType: '' })],
    );
    assert.equal(levels.length, 0);
    assert.equal(unassigned.length, 1);
  });
});

describe('Phase R — Additional', () => {
  it('skill mastery subject type', () => {
    const { levels } = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), [
      makeEv(),
    ]);
    assert.equal(levels[0]?.subject.subjectType, 'skill');
  });
  it('no synthetic score', () => {
    const { levels } = calculateSkillMastery(makeProfile(), [makeEv()]);
    assert.equal(levels[0]?.level, null);
  });
});

describe('Phase S', () => {
  it('teacher has student read', () => {
    assert.equal(hasCapability('teacher', 'teacher.students.read'), true);
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
  it('entitlement no billing', () => {
    assert.ok(!Object.keys(createEntitlementAdjustmentRequest('u1', { f: 'x' }, 'test')).includes('price'));
  });
  it('sensitive action stale', () => {
    assert.equal(isConfirmationStale(createConfirmation('d', 't', {}, 'ik1', -60000)), true);
  });
});

describe('Phase U', () => {
  it('draft transitions', () => {
    assert.equal(canTransitionDraft('draft', 'imported'), true);
  });
  it('no provenance blocks', () => {
    assert.equal(evaluateProvenanceGate(null, true).passed, false);
  });
  it('author cannot self-approve', () => {
    assert.equal(canSelfApprove(true, true).allowed, false);
  });
  it('batch partial failure', () => {
    assert.equal(
      createBatchResult([
        { contentId: 'c1', success: true },
        { contentId: 'c2', success: false },
      ]).partial,
      true,
    );
  });
});

describe('Phase V', () => {
  it('agreement', () => {
    assert.equal(calculateAgreement([1, 1], [1, 1], 0).absoluteAgreement, 1);
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
  it('bias block', () => {
    assert.equal(detectBias([0.9, 0.5], 0.7, 0.1).hasBias, true);
  });
  it('drift failure', () => {
    assert.equal(detectDrift(0.7, 0.9, 0.1).drifted, true);
  });
  it('report immutability', () => {
    assert.equal(finalizeReport(buildCalibrationReport('ds1', ['p1'])).immutable, true);
  });
  it('observational wording', () => {
    assert.equal(evaluateEffectiveness(0.5, 0.7, false).classification, 'observational');
  });
});

describe('Phase W', () => {
  it('notification failure does not block', () => {
    assert.equal(isNotificationBlocked(false, true, false), false);
  });
  it('notification suppressed', () => {
    assert.equal(isNotificationBlocked(false, false, false), true);
  });
  it('legal hold exclusion', () => {
    assert.equal(isEligibleForRetention(365, 90, true), false);
  });
  it('stale progress', () => {
    assert.equal(isProgressStale(new Date(Date.now() - 7200000).toISOString(), 3600000), true);
  });
});
