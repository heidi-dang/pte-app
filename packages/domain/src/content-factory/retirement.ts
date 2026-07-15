export function canRetireContent(currentState: string): boolean {
  return currentState === 'published';
}

export function canReactivateContent(currentState: string): boolean {
  return currentState === 'retired';
}
