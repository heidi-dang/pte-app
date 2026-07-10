export interface WorkerConfig {
  version: string;
  logLevel: string;
}

export function loadConfig(): WorkerConfig {
  return {
    version: process.env.APP_VERSION || '0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
