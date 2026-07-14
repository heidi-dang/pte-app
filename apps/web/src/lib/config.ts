const COOKIE_NAME = process.env.SESSION_COOKIE_NAME;

export function getSessionCookieName(): string {
  if (!COOKIE_NAME) {
    if (typeof window === 'undefined') {
      throw new Error('SESSION_COOKIE_NAME environment variable is required');
    }
    return 'pte_session';
  }
  return COOKIE_NAME;
}
