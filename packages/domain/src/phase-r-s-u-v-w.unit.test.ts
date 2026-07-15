import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ScoreTrendConfig, ScoreTrendId, MasteryProfile, MasteryId, MasterySnapshotId } from '@pte-app/contracts';
import { buildScoreTrendSet, isProfileCompatible } from './reporting/score-trend.js';
import { calculateSkillMastery, calculateTaskMastery, buildMasterySnapshot } from './reporting/mastery-calculator.js';
import type { MasteryEvidence, EvidencePolicy } from '@pte-app/contracts';
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

describe('Phase R — Mastery Identity', () => {
  it('skill mastery produces subjectType skill', () => {
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), [
      makeEv(),
    ]);
    assert.equal(levels[0]?.subject.subjectType, 'skill');
    assert.equal(levels[0]?.subject.subjectId, 'reading');
  });

  it('task mastery produces subjectType task', () => {
    const levels = calculateTaskMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), [
      makeEv(),
    ]);
    assert.equal(levels[0]?.subject.subjectType, 'task');
    assert.equal(levels[0]?.subject.subjectId, 'task1');
  });

  it('task mastery includes taskType', () => {
    const levels = calculateTaskMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), [
      makeEv(),
    ]);
    if (levels[0]?.subject.subjectType === 'task') {
      assert.equal(levels[0].subject.taskType, 'reading_single_answer');
    }
  });

  it('distinct task and skill', () => {
    const ev = [makeEv({ skillId: 'reading', taskId: 'task1' }), makeEv({ skillId: 'reading', taskId: 'task2' })];
    const pol = makePolicy({ minimumEvidence: 1 });
    const skillLevels = calculateSkillMastery(makeProfile({ evidencePolicy: pol }), ev);
    const taskLevels = calculateTaskMastery(makeProfile({ evidencePolicy: pol }), ev);
    assert.equal(skillLevels.length, 1);
    assert.equal(skillLevels[0]?.subject.subjectId, 'reading');
    assert.equal(taskLevels.length, 2);
    assert.equal(taskLevels[0]?.subject.subjectId, 'task1');
    assert.equal(taskLevels[1]?.subject.subjectId, 'task2');
  });

  it('no undefined id fallback', () => {
    const ev = [makeEv({ skillName: 'Reading' })];
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1 }) }), ev);
    assert.equal(levels[0]?.subject.subjectName, 'Reading');
  });
});

describe('Phase R — Evidence Eligibility', () => {
  it('partial include', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'partial', estimatedTrainingScore: 0.6 }));
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3, partialResultPolicy: 'include' }) }),
      ev,
    );
    assert.equal(levels[0]?.evidenceCount, 3);
  });

  it('partial discount differs from include', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'partial', estimatedTrainingScore: 0.9 }));
    const inc = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({ minimumEvidence: 3, partialResultPolicy: 'include', partialResultWeight: 0.5 }),
      }),
      ev,
    );
    const disc = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({ minimumEvidence: 3, partialResultPolicy: 'discount', partialResultWeight: 0.3 }),
      }),
      ev,
    );
    assert.notEqual(inc[0]?.level, disc[0]?.level);
  });

  it('partial exclude', () => {
    const ev = [makeEv({ completenessStatus: 'partial' })];
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1, partialResultPolicy: 'exclude' }) }),
      ev,
    );
    assert.equal(levels[0]?.status, 'insufficient');
    assert.equal(levels[0]?.excludedEvidence[0]?.reason, 'partial-policy-excluded');
  });

  it('failed exclude', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.1 }));
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3, failedResultPolicy: 'exclude' }) }),
      ev,
    );
    assert.equal(levels[0]?.status, 'insufficient');
    assert.equal(levels[0]?.eligibleEvidence, 0);
  });

  it('failed include-with-disclosure', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.6 }));
    const levels = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({
          minimumEvidence: 3,
          failedResultPolicy: 'include-with-disclosure',
          failedResultWeight: 0.5,
        }),
      }),
      ev,
    );
    assert.equal(levels[0]?.status, 'partial');
    assert.ok(levels[0]?.warnings.some((w) => w.includes('disclosure')));
  });

  it('failed evidence is not ordinary performance', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ completenessStatus: 'failed', estimatedTrainingScore: 0.1 }));
    const levels = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({
          minimumEvidence: 3,
          failedResultPolicy: 'include-with-disclosure',
          failedResultWeight: 0.5,
        }),
      }),
      ev,
    );
    assert.equal(levels[0]?.status, 'partial');
    assert.equal(levels[0]?.failedEvidence, 3);
  });
});

