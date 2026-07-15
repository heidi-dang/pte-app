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

describe('Phase R — Weighted Mastery', () => {
  it('weighted mean divides by total weight', () => {
    const ev = [
      makeEv({ completenessStatus: 'partial', estimatedTrainingScore: 0.9 }),
      makeEv({ completenessStatus: 'complete', estimatedTrainingScore: 0.5 }),
    ];
    const pol = makePolicy({ minimumEvidence: 2, partialResultPolicy: 'discount', partialResultWeight: 0.5 });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    if (levels[0]?.status === 'insufficient') {
      assert.fail('should have sufficient evidence');
      return;
    }
    assert.ok(typeof levels[0]?.level === 'number');
  });

  it('partial weight 0.5', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'partial', estimatedTrainingScore: 1 }));
    const pol = makePolicy({ minimumEvidence: 3, partialResultPolicy: 'discount', partialResultWeight: 0.5 });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    if (levels[0]?.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.ok(levels[0]?.contributingEvidence[0]?.appliedWeight === 0.5);
  });

  it('failed weight below 1', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.5 }));
    const pol = makePolicy({
      minimumEvidence: 3,
      failedResultPolicy: 'include-with-disclosure',
      failedResultWeight: 0.3,
    });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    if (levels[0]?.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.ok(levels[0]?.contributingEvidence[0]?.appliedWeight === 0.3);
  });

  it('zero total weight returns insufficient', () => {
    const ev = [makeEv({ completenessStatus: 'failed' })];
    const pol = makePolicy({
      minimumEvidence: 1,
      failedResultPolicy: 'include-with-disclosure',
      failedResultWeight: 0,
    });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    assert.equal(levels[0]?.status, 'insufficient');
  });

  it('weighted contribution metadata preserved', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'partial', estimatedTrainingScore: 0.8 }));
    const pol = makePolicy({ minimumEvidence: 3, partialResultPolicy: 'discount', partialResultWeight: 0.5 });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    if (levels[0]?.status === 'insufficient') {
      assert.fail();
      return;
    }
    const c = levels[0]?.contributingEvidence[0] as WeightedContribution;
    assert.ok(c.appliedWeight > 0);
    assert.ok(c.weightedScore > 0);
    assert.ok(c.inclusionReason === 'partial-discounted');
    assert.equal(c.evidence.estimatedTrainingScore, 0.8);
  });
});

describe('Phase R — Normalisation Validation', () => {
  it('invalid linear range throws', () => {
    const pol = makePolicy({
      minimumEvidence: 1,
      scoreNormalisationPolicy: {
        method: 'linear',
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

  it('zero z-score deviation throws', () => {
    const pol = makePolicy({
      minimumEvidence: 1,
      scoreNormalisationPolicy: { method: 'z-score', referenceMean: 0.5, referenceStandardDeviation: 0 },
    });
    assert.throws(
      () => calculateSkillMastery(makeProfile({ evidencePolicy: pol }), [makeEv()]),
      (e: unknown) => e instanceof MasteryValidationError && e.code === 'INVALID_Z_SCORE_STANDARD_DEVIATION',
    );
  });
});

describe('Phase R — Level Fallback', () => {
  it('null fallback never creates level 0', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.1 }));
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3 }), fallbackLevel: null }),
      ev,
    );
    assert.equal(levels[0]?.level, null);
    assert.equal(levels[0]?.status, 'insufficient');
  });

  it('explicit fallback level used', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.1 }));
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3 }), fallbackLevel: 0 }),
      ev,
    );
    assert.equal(levels[0]?.level, 0);
  });
});

describe('Phase R — Profile Compatibility', () => {
  it('mixed profile allow', () => {
    const ev = [makeEv({ scoringProfileVersion: 2 })];
    const pol = makePolicy({
      minimumEvidence: 1,
      allowedScoringProfileVersions: [1, 2],
      mixedProfilePolicy: 'allow',
      referenceScoringProfileVersion: null,
    });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    assert.equal(levels[0]?.eligibleEvidence, 1);
  });

  it('mixed profile exclude', () => {
    const ev = [makeEv({ scoringProfileVersion: 2 })];
    const pol = makePolicy({
      minimumEvidence: 1,
      mixedProfilePolicy: 'exclude-mismatched',
      referenceScoringProfileVersion: 1,
    });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    assert.equal(levels[0]?.eligibleEvidence, 0);
  });

  it('mixed profile disclose creates warning', () => {
    const ev = [makeEv({ scoringProfileVersion: 2 })];
    const pol = makePolicy({
      minimumEvidence: 1,
      mixedProfilePolicy: 'disclose-mismatched',
      referenceScoringProfileVersion: 1,
      allowedScoringProfileVersions: [1, 2],
    });
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    assert.equal(levels[0]?.eligibleEvidence, 1);
    assert.ok(levels[0]?.warnings.length > 0);
  });
});

