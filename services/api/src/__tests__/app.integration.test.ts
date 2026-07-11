import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { loadConfig } from '../env.js';
import { buildApp } from '../app.js';

describe('App Flow Integration — Profile & Onboarding', () => {
  it('performs login, get-me, update-profile, set-targets, mic-check, complete-onboarding', async () => {
    const users = new Map<string, any>();
    const sessions = new Map<string, any>();

    const passHash = await bcrypt.hash('Password123!', 10);
    const userId = 'u-integ-1';
    const baseUser = {
      id: userId,
      email: 'onboarding@example.com',
      passwordHash: passHash,
      emailVerified: true,
      failedLoginCount: 0,
      lockedUntil: null,
      roles: [{ role: { name: 'FREE_STUDENT' } }],
      profile: {
        firstName: 'Test',
        lastName: 'User',
        displayName: null,
        country: null,
        timezone: null,
        onboardingStep: null,
        onboardingComplete: false,
        microphoneChecked: false,
        targetOverallScore: null,
        targetSpeaking: null,
        targetWriting: null,
        targetReading: null,
        targetListening: null,
        examDate: null,
      },
      createdAt: new Date(),
    };
    users.set(userId, { ...baseUser });

    const app = await buildApp(loadConfig());

    // Mock db
    (app as any).db = {
      $transaction: mock.fn(async (cb: any) => cb((app as any).db)),
      role: { findUnique: mock.fn(async () => ({ id: 'r-free' })) },
      userRole: { create: mock.fn(async () => ({})) },
      session: {
        update: mock.fn(async ({ where, data }: any) => {
          const s = sessions.get(where.id);
          if (s) s.expiresAt = data.expiresAt;
          return s;
        }),
      },
      userProfile: {
        update: mock.fn(async ({ where, data }: any) => {
          const u = users.get(where.userId);
          if (u) Object.assign(u.profile, data);
          return u?.profile;
        }),
        upsert: mock.fn(async ({ create, update }: any) => {
          const u = users.get(create.userId);
          if (u) Object.assign(u.profile, update);
          return u?.profile;
        }),
      },
    };

    // Mock repositories
    (app as any).repositories = {
      users: {
        findByEmail: mock.fn(
          async (email: string) => Array.from(users.values()).find((u) => u.email === email) ?? null,
        ),
        findById: mock.fn(async (id: string) => users.get(id) ?? null),
        isLockedOut: mock.fn(async () => false),
        resetFailedLogins: mock.fn(async () => {}),
        upsertProfile: mock.fn(async ({ userId: uid, ...data }: any) => {
          const u = users.get(uid);
          if (u) Object.assign(u.profile, data);
          return u?.profile;
        }),
        setTargets: mock.fn(async (uid: string, data: any) => {
          const u = users.get(uid);
          if (u) Object.assign(u.profile, data);
          return u?.profile;
        }),
        recordMicrophoneCheck: mock.fn(async (uid: string) => {
          const u = users.get(uid);
          if (u) {
            u.profile.microphoneChecked = true;
            u.profile.microphoneCheckAt = new Date();
          }
          return u?.profile;
        }),
        updateOnboardingStep: mock.fn(async (uid: string, step: string, complete: boolean) => {
          const u = users.get(uid);
          if (u) {
            u.profile.onboardingStep = step;
            u.profile.onboardingComplete = complete;
          }
          return u?.profile;
        }),
      },
      sessions: {
        createSession: mock.fn(async (input: any) => {
          const id = `sess_${Date.now()}`;
          const s = { id, ...input, invalidatedAt: null };
          sessions.set(input.token, s);
          return s;
        }),
        findActiveSession: mock.fn(async (token: string) => {
          const s = sessions.get(token);
          if (s && !s.invalidatedAt && s.expiresAt > new Date()) {
            return { ...s, user: users.get(s.userId) };
          }
          return null;
        }),
        invalidateSession: mock.fn(async (token: string) => {
          const s = sessions.get(token);
          if (s) s.invalidatedAt = new Date();
        }),
      },
      audit: { append: mock.fn(async () => {}) },
    };

    (app as any).emailProvider = { send: mock.fn(async () => {}) };

    // ── 1. Login ──
    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'onboarding@example.com', password: 'Password123!' },
    });
    assert.equal(loginRes.statusCode, 200, `login: ${loginRes.body}`);
    const token = loginRes.json().token;

    const auth = { authorization: `Bearer ${token}` };

    // ── 2. GET /app/me ──
    const meRes = await app.inject({ method: 'GET', url: '/app/me', headers: auth });
    assert.equal(meRes.statusCode, 200, `me: ${meRes.body}`);
    assert.equal(meRes.json().id, userId);

    // ── 3. PATCH /app/profile ──
    const profileRes = await app.inject({
      method: 'PATCH',
      url: '/app/profile',
      headers: auth,
      payload: { country: 'AU', timezone: 'Australia/Sydney', studyHistoryMonths: 3 },
    });
    assert.equal(profileRes.statusCode, 200, `profile: ${profileRes.body}`);

    // ── 4. POST /app/onboarding/targets ──
    const targetsRes = await app.inject({
      method: 'POST',
      url: '/app/onboarding/targets',
      headers: auth,
      payload: {
        targetOverallScore: 79,
        targetSpeaking: 79,
        targetWriting: 65,
        targetReading: 70,
        targetListening: 79,
      },
    });
    assert.equal(targetsRes.statusCode, 200, `targets: ${targetsRes.body}`);

    // ── 5. POST /app/onboarding/microphone-check ──
    const micRes = await app.inject({
      method: 'POST',
      url: '/app/onboarding/microphone-check',
      headers: auth,
    });
    assert.equal(micRes.statusCode, 200, `mic: ${micRes.body}`);
    assert.equal(users.get(userId).profile.microphoneChecked, true);

    // ── 6. PATCH /app/onboarding/step → complete ──
    const stepRes = await app.inject({
      method: 'PATCH',
      url: '/app/onboarding/step',
      headers: auth,
      payload: { step: 'complete' },
    });
    assert.equal(stepRes.statusCode, 200, `step: ${stepRes.body}`);
    assert.equal(stepRes.json().complete, true);
    assert.equal(users.get(userId).profile.onboardingComplete, true);

    await app.close();
  });
});
