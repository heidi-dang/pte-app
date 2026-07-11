import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export interface CreateProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

export interface CreateEmailVerificationInput {
  userId: string;
  token: string;
  expiresAt: Date;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function createUsersRepository(db: PrismaClient) {
  return {
    /** Create a new user account. Throws if email is already registered. */
    async createUser(input: CreateUserInput) {
      return db.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          passwordHash: input.passwordHash,
        },
      });
    },

    /** Find a user by their email address (case-insensitive). */
    async findByEmail(email: string) {
      return db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { roles: { include: { role: true } }, profile: true },
      });
    },

    /** Find a user by their ID. */
    async findById(id: string) {
      return db.user.findUnique({
        where: { id },
        include: { roles: { include: { role: true } }, profile: true },
      });
    },

    /** Mark a user's email as verified. Returns null if user not found. */
    async markEmailVerified(userId: string) {
      return db.user.update({
        where: { id: userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      });
    },

    /** Increment failed login count and set lockout if threshold exceeded. */
    async recordFailedLogin(userId: string, maxAttempts: number, lockoutSeconds: number) {
      const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
      const newCount = user.failedLoginCount + 1;
      const shouldLock = newCount >= maxAttempts;
      return db.user.update({
        where: { id: userId },
        data: {
          failedLoginCount: newCount,
          lockedUntil: shouldLock ? new Date(Date.now() + lockoutSeconds * 1000) : undefined,
        },
      });
    },

    /** Reset failed login count after a successful login. */
    async resetFailedLogins(userId: string) {
      return db.user.update({
        where: { id: userId },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    },

    /** Check if the user is currently locked out. */
    async isLockedOut(userId: string): Promise<boolean> {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user?.lockedUntil) return false;
      return user.lockedUntil > new Date();
    },

    /** Create or update user profile. */
    async upsertProfile(input: CreateProfileInput) {
      return db.userProfile.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: input.displayName,
        },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: input.displayName,
        },
      });
    },

    /** Update onboarding step progress. */
    async updateOnboardingStep(userId: string, step: string, complete: boolean) {
      return db.userProfile.update({
        where: { userId },
        data: { onboardingStep: step, onboardingComplete: complete },
      });
    },

    /** Set target scores and exam date from onboarding. */
    async setTargets(userId: string, targets: Prisma.UserProfileUpdateInput) {
      return db.userProfile.update({ where: { userId }, data: targets });
    },

    /** Record microphone check result. */
    async recordMicrophoneCheck(userId: string) {
      return db.userProfile.update({
        where: { userId },
        data: { microphoneChecked: true, microphoneCheckAt: new Date() },
      });
    },

    /** Create an email verification token record. */
    async createEmailVerification(input: CreateEmailVerificationInput) {
      return db.emailVerification.create({
        data: {
          userId: input.userId,
          token: input.token,
          expiresAt: input.expiresAt,
        },
      });
    },

    /** Find an active (unused, unexpired) verification token. */
    async findActiveVerification(token: string) {
      return db.emailVerification.findFirst({
        where: {
          token,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
    },

    /** Mark an email verification token as used. */
    async consumeVerification(id: string) {
      return db.emailVerification.update({
        where: { id },
        data: { usedAt: new Date() },
      });
    },
  };
}
