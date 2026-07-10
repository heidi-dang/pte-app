export interface ScoringConfig {
  host: string;
  port: number;
  webOrigin: string;
  version: string;
  logLevel: string;
}

export function loadConfig(): ScoringConfig {
  return {
    host: process.env.SCORING_HOST || '0.0.0.0',
    port: parseInt(process.env.SCORING_PORT || '5000', 10),
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    version: process.env.APP_VERSION || '0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
