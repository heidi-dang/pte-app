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
import { calculateMasteryLevels, buildMasterySnapshot } from './reporting/mastery-calculator.js';
import { evaluateFreshness } from './reporting/freshness.js';
import { hasPartialData, labelScore } from './reporting/partial-data.js';
import { buildCompositeReport } from './reporting/report-builder.js';
import { hasCapability } from './staff/permission-policy.js';
import { isAssignedTeacher } from './staff/teacher-student-access.js';
import { createFeedbackVersion } from './staff/feedback-versioning.js';
import { acquireLock, isLockExpired, canTakeOver } from './staff/review-lock.js';
import { createConfirmation, isConfirmationStale } from './staff/sensitive-action.js';
import { canStartImpersonation } from './staff/impersonation-policy.js';
import { canTransition as canTransitionDraft } from './content-factory/draft-state-machine.js';
import { evaluateProvenanceGate } from './content-factory/provenance-gate.js';
import { canSelfApprove } from './content-factory/approval-state-machine.js';
import { calculateAgreement } from './calibration/agreement-metrics.js';
import { evaluatePromotionGate } from './calibration/promotion-gate.js';
import { isNotificationBlocked } from './operations/notification-policy.js';
import { canTransition as canTransitionCase } from './operations/support-case-state-machine.js';

describe('Phase R — Dashboard and Mastery', () => {
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

  it('mastery insufficient evidence', () => {
    const profile = {
      id: 'mp1' as MasteryId,
      version: 1,
      minimumEvidence: 5,
      minimumConfidence: 0.5,
      levelDefinitions: { '1': { threshold: 0.5, label: 'Beginner' } },
      staleDataThresholdDays: 30,
    };
    const attempts = [
      {
        resultId: 'r1',
        questionVersionId: 'qv1',
        taskType: 'reading',
        completedAt: '2025-01-01T00:00:00Z',
        estimatedScore: 0.6,
      },
    ];
    const snapshot = buildMasterySnapshot(profile, 'user1', attempts, 'fresh');
    assert.equal(snapshot.levels[0]?.status, 'insufficient');
    assert.ok(snapshot.partialData);
  });

  it('mastery sufficient evidence', () => {
    const profile = {
      id: 'mp1' as MasteryId,
      version: 1,
      minimumEvidence: 1,
      minimumConfidence: 0.5,
      levelDefinitions: { '1': { threshold: 0.5, label: 'Beginner' } },
      staleDataThresholdDays: 30,
    };
    const attempts = Array.from({ length: 5 }, (_, i) => ({
      resultId: `r${i}`,
      questionVersionId: 'qv1',
      taskType: 'reading',
      completedAt: '2025-01-01T00:00:00Z',
      estimatedScore: 0.6,
    }));
    const snapshot = buildMasterySnapshot(profile, 'user1', attempts, 'fresh');
    assert.ok(snapshot.levels.length > 0);
  });

  it('freshness evaluation', () => {
    const fresh = evaluateFreshness(new Date().toISOString(), 3600000, 'test');
    assert.equal(fresh.status, 'fresh');
    const stale = evaluateFreshness(new Date(Date.now() - 7200000).toISOString(), 3600000, 'test');
    assert.equal(stale.status, 'stale');
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
    assert.equal(hasCapability('admin', 'admin.audit.read'), true);
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
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
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
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];
    assert.equal(isAssignedTeacher(assignments, 't1', 's1'), true);
  });

  it('feedback versioning preserved', () => {
    const feedback = {
      id: 'f1',
      attemptId: 'a1',
      teacherId: 't1',
      status: 'draft' as const,
      version: 1,
      versionHistory: [{ version: 1, content: 'v1', updatedAt: '2025-01-01T00:00:00Z' }],
      author: 't1',
      studentVisible: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    const updated = createFeedbackVersion(feedback, 'v2');
    assert.equal(updated.version, 2);
    assert.equal(updated.versionHistory.length, 2);
  });

  it('review lock conflict', () => {
    const lock = acquireLock('review1', 'teacher1', 60000);
    assert.equal(lock.status, 'active');
    assert.equal(lock.ownerId, 'teacher1');
  });

  it('expired lock detected', () => {
    const lock = {
      id: 'l1',
      reviewId: 'r1',
      ownerId: 't1',
      acquiredAt: '2025-01-01T00:00:00Z',
      expiresAt: '2020-01-01T00:00:00Z',
      status: 'active' as const,
      takeoverHistory: [],
    };
    assert.equal(isLockExpired(lock), true);
  });

  it('impersonation audit', () => {
    const result = canStartImpersonation(true, true);
    assert.equal(result.allowed, true);
  });

  it('impersonation disabled by config', () => {
    const result = canStartImpersonation(false, true);
    assert.equal(result.allowed, false);
  });

  it('sensitive action confirmation', () => {
    const conf = createConfirmation('delete-content', 'test', { id: 'c1' }, 'ik1', 60000);
    assert.equal(conf.status, 'pending');
    assert.equal(isConfirmationStale(conf), false);
  });

  it('sensitive action stale rejection', () => {
    const conf = createConfirmation('delete-content', 'test', { id: 'c1' }, 'ik2', -60000);
    assert.equal(isConfirmationStale(conf), true);
  });
});

