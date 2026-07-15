import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  ScoreTrendConfig,
  ScoreTrendId,
  MasteryProfile,
  MasteryId,
  MasterySnapshotId,
  MockComparisonId,
  TraitAnalysisId,
  WeaknessReportId,
} from '@pte-app/contracts';
import { buildScoreTrendSet, isProfileCompatible } from './reporting/score-trend.js';
import {
  calculateSkillMastery,
  calculateTaskMastery,
  buildMasterySnapshot,
  type SkillEvidence,
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

const makeEv = (overrides: Partial<SkillEvidence> = {}): SkillEvidence => ({
  skillId: 'reading',
  skillName: 'Reading',
  taskId: 'task1',
  resultId: 'r1',
  estimatedScore: 0.7,
  confidence: 0.8,
  profileVersion: 1,
  completenessStatus: 'complete',
  timestamp: '2025-01-01T00:00:00Z',
  ...overrides,
});

const makeProfile = (overrides: Partial<MasteryProfile> = {}): MasteryProfile => ({
  id: 'mp1' as MasteryId,
  version: 1,
  minimumEvidence: 3,
  minimumConfidence: 0.5,
  levelDefinitions: { '1': { threshold: 0.5, label: '1' }, '2': { threshold: 0.8, label: '2' } },
  staleDataThresholdDays: 30,
  ...overrides,
});

describe('Phase R — Dashboard and Mastery', () => {
  it('no synthetic mastery score', () => {
    const levels = calculateSkillMastery(makeProfile(), [makeEv({ estimatedScore: 0.6 })]);
    assert.equal(levels[0]?.status, 'insufficient');
    assert.equal(levels[0]?.level, -1);
  });

  it('distinct task and skill mastery', () => {
    const ev = [makeEv({ skillId: 'reading', taskId: 'task1' }), makeEv({ skillId: 'reading', taskId: 'task2' })];
    const skillLevels = calculateSkillMastery(makeProfile({ minimumEvidence: 1 }), ev);
    const taskLevels = calculateTaskMastery(makeProfile({ minimumEvidence: 1 }), ev);
    assert.equal(skillLevels.length, 1);
    assert.equal(taskLevels.length, 2);
  });

  it('insufficient evidence produces no level', () => {
    const ev = [makeEv({ estimatedScore: 0.6 })];
    const levels = calculateSkillMastery(makeProfile({ minimumEvidence: 10 }), ev);
    assert.equal(levels[0]?.status, 'insufficient');
    assert.equal(levels[0]?.level, -1);
    assert.equal(levels[0]?.confidence, 0);
  });

  it('sufficient evidence produces level', () => {
    const ev = Array.from({ length: 5 }, (_, i) => makeEv({ estimatedScore: 0.7 + i * 0.02 }));
    const levels = calculateSkillMastery(makeProfile({ minimumEvidence: 3 }), ev);
    assert.equal(levels[0]?.status, 'sufficient');
    assert.ok(levels[0]?.level >= 0);
  });

  it('mastery snapshot with insufficient evidence', () => {
    const snapshot = buildMasterySnapshot(makeProfile({ minimumEvidence: 10 }), 'user1', [makeEv()], 'fresh');
    assert.ok(snapshot.partialData);
    assert.ok(snapshot.warnings.length > 0);
  });

  it('mastery snapshot with injected IDs', () => {
    const idGen = () => 'injected-id';
    const tsGen = () => '2025-01-01T00:00:00Z';
    const snapshot = buildMasterySnapshot(
      makeProfile({ minimumEvidence: 0 }),
      'user1',
      [makeEv()],
      'fresh',
      idGen,
      tsGen,
    );
    assert.equal(snapshot.id, 'injected-id');
    assert.equal(snapshot.calculatedAt, '2025-01-01T00:00:00Z');
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
    const trend = buildScoreTrendSet(config, points);
    assert.equal(trend.dataPoints.length, 2);
    assert.equal(trend.warnings.length, 0);
  });

  it('incompatible profile comparison flagged', () => {
    assert.equal(
      isProfileCompatible({ profileId: 'p1', profileVersion: 1 }, { profileId: 'p1', profileVersion: 2 }),
      false,
    );
  });

  it('profile version change detected', () => {
    const config = {
      id: 'cfg1' as ScoreTrendId,
      version: 1,
      timeGrouping: 'day' as const,
      aggregationMethod: 'mean' as const,
      minimumDataPoints: 1,
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
        profileVersion: 2,
        partial: false,
      },
    ];
    const trend = buildScoreTrendSet(config, points);
    assert.ok(trend.warnings.length > 0);
  });

  it('freshness evaluation', () => {
    assert.equal(evaluateFreshness(new Date().toISOString(), 3600000, 'test').status, 'fresh');
    assert.equal(evaluateFreshness(new Date(Date.now() - 7200000).toISOString(), 3600000, 'test').status, 'stale');
  });

  it('partial data detection', () => {
    assert.equal(hasPartialData([{ status: 'sufficient' }, { status: 'insufficient' }]), true);
    assert.equal(hasPartialData([{ status: 'sufficient' }, { status: 'sufficient' }]), false);
  });

  it('label says Estimated training result', () => {
    assert.ok(labelScore(0.75, 'good').startsWith('Estimated training result'));
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
    assert.ok(report.warnings.length > 0);
  });

  it('lineage: source result references preserved in mastery', () => {
    const ev = Array.from({ length: 3 }, (_, i) => makeEv({ resultId: `res${i}`, estimatedScore: 0.7 }));
    const levels = calculateSkillMastery(makeProfile({ minimumEvidence: 3 }), ev);
    assert.equal(levels[0]?.contributingAttempts[0]?.resultId, 'res0');
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
    const updated = createFeedbackVersion(fb, 'v2');
    assert.equal(updated.version, 2);
    assert.equal(updated.versionHistory.length, 2);
  });
  it('review lock conflict', () => {
    const lock = acquireLock('review1', 'teacher1', 60000);
    assert.equal(lock.status, 'active');
  });
  it('expired lock detected', () => {
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
  it('assignment version preservation', () => {
    const asmt = createAssignment('t1', 'Test', 'Do it');
    assert.equal(asmt.version, 1);
    assert.equal(asmt.status, 'draft');
    const pub = publishAssignment(asmt);
    assert.equal(pub.status, 'published');
  });
  it('moderation transitions', () => {
    const mc = createModerationCase('response', 'resp1', 'mod1');
    assert.equal(mc.status, 'open');
    assert.equal(canTransitionModeration('open', 'triaged'), true);
    assert.equal(canTransitionModeration('open', 'resolved'), false);
  });
  it('scoring retry preserves source', () => {
    const action = createScoringSupportAction('job1', 'retry', 'Timeout', 'admin1');
    assert.equal(action.originalResponsePreserved, true);
  });
  it('entitlement adapter contains no billing', () => {
    const req = createEntitlementAdjustmentRequest('user1', { featureFlag: 'extended' }, 'Upgrade request');
    assert.equal(req.confirmationRequired, true);
    assert.ok(!Object.keys(req).includes('price'));
    assert.ok(!Object.keys(req).includes('plan'));
  });
  it('impersonation audit', () => {
    assert.equal(canStartImpersonation(true, true).allowed, true);
  });
  it('impersonation disabled by config', () => {
    assert.equal(canStartImpersonation(false, true).allowed, false);
  });
  it('sensitive action confirmation', () => {
    const conf = createConfirmation('delete', 'test', {}, 'ik1', 60000);
    assert.equal(conf.status, 'pending');
    assert.equal(isConfirmationStale(conf), false);
  });
  it('sensitive action stale rejection', () => {
    const conf = createConfirmation('delete', 'test', {}, 'ik2', -60000);
    assert.equal(isConfirmationStale(conf), true);
  });
});

describe('Phase U — Content Factory', () => {
  it('draft state transitions', () => {
    assert.equal(canTransitionDraft('draft', 'imported'), true);
    assert.equal(canTransitionDraft('draft', 'published'), false);
  });
  it('no provenance blocks publication', () => {
    assert.equal(evaluateProvenanceGate(null, true).passed, false);
  });
  it('generated content blocks publication before human review', () => {
    assert.equal(canTransitionDraft('generating-assistance', 'published'), false);
  });
  it('author cannot self-approve where prohibited', () => {
    assert.equal(canSelfApprove(true, true).allowed, false);
  });
  it('author can self-approve when policy permits', () => {
    assert.equal(canSelfApprove(true, false).allowed, true);
  });
  it('idempotent publication', () => {
    assert.equal(canTransitionDraft('publication-queued', 'published'), true);
  });
  it('retirement preserves historical access', () => {
    assert.equal(canTransitionDraft('published', 'retired'), true);
  });
  it('validation failure', () => {
    assert.equal(canTransitionDraft('validating', 'validation-failed'), true);
    assert.equal(canTransitionDraft('validation-failed', 'draft'), true);
  });
  it('duplicate resolution', () => {
    assert.equal(canTransitionDraft('ready-for-validation', 'validating'), true);
  });
  it('author self-approval rejection', () => {
    assert.equal(canSelfApprove(true, true).allowed, false);
  });
  it('batch partial failure', () => {
    const r = createBatchResult([
      { contentId: 'c1', success: true },
      { contentId: 'c2', success: false },
    ]);
    assert.equal(r.partial, true);
    assert.equal(r.successCount, 1);
    assert.equal(r.failureCount, 1);
  });
  it('quality-profile weights', () => {
    const profile = { id: 'qp1', version: 1, components: { schema: { weight: 1, required: true, threshold: 0.5 } } };
    const result = calculateQualityScore(profile, { schema: 0.8 });
    assert.equal(result.overall, 0.8);
    assert.equal(result.failedRequirements.length, 0);
  });
  it('quality-profile requirement failure', () => {
    const profile = { id: 'qp1', version: 1, components: { schema: { weight: 1, required: true, threshold: 0.5 } } };
    const result = calculateQualityScore(profile, { schema: 0.3 });
    assert.ok(result.failedRequirements.includes('schema'));
  });
  it('import validation', () => {
    assert.equal(validateImportRow({ name: 'test' }, ['name', 'type']).valid, false);
    assert.equal(validateImportRow({ name: 'test', type: 'mcq' }, ['name', 'type']).valid, true);
  });
  it('publication gate requires checks', () => {
    const gate = evaluatePublicationGate([
      { name: 'provenance', passed: true, message: '' },
      { name: 'validation', passed: false, message: 'Validation failed' },
    ]);
    assert.equal(gate.passed, false);
    assert.ok(gate.failures.includes('Validation failed'));
  });
});

describe('Phase V — Calibration', () => {
  it('agreement threshold', () => {
    const m = calculateAgreement([1, 1, 1], [1, 1, 1], 0);
    assert.equal(m.absoluteAgreement, 1);
  });
  it('agreement failure', () => {
    const m = calculateAgreement([1, 0], [0, 1], 0);
    assert.equal(m.absoluteAgreement, 0);
  });
  it('promotion blocked without dataset', () => {
    assert.ok(
      evaluatePromotionGate({ profileId: 'p1', profileVersion: 1 }).failures.includes(
        'Required calibration dataset does not exist',
      ),
    );
  });
  it('promotion blocked without agreement', () => {
    assert.equal(
      evaluatePromotionGate({
        profileId: 'p1',
        profileVersion: 1,
        datasetExists: true,
        minimumSamplesPass: true,
        agreementPass: false,
      }).passed,
      false,
    );
  });
  it('promotion passed with all checks', () => {
    assert.equal(
      evaluatePromotionGate({
        profileId: 'p1',
        profileVersion: 1,
        datasetExists: true,
        minimumSamplesPass: true,
        agreementPass: true,
        biasPass: true,
        biasDisclosureApproved: false,
        driftPass: true,
        reportApproved: true,
        rollbackCriteriaDefined: true,
        auditEventCreated: true,
      }).passed,
      true,
    );
  });
  it('approved disclosure path', () => {
    assert.equal(
      evaluatePromotionGate({
        profileId: 'p1',
        profileVersion: 1,
        datasetExists: true,
        minimumSamplesPass: true,
        agreementPass: true,
        biasPass: false,
        biasDisclosureApproved: true,
        driftPass: true,
        reportApproved: true,
        rollbackCriteriaDefined: true,
        auditEventCreated: true,
      }).passed,
      true,
    );
  });
  it('rollback does not overwrite', () => {
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
        rollbackCriteriaDefined: false,
        auditEventCreated: true,
      }).passed,
      false,
    );
  });
  it('subgroup minimum', () => {
    const result = validateDatasetSamples(3, 10);
    assert.equal(result.valid, false);
  });
  it('bias block', () => {
    const r = detectBias([0.9, 0.5], 0.7, 0.1);
    assert.equal(r.hasBias, true);
  });
  it('drift failure', () => {
    const r = detectDrift(0.7, 0.9, 0.1);
    assert.equal(r.drifted, true);
  });
  it('report immutability', () => {
    const report = buildCalibrationReport('ds1', ['p1']);
    assert.equal(report.immutable, false);
    const fin = finalizeReport(report);
    assert.equal(fin.immutable, true);
  });
  it('rollback preserves results', () => {
    const d = createRollbackDecision('p1', 3, 1, 'Regression', 'admin1');
    assert.equal(d.silentOverwrite, false);
  });
  it('observational wording', () => {
    const e = evaluateEffectiveness(0.5, 0.7, false);
    assert.equal(e.classification, 'observational');
  });
  it('controlled wording', () => {
    const e = evaluateEffectiveness(0.5, 0.7, true);
    assert.equal(e.classification, 'controlled');
  });
});

