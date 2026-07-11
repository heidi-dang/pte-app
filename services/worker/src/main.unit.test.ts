import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from './env.js';

describe('Worker', () => {
  it('loadConfig returns values from environment', () => {
    const origVersion = process.env.APP_VERSION;
    const origLogLevel = process.env.LOG_LEVEL;
    process.env.APP_VERSION = '1.0.0';
    process.env.LOG_LEVEL = 'debug';
    const config = loadConfig();
    assert.equal(config.version, '1.0.0');
    assert.equal(config.logLevel, 'debug');
    process.env.APP_VERSION = origVersion;
    process.env.LOG_LEVEL = origLogLevel;
  });

  it('loadConfig throws when APP_VERSION is missing', () => {
    const orig = process.env.APP_VERSION;
    delete process.env.APP_VERSION;
    assert.throws(() => loadConfig(), { message: /APP_VERSION/ });
    process.env.APP_VERSION = orig;
  });

  it('loadConfig throws for invalid LOG_LEVEL', () => {
    const orig = process.env.LOG_LEVEL;
    const origVersion = process.env.APP_VERSION;
    process.env.APP_VERSION = '1.0.0';
    process.env.LOG_LEVEL = 'invalid_level';
    assert.throws(() => loadConfig(), { message: /LOG_LEVEL/ });
    process.env.LOG_LEVEL = orig;
    process.env.APP_VERSION = origVersion;
  });
});
