export interface Config {
  host: string;
  port: number;
  webOrigin: string;
  version: string;
  logLevel: string;
  // Auth
  bcryptCost: number;
  maxFailedAttempts: number;
  lockoutSeconds: number;
  sessionIdleTimeoutSeconds: number;
  emailVerificationExpirySecs: number;
  passwordResetExpirySecs: number;
  appUrl: string;
}

export function loadConfig(): Config {
  return {
    host: process.env.API_HOST || '0.0.0.0',
    port: parseInt(process.env.API_PORT || '4000', 10),
    webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    version: process.env.APP_VERSION || '0.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    // Auth
    bcryptCost: parseInt(process.env.BCRYPT_COST || '12', 10),
    maxFailedAttempts: parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '5', 10),
    lockoutSeconds: parseInt(process.env.AUTH_LOCKOUT_SECONDS || '60', 10),
    sessionIdleTimeoutSeconds: parseInt(process.env.SESSION_IDLE_TIMEOUT_SECONDS || '86400', 10),
    emailVerificationExpirySecs: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_SECONDS || '3600', 10),
    passwordResetExpirySecs: parseInt(process.env.PASSWORD_RESET_EXPIRY_SECONDS || '3600', 10),
    appUrl: process.env.APP_URL || 'http://localhost:3000',
  };
}
