import { readFileSync, existsSync } from 'node:fs';
import { STATE_PATH, type E2EState } from './global-setup';

export function loadE2EState(): E2EState {
  if (!existsSync(STATE_PATH)) {
    throw new Error(`E2E state not found at ${STATE_PATH}. Run global setup first.`);
  }
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
}
