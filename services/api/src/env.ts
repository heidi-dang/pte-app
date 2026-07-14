import { loadDatabaseConfig, type DatabaseConfig } from '@pte-app/database';
import { loadAuthConfig, type AuthConfig } from './auth/config.js';

export interface Config {
  host: string;
  port: number;
  webOrigin: string;
  version: string;
  logLevel: string;
  database: DatabaseConfig;
  auth: AuthConfig;
}

export function loadConfig(): Config {
  return {
    host: process.env.API_HOST || '0.0.0.0',
    port: parseInt(process.env.API_PORT || '4000', 10),
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    version: process.env.APP_VERSION || '0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    database: loadDatabaseConfig(),
    auth: loadAuthConfig(),
  };
}