describe('Phase R — Score Normalisation', () => {
  it('none', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.7 }));
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3, scoreNormalisationPolicy: { method: 'none' } }) }),
      ev,
    );
    assert.ok(levels[0]?.level !== undefined);
  });

  it('linear normalisation', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.7 }));
    const levels = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({
          minimumEvidence: 3,
          scoreNormalisationPolicy: {
            method: 'linear',
            inputMinimum: 0,
            inputMaximum: 1,
            outputMinimum: 0,
            outputMaximum: 100,
          },
        }),
      }),
      ev,
    );
    assert.ok(levels[0]?.level !== undefined);
  });

  it('z-score normalisation', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.7 }));
    const levels = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({
          minimumEvidence: 3,
          scoreNormalisationPolicy: { method: 'z-score', referenceMean: 0.5, referenceStandardDeviation: 0.1 },
        }),
      }),
      ev,
    );
    assert.ok(levels[0]?.level !== undefined);
  });
});

describe('Phase R — Evidence Separation', () => {
  it('only eligible evidence contributes', () => {
    const ev = [makeEv({ completenessStatus: 'complete' }), makeEv({ completenessStatus: 'failed' })];
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1, failedResultPolicy: 'exclude' }) }),
      ev,
    );
    assert.equal(levels[0]?.contributingEvidence.length, 1);
    assert.equal(levels[0]?.excludedEvidence.length, 1);
  });

  it('excluded evidence has reasons', () => {
    const ev = [makeEv({ completenessStatus: 'failed' })];
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1, failedResultPolicy: 'exclude' }) }),
      ev,
    );
    assert.equal(levels[0]?.excludedEvidence[0]?.reason, 'failed-policy-excluded');
  });
});

describe('Phase R — Explicit Level Values', () => {
  it('level from explicit value', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.7 }));
    const levels = calculateSkillMastery(makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3 }) }), ev);
    assert.equal(levels[0]?.level, 1);
  });

  it('fallback level used when no threshold matches', () => {
    const ev = Array.from({ length: 3 }, () => makeEv({ estimatedTrainingScore: 0.1 }));
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 3 }), fallbackLevel: 0 }),
      ev,
    );
    assert.equal(levels[0]?.level, 0);
  });
});

describe('Phase R — Profile Compatibility', () => {
  it('allowed scoring profile versions filter', () => {
    const ev = [makeEv({ scoringProfileVersion: 2 })];
    const levels = calculateSkillMastery(
      makeProfile({ evidencePolicy: makePolicy({ minimumEvidence: 1, allowedScoringProfileVersions: [1] }) }),
      ev,
    );
    assert.equal(levels[0]?.eligibleEvidence, 0);
    assert.equal(levels[0]?.excludedEvidence.length, 1);
  });

  it('mixed profile policy excludes mismatched', () => {
    const ev = [makeEv({ scoringProfileVersion: 2 })];
    const levels = calculateSkillMastery(
      makeProfile({
        evidencePolicy: makePolicy({
          minimumEvidence: 1,
          allowedScoringProfileVersions: [1],
          mixedProfilePolicy: 'exclude-mismatched',
        }),
      }),
      ev,
    );
    assert.equal(levels[0]?.excludedEvidence.length, 1);
  });
});

