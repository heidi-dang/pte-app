/**
 * Environment schema contract.
 *
 * Describes the validated configuration shape expected by every workspace.
 * Actual loading and parsing is performed by a typed config loader
 * (e.g. packages/schemas or a loader utility).
 */
export interface Environment {
  nodeEnv: 'development' | 'test' | 'staging' | 'production';
  appVersion: string;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

  // Web
  webHost: string;
  webPort: number;
  webOrigin: string;

  // API
  apiHost: string;
  apiPort: number;

  // Scoring
  scoringHost: string;
  scoringPort: number;

  // Database
  postgresHost: string;
  postgresPort: number;
  postgresDatabase: string;
  postgresUser: string;
  postgresPassword: string;

  // Cache
  redisHost: string;
  redisPort: number;

  // Timeouts
  localStartupTimeoutMs: number;
  localSmokeTimeoutMs: number;

  // Browser-accessible
  nextPublicApiUrl: string;
  nextPublicScoringUrl: string;
  nextPublicAppVersion: string;
}

export type NodeEnv = Environment['nodeEnv'];
export type LogLevel = Environment['logLevel'];