describe('Phase W — Operations', () => {
  it('notification failure does not block', () => {
    assert.equal(isNotificationBlocked(false, true, false), false);
  });
  it('notification suppressed by preference', () => {
    assert.equal(isNotificationBlocked(false, false, false), true);
  });
  it('notification blocked by quiet hours', () => {
    assert.equal(isNotificationBlocked(true, false, true), true);
  });
  it('support case transitions', () => {
    assert.equal(canTransitionCase('open', 'triaged'), true);
    assert.equal(canTransitionCase('open', 'resolved'), false);
    assert.equal(canTransitionCase('resolved', 'closed'), true);
  });
  it('delivery state machine', () => {
    assert.equal(canTransitionDelivery('queued', 'sent'), true);
    assert.equal(canTransitionDelivery('queued', 'delivered'), false);
  });
  it('scoring recovery preserves response', () => {
    assert.equal(canRecoverScoring(true), true);
    assert.equal(canRecoverScoring(false), false);
  });
  it('media repair preserves original', () => {
    assert.equal(canRepairMedia(true), true);
    assert.equal(canRepairMedia(false), false);
  });
  it('restoration evidence required', () => {
    assert.equal(requiresRestorationEvidence('passed'), true);
  });
  it('legal hold exclusion', () => {
    assert.equal(isEligibleForRetention(365, 90, true), false);
    assert.equal(isEligibleForRetention(365, 90, false), true);
  });
  it('retention preview', () => {
    const p = previewRetention(100, 5);
    assert.equal(p.eligible, 95);
    assert.equal(p.excluded, 5);
  });
  it('stale progress detection', () => {
    assert.equal(isProgressStale(new Date(Date.now() - 7200000).toISOString(), 3600000), true);
    assert.equal(isProgressStale(new Date().toISOString(), 3600000), false);
  });
  it('delivery duplicate prevention', () => {
    assert.equal(canTransitionDelivery('delivered', 'sent'), false);
  });
  it('scoring recovery lineage preserved', () => {
    assert.equal(canRecoverScoring(true), true);
  });
  it('media repair lineage preserved', () => {
    assert.equal(canRepairMedia(true), true);
  });
  it('backup verification requires integrity', () => {
    assert.equal(requiresRestorationEvidence('passed'), true);
    assert.equal(requiresRestorationEvidence('failed'), false);
  });
  it('notification transaction isolation', () => {
    assert.equal(isNotificationBlocked(false, false, false), true);
  });
});
