/**
 * Identifier contract.
 *
 * Every entity in the system is identified by a branded string or
 * an opaque user-facing id (slug, ulid, etc.).
 */

declare const __brand: unique symbol;

/** Opaque entity id — use the branded subtype for type safety. */
export type EntityId = string & { readonly [__brand]: 'EntityId' };

/** User id. */
export type UserId = string & { readonly [__brand]: 'UserId' };

/** Content / question id. */
export type ContentId = string & { readonly [__brand]: 'ContentId' };

/** Attempt / session id. */
export type AttemptId = string & { readonly [__brand]: 'AttemptId' };

/** Course id. */
export type CourseId = string & { readonly [__brand]: 'CourseId' };

/** Lesson id. */
export type LessonId = string & { readonly [__brand]: 'LessonId' };

/** Mock / section-test id. */
export type MockId = string & { readonly [__brand]: 'MockId' };

/** Subscription / entitlement id. */
export type SubscriptionId = string & { readonly [__brand]: 'SubscriptionId' };

/** Media object id. */
export type MediaId = string & { readonly [__brand]: 'MediaId' };

/** Background job id. */
export type JobId = string & { readonly [__brand]: 'JobId' };

// ----- Constructor helpers -----

let counter = 0;
const prefix = (): string => `${Date.now().toString(36)}${(counter++).toString(36).padStart(4, '0')}`;

export function createEntityId(): EntityId {
  return `ent_${prefix()}` as EntityId;
}

export function createUserId(): UserId {
  return `usr_${prefix()}` as UserId;
}

export function createContentId(): ContentId {
  return `cnt_${prefix()}` as ContentId;
}

export function createAttemptId(): AttemptId {
  return `att_${prefix()}` as AttemptId;
}

export function createJobId(): JobId {
  return `job_${prefix()}` as JobId;
}
