import type { RendererContract } from '@pte-app/contracts';

const registry = new Map<string, RendererContract>();

export function registerRenderer(renderer: RendererContract): void {
  registry.set(renderer.taskType, renderer);
}

export function resolveRenderer(taskType: string): RendererContract | undefined {
  return registry.get(taskType);
}

export function getRegisteredTaskTypes(): string[] {
  return Array.from(registry.keys());
}

export function clearRegistry(): void {
  registry.clear();
}
