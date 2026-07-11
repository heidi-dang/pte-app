import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectiveScorer } from './scorer.js';
import type { ScoringProfile } from './types.js';

const baseProfile: ScoringProfile = {
  id: 'prof_001',
  version: '1.0.0',
  taskType: 'reading_fill_blanks',
  partialCredit: true,
  negativeMarking: false,
  itemMinScore: 0,
  itemMaxScore: 5,
  noResponseScore: 0,
  rules: [{ trait: 'per_blank', weight: 1, description: 'Each correct blank' }],
};

describe('ObjectiveScorer', () => {
  const scorer = new ObjectiveScorer();

  it('scores exact match correctly', () => {
    const result = scorer.score({
      profile: { ...baseProfile, rules: [{ trait: 'exact_match', weight: 1, description: 'Match' }] },
      correctAnswer: { key: 'answer', answer: 'green' },
      studentResponse: { answer: 'green' },
    });
    assert.equal(result.score, 1);
  });

  it('scores per-blank correctly', () => {
    const result = scorer.score({
      profile: baseProfile,
      correctAnswer: { answers: ['cat', 'dog', 'bird'] },
      studentResponse: { answers: ['cat', 'dog', 'fish'] },
    });
    assert.equal(result.score, 2);
    assert.equal(result.maxScore, 3);
  });

  it('scores adjacent pairs for reorder', () => {
    const result = scorer.score({
      profile: { ...baseProfile, rules: [{ trait: 'adjacent_pairs', weight: 1, description: 'Pairs' }] },
      correctAnswer: { order: ['A', 'B', 'C', 'D'] },
      studentResponse: { order: ['A', 'B', 'D', 'C'] },
    });
    // A→B is correct, B→D is wrong, D→C is wrong
    assert.equal(result.score, 1);
    assert.equal(result.maxScore, 3);
  });

  it('applies no-response rule', () => {
    const result = scorer.score({
      profile: { ...baseProfile, noResponseScore: 0 },
      correctAnswer: { answers: ['a', 'b', 'c'] },
      studentResponse: {},
    });
    assert.equal(result.score, 0);
  });

  it('applies negative marking', () => {
    const result = scorer.score({
      profile: {
        ...baseProfile,
        negativeMarking: true,
        itemMinScore: 0,
        rules: [{ trait: 'selected_options', weight: 1, description: 'Options' }],
      },
      correctAnswer: { selected: ['1', '2'] },
      studentResponse: { selected: ['1', '3', '4'] },
    });
    // 1 correct - 2 incorrect = -1, floored at itemMinScore=0
    assert.equal(result.score, 0);
  });

  it('generates percentage', () => {
    const result = scorer.score({
      profile: { ...baseProfile, rules: [{ trait: 'per_blank', weight: 1, description: 'Blanks' }], itemMaxScore: 10 },
      correctAnswer: { answers: ['a', 'b', 'c', 'd'] },
      studentResponse: { answers: ['a', 'b', 'c', 'd'] },
    });
    assert.equal(result.percentage, 100);
    assert.equal(result.profileVersion, '1.0.0');
  });
});