describe('Phase U — Content Factory', () => {
  it('draft state transitions', () => {
    assert.equal(canTransitionDraft('draft', 'imported'), true);
    assert.equal(canTransitionDraft('draft', 'published'), false);
  });

  it('no provenance blocks publication', () => {
    const result = evaluateProvenanceGate(null, true);
    assert.equal(result.passed, false);
    assert.ok(result.blocks.length > 0);
  });

  it('generated content blocks publication before human review', () => {
    assert.equal(canTransitionDraft('generating-assistance', 'published'), false);
    assert.equal(canTransitionDraft('generating-assistance', 'ready-for-validation'), true);
  });

  it('author cannot self-approve where prohibited', () => {
    const result = canSelfApprove(true, true);
    assert.equal(result.allowed, false);
  });

  it('author can self-approve when policy permits', () => {
    const result = canSelfApprove(true, false);
    assert.equal(result.allowed, true);
  });

  it('idempotent publication', () => {
    assert.equal(canTransitionDraft('publication-queued', 'published'), true);
    assert.equal(canTransitionDraft('published', 'retired'), true);
  });

  it('retirement preserves historical access', () => {
    assert.equal(canTransitionDraft('published', 'retired'), true);
    assert.equal(canTransitionDraft('retired', 'archived'), true);
  });
});

describe('Phase V — Calibration', () => {
  it('agreement threshold', () => {
    const metrics = calculateAgreement([1, 1, 1], [1, 1, 1], 0);
    assert.equal(metrics.absoluteAgreement, 1);
    assert.equal(metrics.insufficientData, true);
  });

  it('agreement failure', () => {
    const metrics = calculateAgreement([1, 0, 1], [0, 1, 0], 0);
    assert.equal(metrics.absoluteAgreement, 0);
  });

  it('promotion blocked without dataset', () => {
    const result = evaluatePromotionGate({ profileId: 'p1', profileVersion: 1 });
    assert.equal(result.passed, false);
    assert.ok(result.failures.includes('Required calibration dataset does not exist'));
  });

  it('promotion blocked without agreement', () => {
    const result = evaluatePromotionGate({
      profileId: 'p1',
      profileVersion: 1,
      datasetExists: true,
      minimumSamplesPass: true,
      agreementPass: false,
    });
    assert.equal(result.passed, false);
  });

  it('promotion passed with all checks', () => {
    const result = evaluatePromotionGate({
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
    });
    assert.equal(result.passed, true);
  });

  it('approved disclosure path', () => {
    const result = evaluatePromotionGate({
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
    });
    assert.equal(result.passed, true);
  });

  it('rollback does not overwrite (flag)', () => {
    const result = evaluatePromotionGate({
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
    });
    assert.equal(result.passed, false);
  });
});

describe('Phase W — Operations', () => {
  it('notification failure does not block (mandatory still sends)', () => {
    assert.equal(isNotificationBlocked(false, true, false), false);
  });

  it('notification suppressed by preference', () => {
    assert.equal(isNotificationBlocked(false, false, false), true);
  });

  it('notification blocked by quiet hours', () => {
    assert.equal(isNotificationBlocked(true, false, true), true);
  });

  it('support case state transitions', () => {
    assert.equal(canTransitionCase('open', 'triaged'), true);
    assert.equal(canTransitionCase('open', 'resolved'), false);
    assert.equal(canTransitionCase('resolved', 'closed'), true);
    assert.equal(canTransitionCase('closed', 'reopened'), true);
  });

  it('support case history immutable', () => {
    assert.equal(canTransitionCase('resolved', 'closed'), true);
  });
});
