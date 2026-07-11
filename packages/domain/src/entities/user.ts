import type { UserId, EntityId, IsoTimestamp } from '@pte-app/contracts';

export type UserRole = 'guest' | 'free_student' | 'paid_student' | 'teacher' | 'content_writer' | 'content_reviewer' | 'administrator' | 'super_administrator' | 'system_worker';

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'deleted';

export interface UserProfile {
  readonly displayName: string;
  readonly avatarUrl?: string;
}

export interface UserSettings {
  readonly timezone?: string;
  readonly locale?: string;
  readonly emailNotifications: boolean;
}

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly profile: UserProfile;
  readonly settings: UserSettings;
  readonly targetScore?: number;
  readonly examDate?: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface CreateUserInput {
  readonly email: string;
  readonly role: UserRole;
  readonly profile: UserProfile;
}
