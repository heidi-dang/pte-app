import { createHandlerRegistry, type HandlerRegistry } from '@pte-app/domain';

export function buildDefaultHandlerRegistry(): HandlerRegistry {
  const registry = createHandlerRegistry();
  
  // Handlers will be registered here as they are imported
  // For now we return the registry itself. When reading and listening are implemented,
  // we register their handlers here.
  
  return registry;
}
