import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(64).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export interface SessionPayload {
  readonly userId: string;
  readonly role: string;
  readonly sessionId: string;
}

export function createToken(payload: SessionPayload): string {
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRY as string & jwt.SignOptions['expiresIn'] };
  return jwt.sign({ ...payload }, JWT_SECRET, options);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    if (
      typeof decoded.userId !== 'string' ||
      typeof decoded.role !== 'string' ||
      typeof decoded.sessionId !== 'string'
    ) {
      return null;
    }
    return { userId: decoded.userId, role: decoded.role, sessionId: decoded.sessionId };
  } catch {
    return null;
  }
}

export function createSessionId(): string {
  return `sess_${Date.now().toString(36)}_${randomBytes(12).toString('hex')}`;
}
