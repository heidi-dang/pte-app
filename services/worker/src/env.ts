export interface WorkerConfig {
  version: string;
  logLevel: string;
}

export function loadConfig(): WorkerConfig {
  const version = process.env.APP_VERSION;
  if (!version) {
    throw new Error('Missing required environment variable: APP_VERSION');
  }

  const logLevel = process.env.LOG_LEVEL || 'info';
  const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent', 'test'];
  if (!validLevels.includes(logLevel)) {
    throw new Error(`Invalid LOG_LEVEL: "${logLevel}". Must be one of: ${validLevels.join(', ')}`);
  }

  return { version, logLevel };
}
