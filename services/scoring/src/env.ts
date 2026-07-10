export interface ScoringConfig {
  host: string;
  port: number;
  version: string;
  logLevel: string;
}

export function loadConfig(): ScoringConfig {
  return {
    host: process.env.SCORING_HOST || '0.0.0.0',
    port: parseInt(process.env.SCORING_PORT || '5000', 10),
    version: process.env.APP_VERSION || '0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
