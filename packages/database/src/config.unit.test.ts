import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadDatabaseConfig, type DatabaseConfig } from './config.js';

describe('database config', () => {
  it('loads config from environment', () => {
    const config = loadDatabaseConfig({
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '5432',
      POSTGRES_DATABASE: 'pte_app',
      POSTGRES_USER: 'pte_app',
      POSTGRES_PASSWORD: 'secret',
    });

    assert.equal(config.host, 'localhost');
    assert.equal(config.port, 5432);
    assert.equal(config.database, 'pte_app');
    assert.equal(config.user, 'pte_app');
    assert.equal(config.password, 'secret');
    assert.equal(config.ssl, false);
  });

  it('throws when POSTGRES_HOST is missing', () => {
    assert.throws(() => {
      loadDatabaseConfig({
        POSTGRES_PORT: '5432',
        POSTGRES_DATABASE: 'pte_app',
        POSTGRES_USER: 'pte_app',
        POSTGRES_PASSWORD: 'secret',
      });
    }, /Missing POSTGRES_HOST/);
  });

  it('throws when POSTGRES_PORT is missing', () => {
    assert.throws(() => {
      loadDatabaseConfig({
        POSTGRES_HOST: 'localhost',
        POSTGRES_DATABASE: 'pte_app',
        POSTGRES_USER: 'pte_app',
        POSTGRES_PASSWORD: 'secret',
      });
    }, /Missing POSTGRES_PORT/);
  });

  it('throws for invalid port', () => {
    assert.throws(() => {
      loadDatabaseConfig({
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: '70000',
        POSTGRES_DATABASE: 'pte_app',
        POSTGRES_USER: 'pte_app',
        POSTGRES_PASSWORD: 'secret',
      });
    }, /Invalid POSTGRES_PORT/);
  });

  it('respects SSL flag', () => {
    const config = loadDatabaseConfig({
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '5432',
      POSTGRES_DATABASE: 'pte_app',
      POSTGRES_USER: 'pte_app',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_SSL: 'true',
    });
    assert.equal(config.ssl, true);
  });

  it('applies defaults for optional values', () => {
    const config = loadDatabaseConfig({
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '5432',
      POSTGRES_DATABASE: 'pte_app',
      POSTGRES_USER: 'pte_app',
      POSTGRES_PASSWORD: 'secret',
    });
    assert.equal(config.maxConnections, 10);
    assert.equal(config.connectionTimeoutMs, 5000);
    assert.equal(config.idleTimeoutMs, 30000);
    assert.equal(config.retryAttempts, 10);
    assert.equal(config.retryDelayMs, 1000);
  });
});
