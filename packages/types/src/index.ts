export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type QuestionId = Brand<string, 'QuestionId'>;
export type ExamId = Brand<string, 'ExamId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type CourseId = Brand<string, 'CourseId'>;
export type LessonId = Brand<string, 'LessonId'>;
export type AttemptId = Brand<string, 'AttemptId'>;
export type MediaId = Brand<string, 'MediaId'>;
export type UploadId = Brand<string, 'UploadId'>;
export type ResultId = Brand<string, 'ResultId'>;
export type FeedbackId = Brand<string, 'FeedbackId'>;
export type AuditEventId = Brand<string, 'AuditEventId'>;
export type ProgressId = Brand<string, 'ProgressId'>;
export type ConfigurationId = Brand<string, 'ConfigurationId'>;

export type ISO8601DateTime = Brand<string, 'ISO8601DateTime'>;
export type ISO8601Date = Brand<string, 'ISO8601Date'>;
export type NonEmptyString = Brand<string, 'NonEmptyString'>;
export type PositiveInteger = Brand<number, 'PositiveInteger'>;
export type NonNegativeInteger = Brand<number, 'NonNegativeInteger'>;
export type Percentage = Brand<number, 'Percentage'>;
export type Version = Brand<string, 'Version'>;

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };

export type ReadonlyDeep<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? ReadonlyArray<ReadonlyDeep<U>>
    : T extends Map<infer K, infer V>
      ? ReadonlyMap<ReadonlyDeep<K>, ReadonlyDeep<V>>
      : T extends Set<infer U>
        ? ReadonlySet<ReadonlyDeep<U>>
        : { readonly [K in keyof T]: ReadonlyDeep<T[K]> };

export type Primitive = string | number | boolean | null | undefined;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
