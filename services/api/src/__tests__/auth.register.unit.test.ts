import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';
import { AuditAction } from '@pte-app/db';

function makeMockRepos(overrides = {}) {
  return {
    users: {
      findByEmail: mock.fn(async () => null),
      createUser: mock.fn(async () => ({ id: 'u1', email: 'test@example.com' })),
      upsertProfile: mock.fn(async () => ({})),
      createEmailVerification: mock.fn(async () => ({})),
    },
    audit: {
      append: mock.fn(async () => ({})),
    },
    ...overrides,
  };
}

describe('POST /auth/register', () => {
  it('returns 201 and user ID on successful registration', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos();
    const mockSend = mock.fn(async () => {});

    // Overwrite decorators
    (app as any).repositories = mockRepos;
    (app as any).emailProvider = { send: mockSend };
    (app as any).db = {
      $transaction: mock.fn(async (cb: any) => {
        return cb(app.db);
      }),
      role: {
        findUnique: mock.fn(async () => ({ id: 'r1' })),
      },
      userRole: {
        create: mock.fn(async () => ({})),
      },
      user: {
        create: mock.fn(async (args: any) => ({ id: 'u1', ...args.data })),
      },
      userProfile: {
        upsert: mock.fn(async () => ({})),
      },
      emailVerification: {
        create: mock.fn(async () => ({})),
      },
      auditLog: {
        create: mock.fn(async () => ({})),
      },
    };

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'TEST@example.com', // testing case insensitivity / normalization
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.json().userId, 'u1');

    // Verify email normalization & checks
    const findByEmailCalls = (mockRepos.users.findByEmail as any).mock.calls;
    assert.equal(findByEmailCalls.length, 1);
    assert.equal(findByEmailCalls[0].arguments[0], 'TEST@example.com');

    // Verify email was sent
    const emailCalls = mockSend.mock.calls as any;
    assert.equal(emailCalls.length, 1);
    assert.equal(emailCalls[0].arguments[0].to, 'TEST@example.com');

    await app.close();
  });

  it('returns 409 if email is already registered', async () => {
    const app = await buildApp(loadConfig());
    const mockRepos = makeMockRepos({
      users: {
        findByEmail: mock.fn(async () => ({ id: 'u2', email: 'test@example.com' })),
      },
    });

    (app as any).repositories = mockRepos;

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'securePassword123',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error, 'Conflict');
    await app.close();
  });

  it('returns 400 if required fields are missing', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        // password missing
      },
    });

    assert.equal(res.statusCode, 400);
    await app.close();
  });

  it('returns 400 if password is less than 8 characters', async () => {
    const app = await buildApp(loadConfig());
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /at least 8 characters/);
    await app.close();
  });
});
