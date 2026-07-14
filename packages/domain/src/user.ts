import type { UserProfileContract, UserRole, UserPreferences } from '@pte-app/contracts';
import type { UserId, Version, ISO8601DateTime } from '@pte-app/types';

export interface UserProfile {
  readonly userId: UserId;
  readonly version: Version;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly preferences: UserPreferences;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export function createUserProfile(contract: UserProfileContract): UserProfile {
  return {
    userId: contract.userId,
    version: contract.version,
    email: contract.email,
    displayName: contract.displayName,
    role: contract.role,
    preferences: contract.preferences,
    metadata: contract.metadata as Record<string, unknown>,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export function userProfileHasRole(profile: UserProfile, role: UserRole): boolean {
  return profile.role === role;
}

export function userProfileIsStudent(profile: UserProfile): boolean {
  return profile.role === 'student';
}
