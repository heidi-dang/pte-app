import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

describe('Authentication Flow Integration', () => {
  it('performs register, verify, login, and logout successfully', async () => {
    // Stateful in-memory stores to simulate database behavior
    const users = new Map<string, any>();
    const profiles = new Map<string, any>();
    const verifications = new Map<string, any>();
    const sessions = new Map<string, any>();
    const auditLogs: any[] = [];

    const app = await buildApp(loadConfig());

    // Mock Prisma transaction and database model methods statefully
    (app as any).db = {
      $transaction: mock.fn(async (cb: any) => cb((app as any).db)),
      role: {
        findUnique: mock.fn(async () => ({ id: 'r-free' })),
      },
      userRole: {
        create: mock.fn(async () => ({})),
      },
      session: {
        update: mock.fn(async ({ where, data }: any) => {
          const sess = sessions.get(where.id);
          if (sess) {
            sess.expiresAt = data.expiresAt;
          }
          return sess;
        }),
      },
      user: {
        create: mock.fn(async (args: any) => {
          const user = {
            id: `usr_${Date.now()}`,
            email: args.data.email,
            passwordHash: args.data.passwordHash,
            emailVerified: false,
            failedLoginCount: 0,
            lockedUntil: null,
            roles: [{ role: { name: 'FREE_STUDENT' } }],
          };
          users.set(user.id, user);
          return user;
        }),
        update: mock.fn(async ({ where, data }: any) => {
          const u = users.get(where.id);
          if (u) {
            Object.assign(u, data);
          }
          return u;
        }),
      },
      userProfile: {
        upsert: mock.fn(async (args: any) => {
          profiles.set(args.create.userId, { ...args.create });
          return profiles.get(args.create.userId);
        }),
      },
      emailVerification: {
        create: mock.fn(async (args: any) => {
          const id = `ver_${Date.now()}`;
          const verification = { id, ...args.data, expiresAt: args.data.expiresAt, usedAt: null };
          verifications.set(args.data.token, verification);
          return verification;
        }),
        update: mock.fn(async ({ where, data }: any) => {
          for (const v of verifications.values()) {
            if (v.id === where.id) {
              Object.assign(v, data);
              return v;
            }
          }
          return null;
        }),
      },
      auditLog: {
        create: mock.fn(async (args: any) => {
          auditLogs.push(args.data);
          return { id: `aud_${Date.now()}`, ...args.data };
        }),
      },
    };

    // Inject stateful repository mock implementations
    (app as any).repositories = {
      users: {
        findByEmail: mock.fn(async (email: string) => {
          const lowerEmail = email.toLowerCase().trim();
          return Array.from(users.values()).find((u) => u.email === lowerEmail) || null;
        }),
        findActiveVerification: mock.fn(async (token: string) => {
          const v = verifications.get(token);
          if (v && !v.usedAt && v.expiresAt > new Date()) {
            return v;
          }
          return null;
        }),
        isLockedOut: mock.fn(async () => false),
        resetFailedLogins: mock.fn(async (userId: string) => {
          const u = users.get(userId);
          if (u) {
            u.failedLoginCount = 0;
            u.lockedUntil = null;
          }
        }),
      },
      sessions: {
        createSession: mock.fn(async (input: any) => {
          const id = `sess_${Date.now()}`;
          const session = { id, ...input, invalidatedAt: null };
          sessions.set(input.token, session);
          return session;
        }),
        findActiveSession: mock.fn(async (token: string) => {
          const s = sessions.get(token);
          if (s && !s.invalidatedAt && s.expiresAt > new Date()) {
            // Include user details like in Prisma
            const u = users.get(s.userId);
            return {
              ...s,
              user: u,
            };
          }
          return null;
        }),
        invalidateSession: mock.fn(async (token: string) => {
          const s = sessions.get(token);
          if (s) {
            s.invalidatedAt = new Date();
          }
        }),
      },
      audit: {
        append: mock.fn(async (log: any) => {
          auditLogs.push(log);
        }),
      },
    };

    // Mock Email Provider
    const emailsSent: any[] = [];
    (app as any).emailProvider = {
      send: mock.fn(async (msg: any) => {
        emailsSent.push(msg);
      }),
    };

    // ─── 1. Register User ───
    const regRes = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'INTEGRATION@Example.Com',
        password: 'superSecretPassword123',
        firstName: 'Integration',
        lastName: 'Tester',
      },
    });

    assert.equal(regRes.statusCode, 201);
    const userId = regRes.json().userId;
    assert.ok(userId);

    // Assert registration verification email sent
    assert.equal(emailsSent.length, 1);
    assert.equal(emailsSent[0].to, 'INTEGRATION@Example.Com');
    const emailBody = emailsSent[0].text;
    const tokenMatch = emailBody.match(/token=([a-f0-9]+)/);
    assert.ok(tokenMatch);
    const verificationToken = tokenMatch[1];

    // ─── 2. Verify Email Address ───
    const verifyRes = await app.inject({
      method: 'GET',
      url: `/auth/verify-email?token=${verificationToken}`,
    });

    assert.equal(verifyRes.statusCode, 200);
    assert.equal(users.get(userId).emailVerified, true);

    // ─── 3. Log In User ───
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'integration@example.com',
        password: 'superSecretPassword123',
      },
    });

    assert.equal(loginRes.statusCode, 200);
    const sessionToken = loginRes.json().token;
    assert.ok(sessionToken);

    // ─── 4. Access Protected Route (Logout) ───
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    });

    assert.equal(logoutRes.statusCode, 200);

    // Assert session is invalidated
    const sessionRecord = sessions.get(sessionToken);
    assert.ok(sessionRecord.invalidatedAt);

    // ─── 5. Access Protected Route Again (Should Fail) ───
    const failLogoutRes = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
    });

    assert.equal(failLogoutRes.statusCode, 401);

    await app.close();
  });
});
