import type { UserId, Version, ISO8601DateTime, JsonObject } from '@pte-app/types';

export interface UserProfileContract {
  readonly userId: UserId;
  readonly version: Version;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly preferences: UserPreferences;
  readonly metadata: JsonObject;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export type UserRole = 'student' | 'content_reviewer' | 'administrator' | 'observer';

export interface UserPreferences {
  readonly language: string;
  readonly theme: 'light' | 'dark' | 'system';
  readonly notificationsEnabled: boolean;
}
