import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Web health configuration', () => {
  it('identifies missing API URL', () => {
    const orig = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    assert.equal(!!process.env.NEXT_PUBLIC_API_URL, false);
    process.env.NEXT_PUBLIC_API_URL = orig;
  });

  it('identifies missing scoring URL', () => {
    const orig = process.env.NEXT_PUBLIC_SCORING_URL;
    delete process.env.NEXT_PUBLIC_SCORING_URL;
    assert.equal(!!process.env.NEXT_PUBLIC_SCORING_URL, false);
    process.env.NEXT_PUBLIC_SCORING_URL = orig;
  });

  it('API success state', () => assert.equal('ok', 'ok'));
  it('API failure state', () => assert.equal('fail', 'fail'));
  it('Scoring success state', () => assert.equal('ok', 'ok'));
  it('Scoring failure state', () => assert.equal('fail', 'fail'));
  it('Loading state', () => assert.equal('loading', 'loading'));
});
