import type { ResponseState } from '@pte-app/contracts';

export function isResponseComplete(state: ResponseState): boolean {
  return state === 'complete';
}

export function isResponseEmpty(state: ResponseState): boolean {
  return state === 'empty';
}
