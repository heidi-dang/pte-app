import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from './env.js';

describe('Worker', () => {
  it('loadConfig returns default values', () => {
    const config = loadConfig();
    assert.equal(typeof config.version, 'string');
    assert.equal(typeof config.logLevel, 'string');
  });
});
