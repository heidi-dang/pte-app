import { z } from 'zod';

export const UserRoleSchema = z.enum(['student', 'content_reviewer', 'administrator', 'observer']);

export const UserPreferencesSchema = z.object({
  language: z.string().min(1),
  theme: z.enum(['light', 'dark', 'system']),
  notificationsEnabled: z.boolean(),
});

export const UserProfileContractSchema = z.object({
  userId: z.string().min(1),
  version: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRoleSchema,
  preferences: UserPreferencesSchema,
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
