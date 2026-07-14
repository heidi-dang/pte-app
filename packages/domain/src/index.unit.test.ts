import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createQuestion,
  questionTaskType,
  questionSection,
  questionHasTimeLimit,
  questionHasPreparation,
} from './question.js';
import { createSession, sessionIsActive, sessionIsCompleted, sessionIsTerminal } from './session.js';
import { createAttempt, attemptResponseCount, attemptIsScored } from './attempt.js';
import { createResult, resultScorePercentage } from './result.js';

describe('domain', () => {
  describe('Question', () => {
    const question = createQuestion({
      id: 'q-1' as any,
      version: '1.0.0' as any,
      taskType: 'read-aloud',
      section: 'speaking',
      skillAssessed: 'oral-fluency',
      prompt: 'Read the text',
      media: [],
      timeLimitSeconds: 40,
      preparationSeconds: null,
      maximumAttempts: 1,
      scoringPrinciples: [],
      metadata: {},
      createdAt: '2026-01-01T00:00:00Z' as any,
      updatedAt: '2026-01-01T00:00:00Z' as any,
    });

    it('creates from contract', () => {
      assert.equal(question.id, 'q-1');
      assert.equal(question.taskType, 'read-aloud');
    });

    it('returns task type', () => {
      assert.equal(questionTaskType(question), 'read-aloud');
    });

    it('returns section', () => {
      assert.equal(questionSection(question), 'speaking');
    });

    it('detects time limit', () => {
      assert.equal(questionHasTimeLimit(question), true);
    });

    it('detects no preparation', () => {
      assert.equal(questionHasPreparation(question), false);
    });
  });

  describe('Session', () => {
    const session = createSession({
      id: 's-1' as any,
      version: '1.0.0' as any,
      examId: 'e-1' as any,
      userId: 'u-1' as any,
      status: 'active',
      startedAt: '2026-01-01T00:00:00Z' as any,
      expiresAt: '2026-01-01T01:00:00Z' as any,
      completedAt: null,
      currentTaskIndex: 0,
      answers: [],
      metadata: {},
    });

    it('creates from contract', () => {
      assert.equal(session.id, 's-1');
      assert.equal(session.status, 'active');
    });

    it('detects active', () => {
      assert.equal(sessionIsActive(session), true);
    });

    it('detects not completed', () => {
      assert.equal(sessionIsCompleted(session), false);
    });

    it('detects not terminal', () => {
      assert.equal(sessionIsTerminal(session), false);
    });
  });

  describe('Attempt', () => {
    const attempt = createAttempt({
      id: 'a-1' as any,
      version: '1.0.0' as any,
      userId: 'u-1' as any,
      examId: 'e-1' as any,
      sessionId: 's-1',
      status: 'in_progress',
      questionResponses: [{ questionId: 'q-1', answer: 'hello', score: null, durationMs: 5000 }],
      startedAt: '2026-01-01T00:00:00Z' as any,
      completedAt: null,
      totalScore: null,
      metadata: {},
    });

    it('creates from contract', () => {
      assert.equal(attempt.id, 'a-1');
    });

    it('counts responses', () => {
      assert.equal(attemptResponseCount(attempt), 1);
    });

    it('detects not scored', () => {
      assert.equal(attemptIsScored(attempt), false);
    });
  });

  describe('Result', () => {
    const result = createResult({
      id: 'r-1' as any,
      version: '1.0.0' as any,
      attemptId: 'a-1' as any,
      overallScore: 75,
      maxScore: 100,
      sectionScores: [],
      passed: true,
      scoredAt: '2026-01-01T00:00:00Z' as any,
      metadata: {},
    });

    it('creates from contract', () => {
      assert.equal(result.id, 'r-1');
    });

    it('computes score percentage', () => {
      assert.equal(resultScorePercentage(result), 75);
    });
  });
});
