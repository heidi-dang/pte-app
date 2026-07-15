import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  MasteryProfile,
  MasteryId,
  EvidencePolicy,
  MasteryEvidence,
  WeightedContribution,
} from '@pte-app/contracts';
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
} from '@pte-app/schemas';
import { hasCapability } from './staff/permission-policy.js';
import { isAssignedTeacher } from './staff/teacher-student-access.js';
import { createFeedbackVersion } from './staff/feedback-versioning.js';
import { createConfirmation, isConfirmationStale } from './staff/sensitive-action.js';
import { canTransition as canTransitionDraft } from './content-factory/draft-state-machine.js';
import { evaluateProvenanceGate } from './content-factory/provenance-gate.js';
import { canSelfApprove } from './content-factory/approval-state-machine.js';
import { createBatchResult } from './content-factory/batch-operation.js';
import { calculateAgreement } from './calibration/agreement-metrics.js';
import { evaluatePromotionGate } from './calibration/promotion-gate.js';
import { detectBias } from './calibration/bias-analysis.js';
import { detectDrift } from './calibration/drift-detector.js';
import { finalizeReport, buildCalibrationReport } from './calibration/report-builder.js';
import { evaluateEffectiveness } from './calibration/study-plan-effectiveness.js';
import { isNotificationBlocked } from './operations/notification-policy.js';
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

describe('Phase R — Schema validation', () => {
  it('valid evidence with eval version 0 rejected', () => {
    assert.throws(() =>
      ValidMasteryEvidenceSchema.parse(mkEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: 0 })),
    );
  });
  it('valid evidence with negative eval version rejected', () => {
    assert.throws(() =>
      ValidMasteryEvidenceSchema.parse(mkEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: -1 })),
    );
  });
  it('valid evidence with fractional eval version rejected', () => {
    assert.throws(() =>
      ValidMasteryEvidenceSchema.parse(mkEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: 1.5 })),
    );
  });
  it('empty evaluation ID rejected', () => {
    assert.throws(() =>
      ValidMasteryEvidenceSchema.parse(mkEv({ evaluationProfileId: '', evaluationProfileVersion: 1 })),
    );
  });
  it('empty allowed scoring profile ID rejected', () => {
    assert.throws(() => EvidencePolicySchema.parse(mkPol({ allowedScoringProfileIds: [''] })));
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
});

describe('Phase R — Evidence routing', () => {
  it('invalid scoring version creates no contribution', () => {
    const { levels, unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ scoringProfileVersion: 0 }),
    ]);
    assert.equal(levels.length, 0);
    assert.equal(unassigned.length, 1);
    assert.equal(unassigned[0]?.reason, 'invalid-profile-reference');
  });

  it('incomplete evaluation pair creates no contribution', () => {
    const { levels, unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ evaluationProfileId: 'ep1', evaluationProfileVersion: null }),
    ]);
    assert.equal(levels.length, 0);
    assert.equal(unassigned.length, 1);
    assert.equal(unassigned[0]?.reason, 'invalid-evaluation-pair');
  });

  it('half-present evaluation pair appears in unassigned', () => {
    const { unassigned } = calculateSkillMastery(mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }), [
      mkEv({ evaluationProfileId: null, evaluationProfileVersion: 1 }),
    ]);
    assert.equal(unassigned.length, 1);
  });
});

describe('Phase R — Evaluation disclosure', () => {
  it('both-null eval pair disclosed when reference eval expected', () => {
    const pol = mkPol({
      minimumEvidence: 1,
      mixedProfilePolicy: 'disclose-mismatched',
      referenceEvaluationProfileId: 'ep1',
      referenceEvaluationProfileVersion: 1,
    });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol, fallbackLevel: 0 }), [mkEv()]);
    const lvl = levels[0];
    if (!lvl || lvl.status === 'insufficient') {
      assert.fail();
      return;
    }
    assert.ok(lvl.warnings.some((w) => w.includes('disclosure')));
  });

  it('both-null eval pair excluded under exclude-mismatched', () => {
    const pol = mkPol({
      minimumEvidence: 1,
      mixedProfilePolicy: 'exclude-mismatched',
      referenceEvaluationProfileId: 'ep1',
      referenceEvaluationProfileVersion: 1,
    });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol }), [mkEv()]);
    assert.equal(levels[0]?.eligibleEvidence, 0);
  });
});

describe('Phase R — Schema parsing', () => {
  it('all generated excluded evidence parses through ExcludedEvidenceSchema', () => {
    const ev = [mkEv({ completenessStatus: 'failed' })];
    const pol = mkPol({ minimumEvidence: 1, failedResultPolicy: 'exclude' });
    const { levels } = calculateSkillMastery(mkProf({ evidencePolicy: pol }), ev);
    for (const l of levels) {
      for (const ex of l.excludedEvidence) assert.doesNotThrow(() => ExcludedEvidenceSchema.parse(ex));
    }
  });

  it('every generated contribution parses through WeightedContributionSchema', () => {
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

  it('snapshot with invalid scoring version parses through MasterySnapshotSchema', () => {
    const ev = [mkEv({ scoringProfileVersion: 0 })];
    const snap = buildMasterySnapshot(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }),
      'u1',
      ev,
      'fresh',
      undefined,
      undefined,
      'skill',
    );
    assert.doesNotThrow(() => MasterySnapshotSchema.parse(snap));
  });

  it('snapshot with half-present eval parses through MasterySnapshotSchema', () => {
    const ev = [mkEv({ evaluationProfileId: null, evaluationProfileVersion: 1 })];
    const snap = buildMasterySnapshot(
      mkProf({ evidencePolicy: mkPol({ minimumEvidence: 1 }) }),
      'u1',
      ev,
      'fresh',
      undefined,
      undefined,
      'skill',
    );
    assert.doesNotThrow(() => MasterySnapshotSchema.parse(snap));
  });
});

describe('Phase R — Normalisation', () => {
  it('invalid linear input range fails domain', () => {
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
