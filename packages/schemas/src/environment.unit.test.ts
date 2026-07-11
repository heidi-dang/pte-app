import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvironment } from './environment.js';

describe('Environment schema', () => {
  it('parses valid environment', () => {
    const env = parseEnvironment({
      APP_VERSION: '1.0.0',
      POSTGRES_DATABASE: 'pte',
      POSTGRES_USER: 'pte_user',
      POSTGRES_PASSWORD: 'secret',
    });
    assert.equal(env.APP_VERSION, '1.0.0');
    assert.equal(env.NODE_ENV, 'development');
    assert.equal(env.WEB_PORT, 3000);
  });

  it('rejects missing required fields', () => {
    assert.throws(() => parseEnvironment({}), /APP_VERSION/);
  });

  it('coerces port strings to numbers', () => {
    const env = parseEnvironment({
      APP_VERSION: '1.0.0',
      WEB_PORT: '8080',
      POSTGRES_DATABASE: 'pte',
      POSTGRES_USER: 'pte_user',
      POSTGRES_PASSWORD: 'secret',
    });
    assert.equal(env.WEB_PORT, 8080);
  });

  it('rejects invalid port range', () => {
    assert.throws(() =>
      parseEnvironment({
        APP_VERSION: '1.0.0',
        WEB_PORT: '99999',
        POSTGRES_DATABASE: 'pte',
        POSTGRES_USER: 'pte_user',
        POSTGRES_PASSWORD: 'secret',
      }),
    );
  });
});
