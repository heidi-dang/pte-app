import { resolve } from 'path';

function req(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}

export interface Config {
  host: string;
  port: number;
  version: string;
  logLevel: string;
}

export function loadConfig(): Config {
  return {
    host: process.env.API_HOST || '0.0.0.0',
    port: parseInt(process.env.API_PORT || '4000', 10),
    version: process.env.APP_VERSION || '0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