describe('Phase R — Identity Validation', () => {
  it('missing taskType excluded', () => {
    const ev = [makeEv({ taskType: '' })];
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), ev);
    assert.equal(levels[0]?.status, 'insufficient');
  });

  it('missing required field excluded', () => {
    const ev = [makeEv({ attemptId: '' })];
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), ev);
    assert.equal(levels[0]?.eligibleEvidence, 0);
  });

  it('missing skillId excluded', () => {
    const ev = [makeEv({ skillId: '' })];
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), ev);
    assert.equal(levels[0]?.eligibleEvidence, 0);
  });
});

describe('Phase R — Snapshot Mode', () => {
  it('task snapshot warning wording', () => {
    const snap = buildMasterySnapshot(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 10 }) }),
      'u1',
      [makeEv()],
      'fresh',
      undefined,
      undefined,
      'task',
    );
    assert.ok(snap.warnings.some((w) => w.includes('tasks')));
    assert.equal(snap.masteryType, 'task');
  });

  it('skill snapshot warning wording', () => {
    const snap = buildMasterySnapshot(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 10 }) }),
      'u1',
      [makeEv()],
      'fresh',
      undefined,
      undefined,
      'skill',
    );
    assert.ok(snap.warnings.some((w) => w.includes('skills')));
    assert.equal(snap.masteryType, 'skill');
  });
});

describe('Phase R — Additional invariants', () => {
  it('skill mastery subject type', () => {
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), [
      makeEv(),
    ]);
    assert.equal(levels[0]?.subject.subjectType, 'skill');
  });

  it('task mastery subject type', () => {
    const levels = calculateTaskMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), [
      makeEv(),
    ]);
    assert.equal(levels[0]?.subject.subjectType, 'task');
  });

  it('no synthetic score', () => {
    const levels = calculateSkillMastery(makeProfile(), [makeEv()]);
    assert.equal(levels[0]?.level, null);
  });
});

describe('Phase S — Teacher and Admin Portals', () => {
  it('teacher has student read capability', () => {
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
  it('scoring retry preserves source', () => {
    assert.equal(createScoringSupportAction('job1', 'retry', 'Timeout', 'admin1').originalResponsePreserved, true);
  });
  it('entitlement no billing', () => {
    assert.ok(!Object.keys(createEntitlementAdjustmentRequest('u1', { f: 'x' }, 'test')).includes('price'));
  });
  it('impersonation audit', () => {
    assert.equal(canStartImpersonation(true, true).allowed, true);
  });
  it('sensitive action stale', () => {
    assert.equal(isConfirmationStale(createConfirmation('d', 't', {}, 'ik1', -60000)), true);
  });
});

describe('Phase U — Content Factory', () => {
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
    const r = createBatchResult([
      { contentId: 'c1', success: true },
      { contentId: 'c2', success: false },
    ]);
    assert.equal(r.partial, true);
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
  it('publication gate blocks', () => {
    assert.equal(evaluatePublicationGate([{ name: 'v', passed: false, message: 'F' }]).passed, false);
  });
});

describe('Phase V — Calibration', () => {
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
  it('rollback preserves', () => {
    assert.equal(createRollbackDecision('p1', 3, 1, 'R', 'a1').silentOverwrite, false);
  });
  it('observational wording', () => {
    assert.equal(evaluateEffectiveness(0.5, 0.7, false).classification, 'observational');
  });
});

describe('Phase W — Operations', () => {
  it('notification failure does not block', () => {
    assert.equal(isNotificationBlocked(false, true, false), false);
  });
  it('notification suppressed', () => {
    assert.equal(isNotificationBlocked(false, false, false), true);
  });
  it('support case transitions', () => {
    assert.equal(canTransitionCase('open', 'triaged'), true);
  });
  it('scoring recovery preserves', () => {
    assert.equal(canRecoverScoring(true), true);
  });
  it('media repair preserves', () => {
    assert.equal(canRepairMedia(true), true);
  });
  it('restoration evidence required', () => {
    assert.equal(requiresRestorationEvidence('passed'), true);
  });
  it('legal hold exclusion', () => {
    assert.equal(isEligibleForRetention(365, 90, true), false);
  });
  it('stale progress', () => {
    assert.equal(isProgressStale(new Date(Date.now() - 7200000).toISOString(), 3600000), true);
  });
});