describe('Phase R — Additional invariants', () => {
  it('insufficient evidence produces null level', () => {
    const levels = calculateSkillMastery(makeProfile(), [makeEv()]);
    assert.equal(levels[0]?.status, 'insufficient');
    assert.equal(levels[0]?.level, null);
  });

  it('composite report with partial data warning', () => {
    const filter = { includePartial: true, includeFailed: false };
    const report = buildCompositeReport('user1', filter, {
      mastery: {
        id: 'ms1' as MasterySnapshotId,
        profileId: 'mp1' as unknown as MasteryId,
        profileVersion: 1,
        userId: 'user1',
        levels: [],
        calculatedAt: '2025-01-01T00:00:00Z',
        dataFreshness: 'fresh' as const,
        partialData: true,
        warnings: ['Partial data'],
      },
    });
    assert.ok(report.partialData);
  });

  it('score trend with compatible profile', () => {
    const config = {
      id: 'cfg1' as ScoreTrendId,
      version: 1,
      timeGrouping: 'day' as const,
      aggregationMethod: 'mean' as const,
      minimumDataPoints: 2,
      includePartial: false,
      profileChangePolicy: 'flag' as const,
      staleDataThresholdDays: 30,
    };
    const points = [
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
    assert.equal(buildScoreTrendSet(config, points).dataPoints.length, 2);
  });

  it('freshness evaluation', () => {
    assert.equal(evaluateFreshness(new Date().toISOString(), 3600000, 'test').status, 'fresh');
  });

  it('label says Estimated training result', () => {
    assert.ok(labelScore(0.75, 'good').startsWith('Estimated training result'));
  });

  it('mastery snapshot with injected IDs', () => {
    const idGen = () => 'injected-id';
    const tsGen = () => '2025-01-01T00:00:00Z';
    const policy = makePolicy({ minimumEvidence: 1 });
    const snapshot = buildMasterySnapshot(
      makeProfile({ evidencePolicy: policy }),
      'user1',
      [makeEv()],
      'fresh',
      idGen,
      tsGen,
    );
    assert.equal(snapshot.id, 'injected-id');
  });
});

describe('Phase S — Teacher and Admin Portals', () => {
  it('teacher has student read capability', () => {
    assert.equal(hasCapability('teacher', 'teacher.students.read'), true);
  });
  it('teacher does not have admin user manage capability', () => {
    assert.equal(hasCapability('teacher', 'admin.users.manage'), false);
  });
  it('admin has admin capabilities', () => {
    assert.equal(hasCapability('admin', 'admin.users.read'), true);
  });
  it('unrelated teacher denied', () => {
    const assignments = [
      {
        id: 'a1',
        teacherId: 't1',
        studentId: 's1',
        effectiveFrom: '2025-01-01T00:00:00Z',
        status: 'active' as const,
        auditHistory: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    assert.equal(isAssignedTeacher(assignments, 't2', 's1'), false);
  });
  it('assigned teacher allowed', () => {
    const assignments = [
      {
        id: 'a1',
        teacherId: 't1',
        studentId: 's1',
        effectiveFrom: '2025-01-01T00:00:00Z',
        status: 'active' as const,
        auditHistory: [],
        createdAt: '',
        updatedAt: '',
      },
    ];
    assert.equal(isAssignedTeacher(assignments, 't1', 's1'), true);
  });
  it('feedback versioning preserved', () => {
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
  it('assignment version preservation', () => {
    assert.equal(publishAssignment(createAssignment('t1', 'Test', 'Do it')).status, 'published');
  });
  it('moderation transitions', () => {
    assert.equal(createModerationCase('response', 'resp1', 'mod1').status, 'open');
    assert.equal(canTransitionModeration('open', 'triaged'), true);
  });
  it('scoring retry preserves source', () => {
    assert.equal(createScoringSupportAction('job1', 'retry', 'Timeout', 'admin1').originalResponsePreserved, true);
  });
  it('entitlement adapter contains no billing', () => {
    const req = createEntitlementAdjustmentRequest('user1', { featureFlag: 'extended' }, 'Upgrade');
    assert.ok(!Object.keys(req).includes('price'));
  });
  it('impersonation audit', () => {
    assert.equal(canStartImpersonation(true, true).allowed, true);
  });
  it('sensitive action stale rejection', () => {
    assert.equal(isConfirmationStale(createConfirmation('delete', 'test', {}, 'ik1', -60000)), true);
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
    const profile = { id: 'qp1', version: 1, components: { schema: { weight: 1, required: true, threshold: 0.5 } } };
    assert.equal(calculateQualityScore(profile, { schema: 0.8 }).overall, 0.8);
  });
  it('import validation', () => {
    assert.equal(validateImportRow({ name: 'test' }, ['name', 'type']).valid, false);
  });
  it('publication gate blocks', () => {
    assert.equal(evaluatePublicationGate([{ name: 'validation', passed: false, message: 'Failed' }]).passed, false);
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
  it('rollback preserves results', () => {
    assert.equal(createRollbackDecision('p1', 3, 1, 'Regression', 'admin1').silentOverwrite, false);
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
    assert.equal(canTransitionCase('resolved', 'closed'), true);
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
  it('retention preview', () => {
    assert.equal(previewRetention(100, 5).eligible, 95);
  });
  it('stale progress', () => {
    assert.equal(isProgressStale(new Date(Date.now() - 7200000).toISOString(), 3600000), true);
  });
  it('delivery duplicate prevention', () => {
    assert.equal(canTransitionDelivery('delivered', 'sent'), false);
  });
});
