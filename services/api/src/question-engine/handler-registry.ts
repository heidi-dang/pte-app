import { createHandlerRegistry, type HandlerRegistry, reading, listening } from '@pte-app/domain';

export function buildDefaultHandlerRegistry(): HandlerRegistry {
  const registry = createHandlerRegistry();

  reading.registerReadingHandlers(registry);
  listening.registerListeningHandlers(registry);

  return registry;
}
