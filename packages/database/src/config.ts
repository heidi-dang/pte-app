import type { ConfigurationId, Version, ISO8601DateTime, ISO8601Date } from '@pte-app/types';

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly ssl: boolean;
  readonly maxConnections: number;
  readonly connectionTimeoutMs: number;
  readonly idleTimeoutMs: number;
  readonly retryAttempts: number;
  readonly retryDelayMs: number;
}

export function loadDatabaseConfig(env: Record<string, string | undefined> = process.env): DatabaseConfig {
  const host = env.POSTGRES_HOST;
  const port = env.POSTGRES_PORT;
  const database = env.POSTGRES_DATABASE;
  const user = env.POSTGRES_USER;
  const password = env.POSTGRES_PASSWORD;

  if (!host) throw new Error('Missing POSTGRES_HOST');
  if (!port) throw new Error('Missing POSTGRES_PORT');
  if (!database) throw new Error('Missing POSTGRES_DATABASE');
  if (!user) throw new Error('Missing POSTGRES_USER');
  if (password === undefined) throw new Error('Missing POSTGRES_PASSWORD');

  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error(`Invalid POSTGRES_PORT: ${port}`);
  }

  return {
    host,
    port: parsedPort,
    database,
    user,
    password,
    ssl: env.POSTGRES_SSL === 'true',
    maxConnections: Number(env.POSTGRES_MAX_CONNECTIONS ?? '10'),
    connectionTimeoutMs: Number(env.POSTGRES_CONNECTION_TIMEOUT_MS ?? '5000'),
    idleTimeoutMs: Number(env.POSTGRES_IDLE_TIMEOUT_MS ?? '30000'),
    retryAttempts: Number(env.POSTGRES_RETRY_ATTEMPTS ?? '10'),
    retryDelayMs: Number(env.POSTGRES_RETRY_DELAY_MS ?? '1000'),
  };
}

export interface MigrationRecord {
  readonly id: number;
  readonly version: string;
  readonly name: string;
  readonly appliedAt: ISO8601DateTime;
  readonly checksum: string;
}

export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly disabled: boolean;
  readonly version: number;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export interface UserProfileRecord {
  readonly userId: string;
  readonly displayName: string;
  readonly language: string;
  readonly theme: 'light' | 'dark' | 'system';
  readonly notificationsEnabled: boolean;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
}

export interface UserRoleRecord {
  readonly userId: string;
  readonly role: string;
  readonly assignedAt: ISO8601DateTime;
}

export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: ISO8601DateTime;
  readonly revokedAt: ISO8601DateTime | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: ISO8601DateTime;
}

export interface ConfigurationVersionRecord {
  readonly id: ConfigurationId;
  readonly version: Version;
  readonly status: string;
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly scope: string;
  readonly environment: string;
  readonly effectiveFrom: ISO8601Date;
  readonly effectiveUntil: ISO8601Date | null;
  readonly source: string;
  readonly supersededBy: ConfigurationId | null;
  readonly createdAt: ISO8601DateTime;
}

export interface AuditEventRecord {
  readonly id: string;
  readonly version: string;
  readonly eventType: string;
  readonly actorId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: ISO8601DateTime;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadata: Record<string, unknown>;
}

export interface MediaMetadataRecord {
  readonly id: string;
  readonly version: string;
  readonly type: string;
  readonly url: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly durationSeconds: number | null;
  readonly language: string;
  readonly checksum: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly retiredAt: ISO8601DateTime | null;
}

export interface ContentContractRecord {
  readonly id: string;
  readonly version: string;
  readonly contractType: string;
  readonly contract: Record<string, unknown>;
  readonly createdAt: ISO8601DateTime;
  readonly updatedAt: ISO8601DateTime;
  readonly retiredAt: ISO8601DateTime | null;
}
